import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Config from '../models/Config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const DEFAULT_CONFIGS = [
    {
        key: 'aqeToUsdtRate',
        label: 'AQE/USDT Exchange Rate (1 AQE = X USDT)',
        value: 1.02,
    },
];

const seedConfig = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI is not defined in .env');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        for (const item of DEFAULT_CONFIGS) {
            const existing = await Config.findOne({ key: item.key });
            if (existing) {
                console.log(`[SKIP] Config "${item.key}" already exists (value: ${existing.value})`);
            } else {
                await Config.create(item);
                console.log(`[CREATED] Config "${item.key}" = ${item.value}`);
            }
        }

        console.log('\n✅ Config seed completed!');
        process.exit(0);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedConfig();
