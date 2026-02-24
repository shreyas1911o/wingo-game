try {
    console.log('Testing imports...');
    console.log('Requiring config/db...');
    require('./config/db');
    console.log('Requiring models/User...');
    require('./models/User');
    console.log('Requiring models/Transaction...');
    require('./models/Transaction');
    console.log('Requiring models/GameRound...');
    require('./models/GameRound');
    console.log('Requiring models/Bet...');
    require('./models/Bet');
    console.log('Requiring middleware/authMiddleware...');
    require('./middleware/authMiddleware');
    console.log('Requiring controllers/authController...');
    require('./controllers/authController');
    console.log('Requiring controllers/walletController...');
    require('./controllers/walletController');
    console.log('Requiring controllers/gameController...');
    require('./controllers/gameController');
    console.log('Requiring routes/authRoutes...');
    require('./routes/authRoutes');
    console.log('Requiring routes/walletRoutes...');
    require('./routes/walletRoutes');
    console.log('Requiring routes/gameRoutes...');
    require('./routes/gameRoutes');
    console.log('Requiring gameEngine...');
    require('./gameEngine');
    console.log('All imports successful!');
} catch (error) {
    console.error('Import failed:', error);
}
