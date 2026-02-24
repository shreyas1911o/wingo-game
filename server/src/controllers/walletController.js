const Transaction = require('../models/Transaction');
const User = require('../models/User');

exports.deposit = async (req, res) => {
    const { amount, paymentMethod, transactionId } = req.body;
    const userId = req.user._id;

    try {
        // In a real app, verify payment gateway callback here
        // For demo, we auto-approve or set to pending

        const transaction = await Transaction.create({
            userId,
            type: 'deposit',
            amount,
            paymentMethod,
            transactionId,
            status: 'success', // Auto-approve for demo
            description: `Deposit via ${paymentMethod}`,
        });

        if (transaction.status === 'success') {
            await User.findByIdAndUpdate(userId, { $inc: { walletBalance: amount } });
        }

        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.withdraw = async (req, res) => {
    const { amount, paymentMethod, accountDetails } = req.body;
    const userId = req.user._id;

    try {
        const user = await User.findById(userId);

        if (user.walletBalance < amount) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        const transaction = await Transaction.create({
            userId,
            type: 'withdraw',
            amount,
            paymentMethod,
            status: 'pending', // Requires admin approval
            description: `Withdraw to ${paymentMethod} - ${JSON.stringify(accountDetails)}`,
        });

        // Deduct balance immediately or hold it? 
        // Usually deduct and refund if rejected.
        await User.findByIdAndUpdate(userId, { $inc: { walletBalance: -amount } });

        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getBalance = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('walletBalance vipLevel mobile isAdmin');
        res.json({ walletBalance: user.walletBalance, vipLevel: user.vipLevel, mobile: user.mobile, isAdmin: user.isAdmin });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
