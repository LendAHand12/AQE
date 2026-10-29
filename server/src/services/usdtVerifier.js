import { ethers } from 'ethers';

// USDT (BEP20) on BSC mainnet — 18 decimals
export const USDT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955'.toLowerCase();
const BSC_CHAIN_ID = 56;
export const TRANSFER_TOPIC = ethers.id('Transfer(address,address,uint256)'); // 0xddf252ad…523b3ef
const CLOCK_SKEW_MS = 10 * 60 * 1000;
const DEFAULT_RPC = 'https://bsc-dataseed.binance.org';

export const getMinConfirmations = () => Number(process.env.PAYMENT_MIN_CONFIRMATIONS) || 5;

/** The exact text the wallet signs. Must be character-for-character identical on the client. */
export const buildPaymentMessage = (orderCode, txHash) =>
    `AQE payment for order ${orderCode}\nTransaction: ${String(txHash).toLowerCase()}`;

/** Company wallet that receives payments (same address the client sends to). */
export const getReceiver = () => (process.env.VITE_ADMIN_WALLET_ADDRESS || '').toLowerCase();

let provider = null;
const getProvider = () => {
    if (!provider) {
        const url = process.env.RPC_URL || process.env.ALCHEMY_RPC_URL || DEFAULT_RPC;
        provider = new ethers.JsonRpcProvider(url, BSC_CHAIN_ID, { staticNetwork: true });
    }
    return provider;
};

const is429 = (e) => /429|rate.?limit|too many requests/i.test(`${e?.code ?? ''} ${e?.status ?? ''} ${e?.shortMessage ?? ''} ${e?.message ?? ''}`);

// RPC providers rate-limit: retry with exponential backoff on HTTP 429
export async function rpc(fn, retries = 4) {
    let delay = 500;
    for (let attempt = 0; ; attempt++) {
        try {
            return await fn(getProvider());
        } catch (e) {
            if (!is429(e) || attempt >= retries) throw e;
            await new Promise((r) => setTimeout(r, delay));
            delay *= 2;
        }
    }
}

export const addrFromTopic = (topic) => ('0x' + topic.slice(-40)).toLowerCase();

/**
 * Check one order's tx against the chain.
 * Returns { status: 'verified' | 'pending' | 'invalid', reason }.
 * Network / RPC failures are reported as 'pending' so the next run retries.
 */
export async function verifyUsdtPayment({ txHash, payerAddress, amount, orderCreatedAt }) {
    const receiver = getReceiver();
    if (!ethers.isAddress(receiver)) {
        console.error('[Verifier] VITE_ADMIN_WALLET_ADDRESS is missing or invalid');
        return { status: 'pending', reason: 'Receiving wallet is not configured' };
    }

    try {
        const receipt = await rpc((p) => p.getTransactionReceipt(txHash));
        if (!receipt) {
            const tx = await rpc((p) => p.getTransaction(txHash));
            return { status: 'pending', reason: tx ? 'Transaction is not mined yet' : 'Transaction not found yet' };
        }

        if (receipt.status !== 1) {
            return { status: 'invalid', reason: 'Transaction failed on-chain (status 0x0)' };
        }

        const transfers = receipt.logs.filter((l) =>
            l.address.toLowerCase() === USDT_ADDRESS &&
            l.topics.length === 3 &&
            l.topics[0] === TRANSFER_TOPIC &&
            addrFromTopic(l.topics[2]) === receiver
        );
        if (!transfers.length) {
            return { status: 'invalid', reason: 'No USDT transfer to the company wallet in this transaction' };
        }

        const fromPayer = transfers.filter((l) => addrFromTopic(l.topics[1]) === payerAddress.toLowerCase());
        if (!fromPayer.length) {
            return { status: 'invalid', reason: 'USDT was sent to the company wallet, but not from the wallet that signed' };
        }

        const total = fromPayer.reduce((sum, l) => sum + BigInt(l.data), 0n);
        if (total === 0n) {
            return { status: 'invalid', reason: 'Transferred amount is zero' };
        }
        const expected = ethers.parseUnits(String(amount), 18);
        if (total < expected) {
            return { status: 'invalid', reason: `Underpaid: received ${ethers.formatUnits(total, 18)} USDT, expected ${amount} USDT` };
        }

        const block = await rpc((p) => p.getBlock(receipt.blockNumber));
        if (!block) return { status: 'pending', reason: 'Block not available yet' };
        if (block.timestamp * 1000 < new Date(orderCreatedAt).getTime() - CLOCK_SKEW_MS) {
            return { status: 'invalid', reason: 'Transaction was mined before the order was created' };
        }

        const latest = await rpc((p) => p.getBlockNumber());
        const confirmations = latest - receipt.blockNumber + 1;
        const required = getMinConfirmations();
        if (confirmations < required) {
            return { status: 'pending', reason: `Waiting for confirmations (${Math.max(confirmations, 0)}/${required})` };
        }

        return { status: 'verified', reason: '' };
    } catch (e) {
        console.error('[Verifier] RPC error:', e?.shortMessage || e?.message);
        return { status: 'pending', reason: 'Could not reach the blockchain node, will retry' };
    }
}
