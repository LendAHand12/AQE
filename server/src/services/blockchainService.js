import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { sendTelegramNotification } from '../utils/telegramService.js';

dotenv.config();

const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;
// .env has used both names; fall back to the canonical BSC USDT address
const USDT_CONTRACT_ADDRESS = process.env.USDT_CONTRACT_ADDRESS || process.env.USDT_TOKEN_ADDRESS || '0x55d398326f99059fF775485246999027B3197955';

const GAS_RESERVE_BNB = 0.002; // rough cost of one BEP20 transfer, with headroom

// Minimal ERC20 ABI for transfer
const ERC20_ABI = [
    "function transfer(address to, uint256 amount) public returns (bool)",
    "function decimals() public view returns (uint8)",
    "function balanceOf(address owner) public view returns (uint256)"
];

const getWallet = () => {
    if (!ADMIN_PRIVATE_KEY || !RPC_URL) {
        throw new Error('Blockchain configuration missing in .env (ADMIN_PRIVATE_KEY or RPC_URL)');
    }
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    return new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
};

/** Telegram the admin that an automatic withdrawal failed and needs manual handling. */
export const alertWithdrawalFailed = async ({ user, withdrawal, error }) => {
    await sendTelegramNotification(
        `🚨 <b>Automatic USDT withdrawal FAILED</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 <b>User:</b> @${user?.username || '?'}\n` +
        `💰 <b>Amount:</b> ${withdrawal.amount} USDT\n` +
        `👛 <b>To:</b> <code>${withdrawal.walletAddress}</code>\n` +
        `🆔 <b>Withdrawal:</b> <code>${withdrawal._id}</code>\n` +
        `📝 <b>Reason:</b> ${error.message}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `<i>The order stays PENDING and the user's balance is already deducted. Process it from the admin dashboard.</i>`
    );
};

/**
 * Send USDT to a recipient address
 * @param {string} toAddress Recipient wallet address
 * @param {number} amount Amount of USDT to send
 * @returns {Promise<string>} Transaction hash
 */
export const sendUsdt = async (toAddress, amount) => {
    const wallet = getWallet();
    const contract = new ethers.Contract(USDT_CONTRACT_ADDRESS, ERC20_ABI, wallet);

    // Get decimals (usually 18 for BEP20 USDT, but let's be safe)
    const decimals = await contract.decimals();
    const amountInUnits = ethers.parseUnits(amount.toString(), decimals);

    // Pre-flight: fail with a clear reason instead of an opaque revert
    const [usdtBal, bnbBal] = await Promise.all([
        contract.balanceOf(wallet.address),
        wallet.provider.getBalance(wallet.address)
    ]);
    if (usdtBal < amountInUnits) {
        throw new Error(`Payout wallet has insufficient USDT (${ethers.formatUnits(usdtBal, decimals)} < ${amount})`);
    }
    if (bnbBal < ethers.parseEther(String(GAS_RESERVE_BNB))) {
        throw new Error(`Payout wallet has insufficient BNB for gas (${ethers.formatEther(bnbBal)})`);
    }

    try {
        // Execute transfer
        const tx = await contract.transfer(toAddress, amountInUnits);

        // Wait for 1 confirmation
        const receipt = await tx.wait();

        return receipt.hash;
    } catch (error) {
        console.error('Blockchain Transfer Error:', error);
        throw new Error(`Transfer failed: ${error.shortMessage || error.message}`);
    }
};
