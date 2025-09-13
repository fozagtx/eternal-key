// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IInheritanceEmergency
 * @dev Interface for emergency mechanisms and dispute resolution
 * @notice Defines emergency functions and dispute resolution procedures
 */
interface IInheritanceEmergency {
    // ============ ENUMS ============

    enum EmergencyType {
        OWNER_INCAPACITY, // Owner is incapacitated but alive
        EXECUTOR_COMPROMISE, // Executor account is compromised
        BENEFICIARY_DISPUTE, // Beneficiaries dispute the inheritance
        TECHNICAL_ISSUE, // Technical issues with the contract
        LEGAL_CHALLENGE, // Legal challenges to the inheritance
        FRAUD_DETECTION // Suspected fraudulent activity
    }

    enum EmergencyStatus {
        NONE,
        PENDING, // Emergency declared, waiting for delay
        ACTIVE, // Emergency is active, actions can be taken
        RESOLVED, // Emergency has been resolved
        CANCELLED // Emergency was cancelled
    }

    // ============ STRUCTS ============

    /**
     * @dev Emergency action details
     */
    struct EmergencyAction {
        EmergencyType emergencyType;
        address initiator;
        string reason;
        uint256 timestamp;
        uint256 executeAfter; // Timestamp when action can be executed
        EmergencyStatus status;
        bytes actionData; // Encoded action to be executed
        address[] approvers; // Accounts that approved this action
        uint256 requiredApprovals; // Number of approvals required
    }

    /**
     * @dev Dispute details
     */
    struct DisputeDetails {
        uint256 inheritanceId;
        address challenger;
        address[] respondents;
        string disputeReason;
        bytes evidence; // IPFS hash or other evidence reference
        uint256 filedAt;
        uint256 resolutionDeadline;
        address assignedArbitrator;
        bool isResolved;
        bool challengerWon;
        string resolutionNotes;
    }

    /**
     * @dev Arbitrator information
     */
    struct Arbitrator {
        address arbitratorAddress;
        string name;
        uint256 successfulResolutions;
        uint256 totalResolutions;
        uint256 averageResolutionTime;
        bool isActive;
        uint256 bondAmount; // Required bond for arbitration
    }

    // ============ EVENTS ============

    event EmergencyDeclared(
        uint256 indexed inheritanceId,
        EmergencyType indexed emergencyType,
        address indexed initiator,
        string reason,
        uint256 executeAfter
    );

    event EmergencyExecuted(
        uint256 indexed inheritanceId,
        EmergencyType indexed emergencyType,
        address indexed executor,
        bytes actionData
    );

    event EmergencyCancelled(
        uint256 indexed inheritanceId,
        EmergencyType indexed emergencyType,
        address indexed canceller,
        string reason
    );

    event DisputeFiled(
        uint256 indexed inheritanceId,
        uint256 indexed disputeId,
        address indexed challenger,
        address[] respondents,
        string reason
    );

    event DisputeResolved(
        uint256 indexed inheritanceId,
        uint256 indexed disputeId,
        address indexed arbitrator,
        bool challengerWon,
        string resolutionNotes
    );

    event ArbitratorRegistered(
        address indexed arbitrator,
        string name,
        uint256 bondAmount
    );

    event ArbitratorRemoved(address indexed arbitrator, string reason);

    event EmergencyApprovalGranted(
        uint256 indexed inheritanceId,
        EmergencyType indexed emergencyType,
        address indexed approver
    );

    // ============ EMERGENCY FUNCTIONS ============

    /**
     * @dev Declares an emergency for an inheritance
     * @param _inheritanceId The inheritance ID
     * @param _emergencyType The type of emergency
     * @param _reason Human-readable reason for the emergency
     * @param _actionData Encoded action to be executed after delay
     * @param _requiredApprovals Number of approvals required
     */
    function declareEmergency(
        uint256 _inheritanceId,
        EmergencyType _emergencyType,
        string calldata _reason,
        bytes calldata _actionData,
        uint256 _requiredApprovals
    ) external;

    /**
     * @dev Approves a pending emergency action
     * @param _inheritanceId The inheritance ID
     * @param _emergencyType The emergency type to approve
     */
    function approveEmergencyAction(
        uint256 _inheritanceId,
        EmergencyType _emergencyType
    ) external;

    /**
     * @dev Executes an approved emergency action after the delay period
     * @param _inheritanceId The inheritance ID
     * @param _emergencyType The emergency type to execute
     */
    function executeEmergencyAction(
        uint256 _inheritanceId,
        EmergencyType _emergencyType
    ) external;

    /**
     * @dev Cancels a pending emergency action
     * @param _inheritanceId The inheritance ID
     * @param _emergencyType The emergency type to cancel
     * @param _reason Reason for cancellation
     */
    function cancelEmergencyAction(
        uint256 _inheritanceId,
        EmergencyType _emergencyType,
        string calldata _reason
    ) external;

