const express = require('express');
const router = express.Router();
const { redeemGiftCard, generateGiftCards, getAllGiftCards } = require('../controllers/giftCardController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

router.post('/redeem', protect, redeemGiftCard);
router.post('/generate', protect, admin, generateGiftCards);
router.get('/all', protect, admin, getAllGiftCards);

module.exports = router;
