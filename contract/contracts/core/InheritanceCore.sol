// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

import "../interfaces/IInheritanceCore.sol";
import "../interfaces/ITimingManager.sol";
import "../libraries/InheritanceLib.sol";

contract InheritanceCore is
    IInheritanceCore,
    AccessControl,
    ReentrancyGuard,
    Pausable,
    IERC721Receiver
{
    using SafeERC20 for IERC20;

    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    ITimingManager public timingManager;

    uint256 private _inheritanceCounter;

    mapping(uint256 => InheritanceData) private _inheritances;
    mapping(uint256 => mapping(address => Beneficiary)) private _beneficiaries;
    mapping(uint256 => address[]) private _beneficiaryList;
    mapping(uint256 => Asset[]) private _assets;
    mapping(uint256 => mapping(address => mapping(address => uint256)))
        private _tokenBalances;
    mapping(uint256 => mapping(address => uint256)) private _claimedTokens;
    mapping(uint256 => bool) private _assetsFreezed;

    modifier inheritanceExists(uint256 inheritanceId) {
        if (inheritanceId >= _inheritanceCounter) {
            revert InheritanceLib.InheritanceNotActive(inheritanceId);
        }
        _;
    }

    modifier onlyInheritanceOwner(uint256 inheritanceId) {
        if (_inheritances[inheritanceId].owner != msg.sender) {
            revert InheritanceLib.UnauthorizedAccess(
                msg.sender,
                "inheritance owner"
            );
        }
        _;
    }

    modifier notFreezed(uint256 inheritanceId) {
        require(!_assetsFreezed[inheritanceId], "Assets are frozen");
        _;
    }

    modifier onlyWhenActive(uint256 inheritanceId) {
        if (_inheritances[inheritanceId].status != InheritanceStatus.ACTIVE) {
            revert InheritanceLib.InheritanceNotActive(inheritanceId);
        }
        _;
    }

    modifier onlyWhenTriggered(uint256 inheritanceId) {
        if (
            _inheritances[inheritanceId].status != InheritanceStatus.TRIGGERED
        ) {
            revert InheritanceLib.InheritanceNotTriggered(inheritanceId);
        }
        _;
    }

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function setTimingManager(
        address _timingManager
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_timingManager != address(0), "Invalid timing manager address");
        timingManager = ITimingManager(_timingManager);
    }

    function createInheritance(
        string calldata name,
        address executor,
        bool requiresConfirmation,
        TimeLock calldata timeLock
    ) external override returns (uint256 inheritanceId) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(executor != address(0), "Invalid executor address");
        _validateTimeLock(timeLock);

        inheritanceId = _inheritanceCounter++;

        InheritanceData storage inheritance = _inheritances[inheritanceId];
        inheritance.owner = msg.sender;
        inheritance.name = name;
        inheritance.status = InheritanceStatus.ACTIVE;
        inheritance.createdAt = block.timestamp;
        inheritance.timeLock = timeLock;
        inheritance.requiresConfirmation = requiresConfirmation;
        inheritance.executor = executor;

        _grantRole(OWNER_ROLE, msg.sender);
        _grantRole(EXECUTOR_ROLE, executor);

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
        require(beneficiary != msg.sender, "Owner cannot be beneficiary");

        if (
            _beneficiaryList[inheritanceId].length >=
            InheritanceLib.MAX_BENEFICIARIES
        ) {
            revert InheritanceLib.MaxBeneficiariesExceeded(
                _beneficiaryList[inheritanceId].length,
                InheritanceLib.MAX_BENEFICIARIES
            );
        }

        if (_beneficiaries[inheritanceId][beneficiary].isActive) {
            revert InheritanceLib.BeneficiaryAlreadyExists(beneficiary);
        }

        InheritanceLib.validateAllocation(allocationBasisPoints);

        uint256 totalAllocation = _calculateTotalAllocation(inheritanceId) +
            allocationBasisPoints;
        InheritanceLib.validateTotalAllocation(totalAllocation);

        Beneficiary storage newBeneficiary = _beneficiaries[inheritanceId][
            beneficiary
        ];
        newBeneficiary.wallet = beneficiary;
        newBeneficiary.allocationBasisPoints = allocationBasisPoints;
        newBeneficiary.isActive = true;
        newBeneficiary.addedAt = block.timestamp;

        _beneficiaryList[inheritanceId].push(beneficiary);
        _inheritances[inheritanceId].totalBeneficiaries++;

        emit BeneficiaryAdded(
            inheritanceId,
            beneficiary,
            allocationBasisPoints,
            block.timestamp
        );
    }

    function depositETH(
        uint256 inheritanceId
    )
        external
        payable
        override
        inheritanceExists(inheritanceId)
        onlyInheritanceOwner(inheritanceId)
        onlyWhenActive(inheritanceId)
        notFreezed(inheritanceId)
        nonReentrant
    {
        require(msg.value > 0, "Must deposit positive amount");

        _inheritances[inheritanceId].totalETHDeposited += msg.value;

        Asset memory newAsset = Asset({
            assetType: AssetType.ETH,
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
            AssetType.ETH,
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
        notFreezed(inheritanceId)
        nonReentrant
    {
        require(tokenContract != address(0), "Invalid token contract");
        require(amount > 0, "Must deposit positive amount");

        IERC20(tokenContract).safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );
        _tokenBalances[inheritanceId][tokenContract][address(0)] += amount;

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
        notFreezed(inheritanceId)
        nonReentrant
    {
        require(nftContract != address(0), "Invalid NFT contract");
        require(tokenIds.length > 0, "Must deposit at least one NFT");

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
                hasRole(EXECUTOR_ROLE, msg.sender) ||
                hasRole(EMERGENCY_ROLE, msg.sender),
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
        notFreezed(inheritanceId)
        nonReentrant
    {
        if (!_beneficiaries[inheritanceId][msg.sender].isActive) {
            revert InheritanceLib.BeneficiaryNotFound(msg.sender);
        }

        uint256 claimableETH = getClaimableETH(inheritanceId, msg.sender);

        if (claimableETH > 0) {
            _beneficiaries[inheritanceId][msg.sender]
                .claimedETH += claimableETH;
            _inheritances[inheritanceId].totalETHClaimed += claimableETH;

            InheritanceLib.safeTransferETH(msg.sender, claimableETH);

            uint256[] memory emptyArray = new uint256[](0);
            emit AssetClaimed(
                inheritanceId,
                msg.sender,
                AssetType.ETH,
                address(0),
                claimableETH,
                emptyArray,
                block.timestamp
            );
        }

        _claimERC20Tokens(inheritanceId, msg.sender);
        _claimERC721Tokens(inheritanceId, msg.sender);

        if (_isInheritanceCompleted(inheritanceId)) {
            _inheritances[inheritanceId].status = InheritanceStatus.COMPLETED;
            emit InheritanceCompleted(inheritanceId, block.timestamp);
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
    ) external view override returns (Beneficiary memory) {
        return _beneficiaries[inheritanceId][beneficiary];
    }

    function getClaimableETH(
        uint256 inheritanceId,
        address beneficiary
    ) public view override returns (uint256) {
        if (
            !_beneficiaries[inheritanceId][beneficiary].isActive ||
            _inheritances[inheritanceId].status != InheritanceStatus.TRIGGERED
        ) {
            return 0;
        }

        Beneficiary memory ben = _beneficiaries[inheritanceId][beneficiary];
        uint256 totalETH = _inheritances[inheritanceId].totalETHDeposited;
        uint256 beneficiaryShare = InheritanceLib.calculatePercentage(
            totalETH,
            ben.allocationBasisPoints
        );
        uint256 vestedAmount = _calculateVestedAmount(
            inheritanceId,
            beneficiaryShare
        );

        return
            vestedAmount > ben.claimedETH ? vestedAmount - ben.claimedETH : 0;
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

    function _validateTimeLock(TimeLock memory timeLock) internal view {
        if (timeLock.distributionType == DistributionType.IMMEDIATE) {
            return;
        }

        if (timeLock.unlockTime <= block.timestamp) {
            revert InheritanceLib.InvalidTimeLock(
                "Unlock time must be in the future"
            );
        }

        if (timeLock.distributionType == DistributionType.LINEAR_VESTING) {
            if (
                timeLock.vestingDuration < InheritanceLib.MIN_VESTING_DURATION
            ) {
                revert InheritanceLib.InvalidTimeLock(
                    "Vesting duration too short"
                );
            }
        }

        if (timeLock.distributionType == DistributionType.MILESTONE_BASED) {
            InheritanceLib.validateMilestones(
                timeLock.milestoneTimestamps,
                timeLock.milestonePercentages
            );
        }
    }

    function _calculateTotalAllocation(
        uint256 inheritanceId
    ) internal view returns (uint256) {
        uint256 total = 0;
        address[] memory beneficiaries = _beneficiaryList[inheritanceId];

        for (uint256 i = 0; i < beneficiaries.length; i++) {
            if (_beneficiaries[inheritanceId][beneficiaries[i]].isActive) {
                total += _beneficiaries[inheritanceId][beneficiaries[i]]
                    .allocationBasisPoints;
            }
        }

        return total;
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
        Asset[] memory assets = _assets[inheritanceId];
        uint256 allocation = _beneficiaries[inheritanceId][beneficiary]
            .allocationBasisPoints;

        for (uint256 i = 0; i < assets.length; i++) {
            if (assets[i].assetType == AssetType.ERC20 && assets[i].isActive) {
                address tokenAddr = assets[i].contractAddress;
                uint256 totalTokens = IERC20(tokenAddr).balanceOf(
                    address(this)
                );
                uint256 beneficiaryShare = InheritanceLib.calculatePercentage(
                    totalTokens,
                    allocation
                );
                uint256 vestedAmount = _calculateVestedAmount(
                    inheritanceId,
                    beneficiaryShare
                );
                uint256 claimableAmount = vestedAmount -
                    _claimedTokens[inheritanceId][tokenAddr];

                if (claimableAmount > 0) {
                    _claimedTokens[inheritanceId][tokenAddr] += claimableAmount;
                    IERC20(tokenAddr).safeTransfer(
                        beneficiary,
                        claimableAmount
                    );

                    uint256[] memory emptyArray = new uint256[](0);
                    emit AssetClaimed(
                        inheritanceId,
                        beneficiary,
                        AssetType.ERC20,
                        tokenAddr,
                        claimableAmount,
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
        Asset[] memory assets = _assets[inheritanceId];
        uint256 allocation = _beneficiaries[inheritanceId][beneficiary]
            .allocationBasisPoints;

        for (uint256 i = 0; i < assets.length; i++) {
            if (assets[i].assetType == AssetType.ERC721 && assets[i].isActive) {
                uint256 nftShare = InheritanceLib.calculatePercentage(
                    assets[i].tokenIds.length,
                    allocation
                );

                for (uint256 j = 0; j < nftShare; j++) {
                    if (j < assets[i].tokenIds.length) {
                        try
                            IERC721(assets[i].contractAddress).ownerOf(
                                assets[i].tokenIds[j]
                            )
                        returns (address currentOwner) {
                            if (currentOwner == address(this)) {
                                IERC721(assets[i].contractAddress)
                                    .safeTransferFrom(
                                        address(this),
                                        beneficiary,
                                        assets[i].tokenIds[j]
                                    );

                                uint256[] memory tokenIds = new uint256[](1);
                                tokenIds[0] = assets[i].tokenIds[j];
                                emit AssetClaimed(
                                    inheritanceId,
                                    beneficiary,
                                    AssetType.ERC721,
                                    assets[i].contractAddress,
                                    1,
                                    tokenIds,
                                    block.timestamp
                                );
                            }
                        } catch {}
                    }
                }
            }
        }
    }

    function _isInheritanceCompleted(
        uint256 inheritanceId
    ) internal view returns (bool) {
        uint256 totalETH = _inheritances[inheritanceId].totalETHDeposited;
        uint256 claimedETH = _inheritances[inheritanceId].totalETHClaimed;

        return claimedETH >= totalETH;
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // Timing management functions
    function updateInheritanceTiming(
        uint256 inheritanceId,
        uint256 minVestingDuration,
        uint256 executionDelay,
        uint256 cliffDuration
    )
        external
        inheritanceExists(inheritanceId)
        onlyInheritanceOwner(inheritanceId)
    {
        require(address(timingManager) != address(0), "Timing manager not set");
        timingManager.updateInheritanceTiming(
            inheritanceId,
            minVestingDuration,
            executionDelay,
            cliffDuration
        );
    }

    function setTestingMode(
        uint256 inheritanceId
    )
        external
        inheritanceExists(inheritanceId)
        onlyInheritanceOwner(inheritanceId)
    {
        require(address(timingManager) != address(0), "Timing manager not set");
        timingManager.setTestingMode(inheritanceId);
    }

    function setProductionMode(
        uint256 inheritanceId
    )
        external
        inheritanceExists(inheritanceId)
        onlyInheritanceOwner(inheritanceId)
    {
        require(address(timingManager) != address(0), "Timing manager not set");
        timingManager.setProductionMode(inheritanceId);
    }

    function setCustomTiming(
        uint256 inheritanceId,
        uint256 vestingSeconds,
        uint256 delaySeconds,
        uint256 cliffSeconds
    )
        external
        inheritanceExists(inheritanceId)
        onlyInheritanceOwner(inheritanceId)
    {
        require(address(timingManager) != address(0), "Timing manager not set");
        timingManager.setCustomTiming(
            inheritanceId,
            vestingSeconds,
            delaySeconds,
            cliffSeconds
        );
    }

    function getInheritanceTiming(
        uint256 inheritanceId
    )
        external
        view
        inheritanceExists(inheritanceId)
        returns (ITimingManager.TimingConfig memory)
    {
        if (address(timingManager) != address(0)) {
            return timingManager.getInheritanceTiming(inheritanceId);
        }

        // Return default values if timing manager not set
        return
            ITimingManager.TimingConfig({
                minVestingDuration: InheritanceLib.MIN_VESTING_DURATION,
                defaultExecutionDelay: InheritanceLib.DEFAULT_EXECUTION_DELAY,
                defaultCliffDuration: InheritanceLib.DEFAULT_CLIFF_DURATION,
                maxVestingDuration: 365 days,
                isConfigurable: true
            });
    }

    receive() external payable {
        revert("Use depositETH function");
    }
}