    /**
     * @dev Emergency pause of all inheritance operations
     * @param _inheritanceId The inheritance ID
     * @param _reason Reason for the pause
     */
    function emergencyPause(
        uint256 _inheritanceId,
        string calldata _reason
    ) external;

    /**
     * @dev Emergency unpause of inheritance operations
     * @param _inheritanceId The inheritance ID
     */
    function emergencyUnpause(uint256 _inheritanceId) external;

    /**
     * @dev Emergency withdrawal of assets to a safe address
     * @param _inheritanceId The inheritance ID
     * @param _recipient Address to receive the assets
     * @param _assetTypes Types of assets to withdraw
     * @param _tokens Token addresses (for ERC20/ERC721)
     * @param _amounts Amounts to withdraw
     * @param _tokenIds Token IDs (for ERC721)
     */
    function emergencyWithdraw(
        uint256 _inheritanceId,
        address _recipient,
        uint8[] calldata _assetTypes,
        address[] calldata _tokens,
        uint256[] calldata _amounts,
        uint256[] calldata _tokenIds
    ) external;

    // ============ DISPUTE FUNCTIONS ============

    /**
     * @dev Files a dispute against an inheritance
     * @param _inheritanceId The inheritance ID
     * @param _respondents Addresses being challenged
     * @param _reason Reason for the dispute
     * @param _evidence IPFS hash or other evidence reference
     * @return disputeId The ID of the created dispute
     */
    function fileDispute(
        uint256 _inheritanceId,
        address[] calldata _respondents,
        string calldata _reason,
        bytes calldata _evidence
    ) external returns (uint256 disputeId);

    /**
     * @dev Assigns an arbitrator to a dispute
     * @param _disputeId The dispute ID
     * @param _arbitrator The arbitrator address
     */
    function assignArbitrator(uint256 _disputeId, address _arbitrator) external;

    /**
     * @dev Resolves a dispute (can only be called by assigned arbitrator)
     * @param _disputeId The dispute ID
     * @param _challengerWon Whether the challenger won the dispute
     * @param _resolutionNotes Notes explaining the resolution
     * @param _actionData Optional encoded action to execute
     */
    function resolveDispute(
        uint256 _disputeId,
        bool _challengerWon,
        string calldata _resolutionNotes,
        bytes calldata _actionData
    ) external;

    /**
     * @dev Appeals a dispute resolution
     * @param _disputeId The dispute ID
     * @param _reason Reason for the appeal
     * @param _additionalEvidence Additional evidence for the appeal
     */
    function appealDispute(
        uint256 _disputeId,
        string calldata _reason,
        bytes calldata _additionalEvidence
    ) external;

    // ============ ARBITRATOR MANAGEMENT ============

    /**
     * @dev Registers as an arbitrator
     * @param _name Arbitrator name/identifier
     * @param _bondAmount Bond amount to lock
     */
    function registerArbitrator(
        string calldata _name,
        uint256 _bondAmount
    ) external payable;

    /**
     * @dev Removes an arbitrator (self or by admin)
     * @param _arbitrator Arbitrator address to remove
     * @param _reason Reason for removal
     */
    function removeArbitrator(
        address _arbitrator,
        string calldata _reason
    ) external;

    /**
     * @dev Updates arbitrator information
     * @param _name New name/identifier
     * @param _additionalBond Additional bond to add
     */
    function updateArbitratorInfo(
        string calldata _name,
        uint256 _additionalBond
    ) external payable;

    // ============ VIEW FUNCTIONS ============

    /**
     * @dev Returns emergency action details
     * @param _inheritanceId The inheritance ID
     * @param _emergencyType The emergency type
     */
    function getEmergencyAction(
        uint256 _inheritanceId,
        EmergencyType _emergencyType
    ) external view returns (EmergencyAction memory);

    /**
     * @dev Returns dispute details
     * @param _disputeId The dispute ID
     */
    function getDispute(
        uint256 _disputeId
    ) external view returns (DisputeDetails memory);

    /**
     * @dev Returns all active disputes for an inheritance
     * @param _inheritanceId The inheritance ID
     */
    function getActiveDisputes(
        uint256 _inheritanceId
    ) external view returns (uint256[] memory disputeIds);

    /**
     * @dev Returns arbitrator information
     * @param _arbitrator The arbitrator address
     */
    function getArbitratorInfo(
        address _arbitrator
    ) external view returns (Arbitrator memory);

    /**
     * @dev Returns all registered arbitrators
     */
    function getAllArbitrators()
        external
        view
        returns (address[] memory arbitrators);

    /**
     * @dev Checks if an inheritance is in emergency state
     * @param _inheritanceId The inheritance ID
     */
    function isInEmergencyState(
        uint256 _inheritanceId
    ) external view returns (bool inEmergency);

    /**
     * @dev Returns the emergency delay period
     */
    function getEmergencyDelay() external view returns (uint256 delay);
}
