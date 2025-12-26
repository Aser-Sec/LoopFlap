
import { DeathRecord } from '../types';

const STORAGE_KEY = 'loop_dash_mistakes';
const PATH_KEY = 'loop_dash_best_path';

export const getMistakes = (): DeathRecord[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const recordMistake = (score: number, y: number, obstacleType: string, path: number[]) => {
  const mistakes = getMistakes();
  const newMistake: DeathRecord = {
    score,
    y,
    obstacleType,
    timestamp: Date.now()
  };
  const updated = [newMistake, ...mistakes].slice(0, 10);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  
  // Save the path if it's the best score
  const bestScore = parseFloat(localStorage.getItem('loop_dash_best_score') || '0');
  if (score > bestScore) {
    localStorage.setItem('loop_dash_best_score', score.toString());
    localStorage.setItem(PATH_KEY, JSON.stringify(path));
  }
};

export const getBestPath = (): number[] => {
  const data = localStorage.getItem(PATH_KEY);
  return data ? JSON.parse(data) : [];
};

export const getAdaptiveMessage = (lastMistake?: DeathRecord): string => {
  if (!lastMistake) return "INITIATING NEURAL LINK...";
  
  const messages = [
    "EYES ON THE ECHO.",
    "PRECISION IS POWER.",
    "THE LOOP REMEMBERS.",
    "ADAPTING TO YOUR RHYTHM.",
    "SYNC RATIO INCREASING.",
    "BREAK THE PATTERN.",
    "FLOW STATE DETECTED.",
    "RE-CALIBRATING SEQUENCES."
  ];

  return messages[Math.floor(Math.random() * messages.length)];
};
