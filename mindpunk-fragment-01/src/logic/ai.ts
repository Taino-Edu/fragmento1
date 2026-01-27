import type { Position, Enemy } from '../types';

// Função auxiliar de verificação
const isBlocked = (grid: number[][], x: number, y: number, otherEnemies: Enemy[]) => {
    // Bloqueia se for Parede (1), Muro Móvel (6) ou Saída (9)
    if (x < 0 || x >= grid.length || y < 0 || y >= grid[0].length) return true;
    const cell = grid[x][y];
    if (cell === 1 || cell === 6 || cell === 9) return true;
    
    // Bloqueia se tiver OUTRO inimigo no lugar (para não ficarem um em cima do outro)
    if (otherEnemies.some(e => e.pos.x === x && e.pos.y === y)) return true;
    
    return false;
};

export const processEnemiesTurn = (
    grid: number[][], 
    enemies: Enemy[], 
    playerPos: Position, 
    rows: number, 
    cols: number
) => {
    let damageDealt = 0;
    
    // Mapeia cada inimigo para sua nova posição
    const updatedEnemies = enemies.map(enemy => {
        // Cria uma cópia do inimigo para não alterar o original diretamente
        const newEnemy = { ...enemy };
        
        const dx = playerPos.x - newEnemy.pos.x; 
        const dy = playerPos.y - newEnemy.pos.y;
        
        // Se estiver ao lado do player (distância de 1 casa), ATACA!
        if (Math.abs(dx) + Math.abs(dy) === 1) {
            damageDealt += newEnemy.damage;
            return newEnemy; // Não move, só bate
        }

        // --- Lógica de Movimento (Perseguição) ---
        let tryX = newEnemy.pos.x + Math.sign(dx); 
        let tryY = newEnemy.pos.y + Math.sign(dy);
        
        // Prioriza mover no eixo onde a distância é maior
        if (Math.abs(dx) > Math.abs(dy)) tryY = newEnemy.pos.y; 
        else tryX = newEnemy.pos.x;

        // Filtra os outros inimigos para saber se vai bater neles
        const others = enemies.filter(e => e.id !== enemy.id);
        
        // Se o caminho principal estiver bloqueado, tenta o caminho alternativo (Flanquear)
        if (isBlocked(grid, tryX, tryY, others)) {
            // Reseta para posição original
            tryX = newEnemy.pos.x; 
            tryY = newEnemy.pos.y;
            
            // Tenta o outro eixo
            if (Math.abs(dx) > Math.abs(dy)) { 
                if (dy !== 0) tryY += Math.sign(dy); 
            } else { 
                if (dx !== 0) tryX += Math.sign(dx); 
            }
        }
        
        // Se o caminho alternativo TAMBÉM estiver livre, move. Se não, fica parado.
        if (!isBlocked(grid, tryX, tryY, others)) {
            newEnemy.pos = { x: tryX, y: tryY };
        }

        return newEnemy;
    });

    return { enemies: updatedEnemies, damageDealt };
};