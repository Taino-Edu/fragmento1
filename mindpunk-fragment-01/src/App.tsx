import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MousePointer2, Music } from 'lucide-react';

// Imports da nossa nova estrutura organizada
import { useGameStore } from './store/useGameStore';
import { toggleMusic } from './utils/soundEngine';
import { Grid } from './components/Game/Grid';
import { HUD } from './components/Ui/HUD';
import { Overlay } from './components/Ui/Overlay';

function App() {
  const { 
    movePlayer, status, resetGame, nextLevel, tacticalMode, toggleTacticalMode
  } = useGameStore();

  const [musicOn, setMusicOn] = useState(false);

  // Controle de Música
  const handleMusicToggle = () => {
      const newState = !musicOn;
      setMusicOn(newState);
      toggleMusic(newState);
  };

  // Controles de Teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Comandos Globais
      if (e.key.toLowerCase() === 'r') resetGame();
      if (e.key === 'Enter' && status === 'WON') nextLevel();
      
      // Movimentação
      if (status === 'PLAYING') {
        // Previne scroll com setas/espaço
        if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].indexOf(e.code) > -1) {
            e.preventDefault();
        }

        if (e.code === 'Space') movePlayer('WAIT');
        
        switch (e.key) {
            case 'w': case 'ArrowUp': movePlayer('UP'); break;
            case 's': case 'ArrowDown': movePlayer('DOWN'); break;
            case 'a': case 'ArrowLeft': movePlayer('LEFT'); break;
            case 'd': case 'ArrowRight': movePlayer('RIGHT'); break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePlayer, resetGame, nextLevel, status]);

  return (
    <div className="min-h-screen bg-[#050505] flex flex-row items-center justify-center p-4 relative overflow-hidden selection:bg-punk-accent selection:text-white font-mono">
      {/* Efeitos de Fundo (Scanlines e Vinheta) */}
      <div className="pointer-events-none fixed inset-0 z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] opacity-60" />
      <div className="pointer-events-none fixed inset-0 z-40 bg-gradient-to-t from-black/20 to-transparent" />

      {/* Sidebar (Botões Flutuantes) */}
      <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-30">
         <button onClick={toggleTacticalMode} className={`flex flex-col items-center gap-2 p-3 border transition-all duration-300 backdrop-blur-md ${tacticalMode ? 'border-punk-primary bg-punk-primary/10 shadow-[0_0_15px_rgba(251,191,36,0.2)]' : 'border-punk-wall opacity-50 hover:opacity-100'}`}>
            <MousePointer2 size={20} className={tacticalMode ? 'text-punk-primary drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]' : 'text-punk-wall'} />
            <span className="text-[10px] text-punk-primary writing-mode-vertical select-none notranslate tracking-widest" translate="no">PREVIEW</span>
            <div className={`w-2 h-2 rounded-full transition-colors ${tacticalMode ? 'bg-punk-primary shadow-[0_0_8px_#fbbf24]' : 'bg-punk-wall'}`} />
         </button>

         <button onClick={handleMusicToggle} className={`flex flex-col items-center gap-2 p-3 border transition-all duration-300 backdrop-blur-md ${musicOn ? 'border-punk-accent bg-punk-accent/10 shadow-[0_0_15px_rgba(124,58,237,0.2)]' : 'border-punk-wall opacity-50 hover:opacity-100'}`}>
            <Music size={20} className={musicOn ? 'text-punk-accent animate-pulse' : 'text-punk-wall'} />
            <span className="text-[10px] text-punk-accent writing-mode-vertical select-none notranslate tracking-widest" translate="no">AUDIO</span>
         </button>
      </motion.div>

      {/* Área Principal do Jogo */}
      <div className="flex flex-col items-center w-full max-w-2xl relative z-10">
        
        {/* HUD (Barra de Vida, XP, Nível) */}
        <HUD />

        {/* O Tabuleiro e as Telas de Overlay (Game Over/Menu) */}
        <div className="relative">
             <Grid />
             <Overlay />
        </div>

        {/* Rodapé com Dicas */}
        <div className="mt-8 text-punk-wall text-[10px] font-mono z-10 opacity-50 tracking-widest flex items-center gap-4">
            <span>[CLIQUE] INIMIGO = ATAQUE</span>
            <span>[ESPAÇO] = ESPERAR</span>
        </div>
      </div>
    </div>
  );
}

export default App;