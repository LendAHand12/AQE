import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { verifyUsdtPayment } from './usdtVerifier.js';
import { finalizeBlockchainPayment } from './paymentService.js';
import { sendTelegramNotification } from '../utils/telegramService.js';

const REVIEW_AFTER_MS = 6 * 60 * 60 * 1000; // still unseen/unconfirmed after 6h -> manual review
const BATCH_LIMIT = 50;
const INTERVAL_MS = 60 * 1000;

const alertAdmin = async (transaction, title, reason) => {
    const user = await User.findById(transaction.from).select('username fullName').catch(() => null);
    await sendTelegramNotification(
        `⚠️ <b>${title}</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 <b>User:</b> ${user?.fullName || ''} (@${user?.username || ''})\n` +
        `💰 <b>Amount:</b> ${transaction.amount} ${transaction.symbol}\n` +
        `🆔 <b>Payment ID:</b> <code>${transaction.paymentId}</code>\n` +
        `🔗 <b>Tx:</b> <code>${transaction.hash}</code>\n` +
        `👛 <b>Payer:</b> <code>${transaction.payerAddress}</code>\n` +
        `📝 <b>Reason:</b> ${reason}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `<i>Check on BscScan and approve/reject from the admin dashboard.</i>`
    );
};

// VERIFYING -> PENDING_REVIEW, only if still VERIFYING (so the admin is alerted once)
const moveToReview = async (transaction, reason, title) => {
    const moved = await Transaction.findOneAndUpdate(
        { _id: transaction._id, status: 'VERIFYING' },
        { $set: { status: 'PENDING_REVIEW', paymentError: reason } },
        { new: true }
    );
    if (moved) await alertAdmin(moved, title, reason);
    return moved;
};

/**
 * Verify one VERIFYING order against the chain and apply the outcome.
 * Safe to call concurrently (submit, refresh endpoint and the background job):
 * every transition is a conditional update on the status.
 */
export async function processVerification(transactionId) {
    const transaction = await Transaction.findOne({ _id: transactionId, status: 'VERIFYING' });
    if (!transaction) return null;

    const result = await verifyUsdtPayment({
        txHash: transaction.hash,
        payerAddress: transaction.payerAddress,
        amount: transaction.amount,
        orderCreatedAt: transaction.createdAt
    });

    if (result.status === 'verified') {
        // Atomically VERIFYING -> PROCESSING -> SUCCESS; runs once, then pays commissions
        await finalizeBlockchainPayment(transaction.paymentId, transaction.hash, transaction.amount, 'VERIFYING');
        const after = await Transaction.findById(transaction._id);
        if (after?.status === 'SUCCESS') {
            await Transaction.updateOne({ _id: after._id }, { $unset: { paymentError: 1 } });
        }
        return after;
    }

    if (result.status === 'invalid') {
        return moveToReview(transaction, result.reason, 'Payment needs manual review');
    }

    // pending
    const waitedMs = Date.now() - new Date(transaction.paidAt || transaction.updatedAt).getTime();
    if (waitedMs > REVIEW_AFTER_MS) {
        return moveToReview(transaction, `Not confirmed after 6h: ${result.reason}`, 'Payment unconfirmed for 6h');
    }
    return Transaction.findOneAndUpdate(
        { _id: transaction._id, status: 'VERIFYING' },
        { $set: { paymentError: result.reason } },
        { new: true }
    );
}

let running = false;

/** Background job: re-check every VERIFYING order (guarded against overlapping runs). */
export const runVerificationJob = async () => {
    if (running) return;
    running = true;
    try {
        const pending = await Transaction.find({ status: 'VERIFYING' })
            .sort({ paidAt: 1 })
            .limit(BATCH_LIMIT)
            .select('_id');
        for (const { _id } of pending) {
            try {
                await processVerification(_id);
            } catch (e) {
                console.error(`[VerifyJob] Order ${_id} failed:`, e.message);
            }
        }
    } catch (e) {
        console.error('[VerifyJob] Error:', e.message);
    } finally {
        running = false;
    }
};

export const initPaymentVerificationJob = () => {
    setInterval(runVerificationJob, INTERVAL_MS).unref();
    console.log('[VerifyJob] USDT payment verification scheduled every 60s.');
};
