// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IInheritanceCore {
    enum SwitchStatus {
        INACTIVE,
        ACTIVE,
        CLAIMED,
        CANCELLED
    }

    struct DeadManSwitch {
        address owner;
        address beneficiary;
        uint256 deadline;
        uint256 lastCheckIn;
        uint256 createdAt;
        uint256 balance;
        SwitchStatus status;
    }

    event SwitchInitialized(
        address indexed owner,
        address indexed beneficiary,
        uint256 deadline,
        uint256 timestamp
    );

    event DepositMade(
        address indexed owner,
        uint256 amount,
        uint256 newBalance,
        uint256 timestamp
    );

    event CheckInPerformed(
        address indexed owner,
        uint256 newDeadline,
        uint256 timestamp
    );

    event FundsClaimed(
        address indexed beneficiary,
        uint256 amount,
        uint256 timestamp
    );

    event SwitchCancelled(
        address indexed owner,
        uint256 refundAmount,
        uint256 timestamp
    );

    function initialize(address beneficiary, uint256 deadline) external;

    function deposit() external payable;

    function checkIn(uint256 newDeadline) external;

    function claim() external;

    function cancel() external;

    function getSwitch() external view returns (DeadManSwitch memory);

    function getOwner() external view returns (address);

    function getBeneficiary() external view returns (address);

    function getDeadline() external view returns (uint256);

    function getBalance() external view returns (uint256);

    function getLastCheckIn() external view returns (uint256);

    function getStatus() external view returns (SwitchStatus);

    function isDeadlineExpired() external view returns (bool);

    function getTimeRemaining() external view returns (uint256);
}
