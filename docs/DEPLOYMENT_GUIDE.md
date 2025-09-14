# Smart Contract Integration Setup Guide

This guide will help you deploy the smart contracts and connect them to the frontend.

## Prerequisites

1. Node.js 18+ installed
2. Wallet with test ETH/tokens
3. Environment variables configured

## Step 1: Environment Setup

Create a `.env.local` file in the project root:

```bash
# Wallet Connect (get from https://cloud.walletconnect.com/)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_wallet_connect_project_id

# For contract deployment
PRIVATE_KEY=your_private_key_for_deployment

# Contract addresses (update after deployment)
NEXT_PUBLIC_INHERITANCE_CORE_ADDRESS=0x...
NEXT_PUBLIC_TIMING_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_EMERGENCY_MANAGER_ADDRESS=0x...
```

## Step 2: Deploy Smart Contracts

### Local Development (Hardhat)

1. Start local blockchain:
```bash
cd contract
npx hardhat node
```

2. Deploy contracts to local network:
```bash
npx hardhat run scripts/deploy.ts --network localhost
```

### Somnia Testnet

1. Get test tokens from Somnia faucet
2. Deploy to testnet:
```bash
cd contract
npx hardhat run scripts/deploy.ts --network somnia-testnet
```

## Step 3: Update Contract Addresses

After deployment, update the contract addresses in `lib/contracts.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  InheritanceCore: '0xYOUR_DEPLOYED_ADDRESS' as Address,
  TimingManager: '0xYOUR_TIMING_MANAGER_ADDRESS' as Address,
  EmergencyManager: '0xYOUR_EMERGENCY_MANAGER_ADDRESS' as Address
}
```

## Step 4: Test the Integration

1. Start the frontend:
```bash
npm run dev
```

2. Connect your wallet
3. Switch to the correct network (localhost/Somnia testnet)
4. Create an inheritance vault
5. Deposit some test ETH
6. Add beneficiaries

## Features Implemented

### ✅ Core Smart Contract Integration
- [x] Contract ABI and type definitions
- [x] Wagmi hooks for contract interactions
- [x] Support for multiple networks (mainnet, base, Somnia, local)

### ✅ UI Components
- [x] Create Inheritance Form
- [x] Inheritance Vault Cards
- [x] Deposit Assets Form (ETH, ERC20, NFT)
- [x] Integrated Dashboard

### ✅ Contract Functions
- [x] Create inheritance vaults
- [x] Add beneficiaries
- [x] Deposit ETH/ERC20/ERC721
- [x] Trigger inheritance
- [x] Claim assets
- [x] View inheritance data

## Testing Workflow

1. **Create Inheritance**: Use the "Create Vault" button to create a new inheritance
2. **Deposit Assets**: Use the deposit form to add ETH, tokens, or NFTs
3. **Add Beneficiaries**: Add wallet addresses with allocation percentages
4. **Trigger Distribution**: Test the inheritance trigger functionality
5. **Claim Assets**: Test beneficiary asset claiming

## Network Support

- **Mainnet**: Production Ethereum network
- **Base**: Layer 2 scaling solution
- **Somnia Testnet**: Custom testnet for development
- **Localhost/Hardhat**: Local development network

## Troubleshooting

### Contract Not Found
- Ensure contracts are deployed to the correct network
- Verify contract addresses in `lib/contracts.ts`
- Check network connection in wallet

### Transaction Failures
- Ensure sufficient gas and ETH balance
- Check contract permissions and approvals
- Verify function parameters

### Network Issues
- Confirm correct RPC URLs in `lib/config.ts`
- Check network ID matches chain configuration
- Ensure wallet is connected to correct network

## Security Considerations

⚠️ **Important Security Notes**:
- Never commit private keys to version control
- Use environment variables for sensitive data
- Test thoroughly on testnets before mainnet deployment
- Implement proper access controls
- Audit smart contracts before production use

## Next Steps

1. Deploy contracts to your preferred network
2. Update contract addresses in the code
3. Test all functionality
4. Add additional features like:
   - Multi-signature support
   - Advanced vesting schedules
   - Emergency recovery mechanisms
   - Governance token integration

## Contract Architecture

```
InheritanceCore (Main Contract)
├── TimingManager (Vesting & Timing)
├── EmergencyManager (Emergency Controls)
└── Libraries
    └── InheritanceLib (Shared Logic)
```

The smart contract integration is now complete and ready for testing!