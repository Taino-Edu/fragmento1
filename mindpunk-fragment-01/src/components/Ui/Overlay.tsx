import { useState } from 'react'; // [NOVO] Necessário para atualizar o player
import { useGameStore } from '../../store/useGameStore';
import { motion } from 'framer-motion';
// [NOVO] Adicionei Volume2, VolumeX, SkipForward, Radio para o player
import { Skull, Shield, Zap, Crosshair, Volume2, VolumeX, SkipForward, Radio } from 'lucide-react';
// [NOVO] Importando as funções da sua engine de som
import { toggleMusic, nextTrack, getCurrentTrackName } from '../../utils/soundEngine';

export const Overlay = () => {
  const { status, currentOptions, marketOptions, selectCorruption, stability, resetGame } = useGameStore();

  // --- ESTADO DO PLAYER DE MÚSICA [NOVO] ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackName, setTrackName] = useState(getCurrentTrackName());

  // Funções de Controle do Player
  const handleToggle = () => {
    const newState = !isPlaying;
    setIsPlaying(newState);
    toggleMusic(newState); // Chama a engine
  };

  const handleNextTrack = () => {
    const newName = nextTrack(); // Chama a engine e pega o novo nome
    setTrackName(newName);
    
    // Se não estiver tocando, força o play ao trocar
    if (!isPlaying) {
        setIsPlaying(true);
        toggleMusic(true);
    }
  };

  // --- TELAS MODAIS (BLOQUEANTES) ---

  if (status === 'GAME_OVER') {
    return (
      <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
        <h1 className="text-6xl text-red-600 font-bold mb-4 glitch-text">SISTEMA CRÍTICO</h1>
        <p className="text-gray-400 mb-8">Sua estabilidade chegou a zero.</p>
        <button onClick={resetGame} className="px-8 py-3 bg-red-600 text-black font-bold hover:bg-red-500 transition">
          REINICIAR SISTEMA
        </button>
      </div>
    );
  }

  if (status === 'WON') {
    return (
      <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
        <h1 className="text-6xl text-punk-primary font-bold mb-4">DADOS RECUPERADOS</h1>
        <p className="text-gray-400 mb-8">Nível completado.</p>
        <button onClick={() => useGameStore.getState().nextLevel()} className="px-8 py-3 bg-punk-primary text-black font-bold hover:bg-yellow-400 transition">
          ACESSAR PRÓXIMO NÍVEL
        </button>
      </div>
    );
  }

  if (status === 'SELECTING_UPGRADE') {
    return (
      <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-50 p-4 overflow-y-auto">
        <h2 className="text-3xl text-punk-primary font-mono mb-2"> PROTOCOLO DE REDE </h2>
        <p className="text-gray-500 text-sm mb-8">HP Disponível para troca: <span className="text-red-500 font-bold">{stability}</span></p>

        <div className="flex flex-col md:flex-row gap-8 w-full max-w-6xl">
            
            {/* COLUNA 1: UPGRADES GRÁTIS */}
            <div className="flex-1 border-r border-gray-800 pr-4">
                <h3 className="text-xl text-cyan-500 font-bold mb-4 text-center border-b border-cyan-900 pb-2">ATUALIZAÇÃO DE SISTEMA</h3>
                <div className="flex flex-col gap-4">
                    {currentOptions.map((option, idx) => (
                    <motion.button
                        key={idx}
                        whileHover={{ scale: 1.02, x: 5 }}
                        onClick={() => selectCorruption(option)}
                        className="w-full p-6 bg-gray-900 border border-cyan-500/30 text-left hover:bg-gray-800 hover:border-cyan-500 transition group"
                    >
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-lg font-bold text-cyan-400 group-hover:text-cyan-300">{option.name}</span>
                            {option.type === 'BUFF' ? <Shield size={18} /> : <Zap size={18} />}
                        </div>
                        <p className="text-sm text-gray-400">{option.description}</p>
                    </motion.button>
                    ))}
                </div>
            </div>

            {/* COLUNA 2: MERCADO (Custa Vida) */}
            <div className="flex-1 bg-yellow-900/5 border border-yellow-600/20 p-4 rounded">
                <h3 className="text-xl text-yellow-500 font-bold mb-4 text-center border-b border-yellow-900 pb-2">MERCADO NEGRO (CUSTA HP)</h3>
                <div className="flex flex-col gap-4">
                    {marketOptions.map((option, idx) => {
                        const canAfford = stability > (option.cost || 0);
                        return (
                            <motion.button
                                key={idx}
                                disabled={!canAfford}
                                whileHover={canAfford ? { scale: 1.02, x: 5 } : {}}
                                onClick={() => canAfford && selectCorruption(option)}
                                className={`w-full p-6 border text-left transition group relative overflow-hidden ${
                                    canAfford 
                                    ? 'bg-black border-yellow-500/50 hover:bg-yellow-900/20 hover:border-yellow-400 cursor-pointer' 
                                    : 'bg-gray-900/50 border-gray-800 opacity-50 cursor-not-allowed'
                                }`}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <span className={`text-lg font-bold ${canAfford ? 'text-yellow-400' : 'text-gray-500'}`}>{option.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono bg-red-900/50 text-red-400 px-2 py-1 rounded">-{option.cost} HP</span>
                                        {option.type === 'WEAPON' ? <Crosshair size={18} className="text-yellow-500"/> : <Skull size={18} className="text-yellow-500"/>}
                                    </div>
                                </div>
                                <p className="text-sm text-gray-400">{option.description}</p>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

        </div>
      </div>
    );
  }

  // --- HUD DE JOGO (QUANDO ESTÁ JOGANDO) [NOVO] ---
  // Substituí o 'return null' por este bloco que exibe o player
  return (
    <div className="pointer-events-none fixed inset-0 z-40 p-4 flex flex-col justify-end items-start">
        
       {/* PLAYER INDUSTRIAL (Controles clicáveis -> pointer-events-auto) */}
       <div className="pointer-events-auto mb-4 flex flex-col gap-1 items-start">
            
            {/* Display da Faixa */}
            <div className="flex items-center gap-2 text-[10px] font-mono text-punk-primary uppercase tracking-widest bg-black/90 px-3 py-1 border border-punk-primary/30 shadow-[0_0_10px_rgba(124,58,237,0.2)]">
                <Radio size={12} className={isPlaying ? "animate-pulse" : ""} />
                <span>TRACK: {trackName}</span>
            </div>

            <div className="flex gap-2">
                {/* Botão Play/Pause */}
                <button 
                  onClick={handleToggle}
                  className={`group flex items-center justify-center w-10 h-10 border transition-all rounded-sm ${isPlaying ? 'bg-punk-primary text-black border-punk-primary' : 'bg-black/80 text-gray-400 border-gray-600'}`}
                >
                  {isPlaying ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>

                {/* Botão Next Track */}
                <button 
                  onClick={handleNextTrack}
                  className="group flex items-center justify-center w-10 h-10 bg-black/80 border border-gray-600 text-gray-400 hover:border-punk-primary hover:text-punk-primary transition-all rounded-sm"
                  title="Trocar Frequência"
                >
                  <SkipForward size={18} />
                </button>
            </div>
       </div>

    </div>
  );
};