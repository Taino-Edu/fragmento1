// src/components/UI/Overlay.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, AlertTriangle, CheckCircle } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

export const Overlay = () => {
    const { status, currentOptions, selectCorruption, resetGame, nextLevel } = useGameStore();

    if (status === 'PLAYING') return null;

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4 text-center backdrop-blur-md">
                
                {/* SELEÇÃO DE UPGRADE */}
                {status === 'SELECTING_UPGRADE' && (
                <div className="w-full max-w-sm flex flex-col items-center justify-center notranslate" translate="no">
                    <h2 className="text-xl text-punk-primary mb-6 glitch-text tracking-widest border-b border-punk-primary/30 pb-2 w-full flex items-center justify-center gap-2">
                        <Shuffle size={20}/> PROTOCOLO DE REDE
                    </h2>
                    <div className="space-y-3 w-full">
                        {currentOptions.map((option, idx) => (
                            <button 
                                key={option.id + idx}
                                onClick={() => selectCorruption(option)} 
                                className={`w-full border p-4 text-left transition-all group relative overflow-hidden
                                    ${option.type === 'BUFF' ? 'border-punk-primary/30 hover:bg-punk-primary/10 hover:border-punk-primary' : ''}
                                    ${option.type === 'DEBUFF' ? 'border-punk-accent/30 hover:bg-punk-accent/10 hover:border-punk-accent' : ''}
                                    ${option.type === 'GLITCH' ? 'border-red-500/30 hover:bg-red-500/10 hover:border-red-500' : ''}
                                `}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`font-bold ${option.type === 'GLITCH' ? 'text-red-500 glitch-text' : (option.type === 'BUFF' ? 'text-punk-primary' : 'text-punk-accent')}`}>
                                        {option.name}
                                    </span>
                                    <span className="text-[8px] uppercase tracking-widest border px-1 rounded opacity-50">{option.type}</span>
                                </div>
                                <div className="text-[10px] text-punk-wall group-hover:text-white transition-colors">
                                    {option.description}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                )}

                {/* GAME OVER */}
                {status === 'GAME_OVER' && (
                <>
                    <AlertTriangle size={64} className="text-punk-accent mb-6 animate-pulse drop-shadow-[0_0_15px_#7c3aed]" />
                    <h2 className="text-3xl text-punk-accent font-bold notranslate tracking-[0.5em] mb-2">DISSOCIADO</h2>
                    <button onClick={resetGame} className="px-8 py-3 border border-punk-accent text-punk-accent hover:bg-punk-accent hover:text-white text-sm tracking-widest transition-all shadow-[0_0_10px_rgba(124,58,237,0.2)] hover:shadow-[0_0_20px_rgba(124,58,237,0.6)]">[R] REBOOT</button>
                </>
                )}

                {/* WIN / NEXT LEVEL */}
                {status === 'WON' && (
                <>
                    <CheckCircle size={64} className="text-punk-primary mb-6 drop-shadow-[0_0_15px_#fbbf24]" />
                    <h2 className="text-2xl text-punk-primary font-bold notranslate tracking-widest mb-2">DADOS RECUPERADOS</h2>
                    <button onClick={nextLevel} className="px-8 py-3 bg-punk-primary text-punk-bg font-bold hover:bg-white text-sm tracking-widest animate-pulse shadow-[0_0_15px_#fbbf24]">[ENTER] PRÓXIMO NÍVEL</button>
                </>
                )}
            </motion.div>
        </AnimatePresence>
    );
};