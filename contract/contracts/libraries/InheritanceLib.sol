// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library InheritanceLib {
    // Constants
    uint256 public constant BASIS_POINTS = 10000; // 100.00%
    uint256 public constant MIN_VESTING_DURATION = 1 days;
    uint256 public constant MAX_VESTING_DURATION = 10 * 365 days; // 10 years
    uint256 public constant DEFAULT_EXECUTION_DELAY = 7 days;
    uint256 public constant DEFAULT_CLIFF_DURATION = 30 days;

    // Custom errors
    error InvalidPercentage(uint256 percentage);
    error InvalidVestingDuration(uint256 duration);
    error InsufficientBalance(uint256 required, uint256 available);
    error AssetTransferFailed(address recipient, uint256 amount);
    error InvalidMilestone(uint256 timestamp, uint256 percentage);
    error MilestoneMismatch(uint256 timestampLength, uint256 percentageLength);

    /**
     * @dev Calculates percentage of a total amount using basis points
     * @param total The total amount
     * @param basisPoints The percentage in basis points (10000 = 100%)
     * @return The calculated percentage amount
     */
    function calculatePercentage(
        uint256 total,
        uint256 basisPoints
    ) internal pure returns (uint256) {
        if (basisPoints == 0) return 0;
        if (basisPoints > BASIS_POINTS) {
            revert InvalidPercentage(basisPoints);
        }
        return (total * basisPoints) / BASIS_POINTS;
    }

    /**
     * @dev Safely transfers STT to a recipient
     * @param to The recipient address
     * @param amount The amount to transfer
     */
    function safeTransferSTT(address to, uint256 amount) internal {
        if (address(this).balance < amount) {
            revert InsufficientBalance(amount, address(this).balance);
        }

        (bool success, ) = payable(to).call{value: amount}("");
        if (!success) {
            revert AssetTransferFailed(to, amount);
        }
    }

    /**
     * @dev Calculates vested amount for linear vesting
     * @param totalAmount The total amount to be vested
     * @param startTime When vesting started
     * @param currentTime Current timestamp
     * @param vestingDuration Total vesting duration in seconds
     * @param cliffDuration Cliff period in seconds
     * @return The amount that has vested
     */
    function calculateVestedAmount(
        uint256 totalAmount,
        uint256 startTime,
        uint256 currentTime,
        uint256 vestingDuration,
        uint256 cliffDuration
    ) internal pure returns (uint256) {
        if (totalAmount == 0 || startTime == 0 || currentTime < startTime) {
            return 0;
        }

        if (vestingDuration == 0) {
            return totalAmount;
        }

        if (vestingDuration < MIN_VESTING_DURATION) {
            revert InvalidVestingDuration(vestingDuration);
        }

        // Check if cliff period has passed
        if (currentTime < startTime + cliffDuration) {
            return 0;
        }

        uint256 timeElapsed = currentTime - startTime;

        // If vesting period is complete
        if (timeElapsed >= vestingDuration) {
            return totalAmount;
        }

        // Calculate linear vesting
        return (totalAmount * timeElapsed) / vestingDuration;
    }

    /**
     * @dev Calculates amount available based on milestone completion
     * @param totalAmount The total amount allocated
     * @param currentTime Current timestamp
     * @param milestoneTimestamps Array of milestone timestamps
     * @param milestonePercentages Array of milestone percentages (basis points)
     * @return The amount available based on completed milestones
     */
    function calculateMilestoneAmount(
        uint256 totalAmount,
        uint256 currentTime,
        uint256[] memory milestoneTimestamps,
        uint256[] memory milestonePercentages
    ) internal pure returns (uint256) {
        if (totalAmount == 0) return 0;

        if (milestoneTimestamps.length != milestonePercentages.length) {
            revert MilestoneMismatch(
                milestoneTimestamps.length,
                milestonePercentages.length
            );
        }

        if (milestoneTimestamps.length == 0) {
            return totalAmount;
        }

        uint256 totalUnlocked = 0;

        for (uint256 i = 0; i < milestoneTimestamps.length; i++) {
            if (currentTime >= milestoneTimestamps[i]) {
                if (milestonePercentages[i] > BASIS_POINTS) {
                    revert InvalidMilestone(
                        milestoneTimestamps[i],
                        milestonePercentages[i]
                    );
                }
                totalUnlocked += milestonePercentages[i];
            }
        }

        // Ensure total unlocked doesn't exceed 100%
        if (totalUnlocked > BASIS_POINTS) {
            totalUnlocked = BASIS_POINTS;
        }

        return calculatePercentage(totalAmount, totalUnlocked);
    }

    /**
     * @dev Validates milestone arrays for consistency
     * @param milestoneTimestamps Array of timestamps
     * @param milestonePercentages Array of percentages
     */
    function validateMilestones(
        uint256[] memory milestoneTimestamps,
        uint256[] memory milestonePercentages
    ) internal pure {
        if (milestoneTimestamps.length != milestonePercentages.length) {
            revert MilestoneMismatch(
                milestoneTimestamps.length,
                milestonePercentages.length
            );
        }

        uint256 totalPercentage = 0;
        uint256 previousTimestamp = 0;

        for (uint256 i = 0; i < milestoneTimestamps.length; i++) {
            // Ensure timestamps are in ascending order
            if (milestoneTimestamps[i] <= previousTimestamp && i > 0) {
                revert InvalidMilestone(
                    milestoneTimestamps[i],
                    milestonePercentages[i]
                );
            }

            // Ensure percentage is valid
            if (
                milestonePercentages[i] == 0 ||
                milestonePercentages[i] > BASIS_POINTS
            ) {
                revert InvalidMilestone(
                    milestoneTimestamps[i],
                    milestonePercentages[i]
                );
            }

            totalPercentage += milestonePercentages[i];
            previousTimestamp = milestoneTimestamps[i];
        }

        // Total percentages should not exceed 100%
        if (totalPercentage > BASIS_POINTS) {
            revert InvalidPercentage(totalPercentage);
        }
    }

    /**
     * @dev Validates that an allocation percentage is within valid range
     * @param basisPoints The allocation in basis points
     */
    function validateAllocation(uint256 basisPoints) internal pure {
        if (basisPoints == 0 || basisPoints > BASIS_POINTS) {
            revert InvalidPercentage(basisPoints);
        }
    }

    /**
     * @dev Validates that total allocations don't exceed 100%
     * @param totalBasisPoints Sum of all allocations
     */
    function validateTotalAllocation(uint256 totalBasisPoints) internal pure {
        if (totalBasisPoints > BASIS_POINTS) {
            revert InvalidPercentage(totalBasisPoints);
        }
    }

    /**
     * @dev Calculates the minimum required STT balance for claims
     * @param totalDeposited Total STT amount deposited
     * @param totalClaimed Total STT amount already claimed
     * @return The remaining STT balance needed
     */
    function calculateRequiredBalance(
        uint256 totalDeposited,
        uint256 totalClaimed
    ) internal pure returns (uint256) {
        return
            totalDeposited > totalClaimed ? totalDeposited - totalClaimed : 0;
    }

    /**
     * @dev Checks if vesting duration is within acceptable limits
     * @param duration The vesting duration to validate
     */
    function validateVestingDuration(uint256 duration) internal pure {
        if (
            duration < MIN_VESTING_DURATION || duration > MAX_VESTING_DURATION
        ) {
            revert InvalidVestingDuration(duration);
        }
    }
}
