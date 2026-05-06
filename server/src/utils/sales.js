import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';

/**
 * Calculates total system sales for a given user.
 * Sums all successful USDT payments from all descendants in the referral tree.
 * @param {string|mongoose.Types.ObjectId} userId 
 * @returns {Promise<number>} Total sales amount in USDT
 */
export const calculateUserSystemSales = async (userId) => {
    try {
        const id = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;

        const results = await User.aggregate([
            { $match: { _id: id } },
            {
                $graphLookup: {
                    from: 'users',
                    startWith: '$_id',
                    connectFromField: '_id',
                    connectToField: 'referredBy',
                    as: 'descendants'
                }
            },
            {
                $lookup: {
                    from: 'transactions',
                    localField: 'descendants._id',
                    foreignField: 'from',
                    as: 'descendantTransactions'
                }
            },
            {
                $project: {
                    totalSales: {
                        $sum: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: '$descendantTransactions',
                                        as: 'tx',
                                        cond: { 
                                            $and: [
                                                { $eq: ['$$tx.type', 'PAYMENT'] },
                                                { $eq: ['$$tx.status', 'SUCCESS'] },
                                                { $eq: ['$$tx.symbol', 'USDT'] }
                                            ]
                                        }
                                    }
                                },
                                as: 'filteredTx',
                                in: '$$filteredTx.amount'
                            }
                        }
                    }
                }
            }
        ]);

        return results.length > 0 ? results[0].totalSales : 0;
    } catch (error) {
        console.error(`Error calculating sales for user ${userId}:`, error);
        return 0;
    }
};

/**
 * Calculates the total number of descendants in a user's referral network.
 * @param {string|mongoose.Types.ObjectId} userId 
 * @returns {Promise<number>} Total network size
 */
export const calculateUserNetworkSize = async (userId) => {
    try {
        const id = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;

        const results = await User.aggregate([
            { $match: { _id: id } },
            {
                $graphLookup: {
                    from: 'users',
                    startWith: '$_id',
                    connectFromField: '_id',
                    connectToField: 'referredBy',
                    as: 'descendants'
                }
            },
            {
                $project: {
                    totalNetwork: { $size: '$descendants' }
                }
            }
        ]);

        return results.length > 0 ? results[0].totalNetwork : 0;
    } catch (error) {
        console.error(`Error calculating network size for user ${userId}:`, error);
        return 0;
    }
};
