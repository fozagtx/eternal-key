# 🔐 Eternal Key - Decentralized Inheritance Platform

**Secure your digital legacy with blockchain technology. Create automated inheritance contracts that protect your assets for future generations.**

[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-000000?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Powered by Somnia](https://img.shields.io/badge/Powered%20by-Somnia-blue?style=for-the-badge)](https://somnia.network/)
[![Smart Contracts](https://img.shields.io/badge/Smart-Contracts-green?style=for-the-badge)](https://soliditylang.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

## 🌟 Overview

Eternal Key is a cutting-edge decentralized inheritance platform that leverages blockchain technology to secure digital assets for future generations. Built on the Somnia network, it provides automated, secure, and transparent inheritance management through smart contracts.

### ✨ Key Features

- **🔒 Blockchain Security**: Immutable inheritance contracts secured by the Somnia blockchain
- **⚡ Instant Setup**: Create inheritance contracts in under 60 seconds
- **🎯 Precise Control**: Set custom release timers and beneficiary allocations  
- **💎 Multi-Asset Support**: Support for STT tokens, ERC20 tokens, and NFTs
- **🔄 Automated Distribution**: Smart contracts handle automatic asset distribution
- **🛡️ Security Audited**: Comprehensive security fixes and testing implemented
- **📱 Modern UI**: Beautiful, responsive interface with real-time feedback
- **🌐 Decentralized**: No central authority - pure blockchain execution
- **🚀 Simplified Process**: No inheritance name required - streamlined user experience

## 🚀 Live Deployment

### **Production Application**
- **Frontend**: [Visit Eternal Key](https://your-domain.com) *(Update with your domain)*
- **Network**: Somnia Testnet
- **Status**: ✅ **Live & Operational**

### **Smart Contract Details**
```
Contract Address: 0x2E68CbB4BdA0b44fed48FA98cE3bff799fa7Fb3E
Network: Somnia Testnet (Chain ID: 50312)
Compiler: Solidity 0.8.28
Security: Audited & Hardened
Deployment: January 2025
Features: No inheritance name field, STT token support, enhanced security
```

**View on Explorer**: [Somnia Explorer](https://shannon-explorer.somnia.network/address/0x2E68CbB4BdA0b44fed48FA98cE3bff799fa7Fb3E)

## 🏗️ Architecture

### **Frontend Stack**
- **Framework**: Next.js 15.5.3 with Turbopack
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom gradients
- **Blockchain**: Wagmi + Viem for Web3 integration
- **Wallet**: ConnectKit for wallet connections
- **UI Components**: Custom components with shadcn/ui

### **Smart Contract Stack**
- **Language**: Solidity ^0.8.24
- **Framework**: Hardhat with TypeScript
- **Security**: OpenZeppelin contracts + custom security fixes
- **Testing**: Comprehensive test suite with 10+ real-world scenarios
- **Deployment**: Automated deployment scripts

### **Security Features**
- **✅ Reentrancy Protection**: SafeERC20 and ReentrancyGuard
- **✅ Access Control**: Role-based permissions with OpenZeppelin
- **✅ Input Validation**: Comprehensive parameter validation
- **✅ Asset Protection**: Secure multi-asset handling
- **✅ Double-Claim Prevention**: State tracking prevents duplicate claims
- **✅ ERC721 Distribution Fix**: Proper NFT distribution without duplicates

## 🛠️ Local Development

### **Prerequisites**
```bash
Node.js >= 18.0.0
npm or yarn or bun
Git
```

### **Installation**
```bash
# Clone the repository
git clone https://github.com/your-username/eternal-key.git
cd eternal-key

# Install dependencies
npm install

# Install contract dependencies
cd contract && npm install && cd ..

# Set up environment variables
cp .env.example .env.local
```

### **Environment Setup**
Create `.env.local` file:
```env
# Wallet Configuration
PRIVATE_KEY=your_private_key_here

# Optional: Analytics & Monitoring
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
```

### **Development Commands**

#### **Frontend Development**
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Format code
npm run format
```

#### **Smart Contract Development**
```bash
cd contract

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to local network
npx hardhat run scripts/deploy-inheritance-core.js --network localhost

# Deploy to Somnia testnet
npx hardhat run scripts/deploy-inheritance-core.js --network somnia-testnet
```

## 📋 Usage Guide

### **Creating an Inheritance Contract**

1. **Connect Wallet**
   - Click "Get Started" on the homepage
   - Connect your wallet using ConnectKit
   - Ensure you have STT tokens for deposits

2. **Set Up Inheritance**
   - Enter beneficiary wallet address
   - Specify STT amount to deposit
   - Review inheritance settings (15-second timer for testing)
   - No inheritance name required - simplified process

3. **Deploy & Fund**
   - Click "Create & Deposit STT"
   - Confirm transaction in your wallet
   - Wait for deployment confirmation

4. **Manage Inheritance**
   - View contract details and inheritance ID
   - Add additional beneficiaries if needed
   - Monitor release timer countdown

### **Claiming Inheritance**

1. **Trigger Inheritance** (when timer expires)
   - Contract owner or executor can trigger
   - Automatic activation after time lock

2. **Claim Assets**
   - Beneficiaries can claim their allocated portion
   - Immediate distribution for STT tokens
   - Proportional distribution based on allocation

## 🔧 Configuration

### **Network Configuration**
The app supports multiple networks via Hardhat configuration:

```typescript
// hardhat.config.ts
networks: {
  "somnia-testnet": {
    url: "https://dream-rpc.somnia.network/",
    chainId: 50312,
    accounts: [process.env.PRIVATE_KEY]
  }
}
```

### **Frontend Configuration**
```typescript
// lib/contracts.ts
export const CONTRACT_ADDRESSES = {
  InheritanceCore: "0x2E68CbB4BdA0b44fed48FA98cE3bff799fa7Fb3E",
  // Add other contract addresses as needed
};
```

## 🧪 Testing

### **Smart Contract Tests**
```bash
cd contract
npx hardhat test
```

**Test Coverage**: 10 comprehensive test cases covering:
- ✅ Contract deployment and initialization
- ✅ Inheritance creation with real STT deposits
- ✅ Beneficiary management and allocation
- ✅ STT deposits and balance tracking
- ✅ Inheritance triggering and claiming
- ✅ Multi-beneficiary scenarios
- ✅ Access control validation
- ✅ Edge cases and error handling

### **Frontend Testing**
```bash
# Build test
npm run build

# Type checking
npm run lint
```

## 📁 Project Structure

```
eternal-key/
├── 📱 Frontend (Next.js)
│   ├── app/                    # Next.js app router
│   ├── components/            # React components
│   │   ├── inheritance/       # Inheritance form components
│   │   └── ui/               # Reusable UI components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utilities and contracts
│   └── public/               # Static assets
│
├── 🔗 Smart Contracts
│   ├── contracts/            # Solidity contracts
│   │   ├── core/            # Core inheritance logic
│   │   ├── interfaces/      # Contract interfaces
│   │   └── libraries/       # Shared libraries
│   ├── test/                # Contract tests
│   ├── scripts/             # Deployment scripts
│   └── hardhat.config.ts    # Hardhat configuration
│
└── 📚 Documentation
    └── README.md            # This file
```

## 🚨 Security Considerations

### **Audited Security Fixes**
- **ERC721 Distribution**: Fixed duplicate token transfer bugs
- **Double-Claiming Prevention**: Added comprehensive state tracking
- **Access Control**: Implemented proper role-based permissions
- **Input Validation**: Enhanced parameter validation throughout
- **Reentrancy Protection**: Multiple layers of protection

### **Best Practices**
- Never share private keys
- Test with small amounts first
- Verify beneficiary addresses before deployment
- Keep backup of inheritance contract addresses
- Monitor contract activity through block explorer

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### **Development Workflow**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links & Resources

### **Official Links**
- **Website**: [Eternal Key](https://your-domain.com)
- **Documentation**: [Docs](https://docs.your-domain.com)
- **Support**: [Discord](https://discord.gg/your-server)

### **Blockchain Resources**
- **Somnia Network**: [somnia.network](https://somnia.network/)
- **Somnia Explorer**: [shannon-explorer.somnia.network](https://shannon-explorer.somnia.network/)
- **Somnia Docs**: [docs.somnia.network](https://docs.somnia.network/)

### **Technical Resources**
- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)
- **Hardhat Documentation**: [hardhat.org/docs](https://hardhat.org/docs)
- **Wagmi Documentation**: [wagmi.sh](https://wagmi.sh/)

## 📊 Stats & Metrics

- **Contract Size**: Optimized for gas efficiency
- **Test Coverage**: 10 comprehensive test scenarios
- **Build Time**: ~20-25 seconds
- **Bundle Size**: Optimized with Turbopack
- **Security Score**: ✅ Audited and hardened

## 🆘 Support

### **Getting Help**
- **Documentation**: Check this README and inline code comments
- **Issues**: Create an issue on GitHub
- **Community**: Join our Discord server
- **Email**: support@your-domain.com

### **Troubleshooting**

**Common Issues**:
1. **Wallet Connection Issues**: Ensure you're on Somnia Testnet
2. **Transaction Failures**: Check gas fees and STT balance
3. **Contract Interaction**: Verify contract address and ABI
4. **Build Errors**: Clear cache and reinstall dependencies

---

<div align="center">

**Built with ❤️ for the decentralized future**

[🌟 Star this repo](https://github.com/your-username/eternal-key) • [🐛 Report Bug](https://github.com/your-username/eternal-key/issues) • [💡 Request Feature](https://github.com/your-username/eternal-key/issues)

</div>