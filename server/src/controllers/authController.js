const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

exports.registerUser = async (req, res) => {
    const { mobile, password, referralCode } = req.body;

    try {
        const userExists = await User.findOne({ mobile });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate a unique referral code for the new user
        const newReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const user = await User.create({
            mobile,
            password: hashedPassword,
            referralCode: newReferralCode,
            referrer: referralCode || null,
        });

        if (user) {
            res.status(201).json({
                token: generateToken(user._id),
                user: {
                    _id: user._id,
                    mobile: user.mobile,
                    walletBalance: user.walletBalance,
                    vipLevel: user.vipLevel,
                    isAdmin: user.isAdmin,
                },
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.loginUser = async (req, res) => {
    const { mobile, password } = req.body;

    try {
        const user = await User.findOne({ mobile });

        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                token: generateToken(user._id),
                user: {
                    _id: user._id,
                    mobile: user.mobile,
                    walletBalance: user.walletBalance,
                    vipLevel: user.vipLevel,
                    isAdmin: user.isAdmin,
                },
            });
        } else {
            res.status(401).json({ message: 'Invalid mobile or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
