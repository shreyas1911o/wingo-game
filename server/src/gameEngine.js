const GameRound = require('./models/GameRound');
const Bet = require('./models/Bet');
const User = require('./models/User');
const Transaction = require('./models/Transaction');

const TIMERS = {
    '30s': 30,
    '1m': 60,
    '3m': 180,
};

class GameEngine {
    constructor(io) {
        this.io = io;
        this.timers = { '30s': 0, '1m': 0, '3m': 0 };
        this.activeRounds = { '30s': null, '1m': null, '3m': null };

        // Admin controls
        this.paused = { '30s': false, '1m': false, '3m': false };
        this.forcedResults = { '30s': null, '1m': null, '3m': null }; // { number, color }
        this.betCounts = { '30s': 0, '1m': 0, '3m': 0 };            // live bet count per round
    }

    async init() {
        console.log('Initializing Game Engine...');
        try {
            await this.startRound('30s');
            await this.startRound('1m');
            await this.startRound('3m');
            this.startLoop();
            console.log('Game Engine Initialized successfully');
        } catch (error) {
            console.error('Error in GameEngine init:', error);
            throw error;
        }
    }

    async startRound(gameType) {
        const periodId = Date.now().toString();
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + TIMERS[gameType] * 1000);

        const round = await GameRound.create({
            periodId, gameType, startTime, endTime, status: 'active',
        });

        this.activeRounds[gameType] = round;
        this.timers[gameType] = TIMERS[gameType];
        this.betCounts[gameType] = 0;

        this.io.emit('new-round', { gameType, periodId, endTime });
    }

    startLoop() {
        setInterval(() => {
            Object.keys(this.timers).forEach(async (gameType) => {
                // Skip if paused
                if (this.paused[gameType]) {
                    // Still broadcast so clients know it's paused
                    this.io.emit('timer-update', {
                        gameType,
                        timeRemaining: this.timers[gameType],
                        paused: true,
                    });
                    return;
                }

                this.timers[gameType]--;
                this.io.emit('timer-update', {
                    gameType,
                    timeRemaining: this.timers[gameType],
                    paused: false,
                });

                if (this.timers[gameType] <= 0) {
                    await this.endRound(gameType);
                }
            });
        }, 1000);
    }

    async endRound(gameType) {
        const round = this.activeRounds[gameType];
        if (!round) return;

        // Use forced result if admin set one, otherwise random
        let resultNumber, resultColor, resultSize;

        if (this.forcedResults[gameType]) {
            const forced = this.forcedResults[gameType];
            resultNumber = forced.number;
            resultColor = forced.color;
            this.forcedResults[gameType] = null; // consume the override
            console.log(`[Admin Override] ${gameType}: result forced to ${resultNumber} (${resultColor})`);
        } else {
            resultNumber = Math.floor(Math.random() * 10);
            if (resultNumber === 0) resultColor = 'Violet';
            else if (resultNumber === 5) resultColor = 'Violet';
            else if ([1, 3, 7, 9].includes(resultNumber)) resultColor = 'Green';
            else resultColor = 'Red';
        }

        resultSize = resultNumber >= 5 ? 'Big' : 'Small';
        const price = Math.floor(Math.random() * 10000) + 10000;

        round.resultNumber = resultNumber;
        round.resultColor = resultColor;
        round.resultSize = resultSize;
        round.price = price;
        round.status = 'completed';
        await round.save();

        this.io.emit('round-result', {
            gameType,
            periodId: round.periodId,
            resultNumber,
            resultColor,
            resultSize,
        });

        this.calculateWinnings(round._id, resultNumber, resultColor, resultSize);
        await this.startRound(gameType);
    }

    // ── Admin control methods ─────────────────────────────────────────────────

    pauseGame(gameType) {
        if (!this.paused[gameType]) {
            this.paused[gameType] = true;
            console.log(`[Admin] Paused ${gameType}`);
        }
    }

    resumeGame(gameType) {
        if (this.paused[gameType]) {
            this.paused[gameType] = false;
            console.log(`[Admin] Resumed ${gameType}`);
        }
    }

    setForcedResult(gameType, number, color) {
        // Derive color if not provided
        if (!color) {
            if (number === 0 || number === 5) color = 'Violet';
            else if ([1, 3, 7, 9].includes(number)) color = 'Green';
            else color = 'Red';
        }
        this.forcedResults[gameType] = { number, color };
        console.log(`[Admin] Forced result for next ${gameType}: ${number} (${color})`);
    }

    clearForcedResult(gameType) {
        this.forcedResults[gameType] = null;
    }

    async forceEndRound(gameType) {
        // Immediately end the current round (admin triggered)
        this.timers[gameType] = 0;
        await this.endRound(gameType);
    }

    getLiveStatus() {
        return Object.keys(this.activeRounds).map(gameType => ({
            gameType,
            periodId: this.activeRounds[gameType]?.periodId ?? null,
            timeRemaining: this.timers[gameType],
            paused: this.paused[gameType],
            forcedResult: this.forcedResults[gameType],
            totalDuration: TIMERS[gameType],
        }));
    }

    async getLiveStatusWithBets() {
        const status = this.getLiveStatus();
        const enriched = await Promise.all(status.map(async (s) => {
            const round = this.activeRounds[s.gameType];
            let betCount = 0, betVolume = 0;
            if (round) {
                const agg = await Bet.aggregate([
                    { $match: { roundId: round._id } },
                    { $group: { _id: null, count: { $sum: 1 }, volume: { $sum: '$amount' } } },
                ]);
                betCount = agg[0]?.count || 0;
                betVolume = agg[0]?.volume || 0;
            }
            return { ...s, betCount, betVolume };
        }));
        return enriched;
    }

    // ─────────────────────────────────────────────────────────────────────────
    async calculateWinnings(roundId, number, color, size) {
        const bets = await Bet.find({ roundId, status: 'pending' });

        for (const bet of bets) {
            let winAmount = 0;
            let won = false;

            if (!isNaN(parseInt(bet.selection)) && parseInt(bet.selection) === number) {
                won = true;
                winAmount = bet.afterTaxAmount * 9;
            } else if (bet.selection === 'Green' && (color === 'Green' || color === 'Violet')) {
                winAmount = number === 5 ? bet.afterTaxAmount * 1.5 : bet.afterTaxAmount * 2;
                won = true;
            } else if (bet.selection === 'Red' && (color === 'Red' || color === 'Violet')) {
                winAmount = number === 0 ? bet.afterTaxAmount * 1.5 : bet.afterTaxAmount * 2;
                won = true;
            } else if (bet.selection === 'Violet' && color === 'Violet') {
                winAmount = bet.afterTaxAmount * 4.5;
                won = true;
            } else if (bet.selection === size) {
                won = true;
                winAmount = bet.afterTaxAmount * 2;
            }

            if (won) {
                bet.status = 'win';
                bet.winAmount = winAmount;
                await bet.save();
                await User.findByIdAndUpdate(bet.userId, { $inc: { walletBalance: winAmount } });
                await Transaction.create({
                    userId: bet.userId, type: 'win', amount: winAmount, status: 'success',
                    description: `Win on ${bet.gameType} - ${bet.periodId}`,
                });
            } else {
                bet.status = 'loss';
                await bet.save();
            }
        }
    }
}

// Singleton export so admin controller can reference the live instance
let instance = null;
GameEngine.getInstance = () => instance;
GameEngine.setInstance = (eng) => { instance = eng; };

module.exports = GameEngine;
