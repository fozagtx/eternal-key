// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "../interfaces/IInheritanceCore.sol";

/**
 * @title InheritanceTimelock
 * @dev Handles time-locked distributions with flexible unlock schedules
 * @notice Implements various unlock mechanisms: immediate, linear, cliff, and milestone-based
 */
contract InheritanceTimelock {
    using Math for uint256;

    // ============ CONSTANTS ============

    uint256 public constant BASIS_POINTS = 10000; // 100% = 10000 basis points
    uint256 public constant MAX_UNLOCK_DURATION = 365 days * 50; // 50 years max
    uint256 public constant MIN_LINEAR_DURATION = 1 days; // Minimum linear vesting duration

    // ============ STORAGE ============

    /// @dev Mapping from inheritance ID to trigger timestamp
    mapping(uint256 => uint256) public inheritanceTriggeredAt;

    /// @dev Mapping to track inheritance triggering status
    mapping(uint256 => bool) public isInheritanceTriggered;

    // ============ EVENTS ============

    event InheritanceTriggered(
        uint256 indexed inheritanceId,
        uint256 timestamp,
        address triggeredBy
    );

    event UnlockCalculated(
        uint256 indexed inheritanceId,
        address indexed beneficiary,
        uint256 unlockedPercentage,
        IInheritanceCore.UnlockType unlockType
    );

    // ============ ERRORS ============

    error InheritanceNotTriggered();
    error InvalidUnlockSchedule();
    error UnlockNotStarted();
    error InvalidTimestamp();

    // ============ MODIFIERS ============

    modifier inheritanceTriggered(uint256 _inheritanceId) {
        if (!isInheritanceTriggered[_inheritanceId])
            revert InheritanceNotTriggered();
        _;
    }

    // ============ CORE FUNCTIONS ============

    /**
     * @dev Triggers the inheritance timelock
     * @param _inheritanceId The inheritance ID
     */
    function triggerInheritance(uint256 _inheritanceId) external {
        require(!isInheritanceTriggered[_inheritanceId], "Already triggered");

        uint256 currentTime = block.timestamp;
        inheritanceTriggeredAt[_inheritanceId] = currentTime;
        isInheritanceTriggered[_inheritanceId] = true;

        emit InheritanceTriggered(_inheritanceId, currentTime, msg.sender);
    }

    /**
     * @dev Calculates the unlocked percentage for a beneficiary based on their unlock schedule
     * @param _inheritanceId The inheritance ID
     * @param _unlockSchedule The beneficiary's unlock schedule
     * @return unlockedPercentage The percentage unlocked (in basis points)
     */
    function calculateUnlockedPercentage(
        uint256 _inheritanceId,
        IInheritanceCore.UnlockSchedule memory _unlockSchedule
    )
        public
        view
        inheritanceTriggered(_inheritanceId)
        returns (uint256 unlockedPercentage)
    {
        uint256 triggeredAt = inheritanceTriggeredAt[_inheritanceId];
        uint256 currentTime = block.timestamp;

        if (
            _unlockSchedule.unlockType == IInheritanceCore.UnlockType.IMMEDIATE
        ) {
            return
                _calculateImmediateUnlock(
                    triggeredAt,
                    currentTime,
                    _unlockSchedule
                );
        } else if (
            _unlockSchedule.unlockType == IInheritanceCore.UnlockType.LINEAR
        ) {
            return
                _calculateLinearUnlock(
                    triggeredAt,
                    currentTime,
                    _unlockSchedule
                );
        } else if (
            _unlockSchedule.unlockType == IInheritanceCore.UnlockType.CLIFF
        ) {
            return
                _calculateCliffUnlock(
                    triggeredAt,
                    currentTime,
                    _unlockSchedule
                );
        } else if (
            _unlockSchedule.unlockType == IInheritanceCore.UnlockType.MILESTONE
        ) {
            return
                _calculateMilestoneUnlock(
                    triggeredAt,
                    currentTime,
                    _unlockSchedule
                );
        }

        return 0;
    }

    /**
     * @dev Calculates the unlocked amount for a beneficiary for a specific asset
     * @param _inheritanceId The inheritance ID
     * @param _totalAmount The total amount allocated to the beneficiary
     * @param _claimedAmount The amount already claimed
     * @param _unlockSchedule The beneficiary's unlock schedule
     * @return claimableAmount The amount that can be claimed now
     */
    function calculateClaimableAmount(
        uint256 _inheritanceId,
        uint256 _totalAmount,
        uint256 _claimedAmount,
        IInheritanceCore.UnlockSchedule memory _unlockSchedule
    )
        external
        view
        inheritanceTriggered(_inheritanceId)
        returns (uint256 claimableAmount)
    {
        uint256 unlockedPercentage = calculateUnlockedPercentage(
            _inheritanceId,
            _unlockSchedule
        );
        uint256 totalUnlockedAmount = (_totalAmount * unlockedPercentage) /
            BASIS_POINTS;

        if (totalUnlockedAmount > _claimedAmount) {
            claimableAmount = totalUnlockedAmount - _claimedAmount;
        } else {
            claimableAmount = 0;
        }
    }

    /**
     * @dev Checks if an inheritance can be triggered
     * @param _inheritanceId The inheritance ID
     * @return canTrigger Whether the inheritance can be triggered
     */
    function canTriggerInheritance(
        uint256 _inheritanceId
    ) external view returns (bool canTrigger) {
        return !isInheritanceTriggered[_inheritanceId];
    }

    /**
     * @dev Returns detailed unlock information for a beneficiary
     * @param _inheritanceId The inheritance ID
     * @param _unlockSchedule The beneficiary's unlock schedule
     */
    function getUnlockDetails(
        uint256 _inheritanceId,
        IInheritanceCore.UnlockSchedule memory _unlockSchedule
    )
        external
        view
        inheritanceTriggered(_inheritanceId)
        returns (
            uint256 unlockedPercentage,
            uint256 nextUnlockTime,
            uint256 nextUnlockPercentage,
            bool isFullyUnlocked
        )
    {
        unlockedPercentage = calculateUnlockedPercentage(
            _inheritanceId,
            _unlockSchedule
        );
        isFullyUnlocked = (unlockedPercentage == BASIS_POINTS);

        if (!isFullyUnlocked) {
            (nextUnlockTime, nextUnlockPercentage) = _getNextUnlockInfo(
                _inheritanceId,
                _unlockSchedule
            );
        }
    }

    // ============ INTERNAL UNLOCK CALCULATIONS ============

    /**
     * @dev Calculates immediate unlock (with optional cliff period)
     */
    function _calculateImmediateUnlock(
        uint256 _triggeredAt,
        uint256 _currentTime,
        IInheritanceCore.UnlockSchedule memory _unlockSchedule
    ) internal pure returns (uint256) {
        uint256 unlockTime = _triggeredAt + _unlockSchedule.cliffPeriod;

        if (_currentTime >= unlockTime) {
            return BASIS_POINTS; // 100% unlocked
        }

        return 0; // Still in cliff period
    }

    /**
     * @dev Calculates linear unlock (vesting over time)
     */
    function _calculateLinearUnlock(
        uint256 _triggeredAt,
        uint256 _currentTime,
        IInheritanceCore.UnlockSchedule memory _unlockSchedule
    ) internal pure returns (uint256) {
        uint256 unlockStartTime = _triggeredAt + _unlockSchedule.cliffPeriod;

        if (_currentTime < unlockStartTime) {
            return 0; // Still in cliff period
        }

        uint256 unlockEndTime = unlockStartTime + _unlockSchedule.duration;

        if (_currentTime >= unlockEndTime) {
            return BASIS_POINTS; // 100% unlocked
        }

        // Calculate linear progression
        uint256 timeElapsed = _currentTime - unlockStartTime;
        uint256 unlockedPercentage = (timeElapsed * BASIS_POINTS) /
            _unlockSchedule.duration;

        return Math.min(unlockedPercentage, BASIS_POINTS);
    }

    /**
     * @dev Calculates cliff unlock (all at once after cliff period)
     */
    function _calculateCliffUnlock(
        uint256 _triggeredAt,
        uint256 _currentTime,
        IInheritanceCore.UnlockSchedule memory _unlockSchedule
    ) internal pure returns (uint256) {
        uint256 unlockTime = _triggeredAt + _unlockSchedule.cliffPeriod;

        if (_currentTime >= unlockTime) {
            return BASIS_POINTS; // 100% unlocked after cliff
        }

        return 0; // Still in cliff period
    }

    /**
     * @dev Calculates milestone-based unlock
     */
    function _calculateMilestoneUnlock(
        uint256 _triggeredAt,
        uint256 _currentTime,
        IInheritanceCore.UnlockSchedule memory _unlockSchedule
    ) internal pure returns (uint256) {
        uint256 totalUnlocked = 0;

        // Apply cliff period to all milestones
        uint256 adjustedCurrentTime = _currentTime;
        if (_unlockSchedule.cliffPeriod > 0) {
            uint256 cliffEndTime = _triggeredAt + _unlockSchedule.cliffPeriod;
            if (_currentTime < cliffEndTime) {
                return 0; // Still in cliff period
            }
            adjustedCurrentTime = _currentTime;
        }

        // Check each milestone
        for (uint256 i = 0; i < _unlockSchedule.milestones.length; i++) {
            uint256 milestoneTime = _triggeredAt +
                _unlockSchedule.milestones[i];

            if (adjustedCurrentTime >= milestoneTime) {
                totalUnlocked += _unlockSchedule.milestonePercentages[i];
            } else {
                break; // Milestones are in chronological order
            }
        }

        return Math.min(totalUnlocked, BASIS_POINTS);
    }

    /**
     * @dev Gets information about the next unlock event
     */
    function _getNextUnlockInfo(
        uint256 _inheritanceId,
        IInheritanceCore.UnlockSchedule memory _unlockSchedule
    )
        internal
        view
        returns (uint256 nextUnlockTime, uint256 nextUnlockPercentage)
    {
        uint256 triggeredAt = inheritanceTriggeredAt[_inheritanceId];
        uint256 currentTime = block.timestamp;

        if (
            _unlockSchedule.unlockType ==
            IInheritanceCore.UnlockType.IMMEDIATE ||
            _unlockSchedule.unlockType == IInheritanceCore.UnlockType.CLIFF
        ) {
            uint256 unlockTime = triggeredAt + _unlockSchedule.cliffPeriod;
            if (currentTime < unlockTime) {
                nextUnlockTime = unlockTime;
                nextUnlockPercentage = BASIS_POINTS;
            }
        } else if (
            _unlockSchedule.unlockType == IInheritanceCore.UnlockType.LINEAR
        ) {
            uint256 unlockStartTime = triggeredAt + _unlockSchedule.cliffPeriod;
            uint256 unlockEndTime = unlockStartTime + _unlockSchedule.duration;

            if (currentTime < unlockEndTime) {
                // Next unlock is continuous, but we can estimate the end time
                nextUnlockTime = unlockEndTime;
                nextUnlockPercentage = BASIS_POINTS;
            }
        } else if (
            _unlockSchedule.unlockType == IInheritanceCore.UnlockType.MILESTONE
        ) {
            // Find the next milestone
            for (uint256 i = 0; i < _unlockSchedule.milestones.length; i++) {
                uint256 milestoneTime = triggeredAt +
                    _unlockSchedule.milestones[i];

                if (currentTime < milestoneTime) {
                    nextUnlockTime = milestoneTime;
                    nextUnlockPercentage = _unlockSchedule.milestonePercentages[
                            i
                        ];
                    break;
                }
            }
        }
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @dev Returns when an inheritance was triggered
     * @param _inheritanceId The inheritance ID
     */
    function getInheritanceTriggeredAt(
        uint256 _inheritanceId
    ) external view returns (uint256 triggeredAt) {
        return inheritanceTriggeredAt[_inheritanceId];
    }

    /**
     * @dev Checks if inheritance is triggered
     * @param _inheritanceId The inheritance ID
     */
    function isTriggered(
        uint256 _inheritanceId
    ) external view returns (bool triggered) {
        return isInheritanceTriggered[_inheritanceId];
    }

    /**
     * @dev Calculates time remaining until next unlock event
     * @param _inheritanceId The inheritance ID
     * @param _unlockSchedule The beneficiary's unlock schedule
     */
    function getTimeUntilNextUnlock(
        uint256 _inheritanceId,
        IInheritanceCore.UnlockSchedule memory _unlockSchedule
    )
        external
        view
        inheritanceTriggered(_inheritanceId)
        returns (uint256 timeRemaining)
    {
        (uint256 nextUnlockTime, ) = _getNextUnlockInfo(
            _inheritanceId,
            _unlockSchedule
        );

        if (nextUnlockTime > block.timestamp) {
            timeRemaining = nextUnlockTime - block.timestamp;
        } else {
            timeRemaining = 0;
        }
    }

    /**
     * @dev Validates an unlock schedule structure
     * @param _unlockSchedule The unlock schedule to validate
     */
    function validateUnlockSchedule(
        IInheritanceCore.UnlockSchedule memory _unlockSchedule
    ) external pure returns (bool isValid, string memory errorReason) {
        // Check cliff period
        if (_unlockSchedule.cliffPeriod > MAX_UNLOCK_DURATION) {
            return (false, "Cliff period too long");
        }

        if (_unlockSchedule.unlockType == IInheritanceCore.UnlockType.LINEAR) {
            if (_unlockSchedule.duration < MIN_LINEAR_DURATION) {
                return (false, "Linear duration too short");
            }
            if (_unlockSchedule.duration > MAX_UNLOCK_DURATION) {
                return (false, "Linear duration too long");
            }
        }

        if (
            _unlockSchedule.unlockType == IInheritanceCore.UnlockType.MILESTONE
        ) {
            if (_unlockSchedule.milestones.length == 0) {
                return (false, "No milestones defined");
            }

            if (
                _unlockSchedule.milestones.length !=
                _unlockSchedule.milestonePercentages.length
            ) {
                return (false, "Milestone arrays length mismatch");
            }

            // Check milestone percentages sum to 100%
            uint256 totalPercentage = 0;
            uint256 previousTimestamp = 0;

            for (
                uint256 i = 0;
                i < _unlockSchedule.milestonePercentages.length;
                i++
            ) {
                totalPercentage += _unlockSchedule.milestonePercentages[i];

                // Check chronological order
                if (
                    _unlockSchedule.milestones[i] <= previousTimestamp && i > 0
                ) {
                    return (false, "Milestones not in chronological order");
                }
                previousTimestamp = _unlockSchedule.milestones[i];

                // Check individual milestone percentage
                if (_unlockSchedule.milestonePercentages[i] == 0) {
                    return (false, "Zero milestone percentage");
                }
            }

            if (totalPercentage != BASIS_POINTS) {
                return (false, "Milestone percentages don't sum to 100%");
            }
        }

        return (true, "");
    }
}
