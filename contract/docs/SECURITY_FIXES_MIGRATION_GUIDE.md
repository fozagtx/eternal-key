# InheritanceCore Security Fixes - Migration Guide

## Overview

This document outlines the critical security fixes implemented in `InheritanceCoreFixed` and provides a comprehensive migration guide from the original `InheritanceCore` contract.

## Critical Security Issues Fixed

### 1. ERC721 Distribution Logic Fix

**Problem**: The original contract's ERC721 distribution could result in:
- Duplicate token assignments to multiple beneficiaries
- Tokens being missed during distribution
- Unfair distribution that doesn't match allocation percentages

**Solution**: 
```solidity
// NEW: Sequential token distribution tracking
mapping(uint256 => mapping(uint256 => uint256)) private _erc721TokenDistribution;

function _claimERC721Asset(
    uint256 inheritanceId,
    address beneficiary,
    uint256 assetIndex,
    uint256 allocationBasisPoints
) internal returns (bool) {
    // Calculate exact token range for this beneficiary
    uint256 startIndex = _erc721TokenDistribution[inheritanceId][assetIndex];
    uint256 tokensToTransfer = InheritanceLib.calculatePercentage(totalTokens, allocationBasisPoints);
    uint256 endIndex = startIndex + tokensToTransfer;
    
    // Transfer sequential range of tokens
    for (uint256 i = 0; i < tokensToTransfer; i++) {
        uint256 tokenIndex = startIndex + i;
        uint256 tokenId = asset.tokenIds[tokenIndex];
        IERC721(asset.contractAddress).safeTransferFrom(address(this), beneficiary, tokenId);
    }
    
    // Update tracking to prevent overlaps
    _erc721TokenDistribution[inheritanceId][assetIndex] = endIndex;
}
```

**Benefits**:
- Guarantees no duplicate token transfers
- Ensures all tokens are distributed according to allocation percentages
- Maintains fair distribution across all beneficiaries

### 2. Asset Double-Claiming Prevention

**Problem**: The original contract allowed beneficiaries to claim the same assets multiple times.

**Solution**: 
```solidity
// NEW: Comprehensive claim tracking
mapping(uint256 => mapping(address => mapping(uint256 => bool))) private _assetsClaimed;
mapping(uint256 => mapping(address => bool)) private _sttClaimed;

function _claimNonSTTAssets(uint256 inheritanceId, address beneficiary) internal returns (bool) {
    for (uint256 i = 0; i < assets.length; i++) {
        if (_assetsClaimed[inheritanceId][beneficiary][i]) {
            continue; // Skip already claimed assets
        }
        
        // Process claiming...
        _assetsClaimed[inheritanceId][beneficiary][i] = true;
    }
}
```

**Benefits**:
- Prevents double-claiming of any asset type
- Maintains accurate state tracking
- Provides transparency through claim status queries

### 3. Enhanced Input Validation

**Problem**: Insufficient validation could lead to invalid contract states.

**Solution**: 
```solidity
function _validateTimeLock(TimeLock calldata timeLock) internal pure {
    if (timeLock.distributionType == DistributionType.LINEAR_VESTING) {
        InheritanceLib.validateVestingDuration(timeLock.vestingDuration);
        require(timeLock.cliffDuration <= timeLock.vestingDuration, "Cliff duration exceeds vesting duration");
    }
    
    if (timeLock.distributionType == DistributionType.MILESTONE_BASED) {
        require(timeLock.milestoneTimestamps.length > 0, "No milestones provided");
        InheritanceLib.validateMilestones(timeLock.milestoneTimestamps, timeLock.milestonePercentages);
    }
}
```

**Benefits**:
- Prevents invalid TimeLock configurations
- Ensures milestone arrays are consistent
- Validates vesting parameters within acceptable ranges

### 4. Interface Consistency Improvements

**Problem**: Interface and implementation had mismatches, particularly with the name parameter.

**Solution**: 
```solidity
// REMOVED: name parameter from InheritanceData struct
struct InheritanceData {
    address owner;
    // string name; <- REMOVED for consistency
    InheritanceStatus status;
    uint256 createdAt;
    // ... other fields
}

// UPDATED: Event signature to match implementation
event InheritanceCreated(
    uint256 indexed inheritanceId,
    address indexed owner,
    uint256 timestamp // name parameter removed
);
```

**Benefits**:
- Perfect interface/implementation alignment
- Eliminates confusion from unused parameters
- Cleaner, more focused data structures

### 5. Fee-on-Transfer Token Support

**Problem**: Original contract assumed all ERC20 transfers would transfer the exact amount specified.

**Solution**: 
```solidity
function depositERC20(uint256 inheritanceId, address tokenContract, uint256 amount) external {
    uint256 balanceBefore = IERC20(tokenContract).balanceOf(address(this));
    IERC20(tokenContract).safeTransferFrom(msg.sender, address(this), amount);
    uint256 balanceAfter = IERC20(tokenContract).balanceOf(address(this));
    
    uint256 actualAmount = balanceAfter - balanceBefore; // Handle fee-on-transfer
    require(actualAmount > 0, "No tokens received");
    
    // Store actualAmount, not the intended amount
}
```

**Benefits**:
- Supports fee-on-transfer tokens
- Accurate asset tracking regardless of transfer fees
- Prevents accounting discrepancies

## Gas Optimization Improvements

### 1. Allocation Caching
```solidity
mapping(uint256 => uint256) private _totalAllocations; // Cache total allocations

function addBeneficiary(...) external {
    uint256 totalAllocation = _totalAllocations[inheritanceId] + allocationBasisPoints;
    // ... validation and storage
    _totalAllocations[inheritanceId] = totalAllocation; // Update cache
}
```

