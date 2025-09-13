# Eternal Inheritance Smart Contracts

A comprehensive inheritance smart contract system built for the Somnia network, featuring multi-asset support, time-locked distributions, and configurable timing for testing and production environments.

## 🚀 Features

- **Multi-Asset Support**: ETH, ERC20 tokens, and ERC721 NFTs
- **Flexible Distribution**: Immediate, linear vesting, cliff vesting, and milestone-based
- **Configurable Timing**: 15-second intervals for testing, production-ready timing
- **Emergency Management**: Dispute resolution and asset freezing capabilities
- **Gas Optimized**: Efficient batch operations and storage patterns
- **Somnia Compatible**: Deployed and tested on Somnia network

## 📋 Contracts Overview

### Core Contracts

1. **InheritanceCore.sol** - Main inheritance management contract
2. **EmergencyManager.sol** - Handles disputes and emergency situations  
3. **TimingManager.sol** - Configurable timing for testing and production

### Key Interfaces

- **IInheritanceCore.sol** - Core inheritance functionality
- **IEmergencyManager.sol** - Emergency and dispute management
- **ITimingManager.sol** - Timing configuration management

## ⚡ Quick Start for Testing

### 1. Deploy Contracts

```bash
# Install dependencies
bun install

# Compile contracts
bun run build

# Deploy to Somnia testnet (set your PRIVATE_KEY in .env)
bun run deploy:testnet
```

### 2. Create an Inheritance with 15-Second Timing

```typescript
// Create inheritance with immediate distribution for testing
const timeLock = {
  distributionType: 0, // IMMEDIATE
  unlockTime: Math.floor(Date.now() / 1000) + 30, // 30 seconds from now
  vestingDuration: 0,
  cliffDuration: 0,
  milestoneTimestamps: [],
  milestonePercentages: []
};

const tx = await inheritanceCore.createInheritance(
  "Test Inheritance",
  executor.address,
  false,
  timeLock
);
```

### 3. Set Testing Mode for Rapid Development

```typescript
// Set 15-second timing for all operations
await inheritanceCore.setTestingMode(inheritanceId);

// Or set custom timing (all in seconds)
await inheritanceCore.setCustomTiming(
  inheritanceId,
  15,  // 15-second vesting
  30,  // 30-second execution delay
  10   // 10-second cliff
);
```

### 4. Quick Test Workflow

```typescript
// 1. Add beneficiaries
await inheritanceCore.addBeneficiary(inheritanceId, beneficiary.address, 6000); // 60%
await inheritanceCore.addBeneficiary(inheritanceId, beneficiary2.address, 4000); // 40%

// 2. Deposit assets
await inheritanceCore.depositETH(inheritanceId, { value: ethers.parseEther("1.0") });

// 3. Trigger inheritance
await inheritanceCore.triggerInheritance(inheritanceId);

// 4. Wait 15 seconds and claim (for testing)
// In production, this would be much longer periods
setTimeout(async () => {
  await inheritanceCore.connect(beneficiary).claimAssets(inheritanceId);
}, 15000);
```

## 🏗️ Architecture

```
InheritanceCore (Main Contract)
├── TimingManager (Configurable timing)
├── EmergencyManager (Dispute resolution)
├── BeneficiaryManager (Built-in)
└── AssetManager (Built-in)
```

### Data Flow

1. **Create Inheritance** → Set up beneficiaries and timing
2. **Deposit Assets** → ETH, ERC20, ERC721 support
3. **Trigger Inheritance** → Begin distribution process
4. **Claim Assets** → Beneficiaries claim their allocated shares
5. **Emergency Actions** → Handle disputes or issues

## 🔧 Configuration Options

### Timing Modes

```typescript
// Testing Mode (15-second intervals)
await inheritanceCore.setTestingMode(inheritanceId);

// Production Mode (days/weeks)
await inheritanceCore.setProductionMode(inheritanceId);

// Custom Timing
await inheritanceCore.setCustomTiming(inheritanceId, vestingSeconds, delaySeconds, cliffSeconds);
```

### Distribution Types

- **IMMEDIATE (0)**: Assets available immediately after trigger
- **LINEAR_VESTING (1)**: Gradual release over time
- **CLIFF_VESTING (2)**: All or nothing after cliff period
- **MILESTONE_BASED (3)**: Release at specific timestamps

