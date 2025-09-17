# Inheritance Smart Contract System

A production-ready, secure smart contract system for managing digital asset inheritance on the Somnia blockchain network.

## Overview

The Inheritance Smart Contract System enables users to create, manage, and execute digital asset inheritance plans. It supports ETH, ERC20 tokens, and ERC721 NFTs with flexible distribution mechanisms including immediate transfers, linear vesting, cliff vesting, and milestone-based distributions.

## Features

### Core Functionality
- **Multi-Asset Support**: ETH, ERC20 tokens, and ERC721 NFTs
- **Flexible Beneficiary Management**: Add multiple beneficiaries with custom allocation percentages
- **Advanced Distribution Types**:
  - Immediate distribution
  - Linear vesting over time
  - Cliff vesting with unlock periods
  - Milestone-based distributions
- **Role-Based Access Control**: Secure permission system with admin and executor roles
- **Inheritance Triggering**: Manual triggering by authorized parties

### Security Features
- **Access Control**: OpenZeppelin's AccessControl for role management
- **Reentrancy Protection**: Built-in protection against reentrancy attacks
- **Input Validation**: Comprehensive validation of all inputs
- **Safe Transfers**: Secure asset transfer mechanisms

## 🚀 Latest Deployment

### Somnia Testnet Deployment
- **Contract Address**: `0x27Bb37f882442638ebde4eC43c5560BFD4e71471`
- **Transaction Hash**: `0x962e49a068fe2382e5302368d435a53465394bd2e35dd0f886cb79c7938da08b`
- **Block Number**: `178709840`
- **Network**: Somnia Testnet
- **Status**: ✅ **ACTIVE** - All tests passing (43/43)

### Contract Verification
```bash
npx hardhat verify --network somnia-testnet 0x27Bb37f882442638ebde4eC43c5560BFD4e71471
```

## Quick Start

### Prerequisites

- Node.js >= 16
- npm or yarn
- Hardhat development environment

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd key/contract

# Install dependencies
npm install

# Compile contracts
npm run build
```

### Configuration

1. Copy `.env.example` to `.env`
2. Configure your environment variables:

```bash
PRIVATE_KEY=your_private_key_here
SOMNIA_TESTNET_RPC=https://dream-rpc.somnia.network/
SOMNIA_MAINNET_RPC=https://dream-rpc.somnia.network/
```

## Usage

### Deployment

#### Testnet Deployment
```bash
npm run deploy:testnet
```

#### Mainnet Deployment
```bash
npm run deploy:mainnet
```

### Verification

After deployment, verify your contract:

```bash
npm run verify:deployment
```

### Basic Contract Interaction

```typescript
import { ethers } from "hardhat";
import { InheritanceCore } from "./typechain-types";

// Connect to deployed contract
const contract = await ethers.getContractAt("InheritanceCore", contractAddress);

// Create an inheritance
const timeLock = {
  distributionType: 0, // IMMEDIATE
  unlockTime: Math.floor(Date.now() / 1000) + 86400, // 24 hours
  vestingDuration: 0,
  cliffDuration: 0,
  milestoneTimestamps: [],
  milestonePercentages: []
};

const tx = await contract.createInheritance(
  "My Inheritance",
  executorAddress,
  false,
  timeLock
);

const receipt = await tx.wait();
const inheritanceId = 0; // First inheritance has ID 0

// Add beneficiaries
await contract.addBeneficiary(inheritanceId, beneficiaryAddress, 10000); // 100%

// Deposit assets
await contract.depositSTT(inheritanceId, { value: ethers.parseEther("10") });

// Trigger inheritance
await contract.triggerInheritance(inheritanceId);

// Claim assets (as beneficiary)
await contract.connect(beneficiary).claimAssets(inheritanceId);
```

## Contract Architecture

### Core Contracts

#### InheritanceCore.sol
The main contract handling all inheritance functionality:
- Inheritance creation and management
- Beneficiary management
- Asset deposits (ETH, ERC20, ERC721)
- Vesting calculations
- Asset claiming

#### InheritanceLib.sol
Utility library containing:
- Mathematical calculations for vesting
- Validation functions
- Safe transfer utilities
- Constants and error definitions

### Data Structures

```solidity
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

struct Beneficiary {
    address wallet;
    uint256 allocationBasisPoints; // 10000 = 100%
    bool isActive;
    uint256 claimedETH;
    uint256 addedAt;
}

struct TimeLock {
    DistributionType distributionType;
    uint256 unlockTime;
    uint256 vestingDuration;
    uint256 cliffDuration;
    uint256[] milestoneTimestamps;
    uint256[] milestonePercentages;
}
```

## Distribution Types

### Immediate Distribution (0)
Assets are available for claiming immediately after inheritance is triggered.

### Linear Vesting (1)
Assets vest linearly over the specified vesting duration after the cliff period.

### Cliff Vesting (2)
Assets become fully available after the cliff period ends.

### Milestone-Based (3)
Assets are released based on predefined milestones with specific timestamps and percentages.

## Testing

### Run Tests
```bash
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

