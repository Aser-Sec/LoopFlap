
import React, { useRef, useEffect, useCallback } from 'react';
import { GameState, Obstacle, Player, Particle, JumpEffect, DataOrb } from '../types';
import { COLORS, GRAVITY, JUMP_FORCE, TERMINAL_VELOCITY, BASE_SPEED, MAX_SPEED, SPEED_INCREMENT, GROUND_HEIGHT, SYNC_GAIN, DASH_DURATION } from '../constants';
import { recordMistake, getBestPath } from '../services/memoryService';

interface GameCanvasProps {
  gameState: GameState;
  onGameOver: (score: number) => void;
  onUpdateScore: (score: number) => void;
  syncMeter: number;
  onUpdateSync: (val: number) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, onGameOver, onUpdateScore, syncMeter, onUpdateSync }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  const playerRef = useRef<Player & { path: number[] }>({
    y: 0,
    velocity: 0,
    radius: 14,
    syncMeter: 0,
    isDashing: false,
    dashCooldown: 0,
    path: []
  });
  
  const obstaclesRef = useRef<Obstacle[]>([]);
  const orbsRef = useRef<DataOrb[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const backgroundStarsRef = useRef<{x: number, y: number, s: number, o: number}[]>([]);
  const jumpEffectsRef = useRef<JumpEffect[]>([]);
  const bestPathRef = useRef<number[]>(getBestPath());
  
  const speedRef = useRef(BASE_SPEED);
  const lastSpawnRef = useRef(0);
  const gameTimeRef = useRef(0);
  const shakeRef = useRef(0);
  const impactRef = useRef(0);
  const hasStartedRef = useRef(false);

  const playSound = (type: 'flap' | 'death' | 'sync' | 'dash' | 'perfect', freqMod = 1) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const gain = ctx.createGain();
      const osc = ctx.createOscillator();
      
      if (type === 'flap') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180 * freqMod, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(45 * freqMod, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      } else if (type === 'perfect') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.07, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      } else if (type === 'sync') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      } else if (type === 'dash') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(40, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(60, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
      }

      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {}
  };

  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    playerRef.current = {
      y: canvas.height / 2,
      velocity: 0,
      radius: 14,
      syncMeter: 0,
      isDashing: false,
      dashCooldown: 0,
      path: []
    };

    if (backgroundStarsRef.current.length === 0) {
      for (let i = 0; i < 120; i++) {
        backgroundStarsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          s: Math.random() * 1.5 + 0.5,
          o: Math.random() * 0.4 + 0.1
        });
      }
    }

    obstaclesRef.current = [];
    orbsRef.current = [];
    particlesRef.current = [];
    jumpEffectsRef.current = [];
    bestPathRef.current = getBestPath();
    speedRef.current = BASE_SPEED;
    lastSpawnRef.current = 0;
    gameTimeRef.current = 0;
    shakeRef.current = 0;
    impactRef.current = 0;
    hasStartedRef.current = false;
    onUpdateSync(0);
  }, [onUpdateSync]);

  const createExplosion = (x: number, y: number, color: string, count = 15, force = 8) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x, y, 
        vx: (Math.random() - 0.5) * force, 
        vy: (Math.random() - 0.5) * force, 
        life: 1, 
        color, 
        size: Math.random() * 2 + 1,
        decay: Math.random() * 0.02 + 0.02
      });
    }
  };

  const spawnObstacle = useCallback((timestamp: number, width: number, height: number) => {
    const groundY = height - GROUND_HEIGHT;
    const score = Math.floor(gameTimeRef.current / 10);
    const gapSize = Math.max(140, 240 - score * 0.9);
    const gapTop = 80 + Math.random() * (groundY - gapSize - 160);

    let type: any = 'gate';
    if (score > 20) type = 'moving_gate';
    
    obstaclesRef.current.push({
      x: width + 200,
      y: gapTop,
      width: 60,
      height: gapSize,
      type,
      color: COLORS.obstacle,
      offset: 0,
      speed: 2.5 + Math.random() * 3.5,
      syncAwarded: false
    });

    if (Math.random() > 0.5) {
      orbsRef.current.push({
        x: width + 230,
        y: gapTop + gapSize / 2,
        radius: 8,
        type: 'sync',
        collected: false
      });
    }
    lastSpawnRef.current = timestamp;
  }, []);

  const update = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas || gameState !== GameState.PLAYING) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (hasStartedRef.current) {
      gameTimeRef.current += 1;
      onUpdateScore(Math.floor(gameTimeRef.current / 10));

      if (speedRef.current < MAX_SPEED) speedRef.current += SPEED_INCREMENT;
      if (shakeRef.current > 0) shakeRef.current *= 0.92;
      if (impactRef.current > 0) impactRef.current *= 0.9;

      const player = playerRef.current;
      player.path.push(player.y);

      if (player.dashCooldown > 0) {
        player.dashCooldown -= 1;
        if (player.dashCooldown <= 0) player.isDashing = false;
        createExplosion(160, player.y, COLORS.sync, 1, 0.5);
      }

      if (!player.isDashing) {
        player.velocity += GRAVITY;
        if (player.velocity > TERMINAL_VELOCITY) player.velocity = TERMINAL_VELOCITY;
        player.y += player.velocity;
      }

      const groundY = canvas.height - GROUND_HEIGHT;
      if (player.y + player.radius > groundY || player.y - player.radius < 0) {
        if (!player.isDashing) {
          recordMistake(Math.floor(gameTimeRef.current / 10), player.y, 'boundary', player.path);
          playSound('death');
          shakeRef.current = 50;
          createExplosion(160, player.y, COLORS.player, 80, 12);
          onGameOver(Math.floor(gameTimeRef.current / 10));
          return;
        }
      }

      const spawnInterval = Math.max(900, 2200 - (speedRef.current * 100));
      if (timestamp - lastSpawnRef.current > spawnInterval) {
        spawnObstacle(timestamp, canvas.width, canvas.height);
      }

      const px = 160;
      const py = player.y;

      for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
        const obs = obstaclesRef.current[i];
        obs.x -= speedRef.current;

        if (obs.type === 'moving_gate') {
          obs.offset = Math.sin(gameTimeRef.current * 0.07) * 90;
        }

        const effectiveY = obs.y + (obs.offset || 0);
        const inTop = px + player.radius > obs.x && px - player.radius < obs.x + obs.width && py - player.radius < effectiveY;
        const inBottom = px + player.radius > obs.x && px - player.radius < obs.x + obs.width && py + player.radius > effectiveY + obs.height;

        if (inTop || inBottom) {
          if (player.isDashing) {
            playSound('dash');
            impactRef.current = 1.0;
            shakeRef.current = 35;
            createExplosion(obs.x + obs.width/2, py, COLORS.obstacle, 60, 18);
            obstaclesRef.current.splice(i, 1);
            continue;
          } else {
            recordMistake(Math.floor(gameTimeRef.current / 10), player.y, obs.type, player.path);
            playSound('death');
            shakeRef.current = 50;
            createExplosion(px, py, COLORS.player, 80, 12);
            onGameOver(Math.floor(gameTimeRef.current / 10));
            return;
          }
        }

        // Perfect Sync check - Ensure it only awards once per gate
        if (!obs.syncAwarded && !inTop && !inBottom && obs.x < px && obs.x + speedRef.current > px) {
            const center = effectiveY + obs.height / 2;
            if (Math.abs(py - center) < obs.height * 0.14) {
              playSound('perfect');
              const newSync = Math.min(100, player.syncMeter + 20);
              player.syncMeter = newSync;
              onUpdateSync(newSync);
              createExplosion(px, py, COLORS.bonus, 10, 8);
              obs.syncAwarded = true;
            }
        }

        if (obs.x + obs.width < -300) obstaclesRef.current.splice(i, 1);
      }

      for (let i = orbsRef.current.length - 1; i >= 0; i--) {
        const orb = orbsRef.current[i];
        orb.x -= speedRef.current;
        const dx = px - orb.x;
        const dy = py - orb.y;
        if (Math.sqrt(dx*dx + dy*dy) < player.radius + orb.radius + 10) {
          player.syncMeter = Math.min(100, player.syncMeter + SYNC_GAIN);
          onUpdateSync(player.syncMeter);
          playSound('sync');
          createExplosion(orb.x, orb.y, COLORS.sync, 20, 5);
          orbsRef.current.splice(i, 1);
        } else if (orb.x < -100) orbsRef.current.splice(i, 1);
      }

      backgroundStarsRef.current.forEach(star => {
        star.x -= speedRef.current * 0.12;
        if (star.x < -20) star.x = canvas.width + 20;
      });
    } else {
      playerRef.current.y = (canvas.height / 2) + Math.sin(timestamp * 0.005) * 15;
    }

    particlesRef.current.forEach(p => { 
      p.x += p.vx; p.y += p.vy; p.life -= p.decay || 0.03; 
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);
    jumpEffectsRef.current.forEach(e => { e.radius += 8; e.alpha -= 0.1; });
    jumpEffectsRef.current = jumpEffectsRef.current.filter(e => e.alpha > 0);

    draw(ctx, canvas.width, canvas.height);
    requestRef.current = requestAnimationFrame(update);
  }, [gameState, spawnObstacle, onGameOver, onUpdateScore, onUpdateSync]);

  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.save();
    if (shakeRef.current > 0.5) {
      ctx.translate(Math.random() * shakeRef.current - shakeRef.current / 2, Math.random() * shakeRef.current - shakeRef.current / 2);
    }

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    backgroundStarsRef.current.forEach(star => {
      ctx.fillStyle = `rgba(255, 255, 255, ${star.o})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.s, 0, Math.PI * 2);
      ctx.fill();
    });

    if (impactRef.current > 0.01) {
      ctx.fillStyle = `rgba(255, 255, 255, ${impactRef.current * 0.15})`;
      ctx.fillRect(0, 0, w, h);
    }

    const score = Math.floor(gameTimeRef.current / 10);
    const phaseColor = score > 60 ? '#ff007b' : score > 30 ? '#7000ff' : '#00f2ff';
    
    // Grid Lines (Low Opacity)
    ctx.strokeStyle = `${phaseColor}0D`;
    ctx.lineWidth = 1;
    const gridSize = 140;
    const offsetX = (gameTimeRef.current * speedRef.current * 0.4) % gridSize;
    for (let x = -offsetX; x < w; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Echo Path
    if (bestPathRef.current.length > 0) {
      ctx.strokeStyle = `rgba(0, 242, 255, 0.08)`;
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 12]);
      ctx.beginPath();
      const pathIdx = Math.floor(gameTimeRef.current);
      const startIdx = Math.max(0, pathIdx - 30);
      for(let i = startIdx; i < pathIdx + 100 && i < bestPathRef.current.length; i++) {
        const x = 160 + (i - pathIdx) * speedRef.current;
        const y = bestPathRef.current[i];
        if (i === startIdx) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const groundY = h - GROUND_HEIGHT;
    ctx.strokeStyle = phaseColor; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(w, groundY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(w, 4); ctx.stroke();

    // Obstacles - NO GLOW (Removed shadowBlur)
    obstaclesRef.current.forEach(obs => {
      const yOff = obs.offset || 0;
      const grad = ctx.createLinearGradient(obs.x, 0, obs.x + obs.width, 0);
      grad.addColorStop(0, obs.color);
      grad.addColorStop(0.5, '#fff');
      grad.addColorStop(1, obs.color);
      
      ctx.fillStyle = grad;
      ctx.fillRect(obs.x, 0, obs.width, obs.y + yOff);
      ctx.fillRect(obs.x, obs.y + yOff + obs.height, obs.width, groundY - (obs.y + yOff + obs.height));
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(obs.x + 5, obs.y + yOff + obs.height * 0.48, obs.width - 10, obs.height * 0.04);
    });

    orbsRef.current.forEach(orb => {
      ctx.fillStyle = COLORS.sync;
      ctx.shadowBlur = 15; ctx.shadowColor = COLORS.sync;
      ctx.beginPath(); 
      ctx.arc(orb.x, orb.y, orb.radius + Math.sin(gameTimeRef.current * 0.15) * 2, 0, Math.PI * 2); 
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    const player = playerRef.current;
    ctx.save();
    ctx.translate(160, player.y);
    if (player.isDashing) {
      ctx.scale(4, 0.2);
      ctx.shadowBlur = 40; ctx.shadowColor = '#fff';
      ctx.fillStyle = '#fff';
    } else {
      ctx.rotate(player.velocity * 0.1);
      ctx.shadowBlur = 20; ctx.shadowColor = COLORS.player;
      ctx.fillStyle = COLORS.player;
    }
    ctx.beginPath();
    ctx.moveTo(player.radius + 8, 0);
    ctx.lineTo(-player.radius, -player.radius);
    ctx.lineTo(-player.radius, player.radius);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size || 2, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    jumpEffectsRef.current.forEach(e => {
      ctx.strokeStyle = `rgba(0, 242, 255, ${e.alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2); ctx.stroke();
    });

    ctx.restore();
  };

  useEffect(() => {
    const handleAction = (e: KeyboardEvent | TouchEvent | MouseEvent) => {
      if (gameState !== GameState.PLAYING) return;
      if (e instanceof KeyboardEvent && (e.repeat || (e.code !== 'Space' && e.code !== 'ArrowUp'))) return;
      if (e instanceof KeyboardEvent) e.preventDefault();

      const player = playerRef.current;
      if (!hasStartedRef.current) {
        hasStartedRef.current = true;
        lastSpawnRef.current = performance.now();
      }

      if (player.syncMeter >= 100) {
        player.isDashing = true;
        player.dashCooldown = DASH_DURATION;
        player.syncMeter = 0;
        onUpdateSync(0);
        playSound('dash');
        shakeRef.current = 25;
        createExplosion(160, player.y, '#fff', 20, 10);
      } else {
        player.velocity = JUMP_FORCE;
        const hF = 1.4 - (player.y / (canvasRef.current?.height || 1));
        playSound('flap', hF);
        jumpEffectsRef.current.push({ x: 160, y: player.y, radius: 4, alpha: 0.7 });
      }
    };

    window.addEventListener('keydown', handleAction);
    window.addEventListener('touchstart', handleAction);
    window.addEventListener('mousedown', handleAction);
    return () => {
      window.removeEventListener('keydown', handleAction);
      window.removeEventListener('touchstart', handleAction);
      window.removeEventListener('mousedown', handleAction);
    };
  }, [gameState, onUpdateSync]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initGame();
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    if (gameState === GameState.PLAYING) {
      initGame();
      requestRef.current = requestAnimationFrame(update);
    }
    return () => {
      cancelAnimationFrame(requestRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [gameState, update, initGame]);

  return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full cursor-pointer" />;
};

export default GameCanvas;
