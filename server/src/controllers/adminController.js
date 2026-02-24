const User = require('../models/User');
const Transaction = require('../models/Transaction');
const GameRound = require('../models/GameRound');
const Bet = require('../models/Bet');
const GameEngine = require('../gameEngine');

// GET /api/admin/stats
exports.getStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ status: 'active' });
        const bannedUsers = await User.countDocuments({ status: 'banned' });

        const totalBets = await Bet.countDocuments();
        const winBets = await Bet.countDocuments({ status: 'win' });
        const lossBets = await Bet.countDocuments({ status: 'loss' });
        const winRate = totalBets > 0 ? ((winBets / (winBets + lossBets)) * 100).toFixed(1) : 0;

        const totalRounds = await GameRound.countDocuments({ status: 'completed' });

        const revenueAgg = await Transaction.aggregate([
            { $match: { type: 'deposit', status: 'success' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const totalRevenue = revenueAgg[0]?.total || 0;

        // Today's revenue
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const todayRevAgg = await Transaction.aggregate([
            { $match: { type: 'deposit', status: 'success', createdAt: { $gte: todayStart } } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const todayRevenue = todayRevAgg[0]?.total || 0;

        // Total payout
        const payoutAgg = await Bet.aggregate([
            { $match: { status: 'win' } },
            { $group: { _id: null, total: { $sum: '$winAmount' } } },
        ]);
        const totalPayout = payoutAgg[0]?.total || 0;

        // Total bet volume
        const betVolumeAgg = await Bet.aggregate([
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const totalBetVolume = betVolumeAgg[0]?.total || 0;

        const pendingWithdrawals = await Transaction.countDocuments({ type: 'withdraw', status: 'pending' });
        const pendingAmount = await Transaction.aggregate([
            { $match: { type: 'withdraw', status: 'pending' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        // New users today
        const newUsersToday = await User.countDocuments({ createdAt: { $gte: todayStart } });

        res.json({
            totalUsers, activeUsers, bannedUsers, newUsersToday,
            totalBets, winBets, lossBets, winRate,
            totalRounds,
            totalRevenue, todayRevenue,
            totalPayout, totalBetVolume,
            houseEdge: totalBetVolume > 0 ? (((totalBetVolume - totalPayout) / totalBetVolume) * 100).toFixed(1) : 0,
            pendingWithdrawals,
            pendingWithdrawAmount: pendingAmount[0]?.total || 0,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/admin/users/:id
exports.getUserDetail = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });

        const recentBets = await Bet.find({ userId: req.params.id })
            .sort({ createdAt: -1 }).limit(10);
        const recentTxs = await Transaction.find({ userId: req.params.id })
            .sort({ createdAt: -1 }).limit(10);
        const betStats = await Bet.aggregate([
            { $match: { userId: user._id } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                    totalWin: { $sum: '$winAmount' },
                }
            },
        ]);

        res.json({ user, recentBets, recentTxs, betStats });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/admin/users
exports.getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';

        const query = search ? { mobile: { $regex: search, $options: 'i' } } : {};
        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({ users, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/admin/users/:id/status
exports.updateUserStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['active', 'banned', 'suspended'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/admin/users/:id/balance
exports.adjustBalance = async (req, res) => {
    try {
        const { amount, reason } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await User.findByIdAndUpdate(req.params.id, { $inc: { walletBalance: amount } });

        await Transaction.create({
            userId: req.params.id,
            type: amount >= 0 ? 'bonus' : 'withdraw',
            amount: Math.abs(amount),
            status: 'success',
            description: `Admin adjustment: ${reason || 'Manual balance update'}`,
        });

        res.json({ message: `Balance adjusted by ₹${amount}` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/admin/transactions
exports.getTransactions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const type = req.query.type || '';
        const status = req.query.status || '';

        const query = {};
        if (type) query.type = type;
        if (status) query.status = status;

        const total = await Transaction.countDocuments(query);
        const transactions = await Transaction.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('userId', 'mobile');

        res.json({ transactions, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/admin/transactions/:id/approve
exports.approveWithdraw = async (req, res) => {
    try {
        const tx = await Transaction.findById(req.params.id);
        if (!tx) return res.status(404).json({ message: 'Transaction not found' });
        if (tx.status !== 'pending') return res.status(400).json({ message: 'Transaction is not pending' });

        tx.status = 'success';
        await tx.save();
        res.json({ message: 'Withdrawal approved', transaction: tx });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/admin/transactions/:id/reject
exports.rejectWithdraw = async (req, res) => {
    try {
        const tx = await Transaction.findById(req.params.id);
        if (!tx) return res.status(404).json({ message: 'Transaction not found' });
        if (tx.status !== 'pending') return res.status(400).json({ message: 'Transaction is not pending' });

        tx.status = 'failed';
        await tx.save();

        // Refund the user
        await User.findByIdAndUpdate(tx.userId, { $inc: { walletBalance: tx.amount } });

        res.json({ message: 'Withdrawal rejected and refunded', transaction: tx });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/admin/results
exports.getGameResults = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 30;
        const gameType = req.query.gameType || '';

        const query = { status: 'completed' };
        if (gameType) query.gameType = gameType;

        const total = await GameRound.countDocuments(query);
        const results = await GameRound.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({ results, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/admin/bets
exports.getBets = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const gameType = req.query.gameType || '';
        const status = req.query.status || '';

        const query = {};
        if (gameType) query.gameType = gameType;
        if (status) query.status = status;

        const total = await Bet.countDocuments(query);
        const bets = await Bet.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('userId', 'mobile');

        const totals = await Bet.aggregate([
            { $match: query },
            { $group: { _id: null, totalAmount: { $sum: '$amount' }, totalWin: { $sum: '$winAmount' } } },
        ]);

        res.json({ bets, total, page, pages: Math.ceil(total / limit), totals: totals[0] || {} });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/admin/top-players
exports.getTopPlayers = async (req, res) => {
    try {
        const topByBalance = await User.find({ isAdmin: { $ne: true } })
            .select('-password')
            .sort({ walletBalance: -1 })
            .limit(10);

        // Enrich with bet counts
        const enriched = await Promise.all(topByBalance.map(async (u) => {
            const totalBets = await Bet.countDocuments({ userId: u._id });
            const wins = await Bet.countDocuments({ userId: u._id, status: 'win' });
            const totalWon = await Bet.aggregate([
                { $match: { userId: u._id, status: 'win' } },
                { $group: { _id: null, total: { $sum: '$winAmount' } } },
            ]);
            return {
                _id: u._id,
                mobile: u.mobile,
                walletBalance: u.walletBalance,
                vipLevel: u.vipLevel,
                status: u.status,
                totalBets,
                wins,
                totalWon: totalWon[0]?.total || 0,
                referralCode: u.referralCode,
            };
        }));

        res.json({ players: enriched });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/admin/daily-revenue  (last 7 days)
exports.getDailyRevenue = async (req, res) => {
    try {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const start = new Date();
            start.setDate(start.getDate() - i);
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setHours(23, 59, 59, 999);

            const depAgg = await Transaction.aggregate([
                { $match: { type: 'deposit', status: 'success', createdAt: { $gte: start, $lte: end } } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]);
            const betAgg = await Bet.aggregate([
                { $match: { createdAt: { $gte: start, $lte: end } } },
                { $group: { _id: null, count: { $sum: 1 }, volume: { $sum: '$amount' } } },
            ]);
            const regCount = await User.countDocuments({ createdAt: { $gte: start, $lte: end } });

            days.push({
                date: start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
                revenue: depAgg[0]?.total || 0,
                bets: betAgg[0]?.count || 0,
                betVolume: betAgg[0]?.volume || 0,
                newUsers: regCount,
            });
        }
        res.json({ days });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/admin/activity  (recent 30 events)
exports.getRecentActivity = async (req, res) => {
    try {
        const recentBets = await Bet.find({})
            .sort({ createdAt: -1 }).limit(15)
            .populate('userId', 'mobile');
        const recentTxs = await Transaction.find({ type: { $in: ['deposit', 'withdraw'] } })
            .sort({ createdAt: -1 }).limit(15)
            .populate('userId', 'mobile');

        const events = [
            ...recentBets.map(b => ({
                type: 'bet', time: b.createdAt,
                mobile: b.userId?.mobile, gameType: b.gameType,
                selection: b.selection, amount: b.amount, status: b.status,
                winAmount: b.winAmount,
            })),
            ...recentTxs.map(tx => ({
                type: tx.type, time: tx.createdAt,
                mobile: tx.userId?.mobile, amount: tx.amount, status: tx.status,
            })),
        ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 30);

        res.json({ events });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
// GAME CONTROL ENDPOINTS
// ═══════════════════════════════════════════════════════════════

const getEngine = () => {
    const eng = GameEngine.getInstance();
    if (!eng) throw new Error('Game Engine not initialised');
    return eng;
};

// GET /api/admin/game/live
exports.getLiveRounds = async (req, res) => {
    try {
        const data = await getEngine().getLiveStatusWithBets();
        res.json(data);
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// POST /api/admin/game/pause  { gameType }
exports.pauseGame = (req, res) => {
    try {
        const { gameType } = req.body;
        getEngine().pauseGame(gameType);
        res.json({ message: `${gameType} paused` });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// POST /api/admin/game/resume  { gameType }
exports.resumeGame = (req, res) => {
    try {
        const { gameType } = req.body;
        getEngine().resumeGame(gameType);
        res.json({ message: `${gameType} resumed` });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// POST /api/admin/game/force-result  { gameType, number }
exports.forceResult = (req, res) => {
    try {
        const { gameType, number } = req.body;
        const num = parseInt(number);
        if (isNaN(num) || num < 0 || num > 9) return res.status(400).json({ message: 'number must be 0–9' });
        getEngine().setForcedResult(gameType, num);
        res.json({ message: `Next ${gameType} result locked to ${num}` });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// POST /api/admin/game/clear-force  { gameType }
exports.clearForceResult = (req, res) => {
    try {
        const { gameType } = req.body;
        getEngine().clearForcedResult(gameType);
        res.json({ message: `Force result cleared for ${gameType}` });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// POST /api/admin/game/force-end  { gameType }
exports.forceEndRound = async (req, res) => {
    try {
        const { gameType } = req.body;
        await getEngine().forceEndRound(gameType);
        res.json({ message: `${gameType} round ended immediately` });
    } catch (e) { res.status(500).json({ message: e.message }); }
};
