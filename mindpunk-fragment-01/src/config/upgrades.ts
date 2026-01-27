import type { GameState } from '../types';

export type CorruptionEffect = {
    id: string;
    name: string;
    description: string;
    type: 'BUFF' | 'DEBUFF' | 'GLITCH';
    apply: (state: GameState) => Partial<GameState>;
};

export const CORRUPTION_POOL: CorruptionEffect[] = [
    // --- BUFFS (Vantagens Claras) ---
    { 
        id: 'AGI_UP', 
        name: 'OVERCLOCK DE CPU', 
        description: '+5 Agilidade (Move + barato)', 
        type: 'BUFF', 
        apply: (s) => ({ agility: s.agility + 5 }) 
    },
    { 
        id: 'STR_UP', 
        name: 'BRAÇO HIDRÁULICO', 
        description: '+5 Força (Ataque + barato/forte)', 
        type: 'BUFF', 
        apply: (s) => ({ strength: s.strength + 5 }) 
    },
    { 
        id: 'DEF_UP', 
        name: 'CHASSI DE TITÂNIO', 
        description: '+5 Defesa (Menos dano sofrido)', 
        type: 'BUFF', 
        apply: (s) => ({ defense: s.defense + 5 }) 
    },
    { 
        id: 'HP_MEGA', 
        name: 'BATERIA EXTERNA', 
        description: '+50 Vida Máxima', 
        type: 'BUFF', 
        apply: (s) => ({ maxStability: s.maxStability + 50, stability: s.stability + 50 }) 
    },
    { 
        id: 'VAMPIRE', 
        name: 'PROTOCOLO VAMPIRO', 
        description: 'Recupera vida ao matar. Sangra ao andar.', 
        type: 'BUFF', 
        apply: (s) => ({ isVampire: true, strength: s.strength + 10 }) 
    },
    
    // --- DEBUFFS (Troca Equivalente) ---
    { 
        id: 'HEAVY', 
        name: 'ARMADURA PESADA', 
        description: '+15 Defesa, mas -5 Agilidade (Lento)', 
        type: 'DEBUFF', 
        apply: (s) => ({ defense: s.defense + 15, agility: s.agility - 5 }) 
    },
    { 
        id: 'FRAGILE', 
        name: 'NÚCLEO EXPOSTO', 
        description: '+15 Força, mas -30 Max HP', 
        type: 'DEBUFF', 
        apply: (s) => ({ strength: s.strength + 15, maxStability: Math.max(30, s.maxStability - 30) }) 
    },
    
    // --- GLITCHES (Alto Risco / Caos) ---
    { 
        id: 'GLASS', 
        name: 'CANHÃO DE VIDRO', 
        description: 'Max HP vira 25. Força +40. Agilidade +10.', 
        type: 'GLITCH', 
        // Lógica Nova: Vida baixa (25), mas ataque e movimento ficam muito baratos
        apply: (s) => ({ 
            maxStability: 25, 
            stability: 25, 
            strength: s.strength + 40,
            agility: s.agility + 10 
        }) 
    },
    { 
        id: 'GAMBLE', 
        name: 'ROLETA RUSSA', 
        description: '50% chance: Dobra HP ou Perde Metade.', 
        type: 'GLITCH', 
        apply: (s) => { 
            const win = Math.random() > 0.5; 
            if (win) {
                return { maxStability: s.maxStability * 2, stability: s.stability * 2 };
            } else {
                return { maxStability: Math.floor(s.maxStability / 2), stability: Math.floor(s.stability / 2) };
            }
        } 
    },
    { 
        id: 'BERSERK', 
        name: 'MODO BERSERK', 
        description: 'Dano Dobrado (Causado e Recebido).', 
        type: 'GLITCH', 
        apply: (s) => ({ 
            damageMultiplier: (s.damageMultiplier || 1) * 2, 
            defense: s.defense - 10 
        }) 
    },
    {
        id: 'REBOOT',
        name: 'REINICIALIZAÇÃO',
        description: 'Reseta Nível e XP. Ganha +20 em TUDO.',
        type: 'GLITCH',
        apply: (s) => ({
            playerLevel: 1,
            xp: 0,
            xpToNextLevel: 100 + (s.level * 50),
            strength: s.strength + 20,
            agility: s.agility + 20,
            defense: s.defense + 20,
            maxStability: s.maxStability + 50,
            stability: s.maxStability + 50
        })
    },

    // --- CEGUEIRA DE VOLTA ---
    {
        id: 'BLIND_RAGE',
        name: 'SENSOR DEFEITUOSO',
        description: 'Fica Cego (Visão reduzida). Ganha +30 Força e +30 Defesa.',
        type: 'GLITCH',
        apply: (s) => ({
            blindMode: true,
            strength: s.strength + 30,
            defense: s.defense + 30
        })
    }
];
