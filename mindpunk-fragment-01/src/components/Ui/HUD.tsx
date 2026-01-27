import { useGameStore } from '../../store/useGameStore';
import { Heart, Shield, Zap, Activity, Scan, Footprints, Hourglass, Skull, Crosshair } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const HUD = () => {
  const { 
    stability, maxStability, playerLevel, level,
    strength, agility, defense, shield,
    previewCost, skills, useSkill, movePlayer, status, interactionMode, cancelAim,
    xp, xpToNextLevel, totalKills, levelKills 
  } = useGameStore();

  if (status !== 'PLAYING') return null;

  const currentHpPercent = Math.max(0, (stability / maxStability) * 100);
  const costPercent = previewCost ? Math.min(currentHpPercent, (previewCost / maxStability) * 100) : 0;
  const safeHpPercent = currentHpPercent - costPercent;
  const barColor = safeHpPercent > 50 ? 'bg-punk-primary' : safeHpPercent > 20 ? 'bg-orange-500' : 'bg-red-600';
  
  // Escudo agora pode passar de 100%, mas para a barra visual limitamos a 100
  const shieldPercent = shield ? Math.min(100, (shield / maxStability) * 100) : 0;
  
  const xpPercent = Math.min(100, (xp / xpToNextLevel) * 100);

  return (
    <>
      <AnimatePresence>
        {interactionMode === 'aiming_jump' && (
            <motion.div 
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-black/80 border border-purple-500 px-6 py-2 rounded shadow-[0_0_15px_#a855f7] text-purple-400 font-mono text-sm flex items-center gap-2"
            >
                <Zap size={14} className="animate-pulse"/> SELECIONE O DESTINO
            </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-2xl flex flex-col gap-2 mb-4 p-4 bg-black/60 border border-punk-wall/30 backdrop-blur-md rounded-lg shadow-lg relative z-10">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-end text-xs md:text-sm font-mono text-punk-wall uppercase tracking-widest mb-1">
            <span className="text-punk-primary drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]">
                {`FRAG_0${level}`}
            </span>
            
            <div className="flex gap-4 items-center text-gray-400">
                <div className="flex items-center gap-1" title="Kills na Fase">
                    <Crosshair size={12} className="text-red-400" />
                    <span>{levelKills}</span>
                </div>
                <div className="flex items-center gap-1" title="Kills Totais">
                    <Skull size={12} className="text-yellow-500" />
                    <span>{totalKills}</span>
                </div>
            </div>

            <div className="flex gap-4">
                {previewCost !== null && (
                   <span className="text-red-500 font-bold animate-pulse drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]">
                     CUSTO: -{previewCost}
                   </span>
                )}
                <span>LVL {playerLevel}</span>
            </div>
        </div>

        {/* CONTAINER DAS BARRAS DE STATUS */}
        <div className="flex flex-col gap-[2px]">
            
            {/* 1. BARRA DE ESCUDO (Separada) */}
            {shield > 0 && (
                <div className="w-full h-2 bg-blue-900/20 rounded-t-sm relative overflow-hidden flex items-center">
                     <motion.div 
                        className="h-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"
                        initial={{ width: 0 }}
                        animate={{ width: `${shieldPercent}%` }}
                     />
                     <span className="absolute right-1 text-[8px] text-cyan-200 font-bold tracking-widest z-10">
                        SHIELD: {shield}
                     </span>
                </div>
            )}

            {/* 2. BARRA DE VIDA */}
            <div className={`relative w-full h-4 bg-gray-900/80 border border-gray-700/50 flex overflow-hidden ${shield > 0 ? 'rounded-b-sm' : 'rounded-sm'}`}>
                {/* Vida Segura */}
                <motion.div className={`h-full ${barColor} shadow-[0_0_10px_currentColor]`} initial={{ width: '100%' }} animate={{ width: `${safeHpPercent}%` }} />
                
                {/* Dano Previsto */}
                {previewCost !== null && previewCost > 0 && (
                  <motion.div className="h-full bg-red-600/80" initial={{ width: 0 }} animate={{ width: `${costPercent}%`, opacity: [0.5, 1, 0.5] }} transition={{ opacity: { repeat: Infinity, duration: 0.5 } }} />
                )}
                
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white/90 tracking-wider z-20 gap-2 drop-shadow-md">
                    <Heart size={10} className="fill-current text-red-500" /> 
                    {stability} / {maxStability} 
                </div>
            </div>
            
            {/* 3. BARRA DE XP */}
            <div className="w-full h-1 bg-gray-900 rounded-full mt-1 relative overflow-hidden">
                <motion.div className="h-full bg-yellow-500 shadow-[0_0_5px_#fbbf24]" initial={{ width: 0 }} animate={{ width: `${xpPercent}%` }} transition={{ type: "tween", ease: "easeOut", duration: 0.5 }} />
            </div>

        </div>

        {/* Atributos */}
        <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono mt-1">
            <div className="flex gap-3">
                <span className="flex items-center gap-1"><Footprints size={10} /> AGI: {agility}</span>
                <span className="flex items-center gap-1"><Activity size={10} /> STR: {strength}</span>
                <span className="flex items-center gap-1"><Shield size={10} /> DEF: {defense}</span>
            </div>
            <span className="text-yellow-600/50">{Math.floor(xp)} / {xpToNextLevel} XP</span>
        </div>
      </div>

      {/* Botões Laterais (Mantidos Iguais) */}
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-3 z-50 items-end">
        <AnimatePresence>
            {interactionMode !== 'default' && (
                <motion.button initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 50, opacity: 0 }} onClick={cancelAim} className="group relative flex items-center justify-end">
                    <span className="mr-2 bg-black/90 text-red-400 text-[10px] px-2 py-1 rounded border border-red-500/30">CANCELAR</span>
                    <div className="w-10 h-10 bg-black/80 border border-red-500 text-red-400 flex items-center justify-center rounded-md hover:bg-red-900/40 cursor-pointer"><span className="text-lg font-bold">X</span></div>
                </motion.button>
            )}
        </AnimatePresence>

        <AnimatePresence>
            {skills.includes('DASH') && (
                <motion.button initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 50, opacity: 0 }} onClick={() => useSkill('DASH')} className="group relative flex items-center justify-end">
                    <div className={`w-10 h-10 md:w-12 md:h-12 bg-black/80 border flex items-center justify-center rounded-md transition-all cursor-pointer ${interactionMode === 'aiming_jump' ? 'border-purple-500 text-purple-400 shadow-[0_0_15px_#a855f7]' : 'border-cyan-500 text-cyan-400'}`}><Zap size={20} /></div>
                </motion.button>
            )}
        </AnimatePresence>
        
        <AnimatePresence>
            {skills.includes('SCAN') && (
                <motion.button initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 50, opacity: 0 }} onClick={() => useSkill('SCAN')} className="group relative flex items-center justify-end">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-black/80 border border-emerald-500 text-emerald-400 flex items-center justify-center rounded-md hover:bg-emerald-500/20"><Scan size={20} /></div>
                </motion.button>
            )}
        </AnimatePresence>

        <button onClick={() => movePlayer('WAIT')} className="group relative flex items-center justify-end mt-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-black/60 border border-gray-600 text-gray-500 flex items-center justify-center rounded-full hover:bg-gray-700/30"><Hourglass size={16} /></div>
        </button>
      </div>
    </>
  );
};