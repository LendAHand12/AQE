import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from server root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const createUser = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI is not defined in .env');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        const email = 'anhkiet@gmail.com';
        const password = 'Anhkiet1010!';
        const username = 'anhkiet';

        const userExists = await User.findOne({ 
            $or: [
                { email },
                { username }
            ]
        });

        if (userExists) {
            console.log('User already exists. Updating existing user...');
            userExists.password = password;
            userExists.isActive = true;
            userExists.kycStatus = 'verified';
            await userExists.save();
            console.log('User updated successfully!');
        } else {
            await User.create({
                fullName: 'Anh Kiet Root',
                username: username,
                email: email,
                phone: '0987654321',
                password: password,
                isActive: true,
                kycStatus: 'verified'
            });
            console.log('Root User created successfully!');
        }

        console.log('Email: ' + email);
        console.log('Password: ' + password);
        console.log('Status: Active & Verified');

        process.exit(0);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

createUser();
