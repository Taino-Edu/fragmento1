import { useGameStore } from '../../store/useGameStore';
import { Cell } from './Cell';

export const Grid = () => {
  const { 
    grid, enemies, cols, playerPosition, blindMode, status, movePlayer, 
    setPreviewCost, tacticalMode, strength, moveCostReduction, agility 
  } = useGameStore();

  const isVisible = (r: number, c: number) => {
    if (!blindMode) return true;
    const dist = Math.sqrt(Math.pow(r - playerPosition.x, 2) + Math.pow(c - playerPosition.y, 2));
    return dist < 3.5;
  };

  const handleCellClick = (r: number, c: number) => {
      movePlayer({x: r, y: c});
  };

  const handleCellHover = (r: number, c: number, hasEnemy: boolean) => {
      if (tacticalMode && grid[r][c] !== 1 && grid[r][c] !== 6) {
          const baseAttack = 15; 
          const attackCost = Math.max(1, baseAttack - strength);
          
          let moveCost = 10;
          const level = useGameStore.getState().level; 
          if(level >= 5) moveCost += (level - 4) * 5;
          moveCost = Math.max(2, moveCost - agility - (moveCostReduction || 0));
          
          const cost = hasEnemy ? attackCost : moveCost;
          setPreviewCost(cost);
      } else {
          setPreviewCost(null);
      }
  };

  return (
    <div 
        className="relative bg-black/40 border border-punk-wall/50 p-3 shadow-[0_0_40px_rgba(124,58,237,0.15)] backdrop-blur-sm rounded-sm grid gap-0" 
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        onMouseLeave={() => setPreviewCost(null)}
    >
        {grid.map((row, rowIndex) => (
            row.map((cellValue, colIndex) => {
                const enemyHere = enemies.find(e => e.pos.x === rowIndex && e.pos.y === colIndex);
                const finalValue = enemyHere ? 3 : cellValue;

                const dx = Math.abs(rowIndex - playerPosition.x);
                const dy = Math.abs(colIndex - playerPosition.y);
                const isNeighbor = dx + dy === 1;
                const isDiagonalEnemy = (dx === 1 && dy === 1 && !!enemyHere);
                const isValidTarget = isNeighbor || isDiagonalEnemy;

                return (
                    <Cell 
                        key={`${rowIndex}-${colIndex}`}
                        cellValue={finalValue}
                        // --- AQUI ESTÁ A MUDANÇA: Passamos HP e MaxHP ---
                        hp={enemyHere?.hp}
                        maxHp={enemyHere?.maxHp}
                        // ------------------------------------------------
                        visible={isVisible(rowIndex, colIndex)}
                        isValidTarget={isValidTarget}
                        status={status}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        onMouseEnter={() => handleCellHover(rowIndex, colIndex, !!enemyHere)}
                    />
                );
            })
        ))}
    </div>
  );
};