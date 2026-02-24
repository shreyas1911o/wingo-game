const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

dotenv.config();

const startServer = async () => {
    try {
        await connectDB();

        const authRoutes = require('./routes/authRoutes');
        const walletRoutes = require('./routes/walletRoutes');
        const gameRoutes = require('./routes/gameRoutes');
        const adminRoutes = require('./routes/adminRoutes');
        const giftCardRoutes = require('./routes/giftCardRoutes');
        const bannerRoutes = require('./routes/bannerRoutes');
        const uploadRoutes = require('./routes/uploadRoutes');
        const { seedBanners } = require('./controllers/bannerController');
        const GameEngine = require('./gameEngine');

        const app = express();
        const httpServer = createServer(app);
        const io = new Server(httpServer, {
            cors: {
                origin: process.env.FRONTEND_URL || "*",
                methods: ["GET", "POST"]
            }
        });

        app.use(cors({
            origin: process.env.FRONTEND_URL || "*",
            credentials: true
        }));
        app.use(express.json());
        app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

        app.use('/api/auth', authRoutes);
        app.use('/api/wallet', walletRoutes);
        app.use('/api/game', gameRoutes);
        app.use('/api/admin', adminRoutes);
        app.use('/api/giftcard', giftCardRoutes);
        app.use('/api/banners', bannerRoutes);
        app.use('/api/upload', uploadRoutes);

        // Initialize Game Engine
        const gameEngine = new GameEngine(io);
        await gameEngine.init();
        GameEngine.setInstance(gameEngine);

        // Seed banners
        await seedBanners();

        app.get('/', (req, res) => {
            res.send('Wingo Game Server is running');
        });

        const PORT = process.env.PORT || 5000;

        httpServer.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
