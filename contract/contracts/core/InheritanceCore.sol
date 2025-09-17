// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "../interfaces/InheritanceCore.sol";
import "../libraries/InheritanceLib.sol";

contract InheritanceCore is IInheritanceCore, AccessControl, ReentrancyGuard {
    using InheritanceLib for address;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    mapping(address => DeadManSwitch) private switches;

    modifier onlyOwner() {
        InheritanceLib.requireOwner(msg.sender, switches[msg.sender].owner);
        _;
    }

    modifier onlyBeneficiary() {
        InheritanceLib.requireBeneficiary(
            msg.sender,
            switches[msg.sender].beneficiary
        );
        _;
    }

    modifier switchExists() {
        InheritanceLib.requireInitialized(switches[msg.sender].owner);
        _;
    }

    modifier switchNotExists() {
        InheritanceLib.requireNotInitialized(switches[msg.sender].owner);
        _;
    }

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function initialize(
        address beneficiary,
        uint256 deadline
    ) external override switchNotExists {
        InheritanceLib.validateBeneficiary(msg.sender, beneficiary);
        InheritanceLib.validateDeadline(deadline);
        switches[msg.sender] = DeadManSwitch({
            owner: msg.sender,
            beneficiary: beneficiary,
            deadline: deadline,
            lastCheckIn: block.timestamp,
            createdAt: block.timestamp,
            balance: 0,
            status: SwitchStatus.ACTIVE
        });
        emit SwitchInitialized(
            msg.sender,
            beneficiary,
            deadline,
            block.timestamp
        );
    }

    function deposit()
        external
        payable
        override
        switchExists
        onlyOwner
        nonReentrant
    {
        require(msg.value > 0, "Deposit must be greater than 0");
        require(
            switches[msg.sender].status == SwitchStatus.ACTIVE,
            "Switch not active"
        );

        InheritanceLib.requireDeadlineNotExpired(switches[msg.sender].deadline);
        switches[msg.sender].balance += msg.value;

        emit DepositMade(
            msg.sender,
            msg.value,
            switches[msg.sender].balance,
            block.timestamp
        );
    }

    function checkIn(
        uint256 newDeadline
    ) external override switchExists onlyOwner {
        require(
            switches[msg.sender].status == SwitchStatus.ACTIVE,
            "Switch not active"
        );

        InheritanceLib.requireDeadlineNotExpired(switches[msg.sender].deadline);
        InheritanceLib.validateDeadline(newDeadline);

        switches[msg.sender].deadline = newDeadline;
        switches[msg.sender].lastCheckIn = block.timestamp;

        emit CheckInPerformed(msg.sender, newDeadline, block.timestamp);
    }

    function claim() external override nonReentrant {
        DeadManSwitch storage userSwitch = switches[msg.sender];
        require(userSwitch.beneficiary == msg.sender, "Not beneficiary");
        require(userSwitch.status == SwitchStatus.ACTIVE, "Switch not active");

        InheritanceLib.requireDeadlineExpired(userSwitch.deadline);

        uint256 amount = userSwitch.balance;
        require(amount > 0, "No funds to claim");

        userSwitch.status = SwitchStatus.CLAIMED;
        userSwitch.balance = 0;

        InheritanceLib.safeTransferETH(msg.sender, amount);

        emit FundsClaimed(msg.sender, amount, block.timestamp);
    }

    function cancel() external override switchExists onlyOwner nonReentrant {
        require(
            switches[msg.sender].status == SwitchStatus.ACTIVE,
            "Switch not active"
        );

        InheritanceLib.requireDeadlineNotExpired(switches[msg.sender].deadline);

        uint256 refundAmount = switches[msg.sender].balance;

        switches[msg.sender].status = SwitchStatus.CANCELLED;
        switches[msg.sender].balance = 0;

        if (refundAmount > 0) {
            InheritanceLib.safeTransferETH(msg.sender, refundAmount);
        }

        emit SwitchCancelled(msg.sender, refundAmount, block.timestamp);
    }

    function getSwitch() external view override returns (DeadManSwitch memory) {
        return switches[msg.sender];
    }

    function getOwner() external view override returns (address) {
        return switches[msg.sender].owner;
    }

    function getBeneficiary() external view override returns (address) {
        return switches[msg.sender].beneficiary;
    }

    function getDeadline() external view override returns (uint256) {
        return switches[msg.sender].deadline;
    }

    function getBalance() external view override returns (uint256) {
        return switches[msg.sender].balance;
    }

    function getLastCheckIn() external view override returns (uint256) {
        return switches[msg.sender].lastCheckIn;
    }

    function getStatus() external view override returns (SwitchStatus) {
        return switches[msg.sender].status;
    }

    function isDeadlineExpired() external view override returns (bool) {
        return InheritanceLib.isDeadlineExpired(switches[msg.sender].deadline);
    }

    function getTimeRemaining() external view override returns (uint256) {
        return InheritanceLib.getTimeRemaining(switches[msg.sender].deadline);
    }

    receive() external payable {
        revert("Use deposit function");
    }

    fallback() external payable {
        revert("Use deposit function");
    }
}
