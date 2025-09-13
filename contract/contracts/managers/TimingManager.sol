// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "../interfaces/ITimingManager.sol";
import "../libraries/InheritanceLib.sol";

contract TimingManager is ITimingManager, AccessControl {
    bytes32 public constant TIMING_ADMIN_ROLE = keccak256("TIMING_ADMIN_ROLE");
    bytes32 public constant INHERITANCE_OWNER_ROLE =
        keccak256("INHERITANCE_OWNER_ROLE");

    TimingConfig private _globalConfig;
    mapping(uint256 => TimingConfig) private _inheritanceConfigs;
    mapping(uint256 => bool) private _hasCustomConfig;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(TIMING_ADMIN_ROLE, msg.sender);

        // Set initial global configuration with testing-friendly values
        _globalConfig = TimingConfig({
            minVestingDuration: InheritanceLib.MIN_VESTING_DURATION,
            defaultExecutionDelay: InheritanceLib.DEFAULT_EXECUTION_DELAY,
            defaultCliffDuration: InheritanceLib.DEFAULT_CLIFF_DURATION,
            maxVestingDuration: 365 * 24 * 60 * 60, // 1 year max
            isConfigurable: true
        });
    }

    function updateInheritanceTiming(
        uint256 inheritanceId,
        uint256 minVestingDuration,
        uint256 defaultExecutionDelay,
        uint256 defaultCliffDuration
    ) external override {
        require(
            hasRole(INHERITANCE_OWNER_ROLE, msg.sender) ||
                hasRole(TIMING_ADMIN_ROLE, msg.sender),
            "Not authorized to update timing"
        );

        _updateTimingInternal(
            inheritanceId,
            minVestingDuration,
            defaultExecutionDelay,
            defaultCliffDuration
        );
    }

    function updateGlobalTiming(
        uint256 minVestingDuration,
        uint256 defaultExecutionDelay,
        uint256 defaultCliffDuration
    ) external override {
        require(hasRole(TIMING_ADMIN_ROLE, msg.sender), "Not authorized");

        _validateTiming(
            minVestingDuration,
            defaultExecutionDelay,
            defaultCliffDuration
        );

        _globalConfig.minVestingDuration = minVestingDuration;
        _globalConfig.defaultExecutionDelay = defaultExecutionDelay;
        _globalConfig.defaultCliffDuration = defaultCliffDuration;

        emit GlobalTimingUpdated(
            minVestingDuration,
            defaultExecutionDelay,
            defaultCliffDuration,
            msg.sender,
            block.timestamp
        );
    }

    function getInheritanceTiming(
        uint256 inheritanceId
    ) external view override returns (TimingConfig memory) {
        if (_hasCustomConfig[inheritanceId]) {
            return _inheritanceConfigs[inheritanceId];
        }
        return _globalConfig;
    }

    function getGlobalTiming()
        external
        view
        override
        returns (TimingConfig memory)
    {
        return _globalConfig;
    }

    function setTimingConfigurable(
        uint256 inheritanceId,
        bool configurable
    ) external override {
        require(
            hasRole(INHERITANCE_OWNER_ROLE, msg.sender) ||
                hasRole(TIMING_ADMIN_ROLE, msg.sender),
            "Not authorized"
        );

        if (_hasCustomConfig[inheritanceId]) {
            _inheritanceConfigs[inheritanceId].isConfigurable = configurable;
        } else {
            _inheritanceConfigs[inheritanceId] = _globalConfig;
            _inheritanceConfigs[inheritanceId].isConfigurable = configurable;
            _hasCustomConfig[inheritanceId] = true;
        }
    }

    // Helper functions for easy timing presets
    function setTestingMode(uint256 inheritanceId) external {
        require(
            hasRole(INHERITANCE_OWNER_ROLE, msg.sender) ||
                hasRole(TIMING_ADMIN_ROLE, msg.sender),
            "Not authorized"
        );

        _updateTimingInternal(inheritanceId, 15, 15, 15); // 15 seconds for all timings
    }

    function setProductionMode(uint256 inheritanceId) external {
        require(
            hasRole(INHERITANCE_OWNER_ROLE, msg.sender) ||
                hasRole(TIMING_ADMIN_ROLE, msg.sender),
            "Not authorized"
        );

        _updateTimingInternal(
            inheritanceId,
            1 days, // 1 day minimum vesting
            7 days, // 7 day execution delay
            30 days // 30 day cliff
        );
    }

    function setCustomTiming(
        uint256 inheritanceId,
        uint256 vestingSeconds,
        uint256 delaySeconds,
        uint256 cliffSeconds
    ) external {
        require(
            hasRole(INHERITANCE_OWNER_ROLE, msg.sender) ||
                hasRole(TIMING_ADMIN_ROLE, msg.sender),
            "Not authorized"
        );

        _updateTimingInternal(
            inheritanceId,
            vestingSeconds,
            delaySeconds,
            cliffSeconds
        );
    }

    // Batch timing updates
    function batchUpdateTiming(
        uint256[] calldata inheritanceIds,
        uint256 minVestingDuration,
        uint256 defaultExecutionDelay,
        uint256 defaultCliffDuration
    ) external {
        require(hasRole(TIMING_ADMIN_ROLE, msg.sender), "Not authorized");

        for (uint256 i = 0; i < inheritanceIds.length; i++) {
            _updateTimingInternal(
                inheritanceIds[i],
                minVestingDuration,
                defaultExecutionDelay,
                defaultCliffDuration
            );
        }
    }

    // Internal functions
    function _updateTimingInternal(
        uint256 inheritanceId,
        uint256 minVestingDuration,
        uint256 defaultExecutionDelay,
        uint256 defaultCliffDuration
    ) internal {
        TimingConfig storage config = _inheritanceConfigs[inheritanceId];
        require(
            config.isConfigurable || !_hasCustomConfig[inheritanceId],
            "Timing not configurable"
        );

        _validateTiming(
            minVestingDuration,
            defaultExecutionDelay,
            defaultCliffDuration
        );

        config.minVestingDuration = minVestingDuration;
        config.defaultExecutionDelay = defaultExecutionDelay;
        config.defaultCliffDuration = defaultCliffDuration;
        config.maxVestingDuration = _globalConfig.maxVestingDuration;
        config.isConfigurable = true;

        _hasCustomConfig[inheritanceId] = true;

        emit TimingConfigUpdated(
            inheritanceId,
            minVestingDuration,
            defaultExecutionDelay,
            defaultCliffDuration,
            msg.sender,
            block.timestamp
        );
    }

    function _validateTiming(
        uint256 minVestingDuration,
        uint256 defaultExecutionDelay,
        uint256 defaultCliffDuration
    ) internal view {
        require(minVestingDuration >= 1, "Min vesting too short"); // Allow 1 second minimum for testing
        require(defaultExecutionDelay >= 1, "Execution delay too short");
        require(defaultCliffDuration >= 0, "Invalid cliff duration");
        require(
            minVestingDuration <= _globalConfig.maxVestingDuration,
            "Vesting duration too long"
        );
    }
}
