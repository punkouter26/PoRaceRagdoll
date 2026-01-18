'use client';

import { useGameStore } from '@/store/gameStore';

export default function GameUI() {
    const { balance, round, maxRounds, state: gameState, placeBet, selectedRacerId, nextRound, winnerId, racers } = useGameStore();

    const winner = racers.find(r => r.id === winnerId);
    const isWinner = winnerId === selectedRacerId;

    return (
        <div className="absolute inset-0 pointer-events-none z-50 flex flex-col justify-between p-8 font-sans">
            {/* TOP BAR: Glass HUD */}
            <div className="flex justify-between items-start w-full max-w-7xl mx-auto">
                {/* Balance Pill */}
                <div className="glass-panel px-8 py-3 rounded-full flex flex-col items-center backdrop-blur-xl border-white/10 group hover:border-white/20 transition-all cursor-default">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1 group-hover:text-white transition-colors">Balance</span>
                    <span className="text-3xl font-bold text-white tracking-tighter drop-shadow-lg">
                        ${balance.toLocaleString()}
                    </span>
                </div>

                {/* Title (Center) */}
                <div className="mt-4">
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white/10 to-white/30 tracking-[0.5em] uppercase blur-[0.5px]">
                        PoRace
                    </h1>
                </div>

                {/* Round Pill */}
                <div className="glass-panel px-8 py-3 rounded-full flex flex-col items-center backdrop-blur-xl border-white/10">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">Round</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-white tracking-tighter">{round}</span>
                        <span className="text-sm text-gray-500 font-bold">/ {maxRounds}</span>
                    </div>
                </div>
            </div>

            {/* CENTER: Results Overlay */}
            {gameState === 'FINISHED' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md pointer-events-auto z-50 animate-in fade-in zoom-in duration-300">
                    <div className="flex flex-col items-center text-center p-16 glass-panel rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden">
                        {/* Background Glow */}
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[100px] z-0 ${isWinner ? 'bg-green-500/20' : 'bg-red-500/20'}`}></div>

                        <div className="relative z-10">
                            <h2 className="text-sm font-bold text-white/50 uppercase tracking-[0.5em] mb-4">Result</h2>
                            <h1 className={`text-7xl md:text-9xl font-black mb-6 tracking-tighter ${isWinner ? 'text-transparent bg-clip-text bg-gradient-to-br from-[#4CC9F0] to-[#4361ee] drop-shadow-[0_0_30px_rgba(67,97,238,0.5)]' : 'text-transparent bg-clip-text bg-gradient-to-br from-[#ff006e] to-[#8338ec] drop-shadow-[0_0_30px_rgba(255,0,110,0.5)]'}`}>
                                {isWinner ? 'VICTORY' : 'DEFEAT'}
                            </h1>

                            <div className="glass-panel px-8 py-4 rounded-xl mb-12 inline-block">
                                <p className="text-xl text-gray-300 font-light uppercase tracking-widest">
                                    Winner: <span className="text-white font-bold">{winner?.name}</span>
                                </p>
                            </div>

                            <button
                                onClick={nextRound}
                                className="btn-primary px-16 py-5 text-xl w-full rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Next Round
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* BOTTOM BAR: Controls */}
            <div className="flex justify-center items-end pb-12">
                {gameState === 'BETTING' && (
                    <button
                        onClick={placeBet}
                        disabled={selectedRacerId === null}
                        className={`
                            pointer-events-auto px-20 py-6 font-bold text-xl uppercase tracking-[0.2em] transition-all duration-300 rounded-2xl
                            ${selectedRacerId !== null
                                ? 'btn-primary shadow-[0_0_50px_rgba(247,37,133,0.4)]'
                                : 'bg-white/5 text-white/10 border border-white/5 cursor-not-allowed backdrop-blur-sm'}
                        `}
                    >
                        {selectedRacerId !== null ? 'Place Bet ($100)' : 'Select Racer'}
                    </button>
                )}

                {gameState === 'RACING' && (
                    <div className="glass-panel px-10 py-3 rounded-full border-white/5">
                        <div className="text-white/80 text-xs font-bold uppercase tracking-[0.5em] animate-pulse flex items-center gap-3">
                            <div className="w-2 h-2 bg-[#F72585] rounded-full shadow-[0_0_10px_#F72585]"></div>
                            Race in Progress
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
