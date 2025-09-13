// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IInheritanceCore {
    enum DistributionType {
        IMMEDIATE,
        LINEAR_VESTING,
        CLIFF_VESTING,
        MILESTONE_BASED
    }

    enum AssetType {
        ETH,
        ERC20,
        ERC721
    }

    enum InheritanceStatus {
        ACTIVE,
        TRIGGERED,
        COMPLETED,
        DISPUTED,
        FROZEN
    }

    struct Beneficiary {
        address wallet;
        uint256 allocationBasisPoints;
        bool isActive;
        uint256 claimedETH;
        uint256 addedAt;
    }

    struct Asset {
        AssetType assetType;
        address contractAddress;
        uint256 amount;
        uint256[] tokenIds;
        bool isActive;
        uint256 depositedAt;
    }

    struct TimeLock {
        DistributionType distributionType;
        uint256 unlockTime;
        uint256 vestingDuration;
        uint256 cliffDuration;
        uint256[] milestoneTimestamps;
        uint256[] milestonePercentages;
    }

    struct InheritanceData {
        address owner;
        string name;
        InheritanceStatus status;
        uint256 createdAt;
        uint256 triggeredAt;
        TimeLock timeLock;
        uint256 totalBeneficiaries;
        bool requiresConfirmation;
        address executor;
        uint256 totalETHDeposited;
        uint256 totalETHClaimed;
    }

    event InheritanceCreated(
        uint256 indexed inheritanceId,
        address indexed owner,
        string name,
        uint256 timestamp
    );

    event BeneficiaryAdded(
        uint256 indexed inheritanceId,
        address indexed beneficiary,
        uint256 allocationBasisPoints,
        uint256 timestamp
    );

    event AssetDeposited(
        uint256 indexed inheritanceId,
        AssetType assetType,
        address indexed contractAddress,
        uint256 amount,
        uint256[] tokenIds,
        uint256 timestamp
    );

    event InheritanceTriggered(
        uint256 indexed inheritanceId,
        address indexed triggeredBy,
        uint256 timestamp
    );

    event AssetClaimed(
        uint256 indexed inheritanceId,
        address indexed beneficiary,
        AssetType assetType,
        address indexed contractAddress,
        uint256 amount,
        uint256[] tokenIds,
        uint256 timestamp
    );

    event InheritanceCompleted(
        uint256 indexed inheritanceId,
        uint256 timestamp
    );

    function createInheritance(
        string calldata name,
        address executor,
        bool requiresConfirmation,
        TimeLock calldata timeLock
    ) external returns (uint256 inheritanceId);

    function addBeneficiary(
        uint256 inheritanceId,
        address beneficiary,
        uint256 allocationBasisPoints
    ) external;

    function depositETH(uint256 inheritanceId) external payable;

    function depositERC20(
        uint256 inheritanceId,
        address tokenContract,
        uint256 amount
    ) external;

    function depositERC721(
        uint256 inheritanceId,
        address nftContract,
        uint256[] calldata tokenIds
    ) external;

    function triggerInheritance(uint256 inheritanceId) external;

    function claimAssets(uint256 inheritanceId) external;

    function getInheritanceData(
        uint256 inheritanceId
    ) external view returns (InheritanceData memory);

    function getBeneficiaryInfo(
        uint256 inheritanceId,
        address beneficiary
    ) external view returns (Beneficiary memory);

    function getClaimableETH(
        uint256 inheritanceId,
        address beneficiary
    ) external view returns (uint256);

    function getTotalAssets(
        uint256 inheritanceId
    ) external view returns (Asset[] memory);
}