### Test Structure
- **Unit Tests**: Individual function testing
- **Integration Tests**: Full workflow testing
- **Gas Optimization Tests**: Performance validation
- **Security Tests**: Access control and edge cases

## Deployment Guide

### 1. Pre-Deployment Checklist

- [ ] Environment variables configured
- [ ] Private key secured
- [ ] Network configuration verified
- [ ] Contract compiled successfully
- [ ] Tests passing

### 2. Deployment Process

```bash
# Deploy to testnet
npm run deploy:testnet

# Verify deployment
npm run verify:deployment

# Deploy to mainnet (after testnet validation)
npm run deploy:mainnet
```

### 3. Post-Deployment

- Verify contract on block explorer
- Test basic functionality
- Set up monitoring
- Update frontend/client configurations

## Security Considerations

### Access Control
- **Owner**: Can add beneficiaries, deposit assets
- **Executor**: Can trigger inheritance
- **Admin**: Can manage roles and emergency situations

### Best Practices
- Always use the provided interfaces
- Validate inputs before contract interaction
- Monitor contract events for anomalies
- Keep private keys secure
- Use multi-signature wallets for production

### Known Limitations
- Contract size optimization may limit future upgrades
- Gas costs increase with number of beneficiaries
- External token contracts must implement standard interfaces

## API Reference

### Core Functions

#### createInheritance
Creates a new inheritance plan.
```solidity
function createInheritance(
    string calldata name,
    address executor,
    bool requiresConfirmation,
    TimeLock calldata timeLock
) external returns (uint256 inheritanceId)
```

#### addBeneficiary
Adds a beneficiary to an inheritance.
```solidity
function addBeneficiary(
    uint256 inheritanceId,
    address beneficiary,
    uint256 allocationBasisPoints
) external
```

#### depositSTT
Deposits STT into an inheritance.
```solidity
function depositSTT(uint256 inheritanceId) external payable
```

#### triggerInheritance
Triggers the inheritance distribution process.
```solidity
function triggerInheritance(uint256 inheritanceId) external
```

#### claimAssets
Allows beneficiaries to claim their allocated assets.
```solidity
function claimAssets(uint256 inheritanceId) external
```

### View Functions

#### getInheritanceData
Returns complete inheritance information.
```solidity
function getInheritanceData(uint256 inheritanceId) 
    external view returns (InheritanceData memory)
```

#### getBeneficiaryInfo
Returns beneficiary information.
```solidity
function getBeneficiaryInfo(uint256 inheritanceId, address beneficiary)
    external view returns (Beneficiary memory)
```

#### getClaimableSTT
Returns the amount of STT a beneficiary can claim.
```solidity
function getClaimableSTT(uint256 inheritanceId, address beneficiary)
    external view returns (uint256)
```

## Events

```solidity
event InheritanceCreated(uint256 indexed inheritanceId, address indexed owner, string name, uint256 timestamp);
event BeneficiaryAdded(uint256 indexed inheritanceId, address indexed beneficiary, uint256 allocationBasisPoints, uint256 timestamp);
event AssetDeposited(uint256 indexed inheritanceId, AssetType assetType, address indexed contractAddress, uint256 amount, uint256[] tokenIds, uint256 timestamp);
event InheritanceTriggered(uint256 indexed inheritanceId, address indexed triggeredBy, uint256 timestamp);
event AssetClaimed(uint256 indexed inheritanceId, address indexed beneficiary, AssetType assetType, address indexed contractAddress, uint256 amount, uint256[] tokenIds, uint256 timestamp);
event InheritanceCompleted(uint256 indexed inheritanceId, uint256 timestamp);
```

## Error Handling

Common errors and their meanings:

- `"Inheritance does not exist"`: Invalid inheritance ID
- `"Only inheritance owner allowed"`: Access control violation
- `"Inheritance not triggered"`: Attempting to claim before triggering
- `"Not a valid beneficiary"`: Address not in beneficiary list
- `"Invalid allocation"`: Allocation percentage out of range
- `"Total allocation exceeds 100%"`: Sum of allocations > 10000 basis points

## Gas Optimization

### Tips for Gas Efficiency
- Batch operations when possible
- Use appropriate data types
- Minimize storage operations
- Consider beneficiary limits for your use case

### Estimated Gas Costs
- Create Inheritance: ~150,000 gas
- Add Beneficiary: ~80,000 gas
- Deposit ETH: ~100,000 gas
- Trigger Inheritance: ~60,000 gas
- Claim Assets: ~120,000 gas

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Development Guidelines
- Follow Solidity style guide
- Include comprehensive tests
- Document all public functions
- Use meaningful variable names
- Add gas optimization comments

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Support

For questions, issues, or support:
- Create an issue in the repository
- Review existing documentation
- Check the test files for usage examples

## Changelog

### Version 1.0.0
- Initial production release
- Core inheritance functionality
- Multi-asset support
- Flexible distribution mechanisms
- Comprehensive test suite
- Production-ready deployment scripts

## Disclaimer

This smart contract system is provided as-is. Users should thoroughly test and audit the contracts before deploying to mainnet. The developers are not responsible for any losses incurred from the use of this software.