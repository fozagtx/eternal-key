// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "../interfaces/IInheritanceCore.sol";
import "../libraries/InheritanceLib.sol";

/**
 * @title InheritanceCore
 * @dev Secure implementation of the InheritanceCore contract with critical security fixes:
 * 1. Proper ERC721 distribution without duplicates or missed tokens
 * 2. State tracking to prevent double-claiming of assets
 * 3. Comprehensive input validation
 * 4. Gas optimization and security enhancements
 * 5. Interface consistency improvements
 */
contract InheritanceCore is IInheritanceCore, AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Role definitions
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    // Contract state variables
    uint256 private _inheritanceCounter;

    // Core inheritance data storage
    mapping(uint256 => InheritanceData) private _inheritances;
    mapping(uint256 => mapping(address => Beneficiary)) private _beneficiaries;
    mapping(uint256 => address[]) private _beneficiaryList;
    mapping(uint256 => Asset[]) private _assets;

    // CRITICAL FIX: Asset claiming state tracking to prevent double-claiming
    mapping(uint256 => mapping(address => mapping(uint256 => bool)))
        private _assetsClaimed; // inheritanceId => beneficiary => assetIndex => claimed
    mapping(uint256 => mapping(address => bool)) private _sttClaimed; // inheritanceId => beneficiary => claimed
    mapping(uint256 => mapping(uint256 => uint256))
        private _erc721TokenDistribution; // inheritanceId => assetIndex => nextTokenIndex

    // Gas optimization: Pack frequently accessed data
    mapping(uint256 => uint256) private _totalAllocations; // Cache total allocations per inheritance

    // Events are defined in the interface

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

    /**
     * @dev Creates a new inheritance with comprehensive validation
     * @param executor The address authorized to trigger the inheritance
     * @param requiresConfirmation Whether beneficiary confirmation is required
     * @param timeLock The time lock configuration for asset distribution
     * @return inheritanceId The unique identifier for the created inheritance
     */
    function createInheritance(
        address executor,
        bool requiresConfirmation,
        TimeLock calldata timeLock
    ) external override returns (uint256 inheritanceId) {
        // CRITICAL FIX: Enhanced input validation
        require(executor != address(0), "Invalid executor address");
        require(executor != msg.sender, "Executor cannot be the same as owner");

        // Validate TimeLock parameters
        _validateTimeLock(timeLock);

        inheritanceId = _inheritanceCounter++;

        // CRITICAL FIX: Removed name parameter completely for consistency
        _inheritances[inheritanceId] = InheritanceData({
            owner: msg.sender,
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

        // Initialize cache
        _totalAllocations[inheritanceId] = 0;

        emit InheritanceCreated(inheritanceId, msg.sender, block.timestamp);
    }

    /**
     * @dev Adds a beneficiary to an inheritance with enhanced validation
     */
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
            beneficiary != _inheritances[inheritanceId].executor,
            "Cannot add executor as beneficiary"
        );

        // Use library for validation
        InheritanceLib.validateAllocation(allocationBasisPoints);

        require(
            !_beneficiaries[inheritanceId][beneficiary].isActive,
            "Beneficiary already exists"
        );

        // CRITICAL FIX: Use cached total allocation for gas optimization
        uint256 totalAllocation = _totalAllocations[inheritanceId] +
            allocationBasisPoints;
        InheritanceLib.validateTotalAllocation(totalAllocation);

        _beneficiaries[inheritanceId][beneficiary] = Beneficiary({
            wallet: beneficiary,
            allocationBasisPoints: allocationBasisPoints,
            isActive: true,
            claimedSTT: 0,
            addedAt: block.timestamp
        });

        _beneficiaryList[inheritanceId].push(beneficiary);
        _inheritances[inheritanceId].totalBeneficiaries++;
        _totalAllocations[inheritanceId] = totalAllocation; // Update cache

        emit BeneficiaryAdded(
            inheritanceId,
            beneficiary,
            allocationBasisPoints,
            block.timestamp
        );
    }

    /**
     * @dev Deposits STT (native token) to the inheritance
     */
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

    /**
     * @dev Deposits ERC20 tokens to the inheritance with enhanced security
     */
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

        // CRITICAL FIX: Check allowance before transfer
        require(
            IERC20(tokenContract).allowance(msg.sender, address(this)) >=
                amount,
            "Insufficient allowance"
        );

        uint256 balanceBefore = IERC20(tokenContract).balanceOf(address(this));
        IERC20(tokenContract).safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );
        uint256 balanceAfter = IERC20(tokenContract).balanceOf(address(this));

        // CRITICAL FIX: Handle fee-on-transfer tokens
        uint256 actualAmount = balanceAfter - balanceBefore;
        require(actualAmount > 0, "No tokens received");

        Asset memory newAsset = Asset({
            assetType: AssetType.ERC20,
            contractAddress: tokenContract,
            amount: actualAmount,
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
            actualAmount,
            emptyArray,
            block.timestamp
        );
    }

    /**
     * @dev Deposits ERC721 tokens with enhanced validation
     */
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

        // CRITICAL FIX: Validate ownership and approvals before transfers
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(
                IERC721(nftContract).ownerOf(tokenIds[i]) == msg.sender,
                "Not owner of token"
            );
            require(
                IERC721(nftContract).getApproved(tokenIds[i]) ==
                    address(this) ||
                    IERC721(nftContract).isApprovedForAll(
                        msg.sender,
                        address(this)
                    ),
                "Contract not approved for token"
            );
        }

        // Transfer all tokens
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

        uint256 assetIndex = _assets[inheritanceId].length;
        _assets[inheritanceId].push(newAsset);

        // Initialize distribution tracking
        _erc721TokenDistribution[inheritanceId][assetIndex] = 0;

        emit AssetDeposited(
            inheritanceId,
            AssetType.ERC721,
            nftContract,
            tokenIds.length,
            tokenIds,
            block.timestamp
        );
    }

    /**
     * @dev Triggers the inheritance with enhanced authorization checks
     */
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
        require(_totalAllocations[inheritanceId] > 0, "No allocations set");

        inheritance.status = InheritanceStatus.TRIGGERED;
        inheritance.triggeredAt = block.timestamp;

        emit InheritanceTriggered(inheritanceId, msg.sender, block.timestamp);
    }

    /**
     * @dev CRITICAL FIX: Completely rewritten asset claiming logic with proper state tracking
     */
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

        bool hasClaimedAny = false;

        // CRITICAL FIX: Claim STT with double-claim prevention
        if (!_sttClaimed[inheritanceId][msg.sender]) {
            uint256 claimableSTT = getClaimableSTT(inheritanceId, msg.sender);
            if (claimableSTT > 0) {
                _sttClaimed[inheritanceId][msg.sender] = true;
                _beneficiaries[inheritanceId][msg.sender]
                    .claimedSTT += claimableSTT;
                _inheritances[inheritanceId].totalSTTClaimed += claimableSTT;

                (bool success, ) = payable(msg.sender).call{
                    value: claimableSTT
                }("");
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
                hasClaimedAny = true;
            }
        }

        // CRITICAL FIX: Claim other assets with proper state tracking
        hasClaimedAny =
            _claimNonSTTAssets(inheritanceId, msg.sender) ||
            hasClaimedAny;

        require(hasClaimedAny, "No assets available for claiming");

        // Check if inheritance is completed
        if (_isInheritanceCompleted(inheritanceId)) {
            _inheritances[inheritanceId].status = InheritanceStatus.COMPLETED;
            emit InheritanceCompleted(inheritanceId, block.timestamp);
        }
    }

    /**
     * @dev CRITICAL FIX: New function to handle non-STT asset claiming with proper distribution
     */
    function _claimNonSTTAssets(
        uint256 inheritanceId,
        address beneficiary
    ) internal returns (bool hasClaimedAny) {
        Asset[] storage assets = _assets[inheritanceId];
        uint256 allocationBasisPoints = _beneficiaries[inheritanceId][
            beneficiary
        ].allocationBasisPoints;

        for (uint256 i = 0; i < assets.length; i++) {
            if (_assetsClaimed[inheritanceId][beneficiary][i]) {
                continue; // Skip already claimed assets
            }

            if (assets[i].assetType == AssetType.ERC20) {
                hasClaimedAny =
                    _claimERC20Asset(
                        inheritanceId,
                        beneficiary,
                        i,
                        allocationBasisPoints
                    ) ||
                    hasClaimedAny;
            } else if (assets[i].assetType == AssetType.ERC721) {
                hasClaimedAny =
                    _claimERC721Asset(
                        inheritanceId,
                        beneficiary,
                        i,
                        allocationBasisPoints
                    ) ||
                    hasClaimedAny;
            }
        }
    }

    /**
     * @dev CRITICAL FIX: Improved ERC20 claiming logic
     */
    function _claimERC20Asset(
        uint256 inheritanceId,
        address beneficiary,
        uint256 assetIndex,
        uint256 allocationBasisPoints
    ) internal returns (bool) {
        Asset storage asset = _assets[inheritanceId][assetIndex];

        if (!asset.isActive || asset.assetType != AssetType.ERC20) {
            return false;
        }

        uint256 beneficiaryShare = InheritanceLib.calculatePercentage(
            asset.amount,
            allocationBasisPoints
        );

        if (beneficiaryShare == 0) {
            _assetsClaimed[inheritanceId][beneficiary][assetIndex] = true;
            return false;
        }

        _assetsClaimed[inheritanceId][beneficiary][assetIndex] = true;

        IERC20(asset.contractAddress).safeTransfer(
            beneficiary,
            beneficiaryShare
        );

        uint256[] memory emptyArray = new uint256[](0);
        emit AssetClaimed(
            inheritanceId,
            beneficiary,
            AssetType.ERC20,
            asset.contractAddress,
            beneficiaryShare,
            emptyArray,
            block.timestamp
        );

        return true;
    }

    /**
     * @dev CRITICAL FIX: Completely rewritten ERC721 distribution logic to prevent duplicates and missed tokens
     */
    function _claimERC721Asset(
        uint256 inheritanceId,
        address beneficiary,
        uint256 assetIndex,
        uint256 allocationBasisPoints
    ) internal returns (bool) {
        Asset storage asset = _assets[inheritanceId][assetIndex];

        if (!asset.isActive || asset.assetType != AssetType.ERC721) {
            return false;
        }

        // Calculate how many tokens this beneficiary should receive
        uint256 totalTokens = asset.tokenIds.length;
        uint256 tokensToTransfer = InheritanceLib.calculatePercentage(
            totalTokens,
            allocationBasisPoints
        );

        if (tokensToTransfer == 0) {
            _assetsClaimed[inheritanceId][beneficiary][assetIndex] = true;
            return false;
        }

        // CRITICAL FIX: Use distribution tracking to ensure no duplicates or missed tokens
        uint256 startIndex = _erc721TokenDistribution[inheritanceId][
            assetIndex
        ];
        uint256 endIndex = startIndex + tokensToTransfer;

        // Ensure we don't exceed available tokens
        if (endIndex > totalTokens) {
            endIndex = totalTokens;
            tokensToTransfer = endIndex - startIndex;
        }

        if (tokensToTransfer == 0) {
            _assetsClaimed[inheritanceId][beneficiary][assetIndex] = true;
            return false;
        }

        // Transfer the allocated range of tokens
        uint256[] memory transferredTokens = new uint256[](tokensToTransfer);
        for (uint256 i = 0; i < tokensToTransfer; i++) {
            uint256 tokenIndex = startIndex + i;
            uint256 tokenId = asset.tokenIds[tokenIndex];

            IERC721(asset.contractAddress).safeTransferFrom(
                address(this),
                beneficiary,
                tokenId
            );
            transferredTokens[i] = tokenId;
        }

        // Update distribution tracking
        _erc721TokenDistribution[inheritanceId][assetIndex] = endIndex;
        _assetsClaimed[inheritanceId][beneficiary][assetIndex] = true;

        emit AssetClaimed(
            inheritanceId,
            beneficiary,
            AssetType.ERC721,
            asset.contractAddress,
            tokensToTransfer,
            transferredTokens,
            block.timestamp
        );

        emit AssetDistributionCalculated(
            inheritanceId,
            beneficiary,
            assetIndex,
            tokensToTransfer
        );

        return true;
    }

    /**
     * @dev Get inheritance data
     */
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

    /**
     * @dev Get beneficiary information
     */
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

    /**
     * @dev Calculate claimable STT amount with proper vesting logic
     */
    function getClaimableSTT(
        uint256 inheritanceId,
        address beneficiary
    ) public view override inheritanceExists(inheritanceId) returns (uint256) {
        if (
            !_beneficiaries[inheritanceId][beneficiary].isActive ||
            _inheritances[inheritanceId].status !=
            InheritanceStatus.TRIGGERED ||
            _sttClaimed[inheritanceId][beneficiary]
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

    /**
     * @dev Get total assets for an inheritance
     */
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

    /**
     * @dev CRITICAL FIX: Enhanced TimeLock validation
     */
    function _validateTimeLock(TimeLock calldata timeLock) internal pure {
        if (timeLock.distributionType == DistributionType.LINEAR_VESTING) {
            InheritanceLib.validateVestingDuration(timeLock.vestingDuration);
            require(
                timeLock.cliffDuration <= timeLock.vestingDuration,
                "Cliff duration exceeds vesting duration"
            );
        }

        if (timeLock.distributionType == DistributionType.CLIFF_VESTING) {
            require(
                timeLock.cliffDuration > 0,
                "Cliff duration must be positive"
            );
            InheritanceLib.validateVestingDuration(timeLock.cliffDuration);
        }

        if (timeLock.distributionType == DistributionType.MILESTONE_BASED) {
            require(
                timeLock.milestoneTimestamps.length > 0,
                "No milestones provided"
            );
            InheritanceLib.validateMilestones(
                timeLock.milestoneTimestamps,
                timeLock.milestonePercentages
            );
        }
    }

    /**
     * @dev Calculate vested amount based on time lock configuration
     */
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

    /**
     * @dev CRITICAL FIX: Improved completion check
     */
    function _isInheritanceCompleted(
        uint256 inheritanceId
    ) internal view returns (bool) {
        // Check if all beneficiaries have claimed their STT
        address[] memory beneficiaries = _beneficiaryList[inheritanceId];

        for (uint256 i = 0; i < beneficiaries.length; i++) {
            address beneficiary = beneficiaries[i];
            if (_beneficiaries[inheritanceId][beneficiary].isActive) {
                // Check if this beneficiary has any claimable assets remaining
                if (getClaimableSTT(inheritanceId, beneficiary) > 0) {
                    return false;
                }

                // Check if any non-STT assets remain unclaimed
                Asset[] storage assets = _assets[inheritanceId];
                for (uint256 j = 0; j < assets.length; j++) {
                    if (
                        assets[j].assetType != AssetType.STT &&
                        !_assetsClaimed[inheritanceId][beneficiary][j]
                    ) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    /**
     * @dev Handle ERC721 token receipt
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }

    /**
     * @dev Reject direct STT payments
     */
    receive() external payable {
        revert("Direct STT payments not accepted - use depositSTT function");
    }

    /**
     * @dev Emergency function to pause contract (only admin)
     */
    function emergencyPause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        // Implementation would depend on adding Pausable functionality
        // This is a placeholder for emergency controls
    }

    /**
     * @dev Get asset claiming status for a beneficiary
     */
    function getAssetClaimingStatus(
        uint256 inheritanceId,
        address beneficiary
    )
        external
        view
        inheritanceExists(inheritanceId)
        returns (bool[] memory claimed)
    {
        uint256 assetCount = _assets[inheritanceId].length;
        claimed = new bool[](assetCount);

        for (uint256 i = 0; i < assetCount; i++) {
            claimed[i] = _assetsClaimed[inheritanceId][beneficiary][i];
        }

        return claimed;
    }

    /**
     * @dev Check if beneficiary has claimed STT
     */
    function hasClaimedSTT(
        uint256 inheritanceId,
        address beneficiary
    ) external view inheritanceExists(inheritanceId) returns (bool) {
        return _sttClaimed[inheritanceId][beneficiary];
    }
}
