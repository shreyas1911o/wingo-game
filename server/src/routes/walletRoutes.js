const express = require('express');
const router = express.Router();
const { deposit, withdraw, getTransactions, getBalance } = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');

router.post('/deposit', protect, deposit);
router.post('/withdraw', protect, withdraw);
router.get('/transactions', protect, getTransactions);
router.get('/balance', protect, getBalance);

module.exports = router;
