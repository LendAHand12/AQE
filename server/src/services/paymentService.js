import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Commission from '../models/Commission.js';
import BalanceHistory from '../models/BalanceHistory.js';
import Notification from '../models/Notification.js';
import { TokenState } from '../models/Blockchain.js';
import { emitNotification } from '../utils/socket.js';

// Helper: Get current time in Vietnam (GMT+7)
const getVietnamTime = () => {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
};

/**
 * Shared logic to process commissions
 */
async function processCommissions(buyer, amountPaid) {
    if (!buyer.referredBy) return;

    const amountF1 = amountPaid * 0.08;
    const amountF2 = amountPaid * 0.02;

    // F1 - 8%
    const f1 = await User.findById(buyer.referredBy);
    if (f1) {
        const balanceBeforeF1 = f1.usdtBalance || 0;
        f1.usdtBalance = (f1.usdtBalance || 0) + amountF1;
        await f1.save();
        
        await Commission.create({
            recipientId: f1._id,
            fromUserId: buyer._id,
            amountUsdt: amountF1,
            level: 1,
            percentage: 8,
            salesAmount: amountPaid
        });

        await BalanceHistory.create({
            userId: f1._id,
            amount: amountF1,
            symbol: 'USDT',
            type: 'COMMISSION',
            status: 'SUCCESS',
            isOfficial: true,
            balanceBefore: balanceBeforeF1,
            balanceAfter: f1.usdtBalance,
            description: `Commission Level 1 from ${buyer.username}`
        });

        // Notify F1
        await Notification.create({
            userId: f1._id,
            title: 'Commission Received',
            message: `You received ${amountF1} USDT commission (Level 1) from ${buyer.username}'s payment.`,
            type: 'COMMISSION'
        });
        emitNotification(f1._id, {
            title: 'Commission Received',
            message: `+${amountF1} USDT (Level 1) from ${buyer.username}`,
            type: 'COMMISSION'
        });

        // F2 - 2%
        if (f1.referredBy) {
            const f2 = await User.findById(f1.referredBy);
            if (f2) {
                const balanceBeforeF2 = f2.usdtBalance || 0;
                f2.usdtBalance = (f2.usdtBalance || 0) + amountF2;
                await f2.save();
                
                await Commission.create({
                    recipientId: f2._id,
                    fromUserId: buyer._id,
                    amountUsdt: amountF2,
                    level: 2,
                    percentage: 2,
                    salesAmount: amountPaid
                });

                await BalanceHistory.create({
                    userId: f2._id,
                    amount: amountF2,
                    symbol: 'USDT',
                    type: 'COMMISSION',
                    status: 'SUCCESS',
                    isOfficial: true,
                    balanceBefore: balanceBeforeF2,
                    balanceAfter: f2.usdtBalance,
                    description: `Commission Level 2 from ${buyer.username}`
                });

                // Notify F2
                await Notification.create({
                    userId: f2._id,
                    title: 'Commission Received',
                    message: `You received ${amountF2} USDT commission (Level 2) from ${buyer.username}'s payment.`,
                    type: 'COMMISSION'
                });
                emitNotification(f2._id, {
                    title: 'Commission Received',
                    message: `+${amountF2} USDT (Level 2) from ${buyer.username}`,
                    type: 'COMMISSION'
                });
            }
        }
    }
}

/**
 * Process a successful payment from blockchain
 */
