import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Commission from '../models/Commission.js';
import BalanceHistory from '../models/BalanceHistory.js';
import Notification from '../models/Notification.js';
import { TokenState } from '../models/Blockchain.js';
import { emitNotification } from '../utils/socket.js';
import { getSystemTime } from '../utils/time.js';
/**
 * Shared logic to process commissions
 */
export async function processCommissions(buyer, amountPaid, transaction) {
    if (!buyer.referredBy) return;

    let f1Percent = 8;
    let f2Percent = 2;

    if (transaction && transaction.metadata) {
        if (typeof transaction.metadata.f1CommissionPercent === 'number') {
            f1Percent = transaction.metadata.f1CommissionPercent;
        }
        if (typeof transaction.metadata.f2CommissionPercent === 'number') {
            f2Percent = transaction.metadata.f2CommissionPercent;
        }
    }

    const amountF1 = amountPaid * (f1Percent / 100);
    const amountF2 = amountPaid * (f2Percent / 100);

    // F1 - f1Percent%
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
            percentage: f1Percent,
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
            description: `Commission Level 1 (${f1Percent}%) from ${buyer.username}`
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

        // F2 - f2Percent%
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
                    percentage: f2Percent,
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
                    description: `Commission Level 2 (${f2Percent}%) from ${buyer.username}`
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

        const nowVN = getSystemTime();
        const may31VN = new Date('2026-05-31T23:59:59');
        const julyFirstVN = new Date('2026-07-01T00:00:00');

        let phase = 'PRE_REGISTER';
        if (nowVN >= julyFirstVN) {
            phase = 'LIVE';
        }

        // Pegged rate: 1 AQE = 1 USDT (not related to pool price yet)
        const price = 1.0;

        const isPostMay = nowVN > may31VN;
        const isLivePhase = nowVN >= julyFirstVN;
        
        // Use transaction amount as fallback if actualAmount is zero
        const processingAmount = actualAmount > 0 ? actualAmount : transaction.amount;
        const tokensCalculated = processingAmount / price;

        const isDirect = transaction.metadata?.isDirectPurchase === true;

        if (isDirect) {
            // Update Transaction (Lock)
            transaction.status = 'SUCCESS';
            transaction.hash = hash;
            transaction.amount = processingAmount;

            try {
                await transaction.save();
            } catch (saveError) {
                if (saveError.code === 11000) {
                    console.log(`[Finalize] Transaction ${paymentId} already processed (duplicate hash).`);
                    return;
                }
                throw saveError;
            }

            const isPackage = !!transaction.metadata?.packageId;
            let finalTokensCalculated = tokensCalculated;
            let finalBonusPercent = 0;

            if (isPackage) {
                finalTokensCalculated = transaction.metadata.aqeAmount || tokensCalculated;
                finalBonusPercent = transaction.metadata.bonusPercent || 0;
            } else {
                const juneStart = new Date('2026-06-01T00:00:00');
                const juneEnd = new Date('2026-06-30T23:59:59');
                const isJune = nowVN >= juneStart && nowVN <= juneEnd;
                if (isJune) {
                    finalBonusPercent = 5; // 5%
                }
            }

            const bonusTokens = finalTokensCalculated * (finalBonusPercent / 100);

            const balanceBefore = user.aqeBalance;
            user.aqeBalance += finalTokensCalculated;

            // Log purchase receipt
            await BalanceHistory.create({
                userId: user._id,
                amount: finalTokensCalculated,
                symbol: 'AQE',
                type: 'RECEIVE',
                status: 'SUCCESS',
                isOfficial: true,
                balanceBefore,
                balanceAfter: user.aqeBalance,
                description: isPackage 
                    ? `Purchased Investment Package: ${transaction.metadata.packageTitle} via Blockchain`
                    : `Purchased AQE digital units via Blockchain`
            });

            // Log bonus reward
            if (bonusTokens > 0) {
                const balanceBeforeBonus = user.aqeBalance;
                user.aqeBalance += bonusTokens;
                await BalanceHistory.create({
                    userId: user._id,
                    amount: bonusTokens,
                    symbol: 'AQE',
                    type: 'REWARD',
                    status: 'SUCCESS',
                    isOfficial: true,
                    balanceBefore: balanceBeforeBonus,
                    balanceAfter: user.aqeBalance,
                    description: isPackage
                        ? `Package Bonus: ${finalBonusPercent}% for ${transaction.metadata.packageTitle}`
                        : `June Promotion: 5% Bonus for purchasing AQE digital units`
                });
            }

            // Record purchased package on User
            if (isPackage) {
                user.purchasedPackages.push({
                    packageId: transaction.metadata.packageId,
                    title: transaction.metadata.packageTitle,
                    price: processingAmount,
                    aqeAmount: finalTokensCalculated,
                    bonusPercent: finalBonusPercent,
                    purchasedAt: new Date()
                });
            }

            await user.save();
            console.log(`[Finalize Direct] User ${user.username} updated. Balance: ${user.aqeBalance}`);

            // Process commissions
            await processCommissions(user, processingAmount, transaction);

            // Notify user
            const title = isPackage ? 'Investment Package Confirmed' : 'Token Purchase Successful';
            const message = isPackage
                ? `Your purchase of ${transaction.metadata.packageTitle} for ${processingAmount} USDT has been confirmed. You received ${finalTokensCalculated.toFixed(2)} AQE tokens${bonusTokens > 0 ? ` and a bonus of ${bonusTokens.toFixed(2)} AQE (${finalBonusPercent}%)` : ''}.`
                : `Your payment of ${processingAmount} USDT has been confirmed. You received ${tokensCalculated.toFixed(2)} AQE tokens${finalBonusPercent > 0 ? ` and a 5% bonus of ${bonusTokens.toFixed(2)} AQE` : ''}.`;

            await Notification.create({
                userId: user._id,
                title,
                message,
                type: 'PAYMENT'
            });

            return;
        }

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

        // Update Transaction (Use as lock)
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

        try {
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
                
                let bonusPercent = 0.10;

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

                // Convert all previous AQE balance history records to official
                await BalanceHistory.updateMany(
                    { userId: user._id, symbol: 'AQE', status: 'SUCCESS', isOfficial: false },
                    { isOfficial: true }
                );
            }

            if (isLivePhase) {
                user.aqeBalance += tokensCalculated;
            }

            await user.save();
            console.log(`[Finalize] User ${user.username} updated. Balance: ${user.aqeBalance}, Paid: ${user.paidUsdtPreRegister}`);

            // Process commissions
            await processCommissions(user, actualAmount, transaction);

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
        } catch (processError) {
            // ROLLBACK TRANSACTION LOCK IF SOMETHING FAILED
            console.error(`[Finalize] Critical Error! Rolling back transaction ${paymentId}. Error:`, processError);
            transaction.status = 'PENDING';
            transaction.hash = undefined;
            await transaction.save();
            throw processError; // Re-throw to be logged
        }
    } catch (error) {
        console.error('[Blockchain] Error finalizing payment:', error);
    }
};

