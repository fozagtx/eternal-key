// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IInheritanceCore
 * @dev Interface for InheritanceCore contract with security improvements:
 * - Removed inheritance name parameter for consistency
 * - Added new functions for asset claiming status
 * - Enhanced event definitions
 * - Improved type safety and validation
 */
interface IInheritanceCore {
    enum DistributionType {
        IMMEDIATE,
        LINEAR_VESTING,
        CLIFF_VESTING,
        MILESTONE_BASED
    }

    enum AssetType {
        STT,
        ERC20,
        ERC721
    }

    enum InheritanceStatus {
        ACTIVE,
        TRIGGERED,
        COMPLETED,
        DISPUTED,
        FROZEN
    }

    struct Beneficiary {
        address wallet;
        uint256 allocationBasisPoints;
        bool isActive;
        uint256 claimedSTT;
        uint256 addedAt;
    }

    struct Asset {
        AssetType assetType;
        address contractAddress;
        uint256 amount;
        uint256[] tokenIds;
        bool isActive;
        uint256 depositedAt;
    }

    struct TimeLock {
        DistributionType distributionType;
        uint256 unlockTime;
        uint256 vestingDuration;
        uint256 cliffDuration;
        uint256[] milestoneTimestamps;
        uint256[] milestonePercentages;
    }

    /**
     * @dev CRITICAL FIX: Removed name field to maintain consistency
     * The name parameter was causing interface inconsistencies and was not being used effectively
     */
    struct InheritanceData {
        address owner;
        InheritanceStatus status;
        uint256 createdAt;
        uint256 triggeredAt;
        TimeLock timeLock;
        uint256 totalBeneficiaries;
        bool requiresConfirmation;
        address executor;
        uint256 totalSTTDeposited;
        uint256 totalSTTClaimed;
    }

    // ============ EVENTS ============

    /**
     * @dev CRITICAL FIX: Updated event to remove name parameter
     */
    event InheritanceCreated(
        uint256 indexed inheritanceId,
        address indexed owner,
        uint256 timestamp
    );

    event BeneficiaryAdded(
        uint256 indexed inheritanceId,
        address indexed beneficiary,
        uint256 allocationBasisPoints,
        uint256 timestamp
    );

    event AssetDeposited(
        uint256 indexed inheritanceId,
        AssetType assetType,
        address indexed contractAddress,
        uint256 amount,
        uint256[] tokenIds,
        uint256 timestamp
    );

    event InheritanceTriggered(
        uint256 indexed inheritanceId,
        address indexed triggeredBy,
        uint256 timestamp
    );

    event AssetClaimed(
        uint256 indexed inheritanceId,
        address indexed beneficiary,
        AssetType assetType,
        address indexed contractAddress,
        uint256 amount,
        uint256[] tokenIds,
        uint256 timestamp
    );

    event InheritanceCompleted(
        uint256 indexed inheritanceId,
        uint256 timestamp
    );

    /**
     * @dev New event for enhanced transparency in asset distribution
     */
    event AssetDistributionCalculated(
        uint256 indexed inheritanceId,
        address indexed beneficiary,
        uint256 assetIndex,
        uint256 tokenCount
    );

    // ============ CORE FUNCTIONS ============

    /**
     * @dev Creates a new inheritance
     * @param executor The address authorized to trigger the inheritance
     * @param requiresConfirmation Whether beneficiary confirmation is required
     * @param timeLock The time lock configuration for asset distribution
     * @return inheritanceId The unique identifier for the created inheritance
     */
    function createInheritance(
        address executor,
        bool requiresConfirmation,
        TimeLock calldata timeLock
    ) external returns (uint256 inheritanceId);

    /**
     * @dev Adds a beneficiary to an inheritance
     * @param inheritanceId The inheritance identifier
     * @param beneficiary The beneficiary address
     * @param allocationBasisPoints The allocation in basis points (10000 = 100%)
     */
    function addBeneficiary(
        uint256 inheritanceId,
        address beneficiary,
        uint256 allocationBasisPoints
    ) external;

    /**
     * @dev Deposits STT (native token) to the inheritance
     * @param inheritanceId The inheritance identifier
     */
    function depositSTT(uint256 inheritanceId) external payable;

    /**
     * @dev Deposits ERC20 tokens to the inheritance
     * @param inheritanceId The inheritance identifier
     * @param tokenContract The ERC20 token contract address
     * @param amount The amount of tokens to deposit
     */
    function depositERC20(
        uint256 inheritanceId,
        address tokenContract,
        uint256 amount
    ) external;

    /**
     * @dev Deposits ERC721 tokens to the inheritance
     * @param inheritanceId The inheritance identifier
     * @param nftContract The ERC721 contract address
     * @param tokenIds Array of token IDs to deposit
     */
    function depositERC721(
        uint256 inheritanceId,
        address nftContract,
        uint256[] calldata tokenIds
    ) external;

    /**
     * @dev Triggers the inheritance for asset distribution
     * @param inheritanceId The inheritance identifier
     */
    function triggerInheritance(uint256 inheritanceId) external;

    /**
     * @dev Claims available assets for the calling beneficiary
     * @param inheritanceId The inheritance identifier
     */
    function claimAssets(uint256 inheritanceId) external;

    // ============ VIEW FUNCTIONS ============

    /**
     * @dev Gets complete inheritance data
     * @param inheritanceId The inheritance identifier
     * @return InheritanceData struct with all inheritance information
     */
    function getInheritanceData(
        uint256 inheritanceId
    ) external view returns (InheritanceData memory);

    /**
     * @dev Gets beneficiary information
     * @param inheritanceId The inheritance identifier
     * @param beneficiary The beneficiary address
     * @return Beneficiary struct with beneficiary information
     */
    function getBeneficiaryInfo(
        uint256 inheritanceId,
        address beneficiary
    ) external view returns (Beneficiary memory);

    /**
     * @dev Calculates claimable STT amount for a beneficiary
     * @param inheritanceId The inheritance identifier
     * @param beneficiary The beneficiary address
     * @return The amount of STT available for claiming
     */
    function getClaimableSTT(
        uint256 inheritanceId,
        address beneficiary
    ) external view returns (uint256);

    /**
     * @dev Gets all assets associated with an inheritance
     * @param inheritanceId The inheritance identifier
     * @return Array of Asset structs
     */
    function getTotalAssets(
        uint256 inheritanceId
    ) external view returns (Asset[] memory);

    // ============ NEW ENHANCED FUNCTIONS ============

    /**
     * @dev Gets asset claiming status for a beneficiary
     * @param inheritanceId The inheritance identifier
     * @param beneficiary The beneficiary address
     * @return claimed Array indicating which assets have been claimed
     */
    function getAssetClaimingStatus(
        uint256 inheritanceId,
        address beneficiary
    ) external view returns (bool[] memory claimed);

    /**
     * @dev Checks if a beneficiary has claimed their STT allocation
     * @param inheritanceId The inheritance identifier
     * @param beneficiary The beneficiary address
     * @return true if STT has been claimed, false otherwise
     */
    function hasClaimedSTT(
        uint256 inheritanceId,
        address beneficiary
    ) external view returns (bool);

    /**
     * @dev Emergency function to pause contract operations
     * Only callable by admin role
     */
    function emergencyPause() external;
}
