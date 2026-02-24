const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['deposit', 'withdraw', 'bet', 'win', 'bonus', 'referral'],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending',
    },
    description: {
        type: String,
    },
    transactionId: {
        type: String,
        unique: true,
        sparse: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
