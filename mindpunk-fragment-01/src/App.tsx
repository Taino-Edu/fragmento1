import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { MousePointer2 } from 'lucide-react'; // Removi 'Music'

// Imports Organizados
import { useGameStore } from './store/useGameStore';
import { Layout } from './components/Layout'; // <--- Usando o Layout novo
import { Grid } from './components/Game/Grid';
import { HUD } from './components/Ui/HUD';
import { Overlay } from './components/Ui/Overlay';

// Removi: toggleMusic (não precisa mais aqui)

function App() {
  const { 
    movePlayer, status, resetGame, nextLevel, 
    tacticalMode, toggleTacticalMode
  } = useGameStore();

  // Removi: state de musicOn e handleMusicToggle (O Overlay já faz isso)

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
    <Layout>
      {/* Botão Flutuante (Só sobrou o Tactical Mode, o Áudio saiu) */}
      <motion.div 
        initial={{ x: -50, opacity: 0 }} 
        animate={{ x: 0, opacity: 1 }} 
        className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-30 pointer-events-auto"
      >
         <button onClick={toggleTacticalMode} className={`flex flex-col items-center gap-2 p-3 border transition-all duration-300 backdrop-blur-md ${tacticalMode ? 'border-punk-primary bg-punk-primary/10 shadow-[0_0_15px_rgba(251,191,36,0.2)]' : 'border-punk-wall opacity-50 hover:opacity-100'}`}>
            <MousePointer2 size={20} className={tacticalMode ? 'text-punk-primary drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]' : 'text-punk-wall'} />
            <span className="text-[10px] text-punk-primary writing-mode-vertical select-none notranslate tracking-widest" translate="no">PREVIEW</span>
            <div className={`w-2 h-2 rounded-full transition-colors ${tacticalMode ? 'bg-punk-primary shadow-[0_0_8px_#fbbf24]' : 'bg-punk-wall'}`} />
         </button>

         {/* O BOTÃO DE ÁUDIO FOI REMOVIDO DAQUI */}
      </motion.div>

      {/* Conteúdo Central */}
      <div className="flex flex-col items-center w-full max-w-2xl relative z-10 pointer-events-auto">
        
        {/* HUD (Vida, XP, Escudo) */}
        <HUD />

        {/* Tabuleiro + Overlay (Player de Música está aqui dentro agora) */}
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
    </Layout>
  );
}

export default App;