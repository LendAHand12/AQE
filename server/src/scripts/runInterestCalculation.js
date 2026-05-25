import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { calculateDailyInterest } from '../services/interestService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from server root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const runInterestCalculation = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI is not defined in .env');
            process.exit(1);
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected.');

        console.log('Executing daily interest calculation...');
        await calculateDailyInterest();
        console.log('Interest calculation finished.');

        await mongoose.disconnect();
        console.log('MongoDB Disconnected.');
        process.exit(0);
    } catch (error) {
        console.error(`Error running interest calculation script: ${error.message}`);
        process.exit(1);
    }
};

runInterestCalculation();
