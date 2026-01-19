'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useGameStore } from '@/store/gameStore';
import GameUI from '@/components/GameUI';
import OddsBoard from '@/components/OddsBoard';

// Dynamically import 3D components to avoid SSR issues with Three.js
const RaceCanvas = dynamic(() => import('@/components/RaceCanvas'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-black flex items-center justify-center"><span className="text-white">Loading 3D...</span></div>
});

export default function Home() {
  const gameState = useGameStore(state => state.state);
  const hydrate = useGameStore(state => state.hydrate);
  const isHydrated = useGameStore(state => state.isHydrated);
  const [transitioning, setTransitioning] = useState(false);

  // Hydrate the store with random data only on client
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (gameState === 'RACING') {
      setTransitioning(true);
      const timer = setTimeout(() => setTransitioning(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  // Show loading until hydrated
  if (!isHydrated) {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-black flex items-center justify-center">
        <span className="text-white text-xl">Loading...</span>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Transition Overlay */}
      {transitioning && (
        <div className="absolute inset-0 z-[100] bg-black/80 pointer-events-none flex items-center justify-center backdrop-blur-md">
          <div className="flex flex-col items-center">
            <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#4CC9F0] to-[#F72585] tracking-tighter uppercase drop-shadow-[0_0_30px_rgba(76,201,240,0.5)]">
              Ready
            </h1>
            <div className="mt-8 w-48 h-1.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
              <div className="h-full bg-gradient-to-r from-[#4CC9F0] to-[#F72585] animate-loading"></div>
            </div>
          </div>
        </div>
      )}

      {/* Main Game Area (Full Screen) */}
      <div className="relative w-full h-full">
        {/* 3D Scene Layer */}
        <div className="absolute inset-0 z-0">
          {gameState !== 'BETTING' && <RaceCanvas />}
        </div>

        {/* UI Layer */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          <GameUI />
          <OddsBoard />
        </div>
      </div>
    </div>
  );
}
