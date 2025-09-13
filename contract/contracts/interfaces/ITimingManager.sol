// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ITimingManager {
    struct TimingConfig {
        uint256 minVestingDuration;
        uint256 defaultExecutionDelay;
        uint256 defaultCliffDuration;
        uint256 maxVestingDuration;
        bool isConfigurable;
    }

    event TimingConfigUpdated(
        uint256 indexed inheritanceId,
        uint256 minVestingDuration,
        uint256 defaultExecutionDelay,
        uint256 defaultCliffDuration,
        address updatedBy,
        uint256 timestamp
    );

    event GlobalTimingUpdated(
        uint256 minVestingDuration,
        uint256 defaultExecutionDelay,
        uint256 defaultCliffDuration,
        address updatedBy,
        uint256 timestamp
    );

    function updateInheritanceTiming(
        uint256 inheritanceId,
        uint256 minVestingDuration,
        uint256 defaultExecutionDelay,
        uint256 defaultCliffDuration
    ) external;

    function updateGlobalTiming(
        uint256 minVestingDuration,
        uint256 defaultExecutionDelay,
        uint256 defaultCliffDuration
    ) external;

    function getInheritanceTiming(
        uint256 inheritanceId
    ) external view returns (TimingConfig memory);

    function getGlobalTiming() external view returns (TimingConfig memory);

    function setTimingConfigurable(
        uint256 inheritanceId,
        bool configurable
    ) external;

    // Helper functions for easy timing presets
    function setTestingMode(uint256 inheritanceId) external;

    function setProductionMode(uint256 inheritanceId) external;

    function setCustomTiming(
        uint256 inheritanceId,
        uint256 vestingSeconds,
        uint256 delaySeconds,
        uint256 cliffSeconds
    ) external;
}
