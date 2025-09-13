// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/IAccessControl.sol";

/**
 * @title IInheritanceAccessControl
 * @dev Interface for role-based access control in inheritance system
 * @notice Defines roles and permissions for inheritance management
 */
interface IInheritanceAccessControl is IAccessControl {
    // ============ ROLE DEFINITIONS ============

    /// @dev Admin role - can manage all aspects of the system
    bytes32 constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    /// @dev Owner role - can manage their own inheritance
    bytes32 constant OWNER_ROLE = keccak256("OWNER_ROLE");

    /// @dev Executor role - can trigger inheritance for specific accounts
    bytes32 constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    /// @dev Beneficiary role - can claim assets from inheritance
    bytes32 constant BENEFICIARY_ROLE = keccak256("BENEFICIARY_ROLE");

    /// @dev Emergency role - can execute emergency actions
    bytes32 constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    /// @dev Arbitrator role - can resolve disputes
    bytes32 constant ARBITRATOR_ROLE = keccak256("ARBITRATOR_ROLE");

    /// @dev Pauser role - can pause/unpause system operations
    bytes32 constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @dev Upgrader role - can upgrade contracts (if upgradeable)
    bytes32 constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // ============ ROLE MANAGEMENT ============

    /**
     * @dev Grants a role to an account for a specific inheritance
     * @param _inheritanceId The inheritance ID
     * @param _role The role to grant
     * @param _account The account to grant the role to
     */
    function grantInheritanceRole(
        uint256 _inheritanceId,
        bytes32 _role,
        address _account
    ) external;

    /**
     * @dev Revokes a role from an account for a specific inheritance
     * @param _inheritanceId The inheritance ID
     * @param _role The role to revoke
     * @param _account The account to revoke the role from
     */
    function revokeInheritanceRole(
        uint256 _inheritanceId,
        bytes32 _role,
        address _account
    ) external;

    /**
     * @dev Checks if an account has a specific role for an inheritance
     * @param _inheritanceId The inheritance ID
     * @param _role The role to check
     * @param _account The account to check
     * @return hasRole Whether the account has the role
     */
    function hasInheritanceRole(
        uint256 _inheritanceId,
        bytes32 _role,
        address _account
    ) external view returns (bool hasRole);

    /**
     * @dev Checks if an account can perform an action on an inheritance
     * @param _inheritanceId The inheritance ID
     * @param _action The action identifier
     * @param _account The account to check
     * @return canPerform Whether the account can perform the action
     */
    function canPerformAction(
        uint256 _inheritanceId,
        bytes32 _action,
        address _account
    ) external view returns (bool canPerform);

    // ============ ACTION DEFINITIONS ============

    /// @dev Action identifiers for permission checking
    bytes32 constant ACTION_CREATE_INHERITANCE =
        keccak256("ACTION_CREATE_INHERITANCE");
    bytes32 constant ACTION_MODIFY_BENEFICIARIES =
        keccak256("ACTION_MODIFY_BENEFICIARIES");
    bytes32 constant ACTION_DEPOSIT_ASSETS = keccak256("ACTION_DEPOSIT_ASSETS");
    bytes32 constant ACTION_WITHDRAW_ASSETS =
        keccak256("ACTION_WITHDRAW_ASSETS");
    bytes32 constant ACTION_TRIGGER_INHERITANCE =
        keccak256("ACTION_TRIGGER_INHERITANCE");
    bytes32 constant ACTION_CLAIM_ASSETS = keccak256("ACTION_CLAIM_ASSETS");
    bytes32 constant ACTION_EMERGENCY_PAUSE =
        keccak256("ACTION_EMERGENCY_PAUSE");
    bytes32 constant ACTION_EMERGENCY_WITHDRAW =
        keccak256("ACTION_EMERGENCY_WITHDRAW");
    bytes32 constant ACTION_RAISE_DISPUTE = keccak256("ACTION_RAISE_DISPUTE");
    bytes32 constant ACTION_RESOLVE_DISPUTE =
        keccak256("ACTION_RESOLVE_DISPUTE");
    bytes32 constant ACTION_BATCH_OPERATIONS =
        keccak256("ACTION_BATCH_OPERATIONS");

    // ============ EVENTS ============

    event InheritanceRoleGranted(
        uint256 indexed inheritanceId,
        bytes32 indexed role,
        address indexed account,
        address sender
    );

    event InheritanceRoleRevoked(
        uint256 indexed inheritanceId,
        bytes32 indexed role,
        address indexed account,
        address sender
    );

    event PermissionDenied(
        uint256 indexed inheritanceId,
        bytes32 indexed action,
        address indexed account,
        string reason
    );

    // ============ ROLE QUERIES ============

    /**
     * @dev Returns all accounts with a specific role for an inheritance
     * @param _inheritanceId The inheritance ID
     * @param _role The role to query
     * @return accounts Array of accounts with the role
     */
    function getInheritanceRoleMembers(
        uint256 _inheritanceId,
        bytes32 _role
    ) external view returns (address[] memory accounts);

    /**
     * @dev Returns all roles assigned to an account for an inheritance
     * @param _inheritanceId The inheritance ID
     * @param _account The account to query
     * @return roles Array of roles assigned to the account
     */
    function getAccountRoles(
        uint256 _inheritanceId,
        address _account
    ) external view returns (bytes32[] memory roles);

    /**
     * @dev Returns the number of accounts with a specific role
     * @param _inheritanceId The inheritance ID
     * @param _role The role to count
     * @return count Number of accounts with the role
     */
    function getRoleMemberCount(
        uint256 _inheritanceId,
        bytes32 _role
    ) external view returns (uint256 count);
}
