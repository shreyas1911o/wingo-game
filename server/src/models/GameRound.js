const mongoose = require('mongoose');

const gameRoundSchema = new mongoose.Schema({
    periodId: {
        type: String,
        required: true,
        unique: true,
    },
    gameType: {
        type: String,
        enum: ['30s', '1m', '3m'],
        required: true,
    },
    startTime: {
        type: Date,
        required: true,
    },
    endTime: {
        type: Date,
        required: true,
    },
    resultNumber: {
        type: Number,
        default: null, // 0-9
    },
    resultColor: {
        type: String, // 'Green', 'Red', 'Violet'
        default: null,
    },
    resultSize: {
        type: String, // 'Small', 'Big'
        default: null,
    },
    price: {
        type: Number, // Random simulated stock price for realism
        default: 0,
    },
    status: {
        type: String,
        enum: ['active', 'completed'],
        default: 'active',
    },
}, { timestamps: true });

module.exports = mongoose.model('GameRound', gameRoundSchema);
