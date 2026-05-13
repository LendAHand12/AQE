import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load env vars immediately at the top
dotenv.config();

import morgan from 'morgan';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import explorerRoutes from './routes/explorerRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import withdrawalRoutes from './routes/withdrawalRoutes.js';
import kycRoutes from './routes/kycRoutes.js';
import { initCronJobs } from './services/cronService.js';
import { initPaymentListener } from './services/paymentListener.js';
import { createServer } from 'http';
import { initSocket } from './utils/socket.js';

// Connect to Database
connectDB();

const app = express();
const httpServer = createServer(app);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created uploads directory');
}

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: false,
}));
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Static files
app.use('/uploads', express.static(uploadDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/explorer', explorerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/kyc', kycRoutes);

// Root route
app.get('/', (req, res) => {
    res.json({ message: 'AQ Estate API is running...' });
});

// Initialize Socket.io
initSocket(httpServer);

// Initialize Cron Jobs
initCronJobs();

// Initialize Payment Listener (Uncomment when using RPC)
// initPaymentListener();

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
