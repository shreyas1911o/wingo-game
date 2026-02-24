const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// Public routes
router.get('/', bannerController.getBanners);

// Protected Admin routes
router.get('/admin', protect, admin, bannerController.adminGetBanners);
router.post('/', protect, admin, bannerController.createBanner);
router.put('/:id', protect, admin, bannerController.updateBanner);
router.delete('/:id', protect, admin, bannerController.deleteBanner);

module.exports = router;
