import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;
const USDT_CONTRACT_ADDRESS = process.env.USDT_CONTRACT_ADDRESS;

// Minimal ERC20 ABI for transfer
const ERC20_ABI = [
    "function transfer(address to, uint256 amount) public returns (bool)",
    "function decimals() public view returns (uint8)",
    "function balanceOf(address owner) public view returns (uint256)"
];

/**
 * Send USDT to a recipient address
 * @param {string} toAddress Recipient wallet address
 * @param {number} amount Amount of USDT to send
 * @returns {Promise<string>} Transaction hash
 */
export const sendUsdt = async (toAddress, amount) => {
    if (!ADMIN_PRIVATE_KEY || !RPC_URL || !USDT_CONTRACT_ADDRESS) {
        throw new Error('Blockchain configuration missing in .env (ADMIN_PRIVATE_KEY, RPC_URL, or USDT_CONTRACT_ADDRESS)');
    }

    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
        const contract = new ethers.Contract(USDT_CONTRACT_ADDRESS, ERC20_ABI, wallet);

        // Get decimals (usually 18 for BEP20 USDT, but let's be safe)
        const decimals = await contract.decimals();
        const amountInUnits = ethers.parseUnits(amount.toString(), decimals);

        // Execute transfer
        const tx = await contract.transfer(toAddress, amountInUnits);
        
        // Wait for 1 confirmation
        const receipt = await tx.wait();
        
        return receipt.hash;
    } catch (error) {
        console.error('Blockchain Transfer Error:', error);
        throw new Error(`Transfer failed: ${error.message}`);
    }
};
