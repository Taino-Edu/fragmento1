import { motion } from 'framer-motion';
// Ícones novos: Server (Gerador), ShieldCheck (Item Escudo), Terminal (Hack)
import { Bot, Zap, Flame, Lock, BoxSelect, Crosshair, Skull, Sword, Server, ShieldCheck, Terminal } from 'lucide-react'; 
import { useGameStore } from '../../store/useGameStore'; 
import { useMemo } from 'react';

interface CellProps {
  cellValue: number; visible: boolean; isValidTarget: boolean; status: string;
  onClick: () => void; onMouseEnter: () => void; hp?: number; maxHp?: number;
  x: number; y: number;
}

export const Cell = ({ cellValue, visible, isValidTarget, status, onClick, onMouseEnter, hp, maxHp, x, y }: CellProps) => {
  const { attackRange, interactionMode, confirmJump, playerPosition, enemies } = useGameStore();
  const isRanged = attackRange > 1;

  // Verifica tipo de inimigo (se for 3, é inimigo)
  const enemyData = cellValue === 3 ? enemies.find(e => e.pos.x === x && e.pos.y === y) : null;
  const isGenerator = enemyData?.type === 'generator';

  const isJumpTarget = useMemo(() => {
    if (interactionMode !== 'aiming_jump') return false;
    const dist = Math.abs(playerPosition.x - x) + Math.abs(playerPosition.y - y);
    const isWalkable = cellValue !== 1 && cellValue !== 6 && cellValue !== 3;
    return visible && isWalkable && dist <= 3;
  }, [interactionMode, visible, cellValue, playerPosition, x, y]);

  if (!visible) {
    return <div className="w-8 h-8 md:w-10 md:h-10 bg-black border border-punk-wall/5" />;
  }

  const handleClick = () => {
    if (interactionMode === 'aiming_jump') { if (isJumpTarget) confirmJump(x, y); return; }
    onClick();
  };

  let cellClass = `w-8 h-8 md:w-10 md:h-10 flex items-center justify-center border transition-all duration-300 relative `;
  let cursorStyle = "cursor-default";

  // Estilos Base
  if (cellValue === 1) cellClass += "bg-punk-wall/80 border-black/50";
  else if (cellValue === 0) cellClass += "bg-transparent border-punk-wall/10";
  else if (cellValue === 9) cellClass += "bg-punk-accent/10 border-punk-accent/50 shadow-[inset_0_0_10px_rgba(124,58,237,0.2)]"; // Saída
  else if (cellValue === 3) cellClass += isGenerator ? "bg-red-900/40 border-red-500 shadow-[0_0_15px_#ef4444]" : "bg-red-900/10 border-red-500/20"; // Inimigos
  else if (cellValue === 4) cellClass += "bg-emerald-900/10 border-emerald-500/20"; // Cura
  else if (cellValue === 5) cellClass += "bg-orange-900/20 border-orange-500/40 animate-pulse"; // Armadilha
  else if (cellValue === 6) cellClass += "bg-punk-wall/50 border-punk-primary/50"; // Parede Quebrável
  else if (cellValue === 7) cellClass += "bg-purple-900/20 border-purple-500/40"; // ESCUDO
  else if (cellValue === 8) cellClass += "bg-cyan-900/20 border-cyan-500/40 animate-pulse"; // TERMINAL

  if (interactionMode === 'aiming_jump') {
      if (isJumpTarget) cellClass = "w-8 h-8 md:w-10 md:h-10 flex items-center justify-center border relative cursor-pointer bg-purple-900/40 border-purple-500 animate-pulse";
      else cellClass += " opacity-20 grayscale cursor-not-allowed"; 
  } else {
      if (status === 'PLAYING' && isValidTarget && cellValue !== 1 && cellValue !== 6) {
          cellClass += " cursor-pointer hover:bg-white/5";
          if (cellValue === 3) cursorStyle = isRanged ? "cursor-crosshair" : "cursor-pointer";
      }
  }

  const hpPercent = (hp && maxHp) ? (hp / maxHp) * 100 : 0;

  return (
    <div className={`${cellClass} ${cursorStyle}`} onClick={handleClick} onMouseEnter={onMouseEnter}>
      {cellValue === 3 && hp !== undefined && (
        <div className="absolute -top-1 left-0 w-full h-1 bg-black/50 border border-black/50">
            <div className={`h-full ${hpPercent < 30 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${hpPercent}%` }} />
        </div>
      )}

      {cellValue === 2 && (
        <motion.div layoutId="player" className="w-5 h-5 bg-punk-primary rounded-sm shadow-[0_0_15px_#fbbf24] z-20 relative">
          <div className="absolute inset-0 bg-white/50 animate-ping rounded-sm opacity-50"></div>
        </motion.div>
      )}
      
      {cellValue === 3 && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="z-10 relative">
            {isGenerator ? (
                <Server size={24} className="text-red-500 drop-shadow-[0_0_10px_#ef4444]" />
            ) : (
                maxHp && maxHp > 40 ? <Skull size={20} className="text-red-600" /> : <Bot size={20} className="text-red-500" />
            )}
            
            {status === 'PLAYING' && isValidTarget && interactionMode === 'default' && (
                <div className="absolute -top-3 -right-3 text-red-400 animate-bounce bg-black/50 rounded-full p-[1px]">
                    {isRanged ? <Crosshair size={16} /> : <Sword size={16} />}
                </div>
            )}
        </motion.div>
      )}
      
      {cellValue === 4 && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="z-10"><Zap size={18} className="text-emerald-400" /></motion.div>}
      {cellValue === 5 && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="opacity-80"><Flame size={16} className="text-orange-500" /></motion.div>}
      {cellValue === 9 && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Lock size={16} className="text-punk-accent" /></motion.div>}
      {cellValue === 6 && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><BoxSelect size={20} className="text-punk-wall opacity-50" /></motion.div>}
      
      {/* NOVOS ITENS */}
      {cellValue === 7 && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><ShieldCheck size={18} className="text-purple-400 drop-shadow-[0_0_8px_#a855f7]" /></motion.div>}
      {cellValue === 8 && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Terminal size={18} className="text-cyan-400 drop-shadow-[0_0_8px_#06b6d4]" /></motion.div>}
    </div>
  );
};