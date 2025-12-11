import { create } from 'zustand';
import { RACER_SPECIES } from '../config';
import { INITIAL_BALANCE, INITIAL_BET, TOTAL_ROUNDS } from '../config';

// --- ODDS LOGIC MERGED HERE ---
function calculateOdds(racerMass, slopeAngle) {
    let score = 50;
    const massFactor = racerMass * 2;

    if (slopeAngle > 20) {
        score += massFactor * 0.5;
    } else {
        score += massFactor * 0.2;
    }

    score += (Math.random() * 20) - 10;

    let probability = (score + 50) / 200;
    probability = Math.max(0.05, Math.min(0.95, probability));

    if (probability >= 0.5) {
        return -Math.round((probability / (1 - probability)) * 100);
    } else {
        return Math.round(((1 - probability) / probability) * 100);
    }
}

const generateRacers = () => {
    const racers = [];
    for (let i = 0; i < 8; i++) {
        const species = RACER_SPECIES[Math.floor(Math.random() * RACER_SPECIES.length)];
        const massVariance = (Math.random() * 10) - 5;
        const finalMass = Math.max(10, species.mass + massVariance);

        racers.push({
            id: i,
            name: `${species.name} ${i + 1}`,
            species: species.name,
            type: species.type,
            color: species.color,
            mass: finalMass,
            odds: calculateOdds(finalMass, 20)
        });
    }
    return racers;
};

export const useGameStore = create((set, get) => ({
    // State
    balance: INITIAL_BALANCE,
    round: 1,
    maxRounds: TOTAL_ROUNDS,
    gameState: 'BETTING', // BETTING, RACING, FINISHED
    racers: generateRacers(),
    selectedRacerId: null,
    betAmount: INITIAL_BET,
    winnerId: null,

    // Actions
    setGameState: (state) => set({ gameState: state }),

    selectRacer: (id) => set({ selectedRacerId: id }),

    placeBet: () => {
        const { balance, betAmount, selectedRacerId, gameState } = get();
        if (gameState !== 'BETTING' || selectedRacerId === null) return;
        if (balance < betAmount) return;

        set({
            balance: balance - betAmount,
            gameState: 'RACING'
        });
    },

    finishRace: (winnerId) => {
        const { selectedRacerId, racers, betAmount, balance } = get();
        const winner = racers.find(r => r.id === winnerId);
        let newBalance = balance;

        if (selectedRacerId === winnerId) {
            // American Odds Payout Calculation
            let profit = 0;
            if (winner.odds > 0) {
                profit = betAmount * (winner.odds / 100);
            } else {
                profit = betAmount * (100 / Math.abs(winner.odds));
            }
            newBalance += Math.floor(profit) + betAmount;
        }

        set({
            gameState: 'FINISHED',
            winnerId,
            balance: newBalance,
        });
    },

    nextRound: () => {
        const { round, maxRounds } = get();
        if (round >= maxRounds) {
            set({
                round: 1,
                balance: INITIAL_BALANCE,
                racers: generateRacers(),
                gameState: 'BETTING',
                selectedRacerId: null,
                winnerId: null
            });
        } else {
            set({
                round: round + 1,
                racers: generateRacers(),
                gameState: 'BETTING',
                selectedRacerId: null,
                winnerId: null
            });
        }
    }
}));
