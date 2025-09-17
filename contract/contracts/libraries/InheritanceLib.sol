// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library InheritanceLib {
    uint256 public constant MIN_DEADLINE_EXTENSION = 15 seconds;
    uint256 public constant MAX_DEADLINE_EXTENSION = 365 days;
    uint256 public constant DEFAULT_DEADLINE_EXTENSION = 15 seconds;

    error InvalidBeneficiary(address beneficiary);
    error InvalidDeadline(uint256 deadline);
    error DeadlineNotExpired(uint256 currentTime, uint256 deadline);
    error DeadlineExpired(uint256 currentTime, uint256 deadline);
    error ZeroAddress();
    error InsufficientBalance(uint256 required, uint256 available);
    error TransferFailed(address recipient, uint256 amount);
    error InvalidDeadlineExtension(uint256 extension);
    error OnlyOwner(address caller, address owner);
    error OnlyBeneficiary(address caller, address beneficiary);
    error SwitchAlreadyInitialized();
    error SwitchNotInitialized();

    function validateAddress(address addr) internal pure {
        if (addr == address(0)) {
            revert ZeroAddress();
        }
    }

    function validateBeneficiary(
        address owner,
        address beneficiary
    ) internal pure {
        validateAddress(beneficiary);
        if (beneficiary == owner) {
            revert InvalidBeneficiary(beneficiary);
        }
    }

    function validateDeadline(uint256 deadline) internal view {
        if (deadline <= block.timestamp) {
            revert InvalidDeadline(deadline);
        }
    }

    function validateDeadlineExtension(uint256 extension) internal pure {
        if (
            extension < MIN_DEADLINE_EXTENSION ||
            extension > MAX_DEADLINE_EXTENSION
        ) {
            revert InvalidDeadlineExtension(extension);
        }
    }

    function isDeadlineExpired(uint256 deadline) internal view returns (bool) {
        return block.timestamp >= deadline;
    }

    function requireDeadlineNotExpired(uint256 deadline) internal view {
        if (isDeadlineExpired(deadline)) {
            revert DeadlineExpired(block.timestamp, deadline);
        }
    }

    function requireDeadlineExpired(uint256 deadline) internal view {
        if (!isDeadlineExpired(deadline)) {
            revert DeadlineNotExpired(block.timestamp, deadline);
        }
    }

    function calculateNewDeadline(
        uint256 extension
    ) internal view returns (uint256) {
        validateDeadlineExtension(extension);
        return block.timestamp + extension;
    }

    function safeTransferETH(address to, uint256 amount) internal {
        validateAddress(to);

        if (address(this).balance < amount) {
            revert InsufficientBalance(amount, address(this).balance);
        }

        (bool success, ) = payable(to).call{value: amount}("");
        if (!success) {
            revert TransferFailed(to, amount);
        }
    }

    function requireOwner(address caller, address owner) internal pure {
        if (caller != owner) {
            revert OnlyOwner(caller, owner);
        }
    }

    function requireBeneficiary(
        address caller,
        address beneficiary
    ) internal pure {
        if (caller != beneficiary) {
            revert OnlyBeneficiary(caller, beneficiary);
        }
    }

    function requireInitialized(address owner) internal pure {
        if (owner == address(0)) {
            revert SwitchNotInitialized();
        }
    }

    function requireNotInitialized(address owner) internal pure {
        if (owner != address(0)) {
            revert SwitchAlreadyInitialized();
        }
    }

    function getContractBalance() internal view returns (uint256) {
        return address(this).balance;
    }

    function getTimeRemaining(
        uint256 deadline
    ) internal view returns (uint256) {
        if (isDeadlineExpired(deadline)) {
            return 0;
        }
        return deadline - block.timestamp;
    }

    function getTimeSinceLastCheckIn(
        uint256 lastCheckIn
    ) internal view returns (uint256) {
        if (lastCheckIn == 0) {
            return 0;
        }
        return block.timestamp - lastCheckIn;
    }
}
