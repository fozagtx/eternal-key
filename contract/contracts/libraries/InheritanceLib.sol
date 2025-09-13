// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library InheritanceLib {
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MAX_BENEFICIARIES = 50;
    uint256 public constant MAX_MILESTONES = 20;
    uint256 public constant MIN_VESTING_DURATION = 15; // 15 seconds for testing
    uint256 public constant DEFAULT_EXECUTION_DELAY = 15; // 15 seconds for testing
    uint256 public constant DEFAULT_CLIFF_DURATION = 15; // 15 seconds for testing

    error InvalidBasisPoints(uint256 provided, uint256 max);
    error MaxBeneficiariesExceeded(uint256 current, uint256 max);
    error InvalidTimeLock(string reason);
    error InheritanceNotActive(uint256 inheritanceId);
    error UnauthorizedAccess(address caller, string required);
    error AssetTransferFailed(address to, uint256 amount);
    error InsufficientBalance(uint256 requested, uint256 available);
    error BeneficiaryAlreadyExists(address beneficiary);
    error BeneficiaryNotFound(address beneficiary);
    error InheritanceNotTriggered(uint256 inheritanceId);

    function validateAllocation(uint256 allocationBasisPoints) internal pure {
        if (
            allocationBasisPoints == 0 || allocationBasisPoints > BASIS_POINTS
        ) {
            revert InvalidBasisPoints(allocationBasisPoints, BASIS_POINTS);
        }
    }

    function validateTotalAllocation(uint256 totalAllocation) internal pure {
        if (totalAllocation > BASIS_POINTS) {
            revert InvalidBasisPoints(totalAllocation, BASIS_POINTS);
        }
    }

    function calculateVestedAmount(
        uint256 totalAmount,
        uint256 startTime,
        uint256 currentTime,
        uint256 vestingDuration,
        uint256 cliffDuration
    ) internal pure returns (uint256) {
        if (currentTime < startTime + cliffDuration) {
            return 0;
        }

        if (currentTime >= startTime + vestingDuration) {
            return totalAmount;
        }

        uint256 elapsedTime = currentTime - startTime - cliffDuration;
        uint256 vestingTime = vestingDuration - cliffDuration;

        return (totalAmount * elapsedTime) / vestingTime;
    }

    function calculateMilestoneAmount(
        uint256 totalAmount,
        uint256 currentTime,
        uint256[] memory milestoneTimestamps,
        uint256[] memory milestonePercentages
    ) internal pure returns (uint256) {
        if (milestoneTimestamps.length != milestonePercentages.length) {
            return 0;
        }

        uint256 vestedPercentage = 0;

        for (uint256 i = 0; i < milestoneTimestamps.length; i++) {
            if (currentTime >= milestoneTimestamps[i]) {
                vestedPercentage += milestonePercentages[i];
            } else {
                break;
            }
        }

        return (totalAmount * vestedPercentage) / BASIS_POINTS;
    }

    function safeTransferETH(address to, uint256 amount) internal {
        if (address(this).balance < amount) {
            revert InsufficientBalance(amount, address(this).balance);
        }

        (bool success, ) = payable(to).call{value: amount}("");
        if (!success) {
            revert AssetTransferFailed(to, amount);
        }
    }

    function calculatePercentage(
        uint256 amount,
        uint256 basisPoints
    ) internal pure returns (uint256) {
        return (amount * basisPoints) / BASIS_POINTS;
    }

    function isValidTimestamp(uint256 timestamp) internal view returns (bool) {
        return timestamp > block.timestamp;
    }

    function validateMilestones(
        uint256[] memory timestamps,
        uint256[] memory percentages
    ) internal view {
        if (timestamps.length != percentages.length) {
            revert InvalidTimeLock("Milestone arrays length mismatch");
        }

        if (timestamps.length > MAX_MILESTONES) {
            revert InvalidTimeLock("Too many milestones");
        }

        uint256 totalPercentage = 0;
        uint256 previousTimestamp = block.timestamp;

        for (uint256 i = 0; i < timestamps.length; i++) {
            if (timestamps[i] <= previousTimestamp) {
                revert InvalidTimeLock(
                    "Milestone timestamps must be increasing"
                );
            }
            if (percentages[i] == 0) {
                revert InvalidTimeLock("Milestone percentage cannot be zero");
            }

            totalPercentage += percentages[i];
            previousTimestamp = timestamps[i];
        }

        if (totalPercentage != BASIS_POINTS) {
            revert InvalidTimeLock(
                "Total milestone percentages must equal 100%"
            );
        }
    }
}
