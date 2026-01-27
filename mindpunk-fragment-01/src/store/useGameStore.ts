import { create } from 'zustand';
import { generateLevel } from '../utils/mapGenerator'; 
import { playSound } from '../utils/soundEngine';
import type { GameState, Enemy, Position } from '../types'; 
import { BASE_MOVE_COST, BASE_ATTACK_COST, XP_PER_KILL, HARDCORE_LEVEL } from '../config/constants';
import { CORRUPTION_POOL } from '../config/upgrades';
import { processEnemiesTurn } from '../logic/ai';

// --- 1. FUNÇÃO PARA AFASTAR O PORTAL (NOVO) ---
const pushExitAway = (grid: number[][], startPos: Position) => {
    let maxDist = 0;
    let exitPos = { x: 0, y: 0 };
    let currentExit = { x: 0, y: 0 };

    // Limpa a saída antiga e acha o ponto mais longe
    for(let r=0; r<grid.length; r++) {
        for(let c=0; c<grid[0].length; c++) {
            if (grid[r][c] === 9) {
                currentExit = { x: r, y: c };
                grid[r][c] = 0; // Apaga a saída original
            }
            // Só considera chão vazio (0) para ser a nova saída
            if (grid[r][c] === 0) {
                const dist = Math.abs(r - startPos.x) + Math.abs(c - startPos.y);
                if (dist > maxDist) {
                    maxDist = dist;
                    exitPos = { x: r, y: c };
                }
            }
        }
    }
    // Se achou um lugar longe, põe a saída lá. Se não, devolve onde estava.
    if (maxDist > 0) {
        grid[exitPos.x][exitPos.y] = 9;
    } else {
        grid[currentExit.x][currentExit.y] = 9;
    }
    return grid;
};

// --- 2. FUNÇÃO PARA MOVER PAREDES (NOVO) ---
const shuffleWalls = (grid: number[][], playerPos: Position, enemies: Enemy[]) => {
    const newGrid = grid.map(row => [...row]);
    
    for(let r=0; r<grid.length; r++) {
        for(let c=0; c<grid[0].length; c++) {
            // Se for Parede Móvel (6)
            if (grid[r][c] === 6) {
                // 20% de chance de se mover
                if (Math.random() > 0.2) continue;

                const directions = [
                    {x:0, y:1}, {x:0, y:-1}, {x:1, y:0}, {x:-1, y:0}
                ];
                const dir = directions[Math.floor(Math.random() * directions.length)];
                const newX = r + dir.x;
                const newY = c + dir.y;

                // Validações para não prender o jogo
                if (newX >= 0 && newX < grid.length && newY >= 0 && newY < grid[0].length) {
                    const isPlayer = (newX === playerPos.x && newY === playerPos.y);
                    const isEnemy = enemies.some(e => e.pos.x === newX && e.pos.y === newY);
                    const isEmpty = newGrid[newX][newY] === 0;

                    // Move se estiver vazio e não for em cima de ninguém
                    if (isEmpty && !isPlayer && !isEnemy) {
                        newGrid[r][c] = 0; // Libera espaço antigo
                        newGrid[newX][newY] = 6; // Ocupa novo
                    }
                }
            }
        }
    }
    return newGrid;
};

// --- 3. SPAWN DE INIMIGOS (ATUALIZADO PARA TER MAIS GENTE) ---
const extractEnemiesFromGrid = (grid: number[][], level: number): { cleanedGrid: number[][], enemies: Enemy[] } => {
    const enemies: Enemy[] = [];
    const cleanedGrid = grid.map(row => [...row]);
    
    let tankCount = 0;
    const MAX_TANKS = 2;

    // Fator de Densidade: Aumenta conforme o nível
    // Nível 1: 3% de chance extra | Nível 10: 12% de chance extra
    const spawnChance = 0.03 + (level * 0.01); 

    for(let r=0; r<grid.length; r++) {
        for(let c=0; c<grid[0].length; c++) {
            const cell = cleanedGrid[r][c];
            let shouldSpawn = false;

            // Se o mapa já trouxe um inimigo (3) OU se a sorte bater no chão vazio (0)
            if (cell === 3) {
                shouldSpawn = true;
                cleanedGrid[r][c] = 0; // Limpa o marcador 3
            } else if (cell === 0 && Math.random() < spawnChance) {
                shouldSpawn = true;
            }

            if (shouldSpawn) {
                let type: 'drone' | 'tank' | 'runner' = 'drone';
                let hp = 15; 
                const rng = Math.random();

                if (level >= 3 && tankCount < MAX_TANKS && rng > 0.85) {
                    type = 'tank'; hp = 60; tankCount++;
                } else if (level >= 2 && rng > 0.6) {
                    type = 'runner'; hp = 30;
                }

                enemies.push({
                    id: Math.random().toString(36).substr(2, 9),
                    type: type,
                    pos: { x: r, y: c },
                    hp: hp, maxHp: hp,
                    damage: type === 'tank' ? 20 : (type === 'runner' ? 15 : 10),
                    xpValue: type === 'tank' ? 60 : (type === 'runner' ? 35 : 15)
                });
            }
        }
    }
    return { cleanedGrid, enemies };
};

