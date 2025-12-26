
import React, { useState, useCallback } from 'react';
import { GameState } from './types';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [currentScore, setCurrentScore] = useState(0);
  const [syncMeter, setSyncMeter] = useState(0);

  const startGame = useCallback(() => {
    setGameState(GameState.PLAYING);
    setSyncMeter(0);
  }, []);

  const handleGameOver = useCallback((score: number) => {
    setCurrentScore(score);
    setGameState(GameState.GAMEOVER);
  }, []);

  const handleUpdateScore = useCallback((score: number) => {
    setCurrentScore(score);
  }, []);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden flex items-center justify-center">
      <GameCanvas 
        gameState={gameState} 
        onGameOver={handleGameOver} 
        onUpdateScore={handleUpdateScore}
        syncMeter={syncMeter}
        onUpdateSync={setSyncMeter}
      />
      
      <UIOverlay 
        gameState={gameState} 
        score={currentScore} 
        syncMeter={syncMeter}
        onStart={startGame} 
      />

      {/* Subtle Scanlines effect overlay */}
      <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]"></div>
    </div>
  );
};

export default App;
