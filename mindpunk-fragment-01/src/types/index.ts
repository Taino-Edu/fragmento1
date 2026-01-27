export type Position = {
  x: number;
  y: number;
};

export type EnemyType = 'drone' | 'tank' | 'runner' | 'generator';

export interface Enemy {
  id: string;
  type: EnemyType;
  pos: Position;
  hp: number;
  maxHp: number;
  damage: number;
  xpValue: number;
  spawnCooldown?: number;
}

export type PlayerSkill = 'DASH' | 'SCAN';

export interface GameState {
  grid: number[][];
  rows: number;
  cols: number;
  playerPosition: Position;
  enemies: Enemy[];
  
  // Progressão
  level: number; // Número da Fase (Fragmento)
  xp: number;
  xpToNextLevel: number;
  playerLevel: number; // Nível do Personagem (RPG)
  
  // ESTATÍSTICAS DE MATANÇA (NOVO)
  totalKills: number;      // Kills Totais (Run inteira)
  levelKills: number;      // Kills nesta fase atual
  
  // Status
  stability: number;
  maxStability: number;
  shield: number;
  
  // Atributos
  agility: number;
  strength: number;
  defense: number;
  
  // Multiplicadores
  xpMultiplier: number;
  moveCostReduction: number;
  damageMultiplier: number;

  status: 'PLAYING' | 'WON' | 'GAME_OVER' | 'SELECTING_UPGRADE';
  
  // Configs
  invertedControls: boolean;
  blindMode: boolean;
  isVampire: boolean;
  isGhost: boolean;
  tacticalMode: boolean;
  previewCost: number | null;
  
  skills: PlayerSkill[];
  attackRange: number;
  weaponName: string;

  interactionMode: 'default' | 'aiming_jump' | 'aiming_scan';
}