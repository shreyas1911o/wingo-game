const Bet = require('../models/Bet');
const GameRound = require('../models/GameRound');
const User = require('../models/User');

exports.placeBet = async (req, res) => {
    const { gameType, selection, amount } = req.body;
    const userId = req.user._id;

    try {
        const user = await User.findById(userId);
        if (user.walletBalance < amount) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        // Find active round for gameType
        const currentRound = await GameRound.findOne({ gameType, status: 'active' }).sort({ createdAt: -1 });

        if (!currentRound) {
            return res.status(400).json({ message: 'No active round' });
        }

        // Lock time check (e.g., last 5 seconds cannot bet)
        const timeRemaining = (new Date(currentRound.endTime) - new Date()) / 1000;
        if (timeRemaining < 5) {
            return res.status(400).json({ message: 'Round is locked' });
        }

        const tax = amount * 0.02; // 2% fee
        const afterTaxAmount = amount - tax;

        const bet = await Bet.create({
            userId,
            roundId: currentRound._id,
            gameType,
            periodId: currentRound.periodId,
            selection,
            amount,
            tax,
            afterTaxAmount,
        });

        await User.findByIdAndUpdate(userId, { $inc: { walletBalance: -amount } });

        res.status(201).json(bet);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getGameHistory = async (req, res) => {
    const { gameType } = req.query;
    try {
        const history = await GameRound.find({ gameType, status: 'completed' })
            .sort({ createdAt: -1 })
            .limit(10);
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
