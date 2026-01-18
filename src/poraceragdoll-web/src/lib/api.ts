const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface Racer {
    id: number;
    name: string;
    species: string;
    type: string;
    color: string;
    mass: number;
    odds: number;
}

export interface GameState {
    balance: number;
    round: number;
    maxRounds: number;
    state: 'BETTING' | 'RACING' | 'FINISHED';
    racers: Racer[];
    selectedRacerId: number | null;
    betAmount: number;
    winnerId: number | null;
}

export interface RaceResult {
    winnerId: number;
    winnerName: string;
    playerWon: boolean;
    payout: number;
    newBalance: number;
}

export interface SessionResponse {
    sessionId: string;
    state: GameState;
}

export const api = {
    async createSession(): Promise<SessionResponse> {
        const res = await fetch(`${API_BASE_URL}/api/game/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) throw new Error('Failed to create session');
        return res.json();
    },

    async getSession(sessionId: string): Promise<GameState> {
        const res = await fetch(`${API_BASE_URL}/api/game/session/${sessionId}`);
        if (!res.ok) throw new Error('Failed to get session');
        return res.json();
    },

    async placeBet(sessionId: string, racerId: number): Promise<GameState> {
        const res = await fetch(`${API_BASE_URL}/api/game/session/${sessionId}/bet`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ racerId }),
        });
        if (!res.ok) throw new Error('Failed to place bet');
        return res.json();
    },

    async finishRace(sessionId: string, winnerId: number): Promise<{ state: GameState; result: RaceResult }> {
        const res = await fetch(`${API_BASE_URL}/api/game/session/${sessionId}/finish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ winnerId }),
        });
        if (!res.ok) throw new Error('Failed to finish race');
        return res.json();
    },

    async nextRound(sessionId: string): Promise<GameState> {
        const res = await fetch(`${API_BASE_URL}/api/game/session/${sessionId}/next`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) throw new Error('Failed to advance round');
        return res.json();
    },
};
