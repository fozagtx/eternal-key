// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../interfaces/IInheritanceCore.sol";

/**
 * @title InheritanceBeneficiaryManager
 * @dev Manages beneficiaries and their percentage allocations with validation
 * @notice Handles multi-beneficiary support with percentage allocations and unlock schedules
 */
contract InheritanceBeneficiaryManager is ReentrancyGuard {
    using Math for uint256;

    // ============ CONSTANTS ============

    uint256 public constant BASIS_POINTS = 10000; // 100% = 10000 basis points
    uint256 public constant MAX_BENEFICIARIES = 50; // Prevent gas limit issues
    uint256 public constant MIN_PERCENTAGE = 1; // 0.01%
    uint256 public constant MAX_MILESTONES = 20; // Maximum milestones per beneficiary

    // ============ STORAGE ============

    /// @dev Mapping from inheritance ID to beneficiary data
    mapping(uint256 => mapping(address => IInheritanceCore.Beneficiary))
        public beneficiaries;

    /// @dev Mapping from inheritance ID to array of beneficiary addresses
    mapping(uint256 => address[]) public beneficiaryList;

    /// @dev Mapping from inheritance ID to total allocated percentage
    mapping(uint256 => uint256) public totalAllocatedPercentage;

    /// @dev Mapping to track if a beneficiary exists in an inheritance
    mapping(uint256 => mapping(address => bool)) public isBeneficiary;

    // ============ EVENTS ============

    event BeneficiaryAdded(
        uint256 indexed inheritanceId,
        address indexed beneficiary,
        uint256 percentage,
        IInheritanceCore.UnlockType unlockType
    );

    event BeneficiaryUpdated(
        uint256 indexed inheritanceId,
        address indexed beneficiary,
        uint256 oldPercentage,
        uint256 newPercentage
    );

    event BeneficiaryRemoved(
        uint256 indexed inheritanceId,
        address indexed beneficiary,
        uint256 percentage
    );

    event UnlockScheduleUpdated(
        uint256 indexed inheritanceId,
        address indexed beneficiary,
        IInheritanceCore.UnlockType unlockType
    );

    event BeneficiaryStatusChanged(
        uint256 indexed inheritanceId,
        address indexed beneficiary,
        bool isActive
    );

    // ============ ERRORS ============

    error InvalidBeneficiary();
    error InvalidPercentage();
    error TotalPercentageExceeded();
    error BeneficiaryAlreadyExists();
    error BeneficiaryNotFound();
    error MaxBeneficiariesExceeded();
    error InvalidUnlockSchedule();
    error TooManyMilestones();
    error InvalidMilestonePercentages();
    error ZeroAddress();
    error ArrayLengthMismatch();

    // ============ MODIFIERS ============

    modifier validBeneficiary(address _beneficiary) {
        if (_beneficiary == address(0)) revert ZeroAddress();
        _;
    }

    modifier validPercentage(uint256 _percentage) {
        if (_percentage == 0 || _percentage > BASIS_POINTS)
            revert InvalidPercentage();
        _;
    }

    modifier beneficiaryExists(uint256 _inheritanceId, address _beneficiary) {
        if (!isBeneficiary[_inheritanceId][_beneficiary])
            revert BeneficiaryNotFound();
        _;
    }

    modifier beneficiaryNotExists(
        uint256 _inheritanceId,
        address _beneficiary
    ) {
        if (isBeneficiary[_inheritanceId][_beneficiary])
            revert BeneficiaryAlreadyExists();
        _;
    }

    // ============ BENEFICIARY MANAGEMENT ============

    /**
     * @dev Adds a single beneficiary to an inheritance
     * @param _inheritanceId The inheritance ID
     * @param _beneficiary The beneficiary address
     * @param _percentage The percentage allocation in basis points
     * @param _unlockSchedule The unlock schedule for this beneficiary
     */
    function addBeneficiary(
        uint256 _inheritanceId,
        address _beneficiary,
        uint256 _percentage,
        IInheritanceCore.UnlockSchedule calldata _unlockSchedule
    )
        external
        validBeneficiary(_beneficiary)
        validPercentage(_percentage)
        beneficiaryNotExists(_inheritanceId, _beneficiary)
        nonReentrant
    {
        // Check max beneficiaries limit
        if (beneficiaryList[_inheritanceId].length >= MAX_BENEFICIARIES) {
            revert MaxBeneficiariesExceeded();
        }

        // Check total percentage doesn't exceed 100%
        uint256 newTotal = totalAllocatedPercentage[_inheritanceId] +
            _percentage;
        if (newTotal > BASIS_POINTS) {
            revert TotalPercentageExceeded();
        }

        // Validate unlock schedule
        _validateUnlockSchedule(_unlockSchedule);

        // Create beneficiary struct
        IInheritanceCore.Beneficiary storage newBeneficiary = beneficiaries[
            _inheritanceId
        ][_beneficiary];
        newBeneficiary.beneficiaryAddress = _beneficiary;
        newBeneficiary.percentage = _percentage;
        newBeneficiary.isActive = true;
        newBeneficiary.unlockSchedule = _unlockSchedule;

        // Update tracking
        beneficiaryList[_inheritanceId].push(_beneficiary);
        isBeneficiary[_inheritanceId][_beneficiary] = true;
        totalAllocatedPercentage[_inheritanceId] = newTotal;

        emit BeneficiaryAdded(
            _inheritanceId,
            _beneficiary,
            _percentage,
            _unlockSchedule.unlockType
        );
    }

    /**
     * @dev Adds multiple beneficiaries in batch
     * @param _inheritanceId The inheritance ID
     * @param _beneficiaries Array of beneficiary addresses
     * @param _percentages Array of percentage allocations
     * @param _unlockSchedules Array of unlock schedules
     */
    function addBeneficiariesBatch(
        uint256 _inheritanceId,
        address[] calldata _beneficiaries,
        uint256[] calldata _percentages,
        IInheritanceCore.UnlockSchedule[] calldata _unlockSchedules
    ) external nonReentrant {
        uint256 length = _beneficiaries.length;
        if (
            length != _percentages.length || length != _unlockSchedules.length
        ) {
            revert ArrayLengthMismatch();
        }

        if (
            beneficiaryList[_inheritanceId].length + length > MAX_BENEFICIARIES
        ) {
            revert MaxBeneficiariesExceeded();
        }

        uint256 totalNewPercentage = 0;

        // Pre-validate all inputs
        for (uint256 i = 0; i < length; i++) {
            if (_beneficiaries[i] == address(0)) revert ZeroAddress();
            if (_percentages[i] == 0 || _percentages[i] > BASIS_POINTS)
                revert InvalidPercentage();
            if (isBeneficiary[_inheritanceId][_beneficiaries[i]])
                revert BeneficiaryAlreadyExists();

            _validateUnlockSchedule(_unlockSchedules[i]);
            totalNewPercentage += _percentages[i];
        }

        // Check total doesn't exceed 100%
        if (
            totalAllocatedPercentage[_inheritanceId] + totalNewPercentage >
            BASIS_POINTS
        ) {
            revert TotalPercentageExceeded();
        }

        // Add all beneficiaries
        for (uint256 i = 0; i < length; i++) {
            IInheritanceCore.Beneficiary storage newBeneficiary = beneficiaries[
                _inheritanceId
            ][_beneficiaries[i]];
            newBeneficiary.beneficiaryAddress = _beneficiaries[i];
            newBeneficiary.percentage = _percentages[i];
            newBeneficiary.isActive = true;
            newBeneficiary.unlockSchedule = _unlockSchedules[i];

            beneficiaryList[_inheritanceId].push(_beneficiaries[i]);
            isBeneficiary[_inheritanceId][_beneficiaries[i]] = true;

            emit BeneficiaryAdded(
                _inheritanceId,
                _beneficiaries[i],
                _percentages[i],
                _unlockSchedules[i].unlockType
            );
        }

        totalAllocatedPercentage[_inheritanceId] += totalNewPercentage;
    }

    /**
     * @dev Updates a beneficiary's percentage allocation
     * @param _inheritanceId The inheritance ID
     * @param _beneficiary The beneficiary address
     * @param _newPercentage The new percentage allocation
     */
    function updateBeneficiaryPercentage(
        uint256 _inheritanceId,
        address _beneficiary,
        uint256 _newPercentage
    )
        external
        validPercentage(_newPercentage)
        beneficiaryExists(_inheritanceId, _beneficiary)
        nonReentrant
    {
        IInheritanceCore.Beneficiary storage beneficiary = beneficiaries[
            _inheritanceId
        ][_beneficiary];
        uint256 oldPercentage = beneficiary.percentage;

        // Calculate new total
        uint256 newTotal = totalAllocatedPercentage[_inheritanceId] -
            oldPercentage +
            _newPercentage;
        if (newTotal > BASIS_POINTS) {
            revert TotalPercentageExceeded();
        }

        beneficiary.percentage = _newPercentage;
        totalAllocatedPercentage[_inheritanceId] = newTotal;

        emit BeneficiaryUpdated(
            _inheritanceId,
            _beneficiary,
            oldPercentage,
            _newPercentage
        );
    }

    /**
     * @dev Removes a beneficiary from an inheritance
     * @param _inheritanceId The inheritance ID
     * @param _beneficiary The beneficiary address to remove
     */
    function removeBeneficiary(
        uint256 _inheritanceId,
        address _beneficiary
    ) external beneficiaryExists(_inheritanceId, _beneficiary) nonReentrant {
        IInheritanceCore.Beneficiary storage beneficiary = beneficiaries[
            _inheritanceId
        ][_beneficiary];
        uint256 percentage = beneficiary.percentage;

        // Remove from beneficiary list
        address[] storage list = beneficiaryList[_inheritanceId];
        for (uint256 i = 0; i < list.length; i++) {
            if (list[i] == _beneficiary) {
                list[i] = list[list.length - 1];
                list.pop();
                break;
            }
        }

        // Update tracking
        delete beneficiaries[_inheritanceId][_beneficiary];
        isBeneficiary[_inheritanceId][_beneficiary] = false;
        totalAllocatedPercentage[_inheritanceId] -= percentage;

        emit BeneficiaryRemoved(_inheritanceId, _beneficiary, percentage);
    }

    /**
     * @dev Updates a beneficiary's unlock schedule
     * @param _inheritanceId The inheritance ID
     * @param _beneficiary The beneficiary address
     * @param _unlockSchedule The new unlock schedule
     */
    function updateUnlockSchedule(
        uint256 _inheritanceId,
        address _beneficiary,
        IInheritanceCore.UnlockSchedule calldata _unlockSchedule
    ) external beneficiaryExists(_inheritanceId, _beneficiary) nonReentrant {
        _validateUnlockSchedule(_unlockSchedule);

        beneficiaries[_inheritanceId][_beneficiary]
            .unlockSchedule = _unlockSchedule;

        emit UnlockScheduleUpdated(
            _inheritanceId,
            _beneficiary,
            _unlockSchedule.unlockType
        );
    }

    /**
     * @dev Activates or deactivates a beneficiary
     * @param _inheritanceId The inheritance ID
     * @param _beneficiary The beneficiary address
     * @param _isActive Whether the beneficiary should be active
     */
    function setBeneficiaryStatus(
        uint256 _inheritanceId,
        address _beneficiary,
        bool _isActive
    ) external beneficiaryExists(_inheritanceId, _beneficiary) nonReentrant {
        beneficiaries[_inheritanceId][_beneficiary].isActive = _isActive;

        emit BeneficiaryStatusChanged(_inheritanceId, _beneficiary, _isActive);
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @dev Returns beneficiary information
     * @param _inheritanceId The inheritance ID
     * @param _beneficiary The beneficiary address
     */
    function getBeneficiary(
        uint256 _inheritanceId,
        address _beneficiary
    )
        external
        view
        returns (
            address beneficiaryAddress,
            uint256 percentage,
            bool isActive,
            IInheritanceCore.UnlockSchedule memory unlockSchedule,
            uint256 claimedETH
        )
    {
        IInheritanceCore.Beneficiary storage beneficiary = beneficiaries[
            _inheritanceId
        ][_beneficiary];
        return (
            beneficiary.beneficiaryAddress,
            beneficiary.percentage,
            beneficiary.isActive,
            beneficiary.unlockSchedule,
            beneficiary.claimedETH
        );
    }

    /**
     * @dev Returns all beneficiaries for an inheritance
     * @param _inheritanceId The inheritance ID
     */
    function getAllBeneficiaries(
        uint256 _inheritanceId
    ) external view returns (address[] memory) {
        return beneficiaryList[_inheritanceId];
    }

    /**
     * @dev Returns the number of beneficiaries
     * @param _inheritanceId The inheritance ID
     */
    function getBeneficiaryCount(
        uint256 _inheritanceId
    ) external view returns (uint256) {
        return beneficiaryList[_inheritanceId].length;
    }

    /**
     * @dev Returns active beneficiaries only
     * @param _inheritanceId The inheritance ID
     */
    function getActiveBeneficiaries(
        uint256 _inheritanceId
    ) external view returns (address[] memory activeBeneficiaries) {
        address[] memory allBeneficiaries = beneficiaryList[_inheritanceId];
        uint256 activeCount = 0;

        // Count active beneficiaries
        for (uint256 i = 0; i < allBeneficiaries.length; i++) {
            if (beneficiaries[_inheritanceId][allBeneficiaries[i]].isActive) {
                activeCount++;
            }
        }

        // Create array of active beneficiaries
        activeBeneficiaries = new address[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < allBeneficiaries.length; i++) {
            if (beneficiaries[_inheritanceId][allBeneficiaries[i]].isActive) {
                activeBeneficiaries[index] = allBeneficiaries[i];
                index++;
            }
        }
    }

    /**
     * @dev Validates percentage allocations total 100%
     * @param _inheritanceId The inheritance ID
     */
    function validateTotalPercentage(
        uint256 _inheritanceId
    ) external view returns (bool isValid, uint256 currentTotal) {
        currentTotal = totalAllocatedPercentage[_inheritanceId];
        isValid = currentTotal == BASIS_POINTS;
    }

    // ============ INTERNAL FUNCTIONS ============

    /**
     * @dev Validates an unlock schedule
     * @param _unlockSchedule The unlock schedule to validate
     */
    function _validateUnlockSchedule(
        IInheritanceCore.UnlockSchedule calldata _unlockSchedule
    ) internal pure {
        if (_unlockSchedule.unlockType == IInheritanceCore.UnlockType.LINEAR) {
            if (_unlockSchedule.duration == 0) revert InvalidUnlockSchedule();
        }

        if (
            _unlockSchedule.unlockType == IInheritanceCore.UnlockType.MILESTONE
        ) {
            if (
                _unlockSchedule.milestones.length == 0 ||
                _unlockSchedule.milestones.length !=
                _unlockSchedule.milestonePercentages.length
            ) {
                revert InvalidUnlockSchedule();
            }

            if (_unlockSchedule.milestones.length > MAX_MILESTONES) {
                revert TooManyMilestones();
            }

            // Validate milestone percentages sum to 100%
            uint256 totalMilestonePercentage = 0;
            uint256 previousTimestamp = 0;

            for (
                uint256 i = 0;
                i < _unlockSchedule.milestonePercentages.length;
                i++
            ) {
                totalMilestonePercentage += _unlockSchedule
                    .milestonePercentages[i];

                // Ensure milestones are in chronological order
                if (
                    _unlockSchedule.milestones[i] <= previousTimestamp && i > 0
                ) {
                    revert InvalidUnlockSchedule();
                }
                previousTimestamp = _unlockSchedule.milestones[i];
            }

            if (totalMilestonePercentage != BASIS_POINTS) {
                revert InvalidMilestonePercentages();
            }
        }

        // Validate cliff period is reasonable
        if (_unlockSchedule.cliffPeriod > 365 days * 10) {
            // Max 10 years
            revert InvalidUnlockSchedule();
        }
    }

    /**
     * @dev Returns claimed ERC20 amount for a beneficiary
     * @param _inheritanceId The inheritance ID
     * @param _beneficiary The beneficiary address
     * @param _token The ERC20 token address
     */
    function getClaimedERC20(
        uint256 _inheritanceId,
        address _beneficiary,
        address _token
    ) external view returns (uint256) {
        return beneficiaries[_inheritanceId][_beneficiary].claimedERC20[_token];
    }

    /**
     * @dev Returns whether an ERC721 token was claimed by a beneficiary
     * @param _inheritanceId The inheritance ID
     * @param _beneficiary The beneficiary address
     * @param _nftContract The NFT contract address
     * @param _tokenId The token ID
     */
    function isERC721Claimed(
        uint256 _inheritanceId,
        address _beneficiary,
        address _nftContract,
        uint256 _tokenId
    ) external view returns (bool) {
        // For simplicity, using a combined key approach
        bytes32 key = keccak256(abi.encodePacked(_nftContract, _tokenId));
        return
            beneficiaries[_inheritanceId][_beneficiary].claimedERC721[
                address(uint160(uint256(key)))
            ];
    }
}
