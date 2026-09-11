import PlinkoSettings from '../models/PlinkoSettings.js';

// Adds a percentage of a USDT deposit into the Plinko jackpot pool (atomic increment)
export const contributeToJackpot = async (usdtAmount) => {
    if (!usdtAmount || usdtAmount <= 0) return;

    let settings = await PlinkoSettings.findOne();
    if (!settings) {
        settings = await PlinkoSettings.create({});
    }

    const rate = settings.jackpotContributionRate !== undefined ? settings.jackpotContributionRate : 0.001;
    const contribution = usdtAmount * rate;

    if (contribution > 0) {
        await PlinkoSettings.updateOne({ _id: settings._id }, { $inc: { currentJackpot: contribution } });
    }
};
