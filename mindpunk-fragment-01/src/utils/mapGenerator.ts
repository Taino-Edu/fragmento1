// src/utils/mapGenerator.ts

// Tipos de Célula:
// 0: Chão, 1: Parede Fixa, 2: Player, 3: Inimigo, 
// 4: Cura, 5: Fogo, 6: Muro Móvel (Horizontal), 9: Saída

const getShortestPath = (grid: number[][], startX: number, startY: number, targetValue: number) => {
  const rows = grid.length;
  const cols = grid[0].length;
  const queue: { x: number, y: number, dist: number }[] = [{ x: startX, y: startY, dist: 0 }];
  const visited = new Set<string>();
  visited.add(`${startX},${startY}`);

  while (queue.length > 0) {
    const { x, y, dist } = queue.shift()!;
    if (grid[x][y] === targetValue) return dist;

    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      // Paredes (1) e Muros Móveis (6) bloqueiam o pathfinding inicial
      if (nx >= 0 && nx < rows && ny >= 0 && ny < cols && grid[nx][ny] !== 1 && grid[nx][ny] !== 6) {
        if (!visited.has(`${nx},${ny}`)) {
          visited.add(`${nx},${ny}`);
          queue.push({ x: nx, y: ny, dist: dist + 1 });
        }
      }
    }
  }
  return -1;
};

export const generateLevel = (level: number, maxStability: number, moveCost: number) => {
  // 1. DINÂMICA DE TAMANHO
  // Nível 1-4: 10x10 | Nível 5+: 12x12 | Nível 10+: 15x15
  let size = 10;
  if (level >= 5) size = 12;
  if (level >= 10) size = 15;

  const rows = size;
  const cols = size;

  let grid: number[][] = [];
  let validMapFound = false;
  let attempts = 0;

  while (!validMapFound && attempts < 5000) {
    attempts++;
    
    // Reset Grid
    grid = Array.from({ length: rows }, () => Array(cols).fill(1));
    const startX = 1;
    const startY = 1;
    grid[startX][startY] = 2;

    let currentX = startX;
    let currentY = startY;
    let floorCount = 0;
    
    // Níveis altos são mais "abertos" (caos) para caber as mecânicas
    const fillRatio = level >= 5 ? 0.55 : 0.40;
    const maxFloors = (rows * cols) * fillRatio;

    // Random Walk Generation
    while (floorCount < maxFloors) {
      const direction = Math.floor(Math.random() * 4);
      let nextX = currentX;
      let nextY = currentY;

      if (direction === 0) nextX--;
      if (direction === 1) nextX++;
      if (direction === 2) nextY--;
      if (direction === 3) nextY++;

      if (nextX > 0 && nextX < rows - 1 && nextY > 0 && nextY < cols - 1) {
        if (grid[nextX][nextY] === 1) {
          grid[nextX][nextY] = 0;
          floorCount++;
        }
        currentX = nextX;
        currentY = nextY;
      }
    }

    // Saída (Longe do player)
    if (grid[currentX][currentY] === 2) grid[rows-2][cols-2] = 9;
    else grid[currentX][currentY] = 9;

    const distance = getShortestPath(grid, startX, startY, 9);
    
    // Validação
    if (distance !== -1 && (distance * moveCost) <= (maxStability - 10)) {
      
      // POPULAÇÃO DO MAPA (DIFICULDADE PROGRESSIVA)
      
      // Inimigos: Base 2 + 1 a cada 3 níveis
      const maxEnemies = 2 + Math.floor(level / 3);
      let placed = 0;
      while (placed < maxEnemies) {
          const r = Math.floor(Math.random() * rows);
          const c = Math.floor(Math.random() * cols);
          if (grid[r][c] === 0 && (Math.abs(r - startX) + Math.abs(c - startY) > 3)) {
              grid[r][c] = 3; 
              placed++;
          }
      }

      // Loot: Sempre 2
      placed = 0;
      while (placed < 2) {
          const r = Math.floor(Math.random() * rows);
          const c = Math.floor(Math.random() * cols);
          if (grid[r][c] === 0) {
              grid[r][c] = 4;
              placed++;
          }
      }

      // FOGO (Apenas Nível 3+)
      if (level >= 3) {
          placed = 0;
          while (placed < 4) {
              const r = Math.floor(Math.random() * rows);
              const c = Math.floor(Math.random() * cols);
              if (grid[r][c] === 0) {
                  grid[r][c] = 5;
                  placed++;
              }
          }
      }

      // MUROS MÓVEIS (Apenas Nível 5+ "O Caos")
      if (level >= 5) {
          placed = 0;
          while (placed < 3) { // 3 Muros
              const r = Math.floor(Math.random() * rows);
              const c = Math.floor(Math.random() * cols);
              // Muros precisam de espaço lateral para mover, evitamos corredores apertados
              if (grid[r][c] === 0 && grid[r][c+1] !== 1 && grid[r][c-1] !== 1) {
                  grid[r][c] = 6; // 6 = Muro Móvel
                  placed++;
              }
          }
      }

      validMapFound = true;
    }
  }

  // Fallback seguro
  if (!validMapFound) {
      const fallbackGrid = Array.from({ length: rows }, () => Array(cols).fill(0));
      // Bordas
      for(let i=0; i<rows; i++) { fallbackGrid[i][0]=1; fallbackGrid[i][cols-1]=1; }
      for(let j=0; j<cols; j++) { fallbackGrid[0][j]=1; fallbackGrid[rows-1][j]=1; }
      fallbackGrid[1][1] = 2;
      fallbackGrid[rows-2][cols-2] = 9;
      return { grid: fallbackGrid, rows, cols };
  }

  return { grid, rows, cols };
};