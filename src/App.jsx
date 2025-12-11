// src/App.jsx
import React from 'react';
import RaceCanvas from './components/RaceCanvas_Cannon';
import OddsBoard from './components/OddsBoard';
import GameUI from './components/GameUI';

import { useGameStore } from './store/gameStore';

function App() {
  const gameState = useGameStore(state => state.gameState);
  const [transitioning, setTransitioning] = React.useState(false);

  React.useEffect(() => {
    if (gameState === 'RACING') {
      setTransitioning(true);
      const timer = setTimeout(() => setTransitioning(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  return (

    <div className="relative w-screen h-screen overflow-hidden">
      {/* Transition Overlay */}
      {transitioning && (
        <div className="absolute inset-0 z-[100] bg-black/80 pointer-events-none flex items-center justify-center backdrop-blur-md animate-in fade-in zoom-in duration-300">
          <div className="flex flex-col items-center">
            <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#4CC9F0] to-[#F72585] tracking-tighter uppercase drop-shadow-[0_0_30px_rgba(76,201,240,0.5)]">
              Ready
            </h1>
            <div className="mt-8 w-48 h-1.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
              <div className="h-full bg-gradient-to-r from-[#4CC9F0] to-[#F72585] animate-[loading_2s_ease-in-out_infinite]"></div>
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

      {/* Global Styles for Animations */}
      <style>{`
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    50% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
            `}</style>
    </div>
  );
}

export default App;
