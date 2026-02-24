const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
    },
    src: {
        type: String,
        required: true,
    },
    alt: {
        type: String,
        required: true,
    },
    color: {
        type: String,
        default: 'rgba(157, 0, 255, 0.2)',
    },
    link: {
        type: String,
        default: '',
    },
    active: {
        type: Boolean,
        default: true,
    },
    order: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);
