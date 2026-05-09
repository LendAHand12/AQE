import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { finalizeBlockchainPayment } from './paymentService.js';

dotenv.config();

const WSS_URL = process.env.ALCHEMY_WSS_URL;
const RPC_URL = process.env.ALCHEMY_RPC_URL || process.env.RPC_URL;
const CONTRACT_ADDRESS = process.env.PAYMENT_CONTRACT_ADDRESS;

import Transaction from '../models/Transaction.js';
import User from '../models/User.js';

const ABI = [
    "event Deposit(address indexed from, address indexed to, uint256 amount, uint256 paymentId)"
];

const MAX_BLOCK_RANGE = 5;
const CONFIRMATION_BLOCKS = 3;

const USDT_ABI = [
    "event Transfer(address indexed from, address indexed to, uint256 value)"
];
const USDT_ADDRESS = (process.env.USDT_TOKEN_ADDRESS || "0x55d398326f99059fF775485246999027B3197955").toLowerCase();
const ADMIN_ADDRESS = (process.env.ADMIN_WALLET_ADDRESS || "").toLowerCase();

export const initPaymentListener = async () => {
    console.log(`[PaymentListener] Initializing... Admin: ${ADMIN_ADDRESS}`);
    if (WSS_URL) {
        setupWebSocketListener();
    } else if (RPC_URL) {
        setupPollingListener();
    }
};

const setupWebSocketListener = () => {
    console.log(`[PaymentListener] WS Connect: ${WSS_URL}`);
    try {
        const provider = new ethers.WebSocketProvider(WSS_URL);
        const depositContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
        const usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, provider);

        depositContract.on("Deposit", async (from, to, amount, paymentId, event) => {
            handleDepositEvent(amount, paymentId, event.log.transactionHash);
        });

        // Listen for direct transfers to Admin
        usdtContract.on("Transfer", async (from, to, value, event) => {
            if (to.toLowerCase() === ADMIN_ADDRESS) {
                handleTransferEvent(from, value, event.log.transactionHash);
            }
        });

        provider.websocket.on("close", () => setTimeout(setupWebSocketListener, 5000));
    } catch (e) {
        setupPollingListener();
    }
};

const setupPollingListener = async () => {
    console.log(`[PaymentListener] Polling Start (Safety Lag: ${CONFIRMATION_BLOCKS} blocks)`);
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const depositContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
    const usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, provider);

    let lastBlockChecked = (await provider.getBlockNumber()) - CONFIRMATION_BLOCKS;

    const poll = async () => {
        try {
            const currentBlock = (await provider.getBlockNumber()) - CONFIRMATION_BLOCKS;
            if (currentBlock > lastBlockChecked) {
                let targetEndBlock = Math.min(currentBlock, lastBlockChecked + MAX_BLOCK_RANGE);
                
                // 1. Scan for Deposit events
                try {
                    const depositEvents = await depositContract.queryFilter("Deposit", lastBlockChecked + 1, targetEndBlock);
                    for (const event of depositEvents) {
                        const { amount, paymentId } = event.args;
                        await handleDepositEvent(amount, paymentId, event.transactionHash);
                    }
                } catch (e) { console.warn(`[PaymentListener] Deposit scan lag: ${e.message}`); }

                // 2. Scan for direct Transfer events
                try {
                    const transferEvents = await usdtContract.queryFilter("Transfer", lastBlockChecked + 1, targetEndBlock);
                    for (const event of transferEvents) {
                        const { from, to, value } = event.args;
                        if (to.toLowerCase() === ADMIN_ADDRESS) {
                            await handleTransferEvent(from, value, event.transactionHash);
                        }
                    }
                } catch (e) { console.warn(`[PaymentListener] Transfer scan lag: ${e.message}`); }
                
                lastBlockChecked = targetEndBlock;
                if (lastBlockChecked < currentBlock) {
                    setTimeout(poll, 1000);
                    return;
                }
            }
        } catch (error) {
            console.error('[PaymentListener] System Error:', error.message);
        }
        setTimeout(poll, 15000);
    };
    poll();
};

const handleDepositEvent = async (amount, paymentId, hash) => {
    const actualAmount = parseFloat(ethers.formatUnits(amount, 18));
    const pId = Number(paymentId);
    console.log(`[PaymentListener] DEPOSIT DETECTED: ${pId} | Hash: ${hash}`);
    try {
        await finalizeBlockchainPayment(pId, hash, actualAmount);
    } catch (err) {
        console.error(`[PaymentListener] Finalize Error ${pId}:`, err);
    }
};

const handleTransferEvent = async (from, value, hash) => {
    const amount = parseFloat(ethers.formatUnits(value, 18));
    console.log(`[PaymentListener] TRANSFER DETECTED: From ${from} | Amount ${amount} | Hash ${hash}`);
    
    try {
        // Find a matching PENDING transaction
        // 1. Find user by wallet address
        const user = await User.findOne({ walletAddress: { $regex: new RegExp(`^${from}$`, "i") } });
        if (!user) {
            console.log(`[PaymentListener] No user found for wallet ${from}. Skipping.`);
            return;
        }

        // 2. Find pending transaction for this user with matching amount (approximate)
        const pendingTx = await Transaction.findOne({
            from: user._id,
            status: 'PENDING',
            type: 'PAYMENT',
            amount: { $gte: amount * 0.99, $lte: amount * 1.01 } // Allow 1% variance
        }).sort({ createdAt: -1 });

        if (pendingTx) {
            console.log(`[PaymentListener] Match found! PaymentId: ${pendingTx.paymentId}`);
            await finalizeBlockchainPayment(pendingTx.paymentId, hash, amount);
        } else {
            console.log(`[PaymentListener] No matching PENDING transaction for user ${user.username} at amount ${amount}`);
        }
    } catch (err) {
        console.error(`[PaymentListener] Transfer processing error:`, err);
    }
};
