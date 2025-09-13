# Crypto Inheritance System

A comprehensive crypto inheritance system built on the Somnia testnet with deadman switch functionality. This dApp allows users to secure their digital assets for their loved ones using smart contract technology.

![Crypto Inheritance System](https://img.shields.io/badge/Built%20on-Somnia%20Testnet-blue)
![Smart Contracts](https://img.shields.io/badge/Smart%20Contracts-Solidity-green)
![Frontend](https://img.shields.io/badge/Frontend-Next.js-black)

## 🌟 Features

### Core Functionality
- **Secure Inheritance Setup**: Set beneficiaries and deposit STT tokens
- **Deadman Switch**: Configurable duration from 1 day to 1 year
- **Active Management**: Check-in system to prove you're alive and reset the switch
- **Full Control**: Deposit, withdraw, and manage funds while active
- **Automatic Transfer**: Beneficiaries can claim inheritance when deadman switch triggers

### Security Features
- **Smart Contract Based**: Deployed on Somnia testnet with battle-tested code
- **Reentrancy Protection**: All fund transfers are secured against reentrancy attacks
- **Access Control**: Only owners can modify settings, only beneficiaries can claim
- **Pausable**: Emergency pause functionality for contract security
- **Comprehensive Testing**: Full test suite covering edge cases

### User Experience
- **Modern UI**: Dark theme with glass morphism design
- **Real-time Updates**: Live countdown timers and status updates
- **Mobile Responsive**: Works perfectly on all devices
- **Wallet Integration**: Supports MetaMask and other Web3 wallets
- **Error Handling**: Comprehensive error messages and user feedback

## 🚀 Quick Start

### Prerequisites
- Bun (latest version)
- MetaMask or compatible Web3 wallet
- Somnia testnet STT tokens

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd crypto-inheritance-system
```

2. **Install dependencies**
```bash
bun install
```

3. **Set up environment variables**
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration:
```env
# Somnia Testnet Configuration
NEXT_PUBLIC_CHAIN_ID=50312
NEXT_PUBLIC_RPC_URL=https://testnet.somnia.network/
NEXT_PUBLIC_BLOCK_EXPLORER=https://testnet.somnia.network/

# For deployment
PRIVATE_KEY=your_private_key_here
SOMNIA_API_KEY=optional_api_key_for_verification

# For frontend (after contract deployment)
NEXT_PUBLIC_CONTRACT_ADDRESS=deployed_contract_address
```

### Deployment

1. **Compile smart contracts**
```bash
bun run compile
```

2. **Run tests**
```bash
bun run test
```

3. **Deploy to Somnia testnet**
```bash
bun run deploy
```

4. **Update frontend configuration**
After deployment, update `NEXT_PUBLIC_CONTRACT_ADDRESS` in `.env.local` with the deployed contract address.

### Development

1. **Start the development server**
```bash
bun run dev
```

2. **Open your browser**
Navigate to `http://localhost:3000`

## 🏗️ Architecture

### Smart Contract (`InheritanceSystem.sol`)
- **Inheritance Management**: Create, update, and manage inheritances
- **Deadman Switch**: Time-based mechanism with configurable duration
- **Fund Management**: Secure deposit and withdrawal functionality
- **Access Control**: Role-based permissions for owners and beneficiaries
- **Security**: Reentrancy guards and emergency controls

### Frontend (Next.js)
- **Landing Page**: Introduction and wallet connection
- **Dashboard**: Main interface for managing inheritances
- **Components**: Modular, reusable UI components
- **Wallet Integration**: wagmi + RainbowKit for Web3 connectivity
- **Real-time Updates**: Live countdown timers and status monitoring

## 📱 Usage Guide

### For Inheritance Creators

1. **Connect Wallet**
   - Visit the application and connect your MetaMask wallet
   - Ensure you're connected to Somnia testnet (Chain ID: 50312)

2. **Create Inheritance**
   - Enter beneficiary wallet address
   - Choose deadman switch duration (1 day to 1 year)
   - Write a personal message for your beneficiary
   - Deposit initial STT tokens

3. **Manage Your Inheritance**
   - **Check In**: Reset the deadman switch regularly
   - **Deposit/Withdraw**: Add or remove funds anytime
   - **Update Beneficiary**: Change the inheritance recipient
   - **Update Duration**: Modify the deadman switch timeframe

4. **Stay Active**
   - Check in before the deadline to prove you're still active
   - Monitor the countdown timer on your dashboard
   - Receive visual warnings when time is running low

### For Beneficiaries

1. **Check Inheritance Status**
   - Enter the wallet address of someone who might have set you as beneficiary
   - View inheritance details if you're the designated beneficiary

2. **Monitor Deadman Switch**
   - Track the countdown timer to see when inheritance becomes claimable
   - Read personal messages from the inheritance creator

3. **Claim Inheritance**
   - When the deadman switch triggers, you can claim the inheritance
   - Execute the claim transaction to receive the STT tokens
   - Each inheritance can only be claimed once

## 🔧 Configuration

### Network Configuration (Somnia Testnet)
- **Chain ID**: 50312
- **RPC URL**: https://testnet.somnia.network/
- **Currency**: STT (Somnia Test Token)
- **Block Explorer**: https://testnet.somnia.network/

### Smart Contract Configuration
- **Minimum Duration**: 1 day (86,400 seconds)
- **Maximum Duration**: 1 year (31,536,000 seconds)
- **Gas Optimization**: Optimized for minimal gas usage
- **Security**: ReentrancyGuard, Pausable, Ownable

## 🧪 Testing

The project includes comprehensive tests covering:

- **Inheritance Creation**: Valid and invalid scenarios
- **Fund Management**: Deposits, withdrawals, and balance tracking
- **Deadman Switch**: Triggering, reset, and timing mechanics
- **Access Control**: Owner and beneficiary permissions
- **Edge Cases**: Empty inheritances, double execution, invalid inputs

Run tests:
```bash
bun run test
```

## 🔐 Security

### Smart Contract Security
- **Audited Patterns**: Uses OpenZeppelin contracts
- **Reentrancy Protection**: Guards against reentrancy attacks
- **Access Control**: Role-based permissions
- **Input Validation**: Comprehensive parameter checking
- **Emergency Controls**: Pausable functionality

### Frontend Security
- **Environment Variables**: Sensitive data in environment variables
- **Address Validation**: Client-side address format validation
- **Error Handling**: Graceful error management
- **Transaction Monitoring**: Real-time transaction status

## 📁 Project Structure

```
├── contracts/                 # Smart contracts
│   └── InheritanceSystem.sol  # Main inheritance contract
├── scripts/                   # Deployment scripts
│   └── deploy.js             # Contract deployment
├── test/                      # Test files
│   └── InheritanceSystem.test.js
├── pages/                     # Next.js pages
│   ├── index.tsx             # Landing page
│   ├── dashboard.tsx         # Main dashboard
│   └── _app.tsx              # App configuration
├── components/                # React components
│   ├── CountdownTimer.tsx    # Real-time countdown
│   ├── InheritanceCreator.tsx # Inheritance setup
│   ├── InheritanceManager.tsx # Management interface
│   └── BeneficiaryPanel.tsx  # Beneficiary interface
├── lib/                       # Utility libraries
│   ├── contracts.ts          # Contract ABIs and addresses
│   ├── wagmi.ts              # Wallet configuration
│   └── utils.ts              # Helper functions
├── styles/                    # CSS styles
│   └── globals.css           # Global styles
├── hardhat.config.js         # Hardhat configuration
└── package.json              # Dependencies and scripts
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

**Issue**: Cannot connect to Somnia testnet
**Solution**: Add Somnia testnet to MetaMask:
- Network Name: Somnia Testnet
- RPC URL: https://testnet.somnia.network/
- Chain ID: 50312
- Currency Symbol: STT

**Issue**: Transaction fails with "insufficient funds"
**Solution**: Ensure you have STT tokens on Somnia testnet for gas fees

**Issue**: Contract not found error
**Solution**: Verify `NEXT_PUBLIC_CONTRACT_ADDRESS` is set correctly in `.env.local`

### Getting Help
- Create an issue on GitHub for bugs
- Check the documentation for common solutions
- Review the test files for usage examples

## 🚀 Deployment to Production

For production deployment:

1. **Smart Contract**
   - Deploy to Somnia mainnet (when available)
   - Get professional audit
   - Set up monitoring and alerting

2. **Frontend**
   - Deploy to Vercel or similar platform
   - Set up custom domain
   - Configure analytics and monitoring

3. **Security**
   - Regular security reviews
   - Monitor contract interactions
   - Keep dependencies updated

---

**Built with ❤️ for the decentralized future**