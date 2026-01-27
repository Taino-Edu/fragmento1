// src/components/UI/HUD.tsx
import { motion } from 'framer-motion';
import { Terminal, Activity, Weight, Wind, Zap, Shield, Droplet, Ghost } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

export const HUD = () => {
  const { 
    level, playerLevel, stability, maxStability, xp, xpToNextLevel, 
    previewCost, calculateMoveCost, agility, strength, defense,
    invertedControls, blindMode, isVampire, isGhost 
  } = useGameStore();

  const predictedHp = previewCost ? (stability - previewCost) : stability;
  const fillPercent = (stability / maxStability) * 100;
  const xpPercent = (xp / xpToNextLevel) * 100;
  const costPercent = previewCost ? (previewCost / maxStability) * 100 : 0;
  
  const barColor = fillPercent > 30 ? 'bg-punk-primary shadow-[0_0_10px_#fbbf24]' : 'bg-punk-accent shadow-[0_0_10px_#7c3aed]';
  const currentMoveCost = calculateMoveCost(); // Esse mostra o custo do movimento atual (sem alvo específico)
  const overload = Math.floor(stability * 0.05);

  return (
    <div className="flex flex-col items-center w-full max-w-2xl relative z-10 mb-4">
        {/* Header / Título */}
        <div className="mb-4 text-punk-primary text-center space-y-2 w-full max-w-md" translate="no">
            <h1 className="text-2xl tracking-[0.2em] uppercase flex items-center justify-center gap-3 notranslate drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]">
              <Terminal size={24} />
              Mindpunk <span className="text-punk-wall text-sm">//</span> Frag_{level.toString().padStart(2, '0')}
            </h1>
            
            {/* Status Effects */}
            <div className="flex justify-center flex-wrap gap-2 text-[10px] uppercase tracking-wider text-punk-accent min-h-[20px]">
                {invertedControls && <span className="border border-punk-accent px-2 py-0.5 rounded bg-punk-accent/10 animate-pulse">CONTROLES</span>}
                {blindMode && <span className="border border-punk-accent px-2 py-0.5 rounded bg-punk-accent/10 animate-pulse">CEGO</span>}
                {isVampire && <span className="border border-red-600 text-red-500 px-2 py-0.5 rounded bg-red-900/20 flex items-center gap-1"><Droplet size={10}/> VAMPIRO</span>}
                {isGhost && <span className="border border-cyan-400 text-cyan-400 px-2 py-0.5 rounded bg-cyan-900/20 flex items-center gap-1"><Ghost size={10}/> FANTASMA</span>}
            </div>

            {/* Stats Bar (HP e Custo) */}
            <div className="flex justify-between items-end px-1 mt-2 text-xs text-punk-primary notranslate">
                <span className={`flex items-center gap-2 ${previewCost ? 'text-red-500 font-bold' : ''}`}>
                    <Activity size={14} />
                    <span className="tracking-widest">HP:</span> {predictedHp}/{maxStability}
                </span>

                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-punk-accent mb-1 tracking-widest">LVL {playerLevel}</span>
                  <div className="flex items-center gap-2">
                      {overload > 0 && <span className="text-[10px] text-orange-500 flex items-center gap-1" title={`Sobrecarga: +${overload}`}><Weight size={10}/>+{overload}</span>}
                      <span className={previewCost ? 'text-red-500 font-bold drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]' : 'text-punk-wall'}>
                          CUSTO: {previewCost ? `-${previewCost}` : currentMoveCost}
                      </span>
                  </div>
                </div>
            </div>

            {/* Barra de Vida Visual */}
            <div className="w-full h-3 bg-black/80 rounded-sm overflow-hidden border border-punk-wall/50 mt-1 flex relative shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_20%,rgba(0,0,0,0.5)_20%)] bg-[length:5px_100%] z-20 pointer-events-none opacity-20"></div>
                <motion.div className={`h-full ${barColor} z-10`} initial={false} animate={{ width: `${fillPercent}%` }} transition={{ type: "spring", stiffness: 100, damping: 20 }} />
                {previewCost && <div className="h-full bg-red-600/80 animate-pulse z-0" style={{ width: `${costPercent}%` }} />}
            </div>

            {/* Barra de XP */}
            <div className="w-full flex justify-end mt-1 mb-4">
              <div className="w-full h-1 bg-punk-wall/30 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-punk-accent shadow-[0_0_5px_#7c3aed]" animate={{ width: `${xpPercent}%` }} />
              </div>
            </div>

            {/* Atributos */}
            <div className="flex justify-between gap-2 text-[10px] font-mono text-punk-wall border-t border-punk-wall/20 pt-2">
                <div className="flex items-center gap-1" title="Agilidade"><Wind size={12} className={agility > 0 ? "text-punk-primary" : ""} /> AGI: {agility}</div>
                <div className="flex items-center gap-1" title="Força"><Zap size={12} className={strength > 0 ? "text-punk-primary" : ""} /> STR: {strength}</div>
                <div className="flex items-center gap-1" title="Defesa"><Shield size={12} className={defense > 0 ? "text-punk-primary" : ""} /> DEF: {defense}</div>
            </div>
        </div>
    </div>
  );
};