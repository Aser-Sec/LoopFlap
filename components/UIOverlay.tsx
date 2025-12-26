
import React from 'react';
import { GameState } from '../types';
import { getAdaptiveMessage, getMistakes } from '../services/memoryService';

interface UIOverlayProps {
  gameState: GameState;
  score: number;
  syncMeter: number;
  onStart: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ gameState, score, syncMeter, onStart }) => {
  const lastMistake = getMistakes()[0];
  const adaptiveMsg = getAdaptiveMessage(lastMistake);
  const phase = score > 60 ? 'PHASE_03: APEX' : score > 30 ? 'PHASE_02: RESONANCE' : 'PHASE_01: SYNC';

  if (gameState === GameState.START) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-3xl z-20 p-6 text-center overflow-hidden">
        <div className="flex flex-col items-center max-w-lg w-full animate-in fade-in slide-in-from-bottom-12 duration-1000">
            
            <div className="mb-6 inline-block px-5 py-2 border border-[#00f2ff]/40 rounded-full bg-[#00f2ff]/10">
                <span className="text-[#00f2ff] font-orbitron text-[11px] tracking-[0.5em] font-black uppercase">AserFlow Digital Labs</span>
            </div>

            <h1 className="text-6xl md:text-9xl font-orbitron font-black tracking-tighter mb-6 italic leading-tight select-none">
              <span className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">LOOP</span>
              <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f2ff] via-[#7000ff] to-[#ff007b]">FLAP</span>
            </h1>
            
            <div className="w-full bg-white/5 border border-white/10 p-8 md:p-10 rounded-[2.5rem] mb-12 backdrop-blur-3xl shadow-2xl relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-[#00f2ff] to-[#ff007b] rounded-b-full"></div>
                <p className="text-gray-200 mb-8 text-base md:text-lg font-light tracking-wide leading-relaxed">
                    Survive the <span className="text-cyan-400 font-bold">FLIGHT PROTOCOL</span>.
                    <br/>Collect orbs to charge <span className="text-[#ff007b] font-bold">DASH</span>.
                </p>
                <div className="flex justify-center gap-4">
                    <div className="flex flex-col items-center">
                        <span className="bg-white text-black text-[12px] font-orbitron font-black px-8 py-3 rounded-xl uppercase tracking-widest hover:scale-105 transition-transform active:scale-95 cursor-pointer" onClick={onStart}>Initialize</span>
                        <span className="text-gray-500 text-[10px] mt-2 font-mono">SPACE / TAP</span>
                    </div>
                </div>
            </div>

            <div className="text-gray-600 font-mono text-[10px] tracking-[0.6em] uppercase flex flex-col gap-2">
              <span>Secure Connection: AserFlow-X1</span>
              <span className="opacity-40">System Build v2.4.0</span>
            </div>
        </div>
      </div>
    );
  }

  if (gameState === GameState.GAMEOVER) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/98 z-30 p-6 animate-in fade-in duration-700">
        <div className="text-[#ff007b] font-orbitron text-xl md:text-2xl mb-6 tracking-[0.8em] font-black opacity-90">
          LINK_SEVERED
        </div>
        
        <div className="text-white text-9xl md:text-[14rem] font-orbitron font-black mb-10 leading-none tabular-nums drop-shadow-[0_0_40px_rgba(255,0,123,0.5)]">
          {score}
        </div>

        <div className="bg-[#00f2ff]/5 border border-[#00f2ff]/20 px-10 py-5 rounded-3xl mb-16 text-center max-w-sm">
          <div className="text-gray-500 text-[10px] font-mono tracking-widest mb-2 uppercase">AserFlow Analysis</div>
          <div className="text-[#00f2ff] font-orbitron text-sm md:text-lg tracking-[0.1em] uppercase font-bold italic leading-tight">
            "{adaptiveMsg}"
          </div>
        </div>

        <button 
          onClick={onStart}
          className="group px-16 py-6 border-4 border-white text-white font-orbitron font-black text-2xl md:text-3xl rounded-full hover:bg-white hover:text-black transition-all transform hover:scale-105 active:scale-95"
        >
          RE-SYNC
        </button>

        <div className="absolute bottom-12 text-gray-700 font-orbitron text-[10px] font-bold tracking-[1em] uppercase opacity-40">
          ASERFLOW RESEARCH DIVISION
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-0 left-0 w-full p-8 md:p-14 flex justify-between items-start pointer-events-none z-10">
      <div className="font-orbitron">
        <div className={`text-white text-6xl md:text-8xl font-black tabular-nums transition-all ${syncMeter >= 100 ? 'text-yellow-400 scale-110 drop-shadow-[0_0_20px_#ffee00]' : 'opacity-90'}`}>{score}</div>
        <div className="flex items-center gap-3 mt-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00f2ff] animate-pulse"></div>
            <div className="text-[#00f2ff] text-[10px] md:text-[12px] tracking-[0.4em] uppercase font-black opacity-60">{phase}</div>
        </div>
      </div>
      
      <div className="flex flex-col items-end gap-4 w-44 md:w-64">
        <div className="flex justify-between w-full items-baseline px-1">
           <span className="font-orbitron text-[10px] text-white/30 tracking-widest uppercase font-bold">ASERFLOW_SYNC</span>
           <span className={`font-mono text-[12px] tracking-widest uppercase font-black ${syncMeter >= 100 ? 'text-yellow-400' : 'text-white'}`}>{Math.floor(syncMeter)}%</span>
        </div>
        <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/10 backdrop-blur-md">
            <div 
              className="h-full transition-all duration-300 relative rounded-full" 
              style={{ 
                width: `${syncMeter}%`, 
                background: syncMeter >= 100 ? '#ffee00' : 'linear-gradient(90deg, #00f2ff, #7000ff)',
                boxShadow: syncMeter >= 100 ? '0 0 20px #ffee00' : 'none'
              }} 
            />
        </div>
        {syncMeter >= 100 && (
          <div className="text-[11px] font-orbitron text-black bg-white px-4 py-1.5 rounded-md animate-bounce tracking-widest font-black shadow-lg">
            DASH_ACTIVE
          </div>
        )}
      </div>
    </div>
  );
};

export default UIOverlay;
