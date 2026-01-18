'use client';

import { useGameStore } from '@/store/gameStore';
import { audioManager } from '@/lib/audio';
import SelectionCanvas from './SelectionCanvas';

export default function OddsBoard() {
    const { racers, selectedRacerId, selectRacer, state: gameState } = useGameStore();

    const handleRacerClick = (racerId: number) => {
        audioManager.playCoin();
        selectRacer(racerId);
    };

    if (gameState !== 'BETTING') return null;

    return (
        <div className="absolute inset-0 z-40 flex flex-col pointer-events-none bg-gradient-to-b from-black/70 via-black/40 to-black/70">
            {/* Header */}
            <div className="flex-shrink-0 pt-6 pb-4 text-center">
                <h2 className="text-white/90 text-3xl font-black uppercase tracking-[0.5em] drop-shadow-lg">
                    Choose Your Champion
                </h2>
                <p className="text-white/40 text-sm mt-2 tracking-widest">Click to select • Press BET to start</p>
            </div>

            {/* Main Grid Container */}
            <div className="flex-1 relative px-4 pb-4">
                {/* 3D Canvas Background */}
                <div className="absolute inset-0 z-0">
                    <SelectionCanvas racers={racers} />
                </div>

                {/* Professional 4x2 Card Grid */}
                <div className="relative z-10 h-full grid grid-cols-4 grid-rows-2 gap-3 max-w-[1600px] mx-auto">
                    {racers.map((racer, index) => {
                        const isSelected = selectedRacerId === racer.id;
                        const laneNumber = index + 1;
                        
                        return (
                            <div
                                key={racer.id}
                                onClick={() => handleRacerClick(racer.id)}
                                className={`
                                    pointer-events-auto cursor-pointer relative flex flex-col
                                    rounded-2xl overflow-hidden transition-all duration-300
                                    ${isSelected
                                        ? 'ring-4 ring-[#F72585] shadow-[0_0_40px_rgba(247,37,133,0.5)] scale-[1.02] z-20'
                                        : 'ring-1 ring-white/10 hover:ring-white/30 hover:scale-[1.01]'}
                                `}
                            >
                                {/* Top Bar with Lane Number */}
                                <div className={`
                                    flex items-center justify-between px-4 py-2 backdrop-blur-md
                                    ${isSelected 
                                        ? 'bg-gradient-to-r from-[#7209B7]/80 to-[#F72585]/80' 
                                        : 'bg-black/60'}
                                `}>
                                    <div className="flex items-center gap-2">
                                        <span className={`
                                            w-8 h-8 flex items-center justify-center rounded-lg font-black text-lg
                                            ${isSelected ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'}
                                        `}>
                                            {laneNumber}
                                        </span>
                                        <span className={`
                                            font-bold uppercase tracking-wider text-sm
                                            ${isSelected ? 'text-white' : 'text-white/70'}
                                        `}>
                                            Lane {laneNumber}
                                        </span>
                                    </div>
                                    {isSelected && (
                                        <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                                            <div className="w-2 h-2 bg-[#4CC9F0] rounded-full animate-pulse shadow-[0_0_8px_#4CC9F0]"></div>
                                            <span className="text-xs font-bold text-white">SELECTED</span>
                                        </div>
                                    )}
                                </div>

                                {/* Spacer for 3D model visibility */}
                                <div className="flex-1 relative">
                                    {/* Subtle gradient overlay at bottom */}
                                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent"></div>
                                </div>

                                {/* Bottom Info Panel */}
                                <div className={`
                                    px-4 py-3 backdrop-blur-md
                                    ${isSelected ? 'bg-black/70' : 'bg-black/50'}
                                `}>
                                    <h3 className={`
                                        text-xl font-black uppercase tracking-wide mb-2
                                        ${isSelected 
                                            ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#4CC9F0] to-[#F72585]' 
                                            : 'text-white/90'}
                                    `}>
                                        {racer.name}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className={`
                                            px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                                            ${isSelected ? 'bg-[#7209B7]/50 text-white' : 'bg-white/10 text-white/60'}
                                        `}>
                                            {racer.species}
                                        </span>
                                        <span className={`
                                            px-3 py-1 rounded-full text-xs font-bold
                                            ${isSelected ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'}
                                        `}>
                                            {racer.mass}kg
                                        </span>
                                        <div className={`
                                            ml-auto w-4 h-4 rounded-full border-2
                                            ${isSelected ? 'border-white' : 'border-white/30'}
                                        `} style={{ backgroundColor: racer.color || '#ffffff' }}></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
