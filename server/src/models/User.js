const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    mobile: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    walletBalance: {
        type: Number,
        default: 0,
    },
    bonusBalance: {
        type: Number,
        default: 0,
    },
    referralCode: {
        type: String,
        unique: true,
    },
    referrer: {
        type: String, // Mobile number or referral code of the person who referred this user
        default: null,
    },
    vipLevel: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['active', 'banned', 'suspended'],
        default: 'active',
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
