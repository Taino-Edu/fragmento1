import { create } from 'zustand';
import { generateLevel } from '../utils/mapGenerator'; 
import { playSound } from '../utils/soundEngine';
import type { GameState, Enemy, Position, PlayerSkill, EnemyType } from '../types'; 
import { HARDCORE_LEVEL } from '../config/constants';
import { CORRUPTION_POOL } from '../config/upgrades';
import type { CorruptionEffect } from '../config/upgrades'; 
import { processEnemiesTurn } from '../logic/ai';

const COST_MOVE = 8;          
const COST_ATTACK = 15;       
const BASE_PLAYER_DMG = 25;   
const DRONE_BASE_HP = 15;     

// --- XP CURVE ---
const calculateNextLevelXp = (currentLevel: number) => {
    return Math.floor(100 * Math.pow(1.25, currentLevel - 1));
};

const pushExitAway = (grid: number[][], startPos: Position) => {
    let maxDist = 0; let exitPos = { x: 0, y: 0 }; let currentExit = { x: 0, y: 0 };
    for(let r=0; r<grid.length; r++) {
        for(let c=0; c<grid[0].length; c++) {
            if (grid[r][c] === 9) { currentExit = { x: r, y: c }; grid[r][c] = 0; }
            if (grid[r][c] === 0) {
                const dist = Math.abs(r - startPos.x) + Math.abs(c - startPos.y);
                if (dist > maxDist) { maxDist = dist; exitPos = { x: r, y: c }; }
            }
        }
    }
    if (maxDist > 0) grid[exitPos.x][exitPos.y] = 9; else grid[currentExit.x][currentExit.y] = 9;
    return grid;
};

const shuffleWalls = (grid: number[][], playerPos: Position, enemies: Enemy[]) => {
    const newGrid = grid.map(row => [...row]);
    for(let r=0; r<grid.length; r++) {
        for(let c=0; c<grid[0].length; c++) {
            if (grid[r][c] === 6) {
                if (Math.random() > 0.2) continue; 
                const directions = [{x:0, y:1}, {x:0, y:-1}, {x:1, y:0}, {x:-1, y:0}];
                const dir = directions[Math.floor(Math.random() * directions.length)];
                const newX = r + dir.x; const newY = c + dir.y;
                if (newX >= 0 && newX < grid.length && newY >= 0 && newY < grid[0].length) {
                    const isPlayer = (newX === playerPos.x && newY === playerPos.y);
                    const isEnemy = enemies.some(e => e.pos.x === newX && e.pos.y === newY);
                    const isEmpty = newGrid[newX][newY] === 0;
                    if (isEmpty && !isPlayer && !isEnemy) { newGrid[r][c] = 0; newGrid[newX][newY] = 6; }
                }
            }
        }
    }
    return newGrid;
};

