import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import { sendTicketCreatedEmailToAdmin, sendTicketRepliedEmailToUser, sendUserRepliedEmailToAdmin } from '../utils/emailService.js';
import { emitNotification } from '../utils/socket.js';

// ==========================================
// A. API DÀNH CHO USER
// ==========================================

// @desc    Create new ticket
// @route   POST /api/tickets
// @access  Private
export const createTicket = async (req, res) => {
    try {
        const { subject, message } = req.body;
        const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

        if (!subject || !message) {
            return res.status(400).json({ message: 'Subject and message are required' });
        }

        const ticket = await Ticket.create({
            userId: req.user._id,
            subject,
            message,
            images
        });

        // Background tasks
        sendTicketCreatedEmailToAdmin(ticket, req.user.email, req.user.fullName).catch(console.error);
        
        res.status(201).json({ message: 'Ticket created successfully', ticket });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user tickets
// @route   GET /api/tickets/user
// @access  Private
export const getUserTickets = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;

        const query = { userId: req.user._id };
        if (status && status !== 'ALL') {
            query.status = status;
        }

        const tickets = await Ticket.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Ticket.countDocuments(query);

        res.json({
            tickets,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get ticket by ID
// @route   GET /api/tickets/:id
// @access  Private
export const getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate('userId', 'email fullName username')
            .populate('resolvedBy', 'username');

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Only the ticket owner can view it from the user endpoint
        if (ticket.userId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to view this ticket' });
        }

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get ticket by ID for Admin
// @route   GET /api/tickets/admin/:id
// @access  Private (Admin)
export const getTicketByIdAdmin = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate('userId', 'email fullName username')
            .populate('resolvedBy', 'username');

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    User replies to an existing ticket
// @route   POST /api/tickets/:id/reply
// @access  Private
export const replyTicketUser = async (req, res) => {
    try {
        const { message } = req.body;
        const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (ticket.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to reply to this ticket' });
        }

        if (ticket.status === 'CLOSED') {
            return res.status(400).json({ message: 'Cannot reply to a closed ticket' });
        }

        ticket.replies.push({
            sender: 'USER',
            message,
            images,
            createdAt: new Date()
        });

        // Always keep in progress if admin had already replied, or pending if admin hasn't
        if (ticket.status !== 'PENDING') {
            ticket.status = 'IN_PROGRESS';
        }

        await ticket.save();

        // Background tasks (Notify Admin that user replied)
        sendUserRepliedEmailToAdmin(req.user.email, req.user.fullName, ticket.subject, message, ticket._id).catch(console.error);

        res.status(201).json({ message: 'Reply added successfully', ticket });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==========================================
// B. API DÀNH CHO ADMIN
// ==========================================

// @desc    Get all tickets with search and pagination
// @route   GET /api/admin/tickets
// @access  Private (Admin)
export const getAllTickets = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const { status, search } = req.query;

        const matchStage = {};
        if (status && status !== 'ALL') {
            matchStage.status = status;
        }

        const pipeline = [
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'userInfo'
                }
            },
            { $unwind: '$userInfo' }
        ];

        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { subject: { $regex: search, $options: 'i' } },
                        { message: { $regex: search, $options: 'i' } },
                        { 'userInfo.email': { $regex: search, $options: 'i' } },
                        { 'userInfo.username': { $regex: search, $options: 'i' } }
                    ]
                }
            });
        }

        if (Object.keys(matchStage).length > 0) {
            pipeline.push({ $match: matchStage });
        }

        const countPipeline = [...pipeline, { $count: 'total' }];
        const countResult = await Ticket.aggregate(countPipeline);
        const total = countResult[0]?.total || 0;

        pipeline.push(
            { $sort: { createdAt: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
            {
                $project: {
                    'userInfo.password': 0,
                    'userInfo.twoFactorSecret': 0,
                    'userInfo.privateKey': 0
                }
            }
        );

        const tickets = await Ticket.aggregate(pipeline);

        res.json({
            tickets,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reply to a ticket
// @route   PUT /api/admin/tickets/:id/reply
// @access  Private (Admin)
export const replyTicket = async (req, res) => {
    try {
        const { adminResponse } = req.body;
        const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
        
        if (!adminResponse) {
            return res.status(400).json({ message: 'Response message is required' });
        }

        const ticket = await Ticket.findById(req.params.id).populate('userId');

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        
        if (ticket.status === 'CLOSED') {
            return res.status(400).json({ message: 'Cannot reply to a closed ticket' });
        }

        // Push to replies array
        ticket.replies.push({
            sender: 'ADMIN',
            message: adminResponse,
            images,
            createdAt: new Date()
        });

        // Keep for backward compatibility / summary
        ticket.adminResponse = adminResponse;
        ticket.adminResponseAt = new Date();
        
        if (ticket.status === 'PENDING') {
            ticket.status = 'IN_PROGRESS';
        }

        await ticket.save();

        // Send email and socket notification
        sendTicketRepliedEmailToUser(ticket.userId.email, ticket.subject, adminResponse, ticket._id).catch(console.error);
        
        emitNotification(ticket.userId._id, {
            title: 'Ticket Replied',
            message: `Admin has replied to your ticket: ${ticket.subject}`,
            type: 'SYSTEM'
        });

        res.json({ message: 'Response sent successfully', ticket });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Resolve ticket
// @route   PUT /api/admin/tickets/:id/resolve
// @access  Private (Admin)
export const resolveTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findByIdAndUpdate(
            req.params.id,
            { 
                status: 'RESOLVED', 
                resolvedAt: new Date(), 
                resolvedBy: req.admin._id 
            },
            { new: true }
        );

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        res.json({ message: 'Ticket resolved successfully', ticket });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Close ticket
// @route   PUT /api/admin/tickets/:id/close
// @access  Private (Admin)
export const closeTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findByIdAndUpdate(
            req.params.id,
            { status: 'CLOSED' },
            { new: true }
        );

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        res.json({ message: 'Ticket closed successfully', ticket });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