export const finalizeBlockchainPayment = async (paymentId, hash, actualAmount) => {
    try {
        console.log(`[Finalize] Processing PaymentID: ${paymentId}, Hash: ${hash}, Amount: ${actualAmount}`);
        const transaction = await Transaction.findOne({ paymentId, status: 'PENDING' });
        if (!transaction) {
            console.error(`[Finalize] PENDING Transaction not found for paymentId: ${paymentId}`);
            // Check if it's already success
            const existing = await Transaction.findOne({ paymentId, status: 'SUCCESS' });
            if (existing) {
                console.log(`[Finalize] Transaction ${paymentId} already processed as SUCCESS.`);
            }
            return;
        }

        const user = await User.findById(transaction.from);
        if (!user) {
            console.error(`[Blockchain] User not found for transaction: ${transaction._id}`);
            return;
        }

        const nowVN = getVietnamTime();
        const may31VN = new Date('2026-05-31T23:59:59+07:00');
        const julyFirstVN = new Date('2026-07-01T00:00:00+07:00');

        let phase = 'PRE_REGISTER';
        let price = 1.0;

        if (nowVN >= julyFirstVN) {
            phase = 'LIVE';
            const stats = await TokenState.findOne({ symbol: 'AQE' });
            price = stats ? stats.currentPrice : 1.0;
        }

        const isPostMay = nowVN > may31VN;
        const isLivePhase = nowVN >= julyFirstVN;
        
        // Use transaction amount as fallback if actualAmount is zero
        const processingAmount = actualAmount > 0 ? actualAmount : transaction.amount;
        const tokensCalculated = processingAmount / price;

        // Update User Pledge if it was a new pledge
        if (transaction.metadata?.pledgeAmount && (!user.pledgeUsdt || user.pledgeUsdt <= 0 || user.isPledgeCompleted)) {
            // If the user previously completed a pledge, this is a new round
            if (user.isPledgeCompleted) {
                user.pledgeRounds.push({
                    roundNumber: user.pledgeRounds.length + 1,
                    pledgeUsdt: user.pledgeUsdt,
                    paidUsdt: user.paidUsdtPreRegister,
                    tokensReceived: user.preRegisterTokens,
                    bonusPercent: 0, // Simplified or calculate based on date
                    completedAt: new Date()
                });
                user.paidUsdtPreRegister = 0;
                user.preRegisterTokens = 0;
                user.isPledgeCompleted = false;
            }
            user.pledgeUsdt = transaction.metadata.pledgeAmount;
        }

        // Update Transaction
        transaction.status = 'SUCCESS';
        transaction.hash = hash;
        transaction.amount = processingAmount; 
        
        try {
            await transaction.save();
        } catch (saveError) {
            // E11000 duplicate key error on hash means another process already saved it
            if (saveError.code === 11000) {
                console.log(`[Finalize] Transaction ${paymentId} already processed (duplicate hash).`);
                return;
            }
            throw saveError;
        }

        // Log token receipt
        await BalanceHistory.create({
            userId: user._id,
            amount: tokensCalculated,
            symbol: 'AQE',
            type: 'RECEIVE',
            status: 'SUCCESS',
            isOfficial: isLivePhase ? true : user.isPledgeCompleted ? true : false,
            balanceBefore: user.aqeBalance + user.preRegisterTokens,
            balanceAfter: user.aqeBalance + user.preRegisterTokens + tokensCalculated,
            description: `Purchased AQE via Blockchain in ${isLivePhase ? 'Live' : (isPostMay ? 'June' : 'May')} phase`
        });

        // Update User
        user.paidUsdtPreRegister += processingAmount;
        user.preRegisterTokens += tokensCalculated;

        // Auto-complete pledge if reached
        if (user.pledgeUsdt > 0 && user.paidUsdtPreRegister >= user.pledgeUsdt && !user.isPledgeCompleted) {
            user.isPledgeCompleted = true;
            
            let bonusPercent = 0;
            if (nowVN <= may31VN) {
                bonusPercent = 0.10;
            } else if (nowVN < julyFirstVN) {
                bonusPercent = 0.05;
            }

            const bonusTokens = user.preRegisterTokens * bonusPercent;
            const totalTokens = user.preRegisterTokens + bonusTokens;
            
            user.aqeBalance += totalTokens;
            user.preRegisterTokens = 0;
            user.hasReceivedPromotion = true;

            if (bonusTokens > 0) {
                 await BalanceHistory.create({
                    userId: user._id,
                    amount: bonusTokens,
                    symbol: 'AQE',
                    type: 'REWARD',
                    status: 'SUCCESS',
                    isOfficial: true,
                    balanceBefore: user.aqeBalance - bonusTokens,
                    balanceAfter: user.aqeBalance,
                    description: `Bonus ${bonusPercent * 100}% for completing pledge`
                });
            }
        }

        if (isLivePhase) {
            user.aqeBalance += tokensCalculated;
        }

        await user.save();
        console.log(`[Finalize] User ${user.username} updated. Balance: ${user.aqeBalance}, Paid: ${user.paidUsdtPreRegister}`);

        // Process commissions
        await processCommissions(user, actualAmount);

        // Notify user
        const title = isLivePhase ? 'Token Purchase Successful' : 'Pre-registration Payment Received';
        await Notification.create({
            userId: user._id,
            title,
            message: `Your payment of ${processingAmount} USDT has been confirmed. You received ${tokensCalculated.toFixed(2)} AQE tokens.`,
            type: 'PAYMENT'
        });

        emitNotification(user._id, {
            title,
            message: `Confirmed ${processingAmount} USDT. Received ${tokensCalculated.toFixed(2)} AQE.`,
            type: 'PAYMENT',
            paymentId: paymentId // Thêm paymentId để frontend nhận diện
        });

        console.log(`[Blockchain] Payment finalized for user ${user.username}, amount: ${actualAmount}`);
    } catch (error) {
        console.error('[Blockchain] Error finalizing payment:', error);
    }
};
