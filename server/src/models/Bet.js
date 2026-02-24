const mongoose = require('mongoose');

const betSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    roundId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GameRound',
        required: true,
    },
    gameType: {
        type: String,
        enum: ['30s', '1m', '3m'],
        required: true,
    },
    periodId: {
        type: String,
        required: true,
    },
    selection: {
        type: String, // 'Green', 'Red', 'Violet', '0'-'9', 'Big', 'Small'
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    tax: {
        type: Number,
        default: 0,
    },
    afterTaxAmount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'win', 'loss'],
        default: 'pending',
    },
    winAmount: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

module.exports = mongoose.model('Bet', betSchema);
