import exceljs from 'exceljs';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Withdrawal from '../models/Withdrawal.js';
import dayjs from 'dayjs';

/**
 * Helper to create and configure a workbook
 */
const createWorkbook = () => {
    const workbook = new exceljs.Workbook();
    workbook.creator = 'AQ Estate Admin';
    workbook.created = new Date();
    return workbook;
};

/**
 * @desc    Export Users to Excel
 * @route   GET /api/admin/export/users
 * @access  Private/Admin
 */
export const exportUsers = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = {};

        if (startDate && endDate) {
            query.createdAt = {
                $gte: dayjs(startDate).startOf('day').toDate(),
                $lte: dayjs(endDate).endOf('day').toDate()
            };
        }

        const users = await User.find(query).sort({ createdAt: -1 });

        const workbook = createWorkbook();
        const sheet = workbook.addWorksheet('Users');

        sheet.columns = [
            { header: 'ID', key: '_id', width: 25 },
            { header: 'Full Name', key: 'fullName', width: 20 },
            { header: 'Username', key: 'username', width: 20 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Phone', key: 'phone', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'KYC Status', key: 'kycStatus', width: 15 },
            { header: 'USDT Balance', key: 'usdtBalance', width: 15 },
            { header: 'Total AQE', key: 'totalAqe', width: 15 },
            { header: 'Joined At', key: 'createdAt', width: 20 }
        ];

        // Add Header Style
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF276152' } };
        sheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

        users.forEach(user => {
            sheet.addRow({
                _id: user._id.toString(),
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                phone: user.phone || 'N/A',
                status: user.status,
                kycStatus: user.kycStatus,
                usdtBalance: user.usdtBalance,
                totalAqe: (user.officialAqeBalance || 0) + (user.temporaryAqeBalance || 0),
                createdAt: dayjs(user.createdAt).format('DD/MM/YYYY HH:mm:ss')
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=' + `users_export_${dayjs().format('YYYYMMDD')}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Export Users Error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Export Transactions to Excel
 * @route   GET /api/admin/export/transactions
 * @access  Private/Admin
 */
export const exportTransactions = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = { status: 'SUCCESS' };

        if (startDate && endDate) {
            query.createdAt = {
                $gte: dayjs(startDate).startOf('day').toDate(),
                $lte: dayjs(endDate).endOf('day').toDate()
            };
        }

        const transactions = await Transaction.find(query)
            .populate('from', 'username email')
            .populate('to', 'username email')
            .sort({ createdAt: -1 });

        const workbook = createWorkbook();
        const sheet = workbook.addWorksheet('Transactions');

        sheet.columns = [
            { header: 'ID', key: '_id', width: 25 },
            { header: 'Date', key: 'createdAt', width: 20 },
            { header: 'Username', key: 'username', width: 20 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Type', key: 'type', width: 15 },
            { header: 'Method', key: 'method', width: 20 },
            { header: 'Amount', key: 'amount', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Hash/TxId', key: 'hash', width: 40 }
        ];

        // Add Header Style
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF276152' } };
        sheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

        transactions.forEach(tx => {
            const userObj = (tx.type === 'BUY' || tx.type === 'REWARD') ? tx.to : tx.from;
            const username = userObj && typeof userObj === 'object' ? userObj.username : 'N/A';
            const email = userObj && typeof userObj === 'object' ? userObj.email : 'N/A';

            let method = 'Wallet Transfer';
            if (tx.metadata?.method === 'QR') {
                method = 'QR Code';
            } else if (tx.metadata?.method === 'ZELLE') {
                method = 'Zelle';
            }

            sheet.addRow({
                _id: tx._id.toString(),
                createdAt: dayjs(tx.createdAt).format('DD/MM/YYYY HH:mm:ss'),
                username,
                email,
                type: tx.type,
                method,
                amount: tx.amount,
                status: tx.status,
                hash: tx.hash || tx.paymentId || 'N/A'
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=' + `transactions_export_${dayjs().format('YYYYMMDD')}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Export Transactions Error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Export Withdrawals to Excel
 * @route   GET /api/admin/export/withdrawals
 * @access  Private/Admin
 */
export const exportWithdrawals = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = {};

        if (startDate && endDate) {
            query.createdAt = {
                $gte: dayjs(startDate).startOf('day').toDate(),
                $lte: dayjs(endDate).endOf('day').toDate()
            };
        }

        const withdrawals = await Withdrawal.find(query).populate('userId', 'username email').sort({ createdAt: -1 });

        const workbook = createWorkbook();
        const sheet = workbook.addWorksheet('Withdrawals');

        sheet.columns = [
            { header: 'ID', key: '_id', width: 25 },
            { header: 'Date', key: 'createdAt', width: 20 },
            { header: 'Username', key: 'username', width: 20 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Method', key: 'paymentMethod', width: 15 },
            { header: 'Wallet Address', key: 'walletAddress', width: 40 },
            { header: 'Zelle Name', key: 'zelleName', width: 25 },
            { header: 'Zelle Info', key: 'zelleInfo', width: 25 },
            { header: 'Amount', key: 'amount', width: 15 },
            { header: 'Fee', key: 'fee', width: 10 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Hash', key: 'hash', width: 40 }
        ];

        // Add Header Style
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF276152' } };
        sheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

        withdrawals.forEach(w => {
            sheet.addRow({
                _id: w._id.toString(),
                createdAt: dayjs(w.createdAt).format('DD/MM/YYYY HH:mm:ss'),
                username: w.userId ? w.userId.username : 'N/A',
                email: w.userId ? w.userId.email : 'N/A',
                paymentMethod: w.paymentMethod,
                walletAddress: w.walletAddress || 'N/A',
                zelleName: w.zelleName || 'N/A',
                zelleInfo: w.zelleInfo || 'N/A',
                amount: w.amount,
                fee: w.fee,
                status: w.status,
                hash: w.hash || 'N/A'
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=' + `withdrawals_export_${dayjs().format('YYYYMMDD')}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Export Withdrawals Error:', error);
        res.status(500).json({ message: error.message });
    }
};