const extractEnemiesFromGrid = (grid: number[][], level: number): { cleanedGrid: number[][], enemies: Enemy[] } => {
    const enemies: Enemy[] = [];
    const cleanedGrid = grid.map(row => [...row]);
    
    let generatorCount = 0;
    const MAX_GENERATORS = level >= 16 ? 1 + Math.floor((level - 16) / 10) : 0;
    const spawnChance = Math.min(0.15, 0.04 + (level * 0.003)); 
    const hpScaling = level * 5; 
    const dmgScaling = level * 2; 

    for(let r=0; r<grid.length; r++) {
        for(let c=0; c<grid[0].length; c++) {
            const cell = cleanedGrid[r][c];
            let shouldSpawnEnemy = false;
            
            if (cell === 3) { shouldSpawnEnemy = true; cleanedGrid[r][c] = 0; } 
            else if (cell === 0 && Math.random() < spawnChance) { shouldSpawnEnemy = true; }

            if (shouldSpawnEnemy) {
                let type: EnemyType = 'drone';
                let hp = DRONE_BASE_HP; let baseDmg = 10; let xp = 15;
                const rng = Math.random();
                const levelBonusXP = Math.floor(level * 2);

                if (level >= 16 && generatorCount < MAX_GENERATORS) {
                    type = 'generator'; hp = 300; baseDmg = 0; xp = 500 + (level * 10); generatorCount++;
                }
                else if (level >= 5 && rng < 0.3) { type = 'tank'; hp = 80; baseDmg = 30; xp = 50 + levelBonusXP; } 
                else if (level >= 3 && rng < 0.6) { type = 'runner'; hp = 25; baseDmg = 15; xp = 30 + levelBonusXP; }
                else { xp = 15 + levelBonusXP; }

                enemies.push({
                    id: Math.random().toString(36).substr(2, 9),
                    type: type, pos: { x: r, y: c },
                    hp: hp + hpScaling, maxHp: hp + hpScaling,
                    damage: baseDmg + dmgScaling, xpValue: xp,
                    spawnCooldown: 0 
                });
                continue; 
            }

            if (cleanedGrid[r][c] === 0) {
                const rngItem = Math.random();
                if (level >= 11 && rngItem < 0.01) { cleanedGrid[r][c] = 8; } 
                else if (rngItem < 0.04) { cleanedGrid[r][c] = 7; } 
                else if (rngItem < 0.09) { cleanedGrid[r][c] = Math.random() > 0.4 ? 4 : 5; } 
            }
        }
    }
    return { cleanedGrid, enemies };
};

const rawMap = generateLevel(1, 100, 20); 
const mapWithFarExit = pushExitAway(rawMap.grid, {x:1, y:1});
const { cleanedGrid, enemies } = extractEnemiesFromGrid(mapWithFarExit, 1);

const INITIAL_STATE: GameState = {
    grid: cleanedGrid, enemies: enemies, rows: rawMap.rows, cols: rawMap.cols,
    playerPosition: { x: 1, y: 1 }, level: 1,
    stability: 100, maxStability: 100, shield: 0,
    xp: 0, xpToNextLevel: 100, playerLevel: 1,
    totalKills: 0, levelKills: 0,
    agility: 0, strength: 0, defense: 0, xpMultiplier: 1, moveCostReduction: 0, damageMultiplier: 1,
    status: 'PLAYING',
    invertedControls: false, 
    blindMode: false, // --- FOG COMEÇA DESLIGADO ---
    isVampire: false, isGhost: false,
    tacticalMode: false, previewCost: null, 
    skills: [], attackRange: 1, weaponName: 'PUNHOS',
    interactionMode: 'default'
};

interface GameActions {
    movePlayer: (input: string | Position) => void;
    nextLevel: () => void;
    resetGame: () => void;
    toggleTacticalMode: () => void;
    setPreviewCost: (cost: number | null) => void;
    useSkill: (skill: PlayerSkill) => void;
    selectCorruption: (option: CorruptionEffect) => void;
    confirmJump: (x: number, y: number) => void;
    cancelAim: () => void;
    calculateMoveCost: () => number;
    calculateAttackCost: () => number;
}

interface ExtendedState extends GameState, GameActions {
    marketOptions: CorruptionEffect[];
    currentOptions: CorruptionEffect[];
}

