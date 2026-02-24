const express = require('express');
const router = express.Router();
const { placeBet, getGameHistory } = require('../controllers/gameController');
const { protect } = require('../middleware/authMiddleware');

router.post('/bet', protect, placeBet);
router.get('/history', protect, getGameHistory);

module.exports = router;
