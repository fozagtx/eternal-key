// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IEmergencyManager {
    enum EmergencyType {
        INCAPACITY,
        DEATH_CONFIRMATION,
        ACCOUNT_COMPROMISE,
        LEGAL_DISPUTE,
        BENEFICIARY_DISPUTE,
        TECHNICAL_ISSUE
    }

    enum EmergencyStatus {
        NONE,
        RAISED,
        INVESTIGATING,
        APPROVED,
        REJECTED,
        RESOLVED
    }

    struct EmergencyRequest {
        EmergencyType emergencyType;
        EmergencyStatus status;
        address requestedBy;
        uint256 requestedAt;
        uint256 approvedAt;
        uint256 executionDelay;
        string reason;
        bytes evidence;
        address[] approvers;
        bool isExecuted;
    }

    struct DisputeData {
        address disputant;
        address respondent;
        string reason;
        bytes evidence;
        address arbitrator;
        uint256 raisedAt;
        uint256 resolvedAt;
        bool isResolved;
        bool disputantWon;
    }

    event EmergencyRaised(
        uint256 indexed inheritanceId,
        uint256 indexed emergencyId,
        EmergencyType indexed emergencyType,
        address requestedBy,
        string reason,
        uint256 timestamp
    );

    event EmergencyApproved(
        uint256 indexed inheritanceId,
        uint256 indexed emergencyId,
        address indexed approver,
        uint256 executionDelay,
        uint256 timestamp
    );

    event EmergencyExecuted(
        uint256 indexed inheritanceId,
        uint256 indexed emergencyId,
        address indexed executor,
        uint256 timestamp
    );

    event DisputeRaised(
        uint256 indexed inheritanceId,
        uint256 indexed disputeId,
        address indexed disputant,
        address respondent,
        string reason,
        uint256 timestamp
    );

    event DisputeResolved(
        uint256 indexed inheritanceId,
        uint256 indexed disputeId,
        address indexed arbitrator,
        bool disputantWon,
        uint256 timestamp
    );

    event AssetsFreezed(
        uint256 indexed inheritanceId,
        address indexed freezer,
        uint256 timestamp
    );

    event AssetsUnfreezed(
        uint256 indexed inheritanceId,
        address indexed unfreezer,
        uint256 timestamp
    );

    function raiseEmergency(
        uint256 inheritanceId,
        EmergencyType emergencyType,
        string calldata reason,
        bytes calldata evidence
    ) external returns (uint256 emergencyId);

    function approveEmergency(
        uint256 inheritanceId,
        uint256 emergencyId,
        uint256 executionDelay
    ) external;

    function executeEmergency(
        uint256 inheritanceId,
        uint256 emergencyId
    ) external;

    function raiseDispute(
        uint256 inheritanceId,
        address respondent,
        string calldata reason,
        bytes calldata evidence
    ) external returns (uint256 disputeId);

    function resolveDispute(
        uint256 inheritanceId,
        uint256 disputeId,
        bool disputantWon
    ) external;

    function freezeAssets(uint256 inheritanceId) external;

    function unfreezeAssets(uint256 inheritanceId) external;

    function getEmergencyRequest(
        uint256 inheritanceId,
        uint256 emergencyId
    ) external view returns (EmergencyRequest memory);

    function getDispute(
        uint256 inheritanceId,
        uint256 disputeId
    ) external view returns (DisputeData memory);

    function isAssetsFreezed(
        uint256 inheritanceId
    ) external view returns (bool);
}