export const useGameStore = create<ExtendedState>((set, get) => ({
  ...INITIAL_STATE,
  marketOptions: [],
  currentOptions: [],

  toggleTacticalMode: () => set((state) => ({ tacticalMode: !state.tacticalMode })),
  setPreviewCost: (cost) => set({ previewCost: cost }),
  cancelAim: () => set({ interactionMode: 'default' }),

  confirmJump: (targetX: number, targetY: number) => {
    const state = get();
    const cell = state.grid[targetX]?.[targetY];
    const enemyHere = state.enemies.find(e => e.pos.x === targetX && e.pos.y === targetY);
    const dist = Math.abs(state.playerPosition.x - targetX) + Math.abs(state.playerPosition.y - targetY);

    if (cell === 1 || cell === 6 || enemyHere || dist > 3) { playSound.wall(); return; }

    playSound.move();
    const newGrid = state.grid.map(r => [...r]);
    newGrid[state.playerPosition.x][state.playerPosition.y] = 0;
    newGrid[targetX][targetY] = 2;
    const JUMP_COST = 5; 
    
    set({ 
        grid: newGrid, playerPosition: {x: targetX, y: targetY}, 
        skills: state.skills.filter(s => s !== 'DASH'), interactionMode: 'default'
    });
    get().movePlayer('WAIT'); 
    set(s => ({ stability: Math.max(0, s.stability - JUMP_COST) }));
  },

  useSkill: (skill: PlayerSkill) => {
      const state = get();
      if (state.status !== 'PLAYING') return;
      if (skill === 'SCAN') { playSound.heal(); set({ blindMode: false, skills: state.skills.filter(s => s !== 'SCAN') }); }
      if (skill === 'DASH') { set({ interactionMode: 'aiming_jump' }); }
  },

  calculateMoveCost: () => {
      const state = get();
      const difficultyPenalty = state.level >= HARDCORE_LEVEL ? (state.level - 4) * 5 : 0;
      const overloadPenalty = Math.floor(state.stability * 0.05); 
      let cost = (COST_MOVE + difficultyPenalty + overloadPenalty) - state.agility - (state.moveCostReduction || 0);
      if (state.isGhost) cost = cost * 2;
      return Math.max(2, cost);
  },

  calculateAttackCost: () => {
      const state = get();
      return Math.max(5, COST_ATTACK - state.strength);
  },

  movePlayer: (input: string | Position) => {
    const state = get();
    if (state.status !== 'PLAYING') return;
    if (state.interactionMode !== 'default') return; 

    let targetX = state.playerPosition.x;
    let targetY = state.playerPosition.y;
    let isWaitAction = input === 'WAIT';
    let isRangedAttack = false;
    let targetEnemy = null;

    if (!isWaitAction) {
        if (typeof input === 'string') {
             let dir = input;
             if (state.invertedControls) {
                if (input === 'UP') dir = 'DOWN'; else if (input === 'DOWN') dir = 'UP';
                else if (input === 'LEFT') dir = 'RIGHT'; else if (input === 'RIGHT') dir = 'LEFT';
             }
             if (dir === 'UP') targetX--; if (dir === 'DOWN') targetX++;
             if (dir === 'LEFT') targetY--; if (dir === 'RIGHT') targetY++;
             targetEnemy = state.enemies.find(e => e.pos.x === targetX && e.pos.y === targetY);
        } else {
             const enemyAtClick = state.enemies.find(e => e.pos.x === input.x && e.pos.y === input.y);
             const dx = Math.abs(input.x - state.playerPosition.x);
             const dy = Math.abs(input.y - state.playerPosition.y);
             const dist = Math.max(dx, dy); 
             if (enemyAtClick && dist <= state.attackRange) {
                 isRangedAttack = true; targetEnemy = enemyAtClick; targetX = state.playerPosition.x; targetY = state.playerPosition.y;
             } 
             else if (dist === 1) { targetX = input.x; targetY = input.y; targetEnemy = enemyAtClick; } 
             else return; 
        }
    }

    const isWall = state.grid[targetX][targetY] === 1 || state.grid[targetX][targetY] === 6;
    if (!isWaitAction && !isRangedAttack && !targetEnemy && isWall && !state.isGhost) {
        playSound.wall(); return; 
    }

    let newGrid = state.grid.map(row => [...row]); 
    let newStability = state.stability;
    let newShield = state.shield || 0;
    let newEnemies = [...state.enemies];
    let { xp, playerLevel, maxStability, xpToNextLevel } = state; 
    let killsThisTurn = 0;
    let turnEnded = false;
    let actionCost = 0;
    const existenceCost = Math.floor(maxStability * 0.02);

    if (state.grid[targetX][targetY] === 9 && !isWaitAction) {
        playSound.win();
        set({ status: 'WON', playerPosition: { x: targetX, y: targetY } });
        return;
    }

    if (!isWaitAction) {
        if (targetEnemy) {
            playSound.attack();
            actionCost = state.calculateAttackCost();
            const enemyIndex = newEnemies.findIndex(e => e.id === targetEnemy.id);
            if (enemyIndex !== -1) {
                const playerDmg = BASE_PLAYER_DMG + state.strength;
                newEnemies[enemyIndex] = { ...newEnemies[enemyIndex], hp: newEnemies[enemyIndex].hp - playerDmg };
                if (newEnemies[enemyIndex].hp <= 0) {
                     killsThisTurn++; 
                     xp += newEnemies[enemyIndex].xpValue * (state.xpMultiplier || 1);
                     newEnemies.splice(enemyIndex, 1); 
                     playSound.levelUp(); 
                     const adrenaline = actionCost + 10;
                     newStability = Math.min(maxStability, newStability + adrenaline);
                     
                     while (xp >= xpToNextLevel) {
                        xp -= xpToNextLevel;
                        playerLevel++; 
                        maxStability += 25; 
                        newStability = maxStability; 
                        xpToNextLevel = calculateNextLevelXp(playerLevel);
                     }
                }
            }
            targetX = state.playerPosition.x; targetY = state.playerPosition.y;
        } else {
            playSound.move();
            actionCost = state.calculateMoveCost();
            newGrid[state.playerPosition.x][state.playerPosition.y] = 0; 
            newGrid[targetX][targetY] = 2; 
            
            const tile = state.grid[targetX][targetY];
            if (tile === 4) { 
                playSound.heal(); newStability = Math.min(maxStability, newStability + Math.floor(maxStability * 0.3)); newGrid[targetX][targetY] = 2; 
            }
            if (tile === 5) { playSound.damage(); newStability -= Math.max(1, 25 - state.defense); }
            if (tile === 7) { playSound.heal(); newShield += 50; newGrid[targetX][targetY] = 2; }
            if (tile === 8) {
                playSound.levelUp();
                set({ blindMode: false });
                newGrid.forEach((r, rx) => r.forEach((c, cx) => { if(c === 5) newGrid[rx][cx] = 0; }));
                newGrid[targetX][targetY] = 2; 
            }
        }
        newStability -= (existenceCost + actionCost);
        turnEnded = true;
    } else {
        playSound.move(); turnEnded = true; 
        if (state.level <= 8 && !state.isVampire) {
            const regenAmount = Math.floor(maxStability * 0.05);
            newStability = Math.min(maxStability, newStability + regenAmount - existenceCost);
        } else {
            newStability -= existenceCost;
        }
    }

    if (turnEnded) {
        newEnemies.forEach(e => {
            if (e.type === 'generator') {
                e.spawnCooldown = (e.spawnCooldown || 0) + 1;
                if (e.spawnCooldown >= 3) {
                    e.spawnCooldown = 0;
                    const dirs = [{x:1,y:0}, {x:-1,y:0}, {x:0,y:1}, {x:0,y:-1}];
                    for(let d of dirs) {
                        const sx = e.pos.x + d.x; const sy = e.pos.y + d.y;
                        const isEmpty = newGrid[sx]?.[sy] === 0;
                        const noEnemy = !newEnemies.find(en => en.pos.x === sx && en.pos.y === sy);
                        if(isEmpty && noEnemy) {
                            const spawnType = state.level >= 21 ? (Math.random() > 0.5 ? 'tank' : 'runner') : 'drone';
                            newEnemies.push({
                                id: Math.random().toString(), type: spawnType, pos: {x: sx, y: sy},
                                hp: 30, maxHp: 30, damage: 15, xpValue: 10 + (state.level * 2) 
                            });
                            break; 
                        }
                    }
                }
            }
        });

        const aiResult = processEnemiesTurn(newGrid, newEnemies, {x: targetX, y: targetY}, state.rows, state.cols);
        newEnemies = aiResult.enemies;
        newGrid = shuffleWalls(newGrid, {x: targetX, y: targetY}, newEnemies);

        if (aiResult.damageDealt > 0) {
            playSound.damage();
            let damage = Math.max(1, aiResult.damageDealt - state.defense);
            if (newShield > 0) {
                const absorbed = Math.min(newShield, damage);
                newShield -= absorbed;
                damage -= absorbed;
            }
            if (damage > 0) newStability -= damage;
        }

        if (state.isVampire) { const bleed = Math.floor(newStability * 0.02); if (bleed > 0) newStability -= bleed; }
    }

    if (newStability <= 0) {
        playSound.gameOver();
        set({ status: 'GAME_OVER', stability: 0, shield: 0, enemies: newEnemies, grid: newGrid });
    } else {
        set((prev) => ({ 
            grid: newGrid, enemies: newEnemies, playerPosition: { x: targetX, y: targetY }, 
            stability: newStability, shield: newShield, 
            xp, playerLevel, xpToNextLevel, maxStability, 
            totalKills: prev.totalKills + killsThisTurn,
            levelKills: prev.levelKills + killsThisTurn
        }));
    }
  },

  nextLevel: () => {
      const pool = [...CORRUPTION_POOL];
      const marketItems = pool.filter(p => p.cost !== undefined);
      const freeItems = pool.filter(p => p.cost === undefined);
      const shuffle = (arr: any[]) => arr.sort(() => Math.random() - 0.5);
      
      set({ 
          status: 'SELECTING_UPGRADE', 
          currentOptions: shuffle(freeItems).slice(0, 3),
          marketOptions: shuffle(marketItems).slice(0, 3)
      });
  },

  selectCorruption: (option: CorruptionEffect) => {
      const state = get();
      const changes = option.apply(state);
      const nextLvl = state.level + 1;
      
      let mapSize = 20;
      if (nextLvl > 5) mapSize = 25;
      if (nextLvl > 10) mapSize = 30;
      if (nextLvl > 15) mapSize = 35; 

      const mapData = generateLevel(nextLvl, (changes.maxStability || state.maxStability), mapSize);
      const mapFarExit = pushExitAway(mapData.grid, {x:1, y:1});
      const { cleanedGrid, enemies } = extractEnemiesFromGrid(mapFarExit, nextLvl);

      playSound.heal();

      let currentMaxStability = changes.maxStability || state.maxStability;
      let currentStability = currentMaxStability; 

      if (option.cost) { 
          currentStability -= option.cost; 
          currentStability = Math.max(1, currentStability); 
      }

      set({
          ...changes,
          grid: cleanedGrid, enemies, rows: mapData.rows, cols: mapData.cols,
          playerPosition: { x: 1, y: 1 },
          level: nextLvl,
          status: 'PLAYING',
          maxStability: currentMaxStability,
          stability: currentStability,
          shield: state.shield, 
          // --- LÓGICA DE FOG OF WAR (Sombras da Guerra) ---
          // Só ativa se o nível for 10 ou maior
          blindMode: nextLvl >= 10,
          
          levelKills: 0 
      });
  },

  resetGame: () => {
      const map = generateLevel(1, 100, 20); 
      const mapFar = pushExitAway(map.grid, {x:1, y:1});
      const { cleanedGrid, enemies } = extractEnemiesFromGrid(mapFar, 1);
      // Reseta para Level 1, sem blindMode
      set({ ...INITIAL_STATE, grid: cleanedGrid, enemies, rows: map.rows, cols: map.cols, shield: 0, totalKills: 0, levelKills: 0, blindMode: false });
  }
}));