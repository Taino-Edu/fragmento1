import { useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Cell } from './Cell';
import { AnimatePresence, motion } from 'framer-motion';

export const Grid = () => {
  const { 
    grid, status, playerPosition, movePlayer, enemies,
    blindMode, calculateMoveCost, calculateAttackCost, setPreviewCost,
    tacticalMode // Importante!
  } = useGameStore();

  const checkVisibility = (r: number, c: number) => {
    if (!blindMode) return true;
    const dist = Math.abs(r - playerPosition.x) + Math.abs(c - playerPosition.y);
    return dist <= 4; 
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative">
      <div 
        className="grid gap-1 p-3 bg-black/80 border-2 border-punk-wall rounded-xl shadow-[0_0_50px_rgba(124,58,237,0.15)] backdrop-blur-sm"
        style={{ gridTemplateColumns: `repeat(${grid[0].length}, minmax(0, 1fr))` }}
        onMouseLeave={() => setPreviewCost(null)} 
      >
        {grid.map((row, rowIndex) => (
          row.map((cellValue, colIndex) => {
            const enemyHere = enemies.find(e => e.pos.x === rowIndex && e.pos.y === colIndex);
            const displayValue = enemyHere ? 3 : cellValue;
            const isVisible = checkVisibility(rowIndex, colIndex);

            return (
              <Cell 
                key={`${rowIndex}-${colIndex}`}
                x={rowIndex} 
                y={colIndex} 
                cellValue={displayValue}
                visible={isVisible}
                isValidTarget={true} 
                status={status}
                
                onClick={() => movePlayer({ x: rowIndex, y: colIndex })}
                
                // --- CORREÇÃO DO BUG DO PREVIEW ---
                onMouseEnter={() => {
                    // 1. Respeita se o botão "Preview" está ligado
                    if (!tacticalMode) {
                        setPreviewCost(null);
                        return;
                    }

                    // 2. Se for Inimigo visível -> Mostra Custo de Ataque
                    if (isVisible && displayValue === 3) {
                        setPreviewCost(calculateAttackCost());
                        return;
                    }

                    // 3. Se for Chão/Item visível -> Mostra Custo de Movimento
                    // 0=Chão, 4=Cura, 5=Trap, 7=Shield, 8=Terminal
                    const isWalkable = [0, 4, 5, 7, 8].includes(displayValue);
                    if (isVisible && isWalkable) {
                        setPreviewCost(calculateMoveCost());
                    } else {
                        setPreviewCost(null);
                    }
                }}
                
                hp={enemyHere?.hp} 
                maxHp={enemyHere?.maxHp}
              />
            );
          })
        ))}
      </div>

      <AnimatePresence>
        {status === 'GAME_OVER' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
            className="absolute inset-0 bg-black/90 flex items-center justify-center flex-col z-50 rounded-xl"
          >
            <h1 className="text-4xl text-red-600 font-bold mb-4 tracking-widest glitch-text">SISTEMA FALHOU</h1>
            <button 
              onClick={() => useGameStore.getState().resetGame()} 
              className="px-6 py-3 border border-red-600 text-red-500 hover:bg-red-600 hover:text-white transition-all font-mono tracking-widest uppercase text-sm"
            >
              Reiniciar Protocolo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};