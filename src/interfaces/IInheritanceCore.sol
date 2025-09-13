// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/IAccessControl.sol";

/**
 * @title IInheritanceCore
 * @dev Core interface for the inheritance smart contract system
 * @notice Defines the main functionality for managing digital inheritance
 */
interface IInheritanceCore {
    // ============ ENUMS ============

    enum AssetType {
        ETH,
        ERC20,
        ERC721
    }

    enum UnlockType {
        IMMEDIATE, // Unlock immediately after trigger
        LINEAR, // Linear vesting over time
        CLIFF, // Cliff vesting with single unlock
        MILESTONE // Milestone-based unlocking
    }

    enum InheritanceStatus {
        ACTIVE, // Inheritance is active
        TRIGGERED, // Death/incapacity event triggered
        PAUSED, // Temporarily paused by owner
        DISPUTED, // Under dispute resolution
        COMPLETED // All assets distributed
    }

    enum DisputeStatus {
        NONE,
        RAISED,
        UNDER_REVIEW,
        RESOLVED
    }

    // ============ STRUCTS ============

    /**
     * @dev Represents a beneficiary with their allocation details
     */
    struct Beneficiary {
        address beneficiaryAddress;
        uint256 percentage; // Percentage allocation (basis points, 10000 = 100%)
        bool isActive;
        uint256 claimedETH;
        mapping(address => uint256) claimedERC20;
        mapping(address => bool) claimedERC721;
        UnlockSchedule unlockSchedule;
    }

    /**
     * @dev Defines the unlock schedule for a beneficiary
     */
    struct UnlockSchedule {
        UnlockType unlockType;
        uint256 startTime; // When unlocking begins
        uint256 duration; // Duration of vesting (for LINEAR type)
        uint256 cliffPeriod; // Cliff period before any unlock
        uint256[] milestones; // Milestone timestamps
        uint256[] milestonePercentages; // Percentage unlocked at each milestone
    }

    /**
     * @dev Represents an asset in the inheritance
     */
    struct Asset {
        AssetType assetType;
        address contractAddress; // Zero address for ETH
        uint256 tokenId; // For ERC721, ignored for others
        uint256 amount; // Amount or 1 for ERC721
        bool isActive;
    }

    /**
     * @dev Emergency configuration
     */
    struct EmergencyConfig {
        address emergencyContact;
        uint256 emergencyDelay; // Delay before emergency actions can be executed
        bool emergencyActive;
        uint256 emergencyTriggeredAt;
    }

    /**
     * @dev Dispute information
     */
    struct Dispute {
        address challenger;
        address challenged;
        string reason;
        uint256 timestamp;
        DisputeStatus status;
        address arbitrator;
        uint256 resolutionDeadline;
    }

    // ============ EVENTS ============

    event InheritanceCreated(
        address indexed owner,
        address indexed executor,
        uint256 indexed inheritanceId
    );

    event BeneficiaryAdded(
        uint256 indexed inheritanceId,
        address indexed beneficiary,
        uint256 percentage
    );

    event BeneficiaryRemoved(
        uint256 indexed inheritanceId,
        address indexed beneficiary
    );

    event AssetDeposited(
        uint256 indexed inheritanceId,
        AssetType indexed assetType,
        address indexed contractAddress,
        uint256 tokenId,
        uint256 amount
    );

    event AssetWithdrawn(
        uint256 indexed inheritanceId,
        AssetType indexed assetType,
        address indexed contractAddress,
        uint256 tokenId,
        uint256 amount,
        address recipient
    );

    event InheritanceTriggered(
        uint256 indexed inheritanceId,
        address indexed triggeredBy,
        uint256 timestamp
    );

    event DistributionExecuted(
        uint256 indexed inheritanceId,
        address indexed beneficiary,
        AssetType indexed assetType,
        address contractAddress,
        uint256 amount
    );

    event EmergencyActivated(
        uint256 indexed inheritanceId,
        address indexed activatedBy,
        string reason
    );

    event DisputeRaised(
        uint256 indexed inheritanceId,
        address indexed challenger,
        address indexed challenged,
        string reason
    );

    event DisputeResolved(
        uint256 indexed inheritanceId,
        address indexed arbitrator,
        bool approved
    );

    // ============ CORE FUNCTIONS ============

