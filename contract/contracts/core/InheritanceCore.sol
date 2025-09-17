// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "../interfaces/IInheritanceCore.sol";
import "../libraries/InheritanceLib.sol";

contract InheritanceCore is IInheritanceCore, AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    uint256 private _inheritanceCounter;
    mapping(uint256 => InheritanceData) private _inheritances;
    mapping(uint256 => mapping(address => Beneficiary)) private _beneficiaries;
    mapping(uint256 => address[]) private _beneficiaryList;
    mapping(uint256 => Asset[]) private _assets;

    modifier inheritanceExists(uint256 inheritanceId) {
        require(
            inheritanceId < _inheritanceCounter,
            "Inheritance does not exist"
        );
        _;
    }

    modifier onlyInheritanceOwner(uint256 inheritanceId) {
        require(
            msg.sender == _inheritances[inheritanceId].owner,
            "Only inheritance owner allowed"
        );
        _;
    }

    modifier onlyWhenActive(uint256 inheritanceId) {
        require(
            _inheritances[inheritanceId].status == InheritanceStatus.ACTIVE,
            "Inheritance not active"
        );
        _;
    }

    modifier onlyWhenTriggered(uint256 inheritanceId) {
        require(
            _inheritances[inheritanceId].status == InheritanceStatus.TRIGGERED,
            "Inheritance not triggered"
        );
        _;
    }

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(EXECUTOR_ROLE, msg.sender);
    }

    function createInheritance(
        string calldata name,
        address executor,
        bool requiresConfirmation,
        TimeLock calldata timeLock
    ) external override returns (uint256 inheritanceId) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(executor != address(0), "Invalid executor address");

        inheritanceId = _inheritanceCounter++;

        _inheritances[inheritanceId] = InheritanceData({
            owner: msg.sender,
            name: name,
            status: InheritanceStatus.ACTIVE,
            createdAt: block.timestamp,
            triggeredAt: 0,
            timeLock: timeLock,
            totalBeneficiaries: 0,
            requiresConfirmation: requiresConfirmation,
            executor: executor,
            totalSTTDeposited: 0,
            totalSTTClaimed: 0
        });

        emit InheritanceCreated(
            inheritanceId,
            msg.sender,
            name,
            block.timestamp
        );
    }

    function addBeneficiary(
        uint256 inheritanceId,
        address beneficiary,
        uint256 allocationBasisPoints
    )
        external
        override
        inheritanceExists(inheritanceId)
        onlyInheritanceOwner(inheritanceId)
        onlyWhenActive(inheritanceId)
    {
        require(beneficiary != address(0), "Invalid beneficiary address");
        require(beneficiary != msg.sender, "Cannot add self as beneficiary");
        require(
            allocationBasisPoints > 0 && allocationBasisPoints <= 10000,
            "Invalid allocation"
        );
        require(
            !_beneficiaries[inheritanceId][beneficiary].isActive,
            "Beneficiary already exists"
        );

        uint256 totalAllocation = _calculateTotalAllocation(inheritanceId) +
            allocationBasisPoints;
        require(totalAllocation <= 10000, "Total allocation exceeds 100%");

        _beneficiaries[inheritanceId][beneficiary] = Beneficiary({
            wallet: beneficiary,
            allocationBasisPoints: allocationBasisPoints,
            isActive: true,
            claimedSTT: 0,
            addedAt: block.timestamp
        });

        _beneficiaryList[inheritanceId].push(beneficiary);
        _inheritances[inheritanceId].totalBeneficiaries++;

        emit BeneficiaryAdded(
            inheritanceId,
            beneficiary,
            allocationBasisPoints,
            block.timestamp
        );
    }

    function depositSTT(
        uint256 inheritanceId
    )
        external
        payable
        override
        inheritanceExists(inheritanceId)
        onlyInheritanceOwner(inheritanceId)
        onlyWhenActive(inheritanceId)
        nonReentrant
    {
        require(msg.value > 0, "Deposit amount must be positive");

        _inheritances[inheritanceId].totalSTTDeposited += msg.value;

        Asset memory newAsset = Asset({
            assetType: AssetType.STT,
            contractAddress: address(0),
            amount: msg.value,
            tokenIds: new uint256[](0),
            isActive: true,
            depositedAt: block.timestamp
        });

        _assets[inheritanceId].push(newAsset);

        uint256[] memory emptyArray = new uint256[](0);
        emit AssetDeposited(
            inheritanceId,
            AssetType.STT,
            address(0),
            msg.value,
            emptyArray,
            block.timestamp
        );
    }

    function depositERC20(
        uint256 inheritanceId,
        address tokenContract,
        uint256 amount
    )
        external
        override
        inheritanceExists(inheritanceId)
        onlyInheritanceOwner(inheritanceId)
        onlyWhenActive(inheritanceId)
        nonReentrant
    {
        require(tokenContract != address(0), "Invalid token contract");
        require(amount > 0, "Amount must be positive");

        IERC20(tokenContract).safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );

        Asset memory newAsset = Asset({
            assetType: AssetType.ERC20,
            contractAddress: tokenContract,
            amount: amount,
            tokenIds: new uint256[](0),
            isActive: true,
            depositedAt: block.timestamp
        });

        _assets[inheritanceId].push(newAsset);

        uint256[] memory emptyArray = new uint256[](0);
        emit AssetDeposited(
            inheritanceId,
            AssetType.ERC20,
            tokenContract,
            amount,
            emptyArray,
            block.timestamp
        );
    }

    function depositERC721(
        uint256 inheritanceId,
        address nftContract,
        uint256[] calldata tokenIds
    )
        external
        override
        inheritanceExists(inheritanceId)
        onlyInheritanceOwner(inheritanceId)
        onlyWhenActive(inheritanceId)
        nonReentrant
    {
        require(nftContract != address(0), "Invalid NFT contract");
        require(tokenIds.length > 0, "No token IDs provided");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            IERC721(nftContract).safeTransferFrom(
                msg.sender,
                address(this),
                tokenIds[i]
            );
        }

        Asset memory newAsset = Asset({
            assetType: AssetType.ERC721,
            contractAddress: nftContract,
            amount: tokenIds.length,
            tokenIds: tokenIds,
            isActive: true,
            depositedAt: block.timestamp
        });

        _assets[inheritanceId].push(newAsset);

        emit AssetDeposited(
            inheritanceId,
            AssetType.ERC721,
            nftContract,
            tokenIds.length,
            tokenIds,
            block.timestamp
        );
    }

    function triggerInheritance(
        uint256 inheritanceId
    )
        external
        override
        inheritanceExists(inheritanceId)
        onlyWhenActive(inheritanceId)
    {
        InheritanceData storage inheritance = _inheritances[inheritanceId];

        require(
            msg.sender == inheritance.owner ||
                msg.sender == inheritance.executor ||
                hasRole(EXECUTOR_ROLE, msg.sender),
            "Unauthorized to trigger inheritance"
        );

        require(
            _beneficiaryList[inheritanceId].length > 0,
            "No beneficiaries added"
        );

        inheritance.status = InheritanceStatus.TRIGGERED;
        inheritance.triggeredAt = block.timestamp;

        emit InheritanceTriggered(inheritanceId, msg.sender, block.timestamp);
    }

    function claimAssets(
        uint256 inheritanceId
    )
        external
        override
        inheritanceExists(inheritanceId)
        onlyWhenTriggered(inheritanceId)
        nonReentrant
    {
        require(
            _beneficiaries[inheritanceId][msg.sender].isActive,
            "Not a valid beneficiary"
        );

        uint256 claimableSTT = getClaimableSTT(inheritanceId, msg.sender);

        if (claimableSTT > 0) {
            _beneficiaries[inheritanceId][msg.sender]
                .claimedSTT += claimableSTT;
            _inheritances[inheritanceId].totalSTTClaimed += claimableSTT;

            (bool success, ) = payable(msg.sender).call{value: claimableSTT}(
                ""
            );
            require(success, "STT transfer failed");

            uint256[] memory emptyArray = new uint256[](0);
            emit AssetClaimed(
                inheritanceId,
                msg.sender,
                AssetType.STT,
                address(0),
                claimableSTT,
                emptyArray,
                block.timestamp
            );

            _claimERC20Tokens(inheritanceId, msg.sender);
            _claimERC721Tokens(inheritanceId, msg.sender);

            if (_isInheritanceCompleted(inheritanceId)) {
                _inheritances[inheritanceId].status = InheritanceStatus
                    .COMPLETED;
                emit InheritanceCompleted(inheritanceId, block.timestamp);
            }
        }
    }

    function getInheritanceData(
        uint256 inheritanceId
    )
        external
        view
        override
        inheritanceExists(inheritanceId)
        returns (InheritanceData memory)
    {
        return _inheritances[inheritanceId];
    }

    function getBeneficiaryInfo(
        uint256 inheritanceId,
        address beneficiary
    )
        external
        view
        override
        inheritanceExists(inheritanceId)
        returns (Beneficiary memory)
    {
        return _beneficiaries[inheritanceId][beneficiary];
    }

    function getClaimableSTT(
        uint256 inheritanceId,
        address beneficiary
    ) public view override inheritanceExists(inheritanceId) returns (uint256) {
        if (
            !_beneficiaries[inheritanceId][beneficiary].isActive ||
            _inheritances[inheritanceId].status != InheritanceStatus.TRIGGERED
        ) {
            return 0;
        }

        Beneficiary memory ben = _beneficiaries[inheritanceId][beneficiary];
        uint256 totalSTT = _inheritances[inheritanceId].totalSTTDeposited;
        uint256 beneficiaryShare = InheritanceLib.calculatePercentage(
            totalSTT,
            ben.allocationBasisPoints
        );
        uint256 vestedAmount = _calculateVestedAmount(
            inheritanceId,
            beneficiaryShare
        );

        return
            vestedAmount > ben.claimedSTT ? vestedAmount - ben.claimedSTT : 0;
    }

    function getTotalAssets(
        uint256 inheritanceId
    )
        external
        view
        override
        inheritanceExists(inheritanceId)
        returns (Asset[] memory)
    {
        return _assets[inheritanceId];
    }

    function _calculateTotalAllocation(
        uint256 inheritanceId
    ) internal view returns (uint256) {
        uint256 totalAllocation = 0;
        address[] memory beneficiaries = _beneficiaryList[inheritanceId];

        for (uint256 i = 0; i < beneficiaries.length; i++) {
            if (_beneficiaries[inheritanceId][beneficiaries[i]].isActive) {
                totalAllocation += _beneficiaries[inheritanceId][
                    beneficiaries[i]
                ].allocationBasisPoints;
            }
        }

        return totalAllocation;
    }

    function _calculateVestedAmount(
        uint256 inheritanceId,
        uint256 totalAmount
    ) internal view returns (uint256) {
        InheritanceData storage inheritance = _inheritances[inheritanceId];
        TimeLock memory timeLock = inheritance.timeLock;

        if (timeLock.distributionType == DistributionType.IMMEDIATE) {
            return totalAmount;
        }

        uint256 startTime = inheritance.triggeredAt;
        if (startTime == 0) return 0;

        if (timeLock.distributionType == DistributionType.LINEAR_VESTING) {
            return
                InheritanceLib.calculateVestedAmount(
                    totalAmount,
                    startTime,
                    block.timestamp,
                    timeLock.vestingDuration,
                    timeLock.cliffDuration
                );
        }

        if (timeLock.distributionType == DistributionType.CLIFF_VESTING) {
            return
                block.timestamp >= startTime + timeLock.cliffDuration
                    ? totalAmount
                    : 0;
        }

        if (timeLock.distributionType == DistributionType.MILESTONE_BASED) {
            return
                InheritanceLib.calculateMilestoneAmount(
                    totalAmount,
                    block.timestamp,
                    timeLock.milestoneTimestamps,
                    timeLock.milestonePercentages
                );
        }

        return 0;
    }

    function _claimERC20Tokens(
        uint256 inheritanceId,
        address beneficiary
    ) internal {
        Asset[] storage assets = _assets[inheritanceId];
        uint256 allocationBasisPoints = _beneficiaries[inheritanceId][
            beneficiary
        ].allocationBasisPoints;

        for (uint256 i = 0; i < assets.length; i++) {
            if (assets[i].assetType == AssetType.ERC20 && assets[i].isActive) {
                uint256 beneficiaryShare = InheritanceLib.calculatePercentage(
                    assets[i].amount,
                    allocationBasisPoints
                );

                if (beneficiaryShare > 0) {
                    IERC20(assets[i].contractAddress).safeTransfer(
                        beneficiary,
                        beneficiaryShare
                    );

                    uint256[] memory emptyArray = new uint256[](0);
                    emit AssetClaimed(
                        inheritanceId,
                        beneficiary,
                        AssetType.ERC20,
                        assets[i].contractAddress,
                        beneficiaryShare,
                        emptyArray,
                        block.timestamp
                    );
                }
            }
        }
    }

    function _claimERC721Tokens(
        uint256 inheritanceId,
        address beneficiary
    ) internal {
        Asset[] storage assets = _assets[inheritanceId];
        uint256 allocationBasisPoints = _beneficiaries[inheritanceId][
            beneficiary
        ].allocationBasisPoints;

        for (uint256 i = 0; i < assets.length; i++) {
            if (assets[i].assetType == AssetType.ERC721 && assets[i].isActive) {
                uint256 tokensToTransfer = InheritanceLib.calculatePercentage(
                    assets[i].tokenIds.length,
                    allocationBasisPoints
                );

                for (
                    uint256 j = 0;
                    j < tokensToTransfer && j < assets[i].tokenIds.length;
                    j++
                ) {
                    IERC721(assets[i].contractAddress).safeTransferFrom(
                        address(this),
                        beneficiary,
                        assets[i].tokenIds[j]
                    );
                }

                if (tokensToTransfer > 0) {
                    emit AssetClaimed(
                        inheritanceId,
                        beneficiary,
                        AssetType.ERC721,
                        assets[i].contractAddress,
                        tokensToTransfer,
                        assets[i].tokenIds,
                        block.timestamp
                    );
                }
            }
        }
    }

    function _isInheritanceCompleted(
        uint256 inheritanceId
    ) internal view returns (bool) {
        uint256 totalSTT = _inheritances[inheritanceId].totalSTTDeposited;
        uint256 claimedSTT = _inheritances[inheritanceId].totalSTTClaimed;

        return claimedSTT >= totalSTT;
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }

    receive() external payable {
        revert("Direct STT payments not accepted - use depositSTT function");
    }
}
