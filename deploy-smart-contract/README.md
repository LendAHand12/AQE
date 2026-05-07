# USDT BEP20 Payment Smart Contract

This project contains a production-ready smart contract for handling USDT BEP20 payments on the Binance Smart Chain (BSC).

## Features
- Secure USDT deposits with unique `paymentId`.
- Automatic transfer of funds to a designated admin wallet.
- Replay protection to prevent duplicate `paymentId` usage.
- Reentrancy protection.
- Emergency rescue for other tokens (excluding USDT).

## Folder Structure
- `contracts/`: Solidity source files.
- `scripts/`: Deployment and interaction scripts.
- `hardhat.config.js`: Hardhat configuration for BSC.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   - Copy `.env.example` to `.env`.
   - Fill in your `PRIVATE_KEY`, `BSCSCAN_API_KEY`, and `ADMIN_WALLET`.
   ```bash
   cp .env.example .env
   ```

3. **Compile Contract**
   ```bash
   npx hardhat compile
   ```

## Deployment

### Deploy to BSC Testnet
```bash
npx hardhat run scripts/deploy.js --network bscTestnet
```

### Deploy to BSC Mainnet
```bash
npx hardhat run scripts/deploy.js --network bsc
```

## Verification

To verify the contract on BscScan:
```bash
npx hardhat verify --network bsc <CONTRACT_ADDRESS> "0x55d398326f99059fF775485246999027B3197955" "<ADMIN_WALLET>"
```

## Security & Optimization
- **Optimization**: The contract uses the `SafeERC20` library to handle token transfers securely.
- **Gas**: The `runs` parameter in `hardhat.config.js` is set to 200 for a good balance between deployment cost and execution cost.
- **Auditing**: This contract should be reviewed before high-volume production use.
