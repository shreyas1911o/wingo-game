const Banner = require('../models/Banner');

// GET /api/game/banners (Public)
exports.getBanners = async (req, res) => {
    try {
        const banners = await Banner.find({ active: true }).sort({ order: 1 });
        res.json(banners);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/admin/banners (Admin)
exports.adminGetBanners = async (req, res) => {
    try {
        const banners = await Banner.find().sort({ order: 1 });
        res.json(banners);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/admin/banners
exports.createBanner = async (req, res) => {
    try {
        const { id, src, alt, color, link, active, order } = req.body;
        const banner = new Banner({ id, src, alt, color, link, active, order });
        await banner.save();
        res.status(201).json(banner);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// PUT /api/admin/banners/:id
exports.updateBanner = async (req, res) => {
    try {
        const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!banner) return res.status(404).json({ message: 'Banner not found' });
        res.json(banner);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// DELETE /api/admin/banners/:id
exports.deleteBanner = async (req, res) => {
    try {
        const banner = await Banner.findByIdAndDelete(req.params.id);
        if (!banner) return res.status(404).json({ message: 'Banner not found' });
        res.json({ message: 'Banner deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Seed / sync banners on every server start (upsert by id)
exports.seedBanners = async () => {
    const banners = [
        { id: "welcome", src: "/banner-welcome.svg", alt: "Aapka Swagat Hai — Welcome to Wingo", color: "rgba(212,160,23,0.15)", order: 0, active: true },
        { id: "win", src: "/banner-win.svg", alt: "Daily Jeeto — Win Up To ₹10,000 Daily", color: "rgba(26,155,92,0.15)", order: 1, active: true },
        { id: "diwali", src: "/banner-diwali.svg", alt: "Diwali Special — Double Bonus on Deposit", color: "rgba(212,160,23,0.2)", order: 2, active: true },
        { id: "deposit", src: "/banner-deposit.svg", alt: "Pehli Jama — 100% First Deposit Bonus", color: "rgba(212,160,23,0.15)", order: 3, active: true },
        { id: "refer", src: "/banner-refer.svg", alt: "Refer Karo — ₹50 Referral Bonus", color: "rgba(26,155,92,0.12)", order: 4, active: true },
        { id: "vip", src: "/banner-vip.svg", alt: "VIP Club — Exclusive Rewards & Higher Payouts", color: "rgba(212,160,23,0.18)", order: 5, active: true },
        { id: "gift", src: "/banner-gift.svg", alt: "Gift Card — Uphar Card Redeem Karein", color: "rgba(212,160,23,0.12)", order: 6, active: true },
        { id: "withdraw", src: "/banner-withdraw.svg", alt: "Turant Nikalein — Instant Withdrawals 24/7", color: "rgba(26,155,92,0.15)", order: 7, active: true },
        { id: "howtoplay", src: "/banner-howtoplay.svg", alt: "Kaise Khelein — How to Play Wingo", color: "rgba(212,160,23,0.1)", order: 8, active: true },
        { id: "security", src: "/banner-security.svg", alt: "Surakshit Khel — 100% Secure Platform", color: "rgba(26,155,92,0.1)", order: 9, active: true },
    ];

    for (const b of banners) {
        await Banner.findOneAndUpdate(
            { id: b.id },
            { $set: b },
            { upsert: true, returnDocument: 'after' }
        );
    }
    console.log(`✦ Indian luxury banners synced (${banners.length} banners)`);
};