    /**
     * @dev Creates a new inheritance contract
     * @param _executor Address authorized to trigger inheritance
     * @param _beneficiaries Array of beneficiary addresses
     * @param _percentages Array of percentage allocations (basis points)
     * @param _unlockSchedules Array of unlock schedules for each beneficiary
     * @return inheritanceId The ID of the created inheritance
     */
    function createInheritance(
        address _executor,
        address[] calldata _beneficiaries,
        uint256[] calldata _percentages,
        UnlockSchedule[] calldata _unlockSchedules
    ) external returns (uint256 inheritanceId);

    /**
     * @dev Deposits ETH into the inheritance
     * @param _inheritanceId The inheritance ID
     */
    function depositETH(uint256 _inheritanceId) external payable;

    /**
     * @dev Deposits ERC20 tokens into the inheritance
     * @param _inheritanceId The inheritance ID
     * @param _token The ERC20 token address
     * @param _amount The amount to deposit
     */
    function depositERC20(
        uint256 _inheritanceId,
        address _token,
        uint256 _amount
    ) external;

    /**
     * @dev Deposits ERC721 token into the inheritance
     * @param _inheritanceId The inheritance ID
     * @param _nftContract The NFT contract address
     * @param _tokenId The token ID to deposit
     */
    function depositERC721(
        uint256 _inheritanceId,
        address _nftContract,
        uint256 _tokenId
    ) external;

    /**
     * @dev Triggers the inheritance distribution
     * @param _inheritanceId The inheritance ID
     */
    function triggerInheritance(uint256 _inheritanceId) external;

    /**
     * @dev Claims available assets for a beneficiary
     * @param _inheritanceId The inheritance ID
     * @param _assetTypes Array of asset types to claim
     * @param _tokens Array of token addresses (for ERC20/ERC721)
     * @param _tokenIds Array of token IDs (for ERC721)
     */
    function claimAssets(
        uint256 _inheritanceId,
        AssetType[] calldata _assetTypes,
        address[] calldata _tokens,
        uint256[] calldata _tokenIds
    ) external;

    /**
     * @dev Batch claims multiple assets efficiently
     * @param _inheritanceId The inheritance ID
     * @param _batchData Encoded batch claim data
     */
    function batchClaimAssets(
        uint256 _inheritanceId,
        bytes calldata _batchData
    ) external;

    // ============ VIEW FUNCTIONS ============

    /**
     * @dev Returns the inheritance details
     * @param _inheritanceId The inheritance ID
     */
    function getInheritance(
        uint256 _inheritanceId
    )
        external
        view
        returns (
            address owner,
            address executor,
            InheritanceStatus status,
            uint256 triggeredAt,
            uint256 totalBeneficiaries
        );

    /**
     * @dev Returns beneficiary details
     * @param _inheritanceId The inheritance ID
     * @param _beneficiary The beneficiary address
     */
    function getBeneficiary(
        uint256 _inheritanceId,
        address _beneficiary
    )
        external
        view
        returns (
            uint256 percentage,
            bool isActive,
            UnlockSchedule memory unlockSchedule
        );

    /**
     * @dev Calculates claimable amounts for a beneficiary
     * @param _inheritanceId The inheritance ID
     * @param _beneficiary The beneficiary address
     * @return ethAmount Claimable ETH amount
     * @return erc20Amounts Array of claimable ERC20 amounts
     * @return erc20Tokens Array of ERC20 token addresses
     * @return erc721Tokens Array of claimable ERC721 tokens
     * @return erc721TokenIds Array of claimable ERC721 token IDs
     */
    function getClaimableAssets(
        uint256 _inheritanceId,
        address _beneficiary
    )
        external
        view
        returns (
            uint256 ethAmount,
            uint256[] memory erc20Amounts,
            address[] memory erc20Tokens,
            address[] memory erc721Tokens,
            uint256[] memory erc721TokenIds
        );

    /**
     * @dev Returns all assets in an inheritance
     * @param _inheritanceId The inheritance ID
     */
    function getAssets(
        uint256 _inheritanceId
    ) external view returns (Asset[] memory assets);

    /**
     * @dev Checks if inheritance can be triggered
     * @param _inheritanceId The inheritance ID
     * @return canTrigger Whether inheritance can be triggered
     * @return reason Reason if cannot trigger
     */
    function canTriggerInheritance(
        uint256 _inheritanceId
    ) external view returns (bool canTrigger, string memory reason);
}