### 2. Batch Operations
The new contract is designed to handle multiple operations more efficiently by:
- Caching frequently accessed data
- Reducing redundant calculations
- Optimizing storage patterns

## Migration Process

### Phase 1: Pre-Migration Assessment

1. **Audit Current State**:
```javascript
// Check all active inheritances
const activeInheritances = await oldContract.getActiveInheritances();

// For each inheritance, capture:
// - Beneficiaries and allocations
// - Deposited assets
// - Current status
// - Vesting schedules
```

2. **Backup Critical Data**:
```javascript
const migrationData = {
    inheritances: [],
    beneficiaries: [],
    assets: [],
    vestingSchedules: []
};

for (let inheritanceId of activeInheritances) {
    const data = await oldContract.getInheritanceData(inheritanceId);
    migrationData.inheritances.push(data);
    // ... capture all related data
}
```

### Phase 2: Contract Deployment

1. **Deploy New Contract**:
```bash
npx hardhat run scripts/deploy-inheritance-core-fixed.js --network <network>
```

2. **Verify Contract**:
```bash
npx hardhat verify --network <network> <contract-address>
```

### Phase 3: Data Migration

⚠️ **CRITICAL**: Asset migration requires careful handling to prevent loss.

1. **For STT (Native Token) Assets**:
```solidity
// Emergency withdrawal from old contract (if supported)
// Or coordinate with users for manual withdrawal/redeposit

// Method 1: Contract-to-contract transfer (if old contract supports)
oldContract.emergencyWithdrawSTT(inheritanceId, newContractAddress);

// Method 2: User-coordinated migration
// Users withdraw from old contract and deposit to new contract
```

2. **For ERC20 Assets**:
```solidity
// Transfer ERC20 tokens to new contract
for (asset in erc20Assets) {
    IERC20(asset.tokenAddress).transfer(newContractAddress, asset.amount);
}
```

3. **For ERC721 Assets**:
```solidity
// Transfer NFTs to new contract
for (asset in erc721Assets) {
    for (tokenId in asset.tokenIds) {
        IERC721(asset.contractAddress).safeTransferFrom(
            oldContractAddress, 
            newContractAddress, 
            tokenId
        );
    }
}
```

### Phase 4: State Recreation

```javascript
// Recreate inheritances in new contract
for (const inheritance of migrationData.inheritances) {
    const newInheritanceId = await newContract.createInheritance(
        inheritance.executor,
        inheritance.requiresConfirmation,
        inheritance.timeLock
    );
    
    // Add beneficiaries
    for (const beneficiary of inheritance.beneficiaries) {
        await newContract.addBeneficiary(
            newInheritanceId,
            beneficiary.wallet,
            beneficiary.allocationBasisPoints
        );
    }
    
    // Deposit assets (if transferred successfully)
    // Handle triggered status if applicable
}
```

## Testing Strategy

### 1. Unit Tests
Run comprehensive test suite:
```bash
npx hardhat test test/InheritanceCoreFixed.test.js
```

### 2. Integration Tests
```javascript
// Test migration scenarios
describe("Migration Integration", function() {
    it("Should maintain same distribution results", async function() {
        // Create inheritance in both old and new contracts
        // Compare distribution outcomes
        // Verify consistency
    });
});
```

### 3. Gas Usage Comparison
```bash
# Compare gas usage between old and new contracts
npx hardhat test --grep "gas usage"
```

## Deployment Checklist

- [ ] Deploy new contract to testnet
- [ ] Run full test suite
- [ ] Verify gas optimizations
- [ ] Test migration scripts on testnet
- [ ] Conduct security review
- [ ] Deploy to mainnet
- [ ] Verify contract on block explorer
- [ ] Execute migration process
- [ ] Monitor for 24 hours post-migration

## Risk Mitigation

### 1. Rollback Plan
- Keep old contract addresses accessible
- Maintain emergency withdrawal capabilities
- Document all migration transactions

### 2. User Communication
- Notify all users of migration timeline
- Provide clear instructions for asset safety
- Establish support channels

### 3. Monitoring
- Monitor all migration transactions
- Track asset transfers
- Verify contract state consistency

## New Features Available

### Enhanced Query Functions
```solidity
// Check claim status for all assets
function getAssetClaimingStatus(uint256 inheritanceId, address beneficiary) 
    external view returns (bool[] memory);

// Check STT claim status
function hasClaimedSTT(uint256 inheritanceId, address beneficiary) 
    external view returns (bool);
```

### Improved Events
```solidity
// New event for distribution transparency
event AssetDistributionCalculated(
    uint256 indexed inheritanceId,
    address indexed beneficiary,
    uint256 assetIndex,
    uint256 tokenCount
);
```

## Support and Troubleshooting

### Common Migration Issues

1. **Asset Transfer Failures**:
   - Verify contract approvals
   - Check token contract compatibility
   - Ensure sufficient gas limits

2. **State Inconsistencies**:
   - Compare old vs new contract state
   - Verify all beneficiaries added
   - Check allocation totals

3. **Gas Estimation Errors**:
   - Use updated gas estimation methods
   - Account for new contract optimizations

### Emergency Procedures

If migration issues occur:
1. Pause new contract operations
2. Investigate root cause
3. Implement fix or rollback
4. Communicate with affected users
5. Resume operations only after verification

## Conclusion

The `InheritanceCoreFixed` contract addresses all critical security vulnerabilities while maintaining backward compatibility for migration purposes. The enhanced features and optimizations provide a more robust and efficient inheritance management system.

For additional support or questions about the migration process, please refer to the development team documentation or submit issues through the appropriate channels.