const express = require('express');
const router = express.Router();
const { uploadImage, uploadMiddleware } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// POST /api/upload - Admin only
router.post('/', protect, admin, uploadMiddleware, uploadImage);

module.exports = router;
