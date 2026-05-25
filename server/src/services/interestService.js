import cron from 'node-cron';
import User from '../models/User.js';
import BalanceHistory from '../models/BalanceHistory.js';
import Transaction from '../models/Transaction.js';

export const calculateDailyInterest = async () => {
    const nowVN = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const startDate = new Date('2026-06-01T00:00:00+07:00');
    
    // Only start calculating on or after June 1, 2026
    if (nowVN < startDate) {
        console.log('[INTEREST CRON] Current date is before June 1, 2026. Skipping interest calculation.');
        return;
    }

    console.log('[INTEREST CRON] Starting Daily Interest Calculation...');
    
    try {
        const users = await User.find({ 
            $or: [
                { aqeBalance: { $gt: 0 } },
                { preRegisterTokens: { $gt: 0 } }
            ]
        });

        for (const user of users) {
            // Find first payment date if not set
            if (!user.firstPaymentDate) {
                if (user.pledgeRounds && user.pledgeRounds.length > 0) {
                    user.firstPaymentDate = user.pledgeRounds[0].completedAt;
                } else {
                    const firstTx = await Transaction.findOne({ from: user._id, status: 'SUCCESS' }).sort({ createdAt: 1 });
                    if (firstTx) {
                        user.firstPaymentDate = firstTx.createdAt;
                    } else {
                        user.firstPaymentDate = nowVN; // fallback
                    }
                }
            }

            // Calculate days since first payment
            const daysSinceFirstPayment = (nowVN - user.firstPaymentDate) / (1000 * 60 * 60 * 24);
            
            // Only give interest for 365 days
            if (daysSinceFirstPayment >= 0 && daysSinceFirstPayment <= 365) {
                const totalAqe = (user.aqeBalance || 0) + (user.preRegisterTokens || 0);
                if (totalAqe > 0) {
                    const totalInterest = totalAqe * 0.06; // x
                    const dailyInterest = totalInterest / 365; // y

                    const balanceBefore = user.provisionalAqeInterest || 0;
                    user.provisionalAqeInterest = balanceBefore + dailyInterest;
                    
                    await BalanceHistory.create({
                        userId: user._id,
                        amount: dailyInterest,
                        symbol: 'AQE',
                        type: 'INTEREST',
                        status: 'SUCCESS',
                        isOfficial: false,
                        balanceBefore: balanceBefore,
                        balanceAfter: user.provisionalAqeInterest,
                        description: `Daily Interest 6% APR on ${totalAqe.toFixed(2)} AQE`
                    });
                }
            }

            // Move provisional to claimable if today is the 1st of the month
            if (nowVN.getDate() === 1) {
                if (user.provisionalAqeInterest > 0) {
                    user.claimableAqeInterest = (user.claimableAqeInterest || 0) + user.provisionalAqeInterest;
                    user.provisionalAqeInterest = 0;
                }
            }

            await user.save();
        }
        
        console.log('[INTEREST CRON] Daily Interest Calculation completed.');
    } catch (error) {
        console.error('[INTEREST CRON] Error:', error);
    }
};