// Gera o estado inicial
const rawMap = generateLevel(1, 100, 10);
const mapWithFarExit = pushExitAway(rawMap.grid, {x:1, y:1}); // Empurra saída
const { cleanedGrid, enemies } = extractEnemiesFromGrid(mapWithFarExit, 1);

const INITIAL_STATE = {
    grid: cleanedGrid,
    enemies: enemies,
    rows: rawMap.rows,
    cols: rawMap.cols,
    playerPosition: { x: 1, y: 1 },
    level: 1,
    stability: 100, maxStability: 100,
    xp: 0, xpToNextLevel: 100, playerLevel: 1,
    agility: 0, strength: 0, defense: 0,
    xpMultiplier: 1, moveCostReduction: 0, damageMultiplier: 1,
    status: 'PLAYING' as const,
    invertedControls: false, blindMode: false, isVampire: false, isGhost: false,
    tacticalMode: true, previewCost: null, currentOptions: [],
};

export const useGameStore = create<GameState>((set, get) => ({
  ...INITIAL_STATE,

  toggleTacticalMode: () => set((state) => ({ tacticalMode: !state.tacticalMode })),
  setPreviewCost: (cost) => set({ previewCost: cost }),

  calculateMoveCost: () => {
      const state = get();
      const difficultyPenalty = state.level >= HARDCORE_LEVEL ? (state.level - 4) * 5 : 0;
      const overloadPenalty = Math.floor(state.stability * 0.05); 
      let cost = (BASE_MOVE_COST + difficultyPenalty + overloadPenalty) - state.agility - (state.moveCostReduction || 0);
      if (state.isGhost) cost = cost * 2;
      return Math.max(2, cost);
  },

  movePlayer: (input) => {
    const state = get();
    if (state.status !== 'PLAYING') return;

    let targetX = state.playerPosition.x;
    let targetY = state.playerPosition.y;
    let isWaitAction = input === 'WAIT';

    if (!isWaitAction) {
        if (typeof input === 'string') {
             let dir = input;
             if (state.invertedControls) {
                if (input === 'UP') dir = 'DOWN'; else if (input === 'DOWN') dir = 'UP';
                else if (input === 'LEFT') dir = 'RIGHT'; else if (input === 'RIGHT') dir = 'LEFT';
             }
             if (dir === 'UP') targetX--; if (dir === 'DOWN') targetX++;
             if (dir === 'LEFT') targetY--; if (dir === 'RIGHT') targetY++;
        } else {
             const dx = Math.abs(input.x - state.playerPosition.x);
             const dy = Math.abs(input.y - state.playerPosition.y);
             const enemyAtClick = state.enemies.find(e => e.pos.x === input.x && e.pos.y === input.y);
             if ((dx === 1 && dy === 1 && enemyAtClick) || (dx + dy === 1)) {
                 targetX = input.x; targetY = input.y;
             } else return;
        }
    }

    const isWall = state.grid[targetX][targetY] === 1 || state.grid[targetX][targetY] === 6;
    const targetEnemy = state.enemies.find(e => e.pos.x === targetX && e.pos.y === targetY);
    
    if (!isWaitAction && !targetEnemy && isWall && !state.isGhost) {
        playSound.wall();
        return; 
    }

    let newGrid = state.grid.map(row => [...row]); 
    let newStability = state.stability;
    let newEnemies = [...state.enemies];
    let { xp, playerLevel, maxStability } = state;
    let turnEnded = false;

    if (state.grid[targetX][targetY] === 9 && !isWaitAction) {
        playSound.win();
        set({ status: 'WON', playerPosition: { x: targetX, y: targetY } });
        return;
    }

    if (!isWaitAction) {
        if (targetEnemy) {
            playSound.attack();
            const attackCost = Math.max(1, BASE_ATTACK_COST - state.strength); 
            newStability -= attackCost;
            if (state.isVampire) newStability = Math.min(maxStability, newStability + 30);

            const enemyIndex = newEnemies.findIndex(e => e.id === targetEnemy.id);
            if (enemyIndex !== -1) {
                const playerDmg = 25 + state.strength;
                newEnemies[enemyIndex] = { ...newEnemies[enemyIndex], hp: newEnemies[enemyIndex].hp - playerDmg };
                if (newEnemies[enemyIndex].hp <= 0) {
                     newEnemies.splice(enemyIndex, 1); 
                     playSound.levelUp(); 
                     const adrenaline = 15 + Math.floor(maxStability * 0.1);
                     newStability = Math.min(maxStability, newStability + adrenaline);
                     xp += XP_PER_KILL * (state.xpMultiplier || 1);
                     if (xp >= state.xpToNextLevel) {
                        playerLevel++; xp -= state.xpToNextLevel; maxStability += 25; newStability = maxStability;
                    }
                }
            }
            targetX = state.playerPosition.x; targetY = state.playerPosition.y;
        } else {
            playSound.move();
            newStability -= state.calculateMoveCost();
            newGrid[state.playerPosition.x][state.playerPosition.y] = 0; 
            newGrid[targetX][targetY] = 2; 
            if (state.grid[targetX][targetY] === 4) { 
                playSound.heal(); newStability = Math.min(maxStability, newStability + 30); newGrid[targetX][targetY] = 2; 
            }
            if (state.grid[targetX][targetY] === 5) { 
                playSound.damage(); newStability -= Math.max(1, 25 - state.defense);
            }
        }
        if (state.isVampire) newStability -= 5;
        turnEnded = true;
    } else {
        turnEnded = true; 
    }

    if (turnEnded) {
        // --- MOVE INIMIGOS ---
        const aiResult = processEnemiesTurn(newGrid, newEnemies, {x: targetX, y: targetY}, state.rows, state.cols);
        newEnemies = aiResult.enemies;
        
        // --- MOVE PAREDES (Aqui chama a função nova) ---
        newGrid = shuffleWalls(newGrid, {x: targetX, y: targetY}, newEnemies);
        // -----------------------------------------------

        if (aiResult.damageDealt > 0) {
            playSound.damage();
            newStability -= Math.max(0, aiResult.damageDealt - state.defense);
        }
    }

    if (newStability <= 0) {
        playSound.gameOver();
        set({ status: 'GAME_OVER', stability: 0, enemies: newEnemies, grid: newGrid });
    } else {
        set({ 
            grid: newGrid, enemies: newEnemies, playerPosition: { x: targetX, y: targetY }, 
            stability: newStability, xp, playerLevel, maxStability 
        });
    }
  },

  nextLevel: () => {
      const pool = [...CORRUPTION_POOL];
      for (let i = pool.length - 1; i > 0; i--) { 
          const j = Math.floor(Math.random() * (i + 1)); 
          [pool[i], pool[j]] = [pool[j], pool[i]]; 
      }
      set({ status: 'SELECTING_UPGRADE', currentOptions: pool.slice(0, 3) });
  },

  selectCorruption: (option) => {
      const state = get();
      const changes = option.apply(state);
      const nextLvl = state.level + 1;
      
      const mapData = generateLevel(nextLvl, (changes.maxStability || state.maxStability), 10);
      
      // EMPURRA O PORTAL PARA LONGE
      const mapFarExit = pushExitAway(mapData.grid, {x:1, y:1});
      // GERA MAIS INIMIGOS
      const { cleanedGrid, enemies } = extractEnemiesFromGrid(mapFarExit, nextLvl);

      playSound.heal();

      let currentMaxStability = changes.maxStability || state.maxStability;
      const decayCycle = Math.floor((nextLvl - 1) / 5);
      const healPercentage = Math.max(0.1, 1.0 - (decayCycle * 0.1));
      let currentStability = changes.stability || state.stability;

      if (!changes.stability) {
          currentStability = Math.floor(currentMaxStability * healPercentage);
      }

      set({
          ...changes,
          grid: cleanedGrid, enemies, rows: mapData.rows, cols: mapData.cols,
          playerPosition: { x: 1, y: 1 },
          level: nextLvl,
          status: 'PLAYING',
          maxStability: currentMaxStability,
          stability: currentStability
      });
  },

  resetGame: () => {
      const map = generateLevel(1, 100, 10);
      const mapFar = pushExitAway(map.grid, {x:1, y:1});
      const { cleanedGrid, enemies } = extractEnemiesFromGrid(mapFar, 1);
      set({ ...INITIAL_STATE, grid: cleanedGrid, enemies, rows: map.rows, cols: map.cols });
  }
}));