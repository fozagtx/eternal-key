// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IEmergencyManager.sol";
import "../libraries/InheritanceLib.sol";

contract EmergencyManager is IEmergencyManager, AccessControl, ReentrancyGuard {
    bytes32 public constant ARBITRATOR_ROLE = keccak256("ARBITRATOR_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    mapping(uint256 => mapping(uint256 => EmergencyRequest))
        private _emergencyRequests;
    mapping(uint256 => uint256) private _emergencyCounters;
    mapping(uint256 => mapping(uint256 => DisputeData)) private _disputes;
    mapping(uint256 => uint256) private _disputeCounters;
    mapping(uint256 => bool) private _assetsFreezed;
    mapping(uint256 => mapping(address => bool)) private _emergencyContacts;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ARBITRATOR_ROLE, msg.sender);
    }

    function raiseEmergency(
        uint256 inheritanceId,
        EmergencyType emergencyType,
        string calldata reason,
        bytes calldata evidence
    ) external override returns (uint256 emergencyId) {
        require(bytes(reason).length > 0, "Reason cannot be empty");
        require(
            hasRole(EMERGENCY_ROLE, msg.sender) ||
                _emergencyContacts[inheritanceId][msg.sender],
            "Not authorized to raise emergency"
        );

        emergencyId = _emergencyCounters[inheritanceId]++;

        EmergencyRequest storage request = _emergencyRequests[inheritanceId][
            emergencyId
        ];
        request.emergencyType = emergencyType;
        request.status = EmergencyStatus.RAISED;
        request.requestedBy = msg.sender;
        request.requestedAt = block.timestamp;
        request.reason = reason;
        request.evidence = evidence;
        request.executionDelay = InheritanceLib.DEFAULT_EXECUTION_DELAY;

        emit EmergencyRaised(
            inheritanceId,
            emergencyId,
            emergencyType,
            msg.sender,
            reason,
            block.timestamp
        );

        if (
            emergencyType == EmergencyType.ACCOUNT_COMPROMISE ||
            emergencyType == EmergencyType.TECHNICAL_ISSUE
        ) {
            freezeAssets(inheritanceId);
        }
    }

    function approveEmergency(
        uint256 inheritanceId,
        uint256 emergencyId,
        uint256 executionDelay
    ) external override {
        require(
            hasRole(ARBITRATOR_ROLE, msg.sender),
            "Not authorized to approve emergency"
        );
        require(
            emergencyId < _emergencyCounters[inheritanceId],
            "Emergency does not exist"
        );

        EmergencyRequest storage request = _emergencyRequests[inheritanceId][
            emergencyId
        ];
        require(
            request.status == EmergencyStatus.RAISED,
            "Emergency not in correct state"
        );
        require(
            executionDelay >= InheritanceLib.DEFAULT_EXECUTION_DELAY,
            "Execution delay too short"
        );

        request.status = EmergencyStatus.APPROVED;
        request.approvedAt = block.timestamp;
        request.executionDelay = executionDelay;
        request.approvers.push(msg.sender);

        emit EmergencyApproved(
            inheritanceId,
            emergencyId,
            msg.sender,
            executionDelay,
            block.timestamp
        );
    }

    function executeEmergency(
        uint256 inheritanceId,
        uint256 emergencyId
    ) external override nonReentrant {
        require(
            emergencyId < _emergencyCounters[inheritanceId],
            "Emergency does not exist"
        );

        EmergencyRequest storage request = _emergencyRequests[inheritanceId][
            emergencyId
        ];
        require(
            request.status == EmergencyStatus.APPROVED,
            "Emergency not approved"
        );
        require(!request.isExecuted, "Emergency already executed");
        require(
            block.timestamp >= request.approvedAt + request.executionDelay,
            "Execution delay not passed"
        );
        require(
            hasRole(ARBITRATOR_ROLE, msg.sender) ||
                msg.sender == request.requestedBy,
            "Not authorized to execute emergency"
        );

        request.isExecuted = true;
        request.status = EmergencyStatus.RESOLVED;

        if (
            request.emergencyType == EmergencyType.INCAPACITY ||
            request.emergencyType == EmergencyType.DEATH_CONFIRMATION
        ) {
            // In a real implementation, this would trigger inheritance
            // For now, we just unfreeze assets if they were frozen
            if (_assetsFreezed[inheritanceId]) {
                unfreezeAssets(inheritanceId);
            }
        }

        emit EmergencyExecuted(
            inheritanceId,
            emergencyId,
            msg.sender,
            block.timestamp
        );
    }

    function raiseDispute(
        uint256 inheritanceId,
        address respondent,
        string calldata reason,
        bytes calldata evidence
    ) external override returns (uint256 disputeId) {
        require(respondent != address(0), "Invalid respondent");
        require(respondent != msg.sender, "Cannot dispute against yourself");
        require(bytes(reason).length > 0, "Reason cannot be empty");

        disputeId = _disputeCounters[inheritanceId]++;

        DisputeData storage dispute = _disputes[inheritanceId][disputeId];
        dispute.disputant = msg.sender;
        dispute.respondent = respondent;
        dispute.reason = reason;
        dispute.evidence = evidence;
        dispute.raisedAt = block.timestamp;

        freezeAssets(inheritanceId);

        emit DisputeRaised(
            inheritanceId,
            disputeId,
            msg.sender,
            respondent,
            reason,
            block.timestamp
        );
    }

    function resolveDispute(
        uint256 inheritanceId,
        uint256 disputeId,
        bool disputantWon
    ) external override {
        require(
            hasRole(ARBITRATOR_ROLE, msg.sender),
            "Not authorized to resolve dispute"
        );
        require(
            disputeId < _disputeCounters[inheritanceId],
            "Dispute does not exist"
        );

        DisputeData storage dispute = _disputes[inheritanceId][disputeId];
        require(!dispute.isResolved, "Dispute already resolved");

        dispute.arbitrator = msg.sender;
        dispute.resolvedAt = block.timestamp;
        dispute.isResolved = true;
        dispute.disputantWon = disputantWon;

        unfreezeAssets(inheritanceId);

        emit DisputeResolved(
            inheritanceId,
            disputeId,
            msg.sender,
            disputantWon,
            block.timestamp
        );
    }

    function freezeAssets(uint256 inheritanceId) public override {
        require(
            hasRole(EMERGENCY_ROLE, msg.sender) ||
                hasRole(ARBITRATOR_ROLE, msg.sender) ||
                _emergencyContacts[inheritanceId][msg.sender],
            "Not authorized to freeze assets"
        );

        if (!_assetsFreezed[inheritanceId]) {
            _assetsFreezed[inheritanceId] = true;
            emit AssetsFreezed(inheritanceId, msg.sender, block.timestamp);
        }
    }

    function unfreezeAssets(uint256 inheritanceId) public override {
        require(
            hasRole(ARBITRATOR_ROLE, msg.sender),
            "Not authorized to unfreeze assets"
        );

        if (_assetsFreezed[inheritanceId]) {
            _assetsFreezed[inheritanceId] = false;
            emit AssetsUnfreezed(inheritanceId, msg.sender, block.timestamp);
        }
    }

    function getEmergencyRequest(
        uint256 inheritanceId,
        uint256 emergencyId
    ) external view override returns (EmergencyRequest memory) {
        require(
            emergencyId < _emergencyCounters[inheritanceId],
            "Emergency does not exist"
        );
        return _emergencyRequests[inheritanceId][emergencyId];
    }

    function getDispute(
        uint256 inheritanceId,
        uint256 disputeId
    ) external view override returns (DisputeData memory) {
        require(
            disputeId < _disputeCounters[inheritanceId],
            "Dispute does not exist"
        );
        return _disputes[inheritanceId][disputeId];
    }

    function isAssetsFreezed(
        uint256 inheritanceId
    ) external view override returns (bool) {
        return _assetsFreezed[inheritanceId];
    }

    function addEmergencyContact(
        uint256 inheritanceId,
        address contact
    ) external {
        require(contact != address(0), "Invalid contact address");
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not authorized");

        _emergencyContacts[inheritanceId][contact] = true;
    }

    function removeEmergencyContact(
        uint256 inheritanceId,
        address contact
    ) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not authorized");

        _emergencyContacts[inheritanceId][contact] = false;
    }

    function isEmergencyContact(
        uint256 inheritanceId,
        address contact
    ) external view returns (bool) {
        return _emergencyContacts[inheritanceId][contact];
    }
}
