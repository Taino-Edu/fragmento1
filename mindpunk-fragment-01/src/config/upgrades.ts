import type { GameState, PlayerSkill } from '../types';

export type CorruptionEffect = {
    id: string; 
    name: string; 
    description: string;
    type: 'BUFF' | 'DEBUFF' | 'GLITCH' | 'SKILL' | 'WEAPON';
    cost?: number; // Custo em HP. Se undefined, é grátis (Level Up).
    apply: (state: GameState) => Partial<GameState>;
};

export const CORRUPTION_POOL: CorruptionEffect[] = [
    // =========================================================================
    // 1. MERCADO NEGRO (ARMAS, SKILLS & UTILITÁRIOS - PAGOS)
    // =========================================================================
    
    // --- ARMAS ---
    { id: 'WPN_PISTOL', type: 'WEAPON', cost: 30, name: 'PISTOLA PLASMA', description: 'Alcance 3. Dano +15.', 
      apply: s => ({ attackRange: 3, weaponName: 'PLASMA PISTOL', strength: s.strength + 15 }) },
    { id: 'WPN_SHOTGUN', type: 'WEAPON', cost: 50, name: 'SHOTGUN TÁTICA', description: 'Alcance 2. Dano +40 (Curto Alcance).', 
      apply: s => ({ attackRange: 2, weaponName: 'SHOTGUN', strength: s.strength + 40 }) },
    { id: 'WPN_RIFLE', type: 'WEAPON', cost: 70, name: 'RIFLE GAUSS', description: 'Alcance 5. Dano +20 (Longo Alcance).', 
      apply: s => ({ attackRange: 5, weaponName: 'GAUSS RIFLE', strength: s.strength + 20 }) },
    { id: 'WPN_KATANA', type: 'WEAPON', cost: 60, name: 'MONOFILAMENT KATANA', description: 'Alcance 1. Dano +60 (Corpo a Corpo Supremo).', 
      apply: s => ({ attackRange: 1, weaponName: 'MONO-KATANA', strength: s.strength + 60 }) },

    // --- SKILLS ATIVAS ---
    { id: 'SKILL_DASH', type: 'SKILL', cost: 30, name: 'MÓDULO DE SALTO', description: '[ESPAÇO] Pula obstáculos e inimigos.', 
      apply: s => ({ skills: [...s.skills, 'DASH' as PlayerSkill] }) },
    { id: 'SKILL_SCAN', type: 'SKILL', cost: 20, name: 'SONAR TÁTICO', description: 'Revela o mapa e itens.', 
      apply: s => ({ skills: [...s.skills, 'SCAN' as PlayerSkill] }) },

    // --- CONSUMÍVEIS DE LOJA ---
    { id: 'FULL_REPAIR', type: 'BUFF', cost: 50, name: 'REPARO TOTAL', description: 'Recupera 100% da Vida.', 
      apply: s => ({ stability: s.maxStability }) },
    { id: 'SHIELD_GEN_MK1', type: 'BUFF', cost: 40, name: 'ESCUDO DE FORÇA I', description: '+150 Escudo.', 
      apply: s => ({ shield: (s.shield || 0) + 150 }) },
    { id: 'SHIELD_GEN_MK2', type: 'BUFF', cost: 80, name: 'ESCUDO DE FORÇA II', description: '+300 Escudo.', 
      apply: s => ({ shield: (s.shield || 0) + 300 }) },
    { id: 'CORE_UPGRADE', type: 'BUFF', cost: 100, name: 'NÚCLEO DE FUSÃO', description: '+200 Vida Máxima. Recupera tudo.', 
      apply: s => ({ maxStability: s.maxStability + 200, stability: s.maxStability + 200 }) },

    // =========================================================================
    // 2. UPGRADES DE SISTEMA (LEVEL UP - GRÁTIS)
    // =========================================================================

    // --- BUFFS (POSITIVOS) ---
    { id: 'STR_MK1', type: 'BUFF', name: 'SERVOMOTORES V1', description: 'Força +15.', apply: s => ({ strength: s.strength + 15 }) },
    { id: 'STR_MK2', type: 'BUFF', name: 'SERVOMOTORES V2', description: 'Força +30.', apply: s => ({ strength: s.strength + 30 }) },
    
    { id: 'DEF_MK1', type: 'BUFF', name: 'CHASSI TITÂNIO', description: 'Defesa +10.', apply: s => ({ defense: s.defense + 10 }) },
    { id: 'DEF_MK2', type: 'BUFF', name: 'CHASSI CARBONO', description: 'Defesa +20.', apply: s => ({ defense: s.defense + 20 }) },
    
    { id: 'AGI_MK1', type: 'BUFF', name: 'OVERCLOCK CPU', description: 'Agilidade +10.', apply: s => ({ agility: s.agility + 10 }) },
    { id: 'AGI_MK2', type: 'BUFF', name: 'RESFRIAMENTO LÍQUIDO', description: 'Agilidade +20.', apply: s => ({ agility: s.agility + 20 }) },

    { id: 'HP_MK1', type: 'BUFF', name: 'BATERIA AUXILIAR', description: 'Max HP +100.', apply: s => ({ maxStability: s.maxStability + 100, stability: s.stability + 100 }) },
    { id: 'HP_MK2', type: 'BUFF', name: 'CAPACITOR DE FLUXO', description: 'Max HP +200.', apply: s => ({ maxStability: s.maxStability + 200, stability: s.stability + 200 }) },

    { id: 'XP_BOOT', type: 'BUFF', name: 'DATA MINING', description: 'XP x1.3.', apply: s => ({ xpMultiplier: s.xpMultiplier + 0.3 }) },
    { id: 'XP_MEGA', type: 'BUFF', name: 'BIG DATA AI', description: 'XP x1.6.', apply: s => ({ xpMultiplier: s.xpMultiplier + 0.6 }) },

    { id: 'MOVE_OPT', type: 'BUFF', name: 'OTIMIZAÇÃO DE ROTA', description: 'Custo Movimento -2.', apply: s => ({ moveCostReduction: s.moveCostReduction + 2 }) },
    { id: 'MOVE_HYPER', type: 'BUFF', name: 'HIPER VELOCIDADE', description: 'Custo Movimento -5.', apply: s => ({ moveCostReduction: s.moveCostReduction + 5 }) },

    { id: 'RANGE_SCOPE', type: 'BUFF', name: 'MIRA LASER', description: 'Alcance +1.', apply: s => ({ attackRange: s.attackRange + 1 }) },
    
    { id: 'OMNI_TOOL', type: 'BUFF', name: 'FERRAMENTA OMNI', description: '+10 Tudo (For/Def/Agi).', 
      apply: s => ({ strength: s.strength + 10, defense: s.defense + 10, agility: s.agility + 10 }) },

    { id: 'NANO_REPAIR', type: 'BUFF', name: 'NANORROBÔS', description: 'Cura 50% da vida agora.', 
      apply: s => ({ stability: Math.min(s.maxStability, s.stability + (s.maxStability * 0.5)) }) },

    { id: 'BERSERK_SERUM', type: 'BUFF', name: 'SORO DE COMBATE', description: 'Força +40.', apply: s => ({ strength: s.strength + 40 }) },
    { id: 'IRON_SKIN', type: 'BUFF', name: 'PELE DE FERRO', description: 'Defesa +25.', apply: s => ({ defense: s.defense + 25 }) },
    { id: 'NEURAL_LINK', type: 'BUFF', name: 'LINK NEURAL', description: 'Agilidade +30.', apply: s => ({ agility: s.agility + 30 }) },

    // =========================================================================
    // 3. GLITCHES & DEBUFFS (ITENS "MALDITOS" - TRADE-OFFS)
    // =========================================================================

    // --- GLITCHES (MUDANÇA DE JOGABILIDADE) ---
    { id: 'GLITCH_VAMP', type: 'GLITCH', name: 'PROTOCOLO VAMPIRO', description: 'Rouba vida ao matar. Perde vida ao andar.', 
      apply: s => ({ isVampire: true, strength: s.strength + 15 }) },
    
    { id: 'GLITCH_GHOST', type: 'GLITCH', name: 'MODO FANTASMA', description: 'Atravessa paredes. Custo de movimento DOBRADO.', 
      apply: s => ({ isGhost: true, agility: s.agility + 30 }) },

    { id: 'GLITCH_GLASS', type: 'GLITCH', name: 'CANHÃO DE VIDRO', description: 'Max HP vira 100. Força +100.', 
      apply: s => ({ maxStability: 100, stability: Math.min(s.stability, 100), strength: s.strength + 100 }) },

    // --- DEBUFFS (PODER COM PREÇO ALTO) ---
    { id: 'DEBUFF_HEAVY', type: 'DEBUFF', name: 'ARMADURA PESADA', description: 'Defesa +50. Agilidade -20.', 
      apply: s => ({ defense: s.defense + 50, agility: s.agility - 20 }) },

    { id: 'DEBUFF_RAGE', type: 'DEBUFF', name: 'FÚRIA CEGA', description: 'Força +60. Defesa -30.', 
      apply: s => ({ strength: s.strength + 60, defense: s.defense - 30 }) },

    { id: 'DEBUFF_DATA', type: 'DEBUFF', name: 'OVERFLOW DE DADOS', description: 'XP x3.0. Max HP -100.', 
      apply: s => ({ xpMultiplier: s.xpMultiplier + 2.0, maxStability: Math.max(50, s.maxStability - 100), stability: Math.min(s.stability, s.maxStability - 100) }) },

    { id: 'DEBUFF_TURRET', type: 'DEBUFF', name: 'MODO TORRETA', description: 'Alcance +3. Custo Movimento +10.', 
      apply: s => ({ attackRange: s.attackRange + 3, moveCostReduction: s.moveCostReduction - 10 }) },

    { id: 'DEBUFF_OLD', type: 'DEBUFF', name: 'HARDWARE VELHO', description: 'Max HP +300. Agilidade -15.', 
      apply: s => ({ maxStability: s.maxStability + 300, stability: s.stability + 300, agility: s.agility - 15 }) },

    { id: 'DEBUFF_CURSED_SWORD', type: 'DEBUFF', name: 'LÂMINA AMALDIÇOADA', description: 'Força +80. Max HP cai pela metade.', 
      apply: s => ({ strength: s.strength + 80, maxStability: Math.floor(s.maxStability / 2), stability: Math.floor(s.stability / 2) }) }
];