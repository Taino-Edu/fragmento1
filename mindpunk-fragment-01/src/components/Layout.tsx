import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-black text-punk-primary font-mono relative overflow-hidden select-none">
      
      {/* --- EFEITOS VISUAIS DE FUNDO (CRT / SCANLINES) --- */}
      
      {/* Grade de Fundo (Opaco) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none" />
      
      {/* Vinheta (Escurece as bordas) */}
      <div className="absolute inset-0 bg-radial-gradient(circle, transparent 50%, black 100%) pointer-events-none opacity-80" />

      {/* Efeito CRT (Linhas horizontais finas) */}
      <div className="fixed inset-0 z-50 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

      {/* --- CONTEÚDO DO JOGO (GRID + HUD) --- */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        {children}
      </div>

    </div>
  );
};