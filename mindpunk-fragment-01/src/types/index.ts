// src/types/index.ts

// 1. Tipos Básicos
export type Position = {
  x: number;
  y: number;
};

// 2. Definição dos Inimigos (NOVO)
export type EnemyType = 'drone' | 'tank' | 'runner';

export interface Enemy {
  id: string;        // Identidade única (para saber qual inimigo tomou dano)
  type: EnemyType;
  pos: Position;
  hp: number;
  maxHp: number;
  damage: number;    // Quanto ele bate
  xpValue: number;   // Quanto XP dá
}

export type Grid = number[][];

// 3. Interface do Estado Global (GameState)
export interface GameState {
  grid: Grid;
  
  // --- A MUDANÇA PRINCIPAL ESTÁ AQUI ---
  enemies: Enemy[]; // Lista de inimigos vivos
  // -------------------------------------

  rows: number;
  cols: number;
  playerPosition: Position;
  
  // Status do Jogo
  status: 'PLAYING' | 'WON' | 'GAME_OVER' | 'SELECTING_UPGRADE';
  level: number;
  
  // Stats do Player
  stability: number;
  maxStability: number;
  xp: number;
  xpToNextLevel: number;
  playerLevel: number;
  
  // Atributos de RPG
  agility: number;
  strength: number;
  defense: number;
  xpMultiplier: number;
  moveCostReduction: number;
  damageMultiplier: number;

  // Flags Especiais
  invertedControls: boolean;
  blindMode: boolean;
  isVampire: boolean;
  isGhost: boolean;

  // Interface de UI
  tacticalMode: boolean;
  previewCost: number | null;
  currentOptions: any[]; 

  // Ações
  movePlayer: (directionOrTarget: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'WAIT' | Position) => void;
  toggleTacticalMode: () => void;
  setPreviewCost: (cost: number | null) => void;
  nextLevel: () => void;
  selectCorruption: (option: any) => void;
  resetGame: () => void;
  calculateMoveCost: () => number;
}