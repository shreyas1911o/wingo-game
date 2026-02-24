const express = require('express');
const router = express.Router();
const {
    getStats,
    getUsers, getUserDetail, updateUserStatus, adjustBalance,
    getTransactions, approveWithdraw, rejectWithdraw,
    getGameResults, getBets,
    getTopPlayers, getDailyRevenue, getRecentActivity,
    getLiveRounds, pauseGame, resumeGame, forceResult, clearForceResult, forceEndRound,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

router.use(protect, admin);

// Stats & analytics
router.get('/stats', getStats);
router.get('/top-players', getTopPlayers);
router.get('/daily-revenue', getDailyRevenue);
router.get('/activity', getRecentActivity);

// Users
router.get('/users', getUsers);
router.get('/users/:id', getUserDetail);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/balance', adjustBalance);

// Transactions
router.get('/transactions', getTransactions);
router.put('/transactions/:id/approve', approveWithdraw);
router.put('/transactions/:id/reject', rejectWithdraw);

// Bets & Results
router.get('/bets', getBets);
router.get('/results', getGameResults);

// Game Control
router.get('/game/live', getLiveRounds);
router.post('/game/pause', pauseGame);
router.post('/game/resume', resumeGame);
router.post('/game/force-result', forceResult);
router.post('/game/clear-force', clearForceResult);
router.post('/game/force-end', forceEndRound);

module.exports = router;
