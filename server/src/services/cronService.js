import cron from 'node-cron';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';
import { emitNotification } from '../utils/socket.js';
import crypto from 'crypto';

const generateHash = (input) => {
    return crypto.createHash('sha256').update(input + Date.now()).digest('hex');
};

/**
 * Initialize all cron jobs
 */
export const initCronJobs = () => {
    // Run at 00:00 on the 1st day of June and July only
    // Pattern: 0 0 1 6,7 * (June=6, July=7)
    cron.schedule('0 0 1 6,7 *', async () => {
        console.log('[CRON] Starting Monthly Token Release Checkpoint...');
        
        try {
            // 1. Find all users with pending pre-register tokens
            const usersToRelease = await User.find({ preRegisterTokens: { $gt: 0 } });
            
            if (usersToRelease.length === 0) {
                console.log('[CRON] No users found for token release.');
                return;
            }

            console.log(`[CRON] Releasing tokens for ${usersToRelease.length} users...`);

            for (const user of usersToRelease) {
                const releasedAmount = user.preRegisterTokens;
                const oldAqeBalance = user.aqeBalance;

                // Update User Balance
                user.aqeBalance += releasedAmount;
                user.preRegisterTokens = 0;
                // If they completed their pledge during this interval, reset their status for next cycle
                // or just keep it. Usually pre-register logic is per-campaign.
                // For simplicity, we just clear the accumulated tokens.
                
                await user.save();

                // Mark all previous unreleased transactions for this user as released (Principal clean-up)
                await Transaction.updateMany(
                    { 
                        $or: [{ from: user._id }, { to: user._id }], 
                        isReleased: false, 
                        status: 'SUCCESS' 
                    },
                    { isReleased: true }
                );

                // Create Notification
                const notif = await Notification.create({
                    userId: user._id,
                    title: 'Monthly Token Release',
                    message: `Your ${releasedAmount.toLocaleString()} AQE tokens from last month have been officially released to your wallet.`,
                    type: 'PAYMENT',
                    isRead: false
                });

                // Emit socket event if possible
                try {
                    emitNotification(user._id, notif);
                } catch (e) {
                    // socket not available or user offline
                }
            }

            console.log('[CRON] Monthly Token Release completed successfully.');
        } catch (error) {
            console.error('[CRON] Error during Monthly Token Release:', error);
        }
    });

    console.log('[CRON] Automatic Release Jobs Scheduled.');
};