/**
 * Process a manual deposit by Admin
 */
export const manualDepositFinalization = async (userId, pledgeAmount, paidAmount, hash, adminUsername) => {
    console.log('[Manual Deposit] Processing for user:', adminUsername);
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const nowVN = getSystemTime();
    const may31VN = new Date('2026-05-31T23:59:59');
    const julyFirstVN = new Date('2026-07-01T00:00:00');

    // Pegged rate: 1 AQE = 1 USDT (not related to pool price yet)
    const price = 1.0;

    const tokensCalculated = paidAmount / price;
    const isLivePhase = nowVN >= julyFirstVN;

    // 1. Update Pledge if changed or new round
    if (pledgeAmount > 0 && (!user.pledgeUsdt || user.pledgeUsdt <= 0 || user.isPledgeCompleted)) {
        if (user.isPledgeCompleted) {
            user.pledgeRounds.push({
                roundNumber: user.pledgeRounds.length + 1,
                pledgeUsdt: user.pledgeUsdt,
                paidUsdt: user.paidUsdtPreRegister,
                tokensReceived: user.preRegisterTokens,
                bonusPercent: 0,
                completedAt: new Date()
            });
            user.paidUsdtPreRegister = 0;
            user.preRegisterTokens = 0;
            user.isPledgeCompleted = false;
        }
        user.pledgeUsdt = pledgeAmount;
    }

    // 2. Create Transaction Record
    const transaction = await Transaction.create({
        hash,
        from: user._id,
        to: 'System',
        amount: paidAmount,
        symbol: 'USDT',
        type: 'PAYMENT',
        status: 'SUCCESS',
        description: `Manual Deposit by Admin (${adminUsername})`,
        metadata: {
            isManual: true,
            admin: adminUsername
        }
    });

    // 3. Log Balance History
    await BalanceHistory.create({
        userId: user._id,
        amount: tokensCalculated,
        symbol: 'AQE',
        type: 'RECEIVE',
        status: 'SUCCESS',
        isOfficial: isLivePhase ? true : false,
        balanceBefore: user.aqeBalance + user.preRegisterTokens,
        balanceAfter: user.aqeBalance + user.preRegisterTokens + tokensCalculated,
        description: `Manual Deposit Approved by ${adminUsername}`
    });

    // 4. Update User Profile
    user.paidUsdtPreRegister += paidAmount;
    user.preRegisterTokens += tokensCalculated;

    // 5. Handle Pledge Completion
    if (user.pledgeUsdt > 0 && user.paidUsdtPreRegister >= user.pledgeUsdt && !user.isPledgeCompleted) {
        user.isPledgeCompleted = true;
        
        let bonusPercent = 0.10;

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
                description: `Bonus ${bonusPercent * 100}% for completing pledge (Manual Deposit)`
            });
        }

        // Convert all previous AQE balance history records to official
        await BalanceHistory.updateMany(
            { userId: user._id, symbol: 'AQE', status: 'SUCCESS', isOfficial: false },
            { isOfficial: true }
        );
    }

    if (isLivePhase) {
        user.aqeBalance += tokensCalculated;
    }

    await user.save();

    // 6. Process Commissions
    await processCommissions(user, paidAmount, transaction);

    // 7. Notify User
    const title = 'Deposit Confirmed';
    await Notification.create({
        userId: user._id,
        title,
        message: `Your manual deposit of ${paidAmount} USDT has been confirmed by Admin. You received ${tokensCalculated.toFixed(2)} AQE tokens.`,
        type: 'PAYMENT'
    });

    emitNotification(user._id, {
        title: 'notifications.payment_approved_title',
        message: 'notifications.payment_approved_msg',
        messageParams: { amount: paidAmount, paymentId: 'Manual' },
        type: 'PAYMENT'
    });

    return { success: true, transactionId: transaction._id };
};

