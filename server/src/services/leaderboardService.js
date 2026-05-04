import User from '../models/User.js';
import Leaderboard from '../models/Leaderboard.js';
import { calculateUserSystemSales } from '../utils/sales.js';

/**
 * Updates the global leaderboard.
 * Calculates total sales for all potential uplines and saves the top 10.
 * Tracks rank changes from the previous update.
 */
export const updateLeaderboard = async () => {
    try {
        console.log('[Leaderboard] Starting update...');

        // 1. Get all users who have at least one referral
        // This optimizes the search by ignoring leaf nodes (users with no downlines)
        const potentialUplines = await User.find({ 
            isDeleted: false 
        }).select('_id username fullName');

        // 2. Calculate sales for each potential upline
        const leaderboardData = [];
        for (const user of potentialUplines) {
            const totalSales = await calculateUserSystemSales(user._id);
            if (totalSales > 0) {
                leaderboardData.push({
                    userId: user._id,
                    username: user.username,
                    fullName: user.fullName,
                    totalSales
                });
            }
        }

        // 3. Filter out root users and Sort by totalSales descending and take top 10
        const excludedNames = ["pierre nguyen", "sonya dang"];
        const filteredData = leaderboardData.filter(item => {
            const fullName = (item.fullName || "").toLowerCase().trim();
            const username = (item.username || "").toLowerCase().trim();
            return !excludedNames.includes(fullName) && !excludedNames.includes(username);
        });
        
        filteredData.sort((a, b) => b.totalSales - a.totalSales);
        const top10 = filteredData.slice(0, 10);

        // 4. Get current leaderboard to compare ranks
        const currentLeaderboard = await Leaderboard.find({}).sort({ rank: 1 });
        const currentRankMap = new Map();
        currentLeaderboard.forEach(item => {
            currentRankMap.set(item.userId.toString(), item.rank);
        });

        // 5. Clear old leaderboard (or we could update one by one, but clearing is safer for rank shifts)
        await Leaderboard.deleteMany({});

        // 6. Save new top 10 with rank tracking
        const savePromises = top10.map((item, index) => {
            const newRank = index + 1;
            const previousRank = currentRankMap.get(item.userId.toString()) || null;

            return Leaderboard.create({
                userId: item.userId,
                username: item.username,
                fullName: item.fullName,
                totalSales: item.totalSales,
                rank: newRank,
                previousRank: previousRank,
                lastUpdated: new Date()
            });
        });

        await Promise.all(savePromises);

        console.log('[Leaderboard] Update completed. Top 10 saved.');
    } catch (error) {
        console.error('[Leaderboard] Error updating leaderboard:', error);
    }
};
