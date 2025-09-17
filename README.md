# Eternal Key - Digital Inheritance Platform

A comprehensive digital inheritance platform built on the Somnia blockchain, featuring a Next.js frontend and production-ready smart contracts.

## 🚀 Live Deployment

### Smart Contract (Somnia Testnet)
- **Contract Address**: `0x27Bb37f882442638ebde4eC43c5560BFD4e71471`
- **Transaction Hash**: `0x962e49a068fe2382e5302368d435a53465394bd2e35dd0f886cb79c7938da08b`
- **Block Number**: `178709840`
- **Network**: Somnia Testnet
- **Status**: ✅ **ACTIVE** - All tests passing (43/43)

### 🔗 Blockchain Explorer Links
- **Contract on Somnia Explorer**: [View Contract](https://explorer.somnia.network/address/0x27Bb37f882442638ebde4eC43c5560BFD4e71471)
- **Deployment Transaction**: [View Transaction](https://explorer.somnia.network/tx/0x962e49a068fe2382e5302368d435a53465394bd2e35dd0f886cb79c7938da08b)
- **Block Details**: [View Block #178709840](https://explorer.somnia.network/block/178709840)

### 🌐 Network Information
- **Network Name**: Somnia Testnet
- **Chain ID**: 50311
- **RPC URL**: `https://dream-rpc.somnia.network/`
- **Explorer**: `https://explorer.somnia.network/`

## Project Structure

```
eternal-key/
├── app/                    # Next.js application
│   ├── components/         # React components
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── contract/              # Smart contract system
│   ├── contracts/         # Solidity contracts
│   ├── scripts/           # Deployment scripts
│   ├── test/              # Test files
│   └── deployments.json   # Deployment records
└── components/            # Shared UI components
```

## Features

### Smart Contract Features
- **Multi-Asset Support**: STT (Somnia native token), ERC20 tokens, and ERC721 NFTs
- **Flexible Distribution**: Immediate, linear vesting, cliff vesting, and milestone-based
- **Access Control**: Role-based permissions with admin and executor roles
- **Security**: Reentrancy protection and comprehensive input validation

### Frontend Features
- **Modern UI**: Built with Next.js 14 and React
- **Web3 Integration**: Seamless blockchain interaction
- **Responsive Design**: Mobile-first approach
- **Real-time Updates**: Live contract state monitoring

## Getting Started

### Frontend Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Smart Contract Development

```bash
# Navigate to contract directory
cd contract

# Install dependencies
npm install

# Compile contracts
npm run build

# Run tests
npm test

# Deploy to testnet
npm run deploy:testnet
```

## Smart Contract Usage

### Basic Contract Interaction

```javascript
// Contract address on Somnia Testnet
const contractAddress = "0x27Bb37f882442638ebde4eC43c5560BFD4e71471";

// Connect to contract
const contract = new ethers.Contract(contractAddress, abi, signer);

// Create inheritance
const timeLock = {
  distributionType: 0, // IMMEDIATE
  unlockTime: Math.floor(Date.now() / 1000) + 86400,
  vestingDuration: 0,
  cliffDuration: 0,
  milestoneTimestamps: [],
  milestonePercentages: []
};

await contract.createInheritance(
  "My Inheritance Plan",
  executorAddress,
  false,
  timeLock
);
```

### Contract Verification

Verify the deployed contract on Somnia testnet:

```bash
cd contract
npx hardhat verify --network somnia-testnet 0x27Bb37f882442638ebde4eC43c5560BFD4e71471
```

## Test Results

All smart contract tests are passing (43/43):

- ✅ Deployment tests
- ✅ Inheritance creation
- ✅ Beneficiary management
- ✅ Asset deposits (STT, ERC20, ERC721)
- ✅ Inheritance triggering
- ✅ Asset claiming
- ✅ Vesting mechanisms
- ✅ Access control
- ✅ Edge cases
- ✅ Gas optimization

## Deployment Information

### Contract Deployment Details
- **Deployer**: `0xc448CA6aC246Ec8D4E45947331eA3A435b40744B`
- **Gas Used**: 49,222,172
- **Deployment Cost**: ~5.5 STT
- **Confirmation**: Block 178709840

### Frontend Deployment
The Next.js application can be deployed on Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)

## Environment Setup

### Required Environment Variables

```bash
# For smart contract deployment
PRIVATE_KEY=your_wallet_private_key
SOMNIA_TESTNET_RPC=https://dream-rpc.somnia.network/
SOMNIA_MAINNET_RPC=https://dream-rpc.somnia.network/

# For frontend (optional)
NEXT_PUBLIC_CONTRACT_ADDRESS=0x27Bb37f882442638ebde4eC43c5560BFD4e71471
NEXT_PUBLIC_CHAIN_ID=50311
```

## Technology Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **ethers.js**: Ethereum library for Web3 integration

### Smart Contracts
- **Solidity ^0.8.24**: Smart contract language
- **Hardhat**: Development environment
- **OpenZeppelin**: Security-audited contract libraries
- **TypeChain**: TypeScript bindings for contracts

### Blockchain
- **Somnia Network**: High-performance EVM-compatible blockchain
- **Network Type**: Testnet (ready for mainnet)

## Security Considerations

### Smart Contract Security
- Comprehensive test coverage (43 tests)
- OpenZeppelin security standards
- Reentrancy protection
- Access control mechanisms
- Input validation

### Best Practices
- Keep private keys secure
- Use hardware wallets for production
- Test thoroughly on testnet before mainnet
- Monitor contract events and transactions

## API Reference

### Core Smart Contract Functions

#### Create Inheritance
```solidity
function createInheritance(
    string calldata name,
    address executor,
    bool requiresConfirmation,
    TimeLock calldata timeLock
) external returns (uint256 inheritanceId)
```

#### Add Beneficiary
```solidity
function addBeneficiary(
    uint256 inheritanceId,
    address beneficiary,
    uint256 allocationBasisPoints
) external
```

#### Deposit Assets
```solidity
function depositSTT(uint256 inheritanceId) external payable
function depositERC20(uint256 inheritanceId, address token, uint256 amount) external
function depositERC721(uint256 inheritanceId, address nft, uint256[] calldata tokenIds) external
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support & Documentation

- **Smart Contract Docs**: [/contract/README.md](./contract/README.md)
- **Frontend Docs**: [Next.js Documentation](https://nextjs.org/docs)
- **Somnia Network**: [https://somnia.network/](https://somnia.network/)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)

## Roadmap

- [ ] Mainnet deployment
- [ ] Advanced UI features
- [ ] Mobile application
- [ ] Multi-language support
- [ ] Integration with hardware wallets
- [ ] Advanced analytics dashboard

---

**Built with ❤️ for the future of digital inheritance**