import crypto from 'crypto';
import SwapRequest from '../models/SwapRequest.js';
import AdminLog from '../models/AdminLog.js';
import { sendSwapApprovedEmail } from '../utils/emailService.js';
import { getSystemConfig } from '../utils/configHelper.js';

// @desc    Proxy JSON-RPC calls to the AMC20 node (public)
// @route   POST /api/swap/rpc-proxy
// The AMC20 RPC node doesn't send CORS headers, so the browser can't call it
// directly. This forwards the request server-side, where CORS doesn't apply.
export const proxyAmc20Rpc = async (req, res) => {
    try {
        const rpcUrl = process.env.AMC20_RPC_URL;
        if (!rpcUrl) {
            return res.status(500).json({ error: { message: 'AMC20 RPC is not configured' } });
        }

        const rpcResponse = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });

        const data = await rpcResponse.json();
        res.status(rpcResponse.status).json(data);
    } catch (error) {
        res.status(502).json({ error: { message: 'Failed to reach AMC20 RPC node' } });
    }
};

// @desc    Create a swap request (public)
// @route   POST /api/swap
export const createSwapRequest = async (req, res) => {
    try {
        const { fullName, phone, countryCode, email, idCode, outputToken, amount, fromWalletAddress, txHash } = req.body;

        if (!fullName || !phone || !email || !idCode || !outputToken || !amount || !txHash) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        if (!['QHEWE', 'AQE'].includes(outputToken)) {
            return res.status(400).json({ message: 'Invalid output token' });
        }

        const existing = await SwapRequest.findOne({ txHash });
        if (existing) {
            return res.status(400).json({ message: 'This transaction has already been submitted' });
        }

        // Lock in the exchange rate at the moment the request is created, so a
        // later admin-side config change doesn't retroactively change what this
        // user is entitled to receive.
        const systemConfig = await getSystemConfig();
        const rateAtRequest = outputToken === 'QHEWE'
            ? systemConfig.heweToQhewRate
            : systemConfig.heweToAqeRate;

        const swapRequest = await SwapRequest.create({
            fullName,
            phone,
            countryCode: countryCode || '+84',
            email,
            idCode,
            outputToken,
            amount,
            rateAtRequest,
            fromWalletAddress,
            txHash,
            status: 'PENDING'
        });

        res.status(201).json(swapRequest);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get swap request context by wallet-submit token (public)
// @route   GET /api/swap/wallet/:token
export const getSwapWalletInfo = async (req, res) => {
    try {
        const swapRequest = await SwapRequest.findOne({
            walletSubmitToken: req.params.token,
            status: 'AWAITING_WALLET'
        }).select('fullName outputToken amount status');

        if (!swapRequest) {
            return res.status(404).json({ message: 'This link is invalid or has already been used' });
        }

        res.json({
            fullName: swapRequest.fullName,
            outputToken: swapRequest.outputToken,
            amount: swapRequest.amount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Submit quantum wallet address (public)
// @route   POST /api/swap/wallet/:token
export const submitSwapWallet = async (req, res) => {
    try {
        const { quantumWalletAddress } = req.body;
        if (!quantumWalletAddress) {
            return res.status(400).json({ message: 'Wallet address is required' });
        }

        const swapRequest = await SwapRequest.findOne({
            walletSubmitToken: req.params.token,
            status: 'AWAITING_WALLET'
        });

        if (!swapRequest) {
            return res.status(404).json({ message: 'This link is invalid or has already been used' });
        }

        swapRequest.quantumWalletAddress = quantumWalletAddress;
        swapRequest.walletSubmittedAt = new Date();
        swapRequest.status = 'AWAITING_TRANSFER';
        swapRequest.walletSubmitToken = null;
        await swapRequest.save();

        res.json({ message: 'Wallet address submitted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all swap requests (Admin)
// @route   GET /api/swap/admin/all
export const getAllSwapRequests = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const status = req.query.status;
        const search = req.query.search;

        let query = {};
        if (status) query.status = status;

        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { idCode: { $regex: search, $options: 'i' } },
                { txHash: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await SwapRequest.countDocuments(query);
        const swapRequests = await SwapRequest.find(query)
            .populate('processedBy', 'username')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            swapRequests,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get a single swap request by id (Admin)
// @route   GET /api/swap/admin/:id
export const getSwapRequestById = async (req, res) => {
    try {
        const swapRequest = await SwapRequest.findById(req.params.id)
            .populate('processedBy', 'username');

        if (!swapRequest) {
            return res.status(404).json({ message: 'Swap request not found' });
        }

        res.json(swapRequest);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve a swap request (Admin)
// @route   PUT /api/swap/admin/:id/approve
export const approveSwapRequest = async (req, res) => {
    try {
        const swapRequest = await SwapRequest.findById(req.params.id);
        if (!swapRequest) {
            return res.status(404).json({ message: 'Swap request not found' });
        }
        if (swapRequest.status !== 'PENDING') {
            return res.status(400).json({ message: 'Only pending requests can be approved' });
        }

        const walletSubmitToken = crypto.randomBytes(32).toString('hex');
        swapRequest.status = 'AWAITING_WALLET';
        swapRequest.walletSubmitToken = walletSubmitToken;
        swapRequest.processedBy = req.admin._id;
        swapRequest.processedAt = new Date();
        await swapRequest.save();

        try {
            await sendSwapApprovedEmail(
                swapRequest.email,
                swapRequest.fullName,
                walletSubmitToken,
                swapRequest.outputToken,
                swapRequest.amount
            );
        } catch (emailError) {
            console.error('Failed to send swap approval email:', emailError);
        }

        await AdminLog.create({
            adminId: req.admin._id,
            adminUsername: req.admin.username,
            action: 'SWAP_APPROVE',
            target: swapRequest.email,
            details: { swapRequestId: swapRequest._id },
            ipAddress: req.ip
        });

        res.json(swapRequest);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reject a swap request (Admin)
// @route   PUT /api/swap/admin/:id/reject
export const rejectSwapRequest = async (req, res) => {
    try {
        const swapRequest = await SwapRequest.findById(req.params.id);
        if (!swapRequest) {
            return res.status(404).json({ message: 'Swap request not found' });
        }
        if (swapRequest.status !== 'PENDING') {
            return res.status(400).json({ message: 'Only pending requests can be rejected' });
        }

        swapRequest.status = 'REJECTED';
        swapRequest.adminNote = req.body?.reason || 'Rejected by Admin';
        swapRequest.processedBy = req.admin._id;
        swapRequest.processedAt = new Date();
        await swapRequest.save();

        await AdminLog.create({
            adminId: req.admin._id,
            adminUsername: req.admin.username,
            action: 'SWAP_REJECT',
            target: swapRequest.email,
            details: { swapRequestId: swapRequest._id, reason: swapRequest.adminNote },
            ipAddress: req.ip
        });

        res.json(swapRequest);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Complete a swap request after manual off-platform transfer (Admin)
// @route   PUT /api/swap/admin/:id/complete
export const completeSwapRequest = async (req, res) => {
    try {
        const swapRequest = await SwapRequest.findById(req.params.id);
        if (!swapRequest) {
            return res.status(404).json({ message: 'Swap request not found' });
        }
        if (swapRequest.status !== 'AWAITING_TRANSFER') {
            return res.status(400).json({ message: 'Only requests awaiting transfer can be completed' });
        }

        const { sentAmount, completionTxHash, adminNote } = req.body;
        if (!sentAmount) {
            return res.status(400).json({ message: 'Sent amount is required' });
        }

        swapRequest.status = 'COMPLETED';
        swapRequest.sentAmount = sentAmount;
        if (completionTxHash) swapRequest.completionTxHash = completionTxHash;
        if (adminNote) swapRequest.adminNote = adminNote;
        swapRequest.processedBy = req.admin._id;
        swapRequest.processedAt = new Date();
        await swapRequest.save();

        await AdminLog.create({
            adminId: req.admin._id,
            adminUsername: req.admin.username,
            action: 'SWAP_COMPLETE',
            target: swapRequest.email,
            details: { swapRequestId: swapRequest._id, sentAmount, completionTxHash },
            ipAddress: req.ip
        });

        res.json(swapRequest);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
