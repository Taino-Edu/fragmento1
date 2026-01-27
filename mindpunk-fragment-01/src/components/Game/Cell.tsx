import { motion } from 'framer-motion';
import { Bot, Zap, Flame, Lock, BoxSelect, Crosshair, Skull } from 'lucide-react';

interface CellProps {
  cellValue: number;
  visible: boolean;
  isValidTarget: boolean;
  status: string;
  onClick: () => void;
  onMouseEnter: () => void;
  // NOVAS PROPS PARA VIDA
  hp?: number; 
  maxHp?: number;
}

export const Cell = ({ cellValue, visible, isValidTarget, status, onClick, onMouseEnter, hp, maxHp }: CellProps) => {
  if (!visible) {
    return <div className="w-8 h-8 md:w-10 md:h-10 bg-black border border-punk-wall/5" />;
  }

  let cursorStyle = "cursor-default";
  if (status === 'PLAYING' && isValidTarget) {
      if (cellValue === 3) cursorStyle = "cursor-crosshair";
      else if (cellValue !== 1 && cellValue !== 6) cursorStyle = "cursor-pointer";
  }
  
  let cellClass = `w-8 h-8 md:w-10 md:h-10 flex items-center justify-center border transition-all duration-300 relative ${cursorStyle} `;
  
  if (cellValue === 1) cellClass += "bg-punk-wall/80 border-black/50";
  if (cellValue === 0) cellClass += "bg-transparent border-punk-wall/10";
  if (cellValue === 9) cellClass += "bg-punk-accent/10 border-punk-accent/50 shadow-[inset_0_0_10px_rgba(124,58,237,0.2)]"; 
  if (cellValue === 3) cellClass += "bg-red-900/10 border-red-500/20"; 
  if (cellValue === 4) cellClass += "bg-emerald-900/10 border-emerald-500/20"; 
  if (cellValue === 5) cellClass += "bg-orange-900/20 border-orange-500/40 animate-pulse"; 
  if (cellValue === 6) cellClass += "bg-punk-wall/50 border-punk-primary/50 shadow-[inset_0_0_5px_#fbbf24]"; 

  if (status === 'PLAYING' && isValidTarget && cellValue !== 1 && cellValue !== 6) {
      cellClass += " hover:bg-white/5";
  }

  // Cálculo da porcentagem de vida
  const hpPercent = (hp && maxHp) ? (hp / maxHp) * 100 : 0;

  return (
    <div className={cellClass} onClick={onClick} onMouseEnter={onMouseEnter}>
      {/* --- BARRA DE VIDA DO INIMIGO --- */}
      {cellValue === 3 && hp !== undefined && (
        <div className="absolute -top-1 left-0 w-full h-1 bg-black/50 border border-black/50">
            <div 
                className={`h-full transition-all duration-300 ${hpPercent < 30 ? 'bg-red-500' : 'bg-green-500'}`} 
                style={{ width: `${hpPercent}%` }} 
            />
        </div>
      )}

      {cellValue === 2 && (
        <motion.div layoutId="player" className="w-5 h-5 bg-punk-primary rounded-sm shadow-[0_0_15px_#fbbf24] z-20 relative" transition={{ type: "spring", stiffness: 300, damping: 25 }}>
          <div className="absolute inset-0 bg-white/50 animate-ping rounded-sm opacity-50"></div>
        </motion.div>
      )}
      
      {cellValue === 3 && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="z-10 relative">
            {/* Muda o ícone se for o Tank (HP > 40) para diferenciar visualmente */}
            {maxHp && maxHp > 40 ? 
                <Skull size={20} className="text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]" /> : 
                <Bot size={20} className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            }
            {status === 'PLAYING' && isValidTarget && <Crosshair size={12} className="absolute -top-2 -right-2 text-red-500 animate-spin-slow opacity-70"/>}
        </motion.div>
      )}
      
      {cellValue === 4 && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="z-10"><Zap size={18} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-bounce" /></motion.div>}
      {cellValue === 5 && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="opacity-80"><Flame size={16} className="text-orange-500 drop-shadow-[0_0_5px_rgba(249,115,22,0.8)]" /></motion.div>}
      {cellValue === 9 && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Lock size={16} className="text-punk-accent drop-shadow-[0_0_8px_rgba(124,58,237,0.8)]" /></motion.div>}
      {cellValue === 6 && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><BoxSelect size={20} className="text-punk-wall opacity-50" /></motion.div>}
    </div>
  );
};