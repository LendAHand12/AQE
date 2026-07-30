import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Config from '../models/Config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const cleanup = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');
        const result = await Config.deleteMany({
            key: { $in: ['withdrawalFee', 'minWithdrawal', 'minTotalPaidForWithdrawal'] }
        });
        console.log(`Deleted ${result.deletedCount} config document(s)`);
        const remaining = await Config.find({});
        console.log('Remaining configs:', remaining.map(c => `${c.key} = ${c.value}`));
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

cleanup();
