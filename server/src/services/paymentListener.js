import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { finalizeBlockchainPayment } from './paymentService.js';

dotenv.config();

const WSS_URL = process.env.ALCHEMY_WSS_URL;
const RPC_URL = process.env.ALCHEMY_RPC_URL || process.env.RPC_URL;
const CONTRACT_ADDRESS = process.env.PAYMENT_CONTRACT_ADDRESS;

const ABI = [
    "event Deposit(address indexed from, address indexed to, uint256 amount, uint256 paymentId)"
];

const MAX_BLOCK_RANGE = 5; // Giảm xuống 5 để cực kỳ an toàn cho gói Free
const CONFIRMATION_BLOCKS = 3; // Quét trễ hơn 3 block để đảm bảo dữ liệu đã ổn định

export const initPaymentListener = async () => {
    if (!CONTRACT_ADDRESS) {
        console.warn('[PaymentListener] Missing PAYMENT_CONTRACT_ADDRESS.');
        return;
    }

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
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
        contract.on("Deposit", async (from, to, amount, paymentId, event) => {
            handleDepositEvent(amount, paymentId, event.log.transactionHash);
        });
        provider.websocket.on("close", () => setTimeout(setupWebSocketListener, 5000));
    } catch (e) {
        setupPollingListener();
    }
};

const setupPollingListener = async () => {
    console.log(`[PaymentListener] Polling Start (Safety Lag: ${CONFIRMATION_BLOCKS} blocks)`);
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

    let lastBlockChecked = (await provider.getBlockNumber()) - CONFIRMATION_BLOCKS;

    const poll = async () => {
        try {
            // Lấy block mới nhất và trừ đi khoảng an toàn
            const currentBlock = (await provider.getBlockNumber()) - CONFIRMATION_BLOCKS;
            
            if (currentBlock > lastBlockChecked) {
                let targetEndBlock = Math.min(currentBlock, lastBlockChecked + MAX_BLOCK_RANGE);
                
                // Sử dụng try-catch riêng cho queryFilter
                try {
                    const events = await contract.queryFilter("Deposit", lastBlockChecked + 1, targetEndBlock);
                    
                    for (const event of events) {
                        const { amount, paymentId } = event.args;
                        await handleDepositEvent(amount, paymentId, event.transactionHash);
                    }
                    
                    lastBlockChecked = targetEndBlock;
                } catch (filterError) {
                    // Nếu vẫn lỗi block range, có thể do node chưa đồng bộ, bỏ qua lượt này
                    console.warn(`[PaymentListener] Filter Lag: ${filterError.message}`);
                }

                // Nếu còn nhiều block chưa quét, quét tiếp ngay lập tức
                if (lastBlockChecked < currentBlock) {
                    setTimeout(poll, 2000);
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
    console.log(`[PaymentListener] DETECTED: ${pId} | Hash: ${hash}`);
    try {
        await finalizeBlockchainPayment(pId, hash, actualAmount);
    } catch (err) {
        console.error(`[PaymentListener] Finalize Error ${pId}:`, err);
    }
};
