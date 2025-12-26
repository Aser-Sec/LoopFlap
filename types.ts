
export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER'
}

export type ObstacleType = 'gate' | 'moving_gate' | 'glitch_gate';

export interface Obstacle {
  x: number;
  y: number; 
  width: number;
  height: number; 
  type: ObstacleType;
  color: string;
  offset?: number; // For moving gates
  speed?: number;  // For moving gates
  syncAwarded?: boolean; // New flag
}

export interface Player {
  y: number;
  velocity: number;
  radius: number;
  syncMeter: number; // 0 to 100
  isDashing: boolean;
  dashCooldown: number;
}

export interface DataOrb {
  x: number;
  y: number;
  radius: number;
  type: 'sync' | 'bonus';
  collected: boolean;
}

export interface DeathRecord {
  score: number;
  y: number;
  obstacleType: string;
  timestamp: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size?: number;
  decay?: number;
}

export interface JumpEffect {
  x: number;
  y: number;
  radius: number;
  alpha: number;
}
