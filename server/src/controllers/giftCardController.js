const GiftCard = require('../models/GiftCard');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const crypto = require('crypto');

exports.redeemGiftCard = async (req, res) => {
    const { code } = req.body;
    const userId = req.user._id;

    try {
        const giftCard = await GiftCard.findOne({ code: code.trim().toUpperCase() });

        if (!giftCard) {
            return res.status(404).json({ message: 'Invalid gift card code' });
        }

        if (giftCard.isUsed) {
            return res.status(400).json({ message: 'Gift card has already been used' });
        }

        if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
            return res.status(400).json({ message: 'Gift card has expired' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Apply amount to user wallet
        user.walletBalance += giftCard.amount;
        await user.save();

        // Mark gift card as used
        giftCard.isUsed = true;
        giftCard.usedBy = userId;
        giftCard.usedAt = new Date();
        await giftCard.save();

        // Create transaction record
        await Transaction.create({
            userId,
            type: 'bonus',
            amount: giftCard.amount,
            status: 'success',
            description: `Redeemed gift card: ${code.toUpperCase()}`,
        });

        res.json({
            message: `Success! ₹${giftCard.amount} added to your wallet.`,
            amount: giftCard.amount,
            newBalance: user.walletBalance
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.generateGiftCards = async (req, res) => {
    const { amount, count, prefix = 'GIFT' } = req.body;
    const adminId = req.user._id;

    if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Valid amount is required' });
    }

    try {
        const generatedCards = [];
        const numCards = parseInt(count) || 1;

        for (let i = 0; i < numCards; i++) {
            const randomCode = crypto.randomBytes(4).toString('hex').toUpperCase();
            const code = `${prefix}-${randomCode}`;

            const card = await GiftCard.create({
                code,
                amount,
                createdBy: adminId,
            });
            generatedCards.push(card);
        }

        res.status(201).json({
            message: `Successfully generated ${numCards} gift cards`,
            cards: generatedCards
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllGiftCards = async (req, res) => {
    try {
        const cards = await GiftCard.find()
            .sort({ createdAt: -1 })
            .populate('usedBy', 'mobile')
            .limit(100);
        res.json(cards);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
