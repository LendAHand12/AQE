import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from server root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const createAdmin = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI is not defined in .env');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        const adminExists = await Admin.findOne({ username: 'admin' });
        if (adminExists) {
            console.log('Admin account already exists.');
            process.exit(0);
        }

        await Admin.create({
            username: 'ameritec@gmail.com',
            password: 'Pierre@1968@@!!',
            role: 'superadmin'
        });

        console.log('Admin account created successfully!');
        console.log('Username: ameritec@gmail.com');
        console.log('Password: Pierre@1968@@!!');
        
        process.exit(0);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

createAdmin();