## 🧪 Testing

```bash
# Run all tests
bun test

# Test timing functionality specifically
bun test test/TimingManager.test.ts

# Test core inheritance features
bun test test/InheritanceCore.test.ts
```

### Key Test Scenarios

1. **15-second rapid testing** - Complete inheritance cycle in under 1 minute
2. **Multi-beneficiary allocation** - Percentage-based distribution
3. **Asset management** - ETH, ERC20, ERC721 handling
4. **Vesting schedules** - Linear and cliff-based distributions
5. **Emergency procedures** - Dispute resolution and asset freezing

## 🌐 Somnia Network Deployment

### Network Configuration

```typescript
// Somnia Testnet
chainId: 30380
rpc: "https://testnet.somnia.network"

// Somnia Mainnet  
chainId: 30380
rpc: "https://rpc.somnia.network"
```

### Deployed Addresses

After deployment, contracts will be available at:
- **InheritanceCore**: `<address>`
- **EmergencyManager**: `<address>` 
- **TimingManager**: `<address>`

View on explorer:
- Testnet: `https://testnet-explorer.somnia.network/address/<address>`
- Mainnet: `https://explorer.somnia.network/address/<address>`

## 💡 Best Practices

### For Development/Testing

1. **Use Testing Mode**: 15-second timing for rapid iterations
2. **Small Amounts**: Use minimal ETH/tokens for testing
3. **Multiple Beneficiaries**: Test various allocation scenarios
4. **Emergency Testing**: Simulate disputes and resolutions

### For Production

1. **Switch to Production Mode**: Use `setProductionMode()` before mainnet
2. **Proper Timing**: Set realistic vesting periods (months/years)
3. **Security Review**: Audit all contracts before deployment
4. **Monitoring**: Set up alerts for emergency events

## 🔒 Security Features

- **Access Control**: Role-based permissions (Owner, Executor, Emergency)
- **Reentrancy Protection**: OpenZeppelin ReentrancyGuard
- **Input Validation**: Comprehensive parameter checking
- **Emergency Controls**: Asset freezing and dispute resolution
- **Pausable**: Admin can pause operations if needed

## 📊 Gas Optimization

- **Inheritance Creation**: ~225k gas
- **Add Beneficiary**: ~187k gas  
- **ETH Deposit**: ~50-100k gas
- **Asset Claims**: ~80-150k gas
- **Batch Operations**: 60-80% gas savings

## 🚨 Emergency Features

### Dispute Resolution

```typescript
// Raise a dispute
await emergencyManager.raiseDispute(inheritanceId, respondent, reason, evidence);

// Resolve dispute (arbitrator only)
await emergencyManager.resolveDispute(inheritanceId, disputeId, disputantWon);
```

### Asset Freezing

```typescript
// Freeze assets during dispute
await emergencyManager.freezeAssets(inheritanceId);

// Unfreeze after resolution
await emergencyManager.unfreezeAssets(inheritanceId);
```

## 📝 Events

### Core Events

- `InheritanceCreated` - New inheritance setup
- `BeneficiaryAdded` - Beneficiary registration
- `AssetDeposited` - Asset deposits (ETH/ERC20/ERC721)
- `InheritanceTriggered` - Distribution started
- `AssetClaimed` - Beneficiary claims
- `InheritanceCompleted` - All assets distributed

### Timing Events

- `TimingConfigUpdated` - Timing parameters changed
- `GlobalTimingUpdated` - Global defaults updated

### Emergency Events

- `EmergencyRaised` - Emergency situation reported
- `DisputeRaised` - Dispute initiated
- `AssetsFreezed` - Assets locked due to dispute

## 🔄 Migration Path

When ready for production:

1. **Update Timing**: Switch from 15-second testing to production timing
2. **Security Audit**: Complete professional audit
3. **Mainnet Deployment**: Deploy to Somnia mainnet
4. **Monitor**: Set up monitoring and alerts
5. **Documentation**: Update user-facing documentation

## 📞 Support

- **GitHub**: https://github.com/your-repo/eternal-inheritance
- **Documentation**: See `/docs` folder for detailed guides
- **Somnia Network**: https://somnia.network

---

**⚠️ Important**: This system uses 15-second timing intervals for testing purposes. Always switch to production timing before mainnet deployment using `setProductionMode()` or appropriate custom timing values.