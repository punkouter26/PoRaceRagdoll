import { create } from 'zustand';
import { api, type GameState, type Racer, type RaceResult } from '@/lib/api';
import { INITIAL_BALANCE, INITIAL_BET, TOTAL_ROUNDS, RACER_SPECIES } from '@/lib/config';

// --- ODDS LOGIC (for offline mode) ---
function calculateOdds(racerMass: number, slopeAngle: number): number {
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

const generateRacers = (): Racer[] => {
    const racers: Racer[] = [];
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
            mass: Math.round(finalMass * 10) / 10,
            odds: calculateOdds(finalMass, 20)
        });
    }
    return racers;
};

interface GameStore extends GameState {
    sessionId: string | null;
    lastResult: RaceResult | null;
    isOnline: boolean;
    isLoading: boolean;
    error: string | null;
    
    // Actions
    initSession: () => Promise<void>;
    selectRacer: (id: number) => void;
    placeBet: () => Promise<void>;
    finishRace: (winnerId: number) => Promise<void>;
    nextRound: () => Promise<void>;
    setOnlineMode: (online: boolean) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
    // Initial state
    sessionId: null,
    balance: INITIAL_BALANCE,
    round: 1,
    maxRounds: TOTAL_ROUNDS,
    state: 'BETTING',
    racers: generateRacers(),
    selectedRacerId: null,
    betAmount: INITIAL_BET,
    winnerId: null,
    lastResult: null,
    isOnline: false, // Start in offline mode for faster dev
    isLoading: false,
    error: null,

    initSession: async () => {
        const { isOnline } = get();
        if (!isOnline) return;

        set({ isLoading: true, error: null });
        try {
            const { sessionId, state } = await api.createSession();
            set({
                sessionId,
                ...state,
                isLoading: false,
            });
        } catch (err) {
            set({
                error: 'Failed to connect to server. Running in offline mode.',
                isOnline: false,
                isLoading: false,
            });
        }
    },

    selectRacer: (id: number) => {
        set({ selectedRacerId: id });
    },

    placeBet: async () => {
        const { isOnline, sessionId, selectedRacerId, balance, betAmount, state: gameState } = get();

        if (gameState !== 'BETTING' || selectedRacerId === null) return;
        if (balance < betAmount) return;

        if (isOnline && sessionId) {
            set({ isLoading: true });
            try {
                const newState = await api.placeBet(sessionId, selectedRacerId);
                set({ ...newState, isLoading: false });
            } catch {
                set({ error: 'Failed to place bet', isLoading: false });
            }
        } else {
            // Offline mode
            set({
                balance: balance - betAmount,
                state: 'RACING',
            });
        }
    },

    finishRace: async (winnerId: number) => {
        const { isOnline, sessionId, selectedRacerId, racers, betAmount, balance } = get();

        if (isOnline && sessionId) {
            set({ isLoading: true });
            try {
                const { state, result } = await api.finishRace(sessionId, winnerId);
                set({
                    ...state,
                    lastResult: result,
                    isLoading: false,
                });
            } catch {
                set({ error: 'Failed to finish race', isLoading: false });
            }
        } else {
            // Offline mode
            const winner = racers.find(r => r.id === winnerId);
            let newBalance = balance;
            const playerWon = selectedRacerId === winnerId;

            if (playerWon && winner) {
                let profit = 0;
                if (winner.odds > 0) {
                    profit = betAmount * (winner.odds / 100);
                } else {
                    profit = betAmount * (100 / Math.abs(winner.odds));
                }
                newBalance += Math.floor(profit) + betAmount;
            }

            set({
                state: 'FINISHED',
                winnerId,
                balance: newBalance,
                lastResult: {
                    winnerId,
                    winnerName: winner?.name || 'Unknown',
                    playerWon,
                    payout: playerWon ? newBalance - balance + betAmount : 0,
                    newBalance,
                },
            });
        }
    },

    nextRound: async () => {
        const { isOnline, sessionId, round, maxRounds } = get();

        if (isOnline && sessionId) {
            set({ isLoading: true });
            try {
                const newState = await api.nextRound(sessionId);
                set({ ...newState, lastResult: null, isLoading: false });
            } catch {
                set({ error: 'Failed to advance round', isLoading: false });
            }
        } else {
            // Offline mode
            if (round >= maxRounds) {
                set({
                    round: 1,
                    balance: INITIAL_BALANCE,
                    racers: generateRacers(),
                    state: 'BETTING',
                    selectedRacerId: null,
                    winnerId: null,
                    lastResult: null,
                });
            } else {
                set({
                    round: round + 1,
                    racers: generateRacers(),
                    state: 'BETTING',
                    selectedRacerId: null,
                    winnerId: null,
                    lastResult: null,
                });
            }
        }
    },

    setOnlineMode: (online: boolean) => {
        set({ isOnline: online });
        if (online) {
            get().initSession();
        }
    },
}));
