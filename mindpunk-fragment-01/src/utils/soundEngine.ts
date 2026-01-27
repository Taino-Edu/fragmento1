// src/utils/soundEngine.ts
// Engine V3: Industrial Metal Procedural // Rammstein meets Doom Eternal

let audioCtx: AudioContext | null = null;

// -- MIXER --
let masterGain: GainNode | null = null;
let drumBus: GainNode | null = null;
let guitarBus: GainNode | null = null;
let synthBus: GainNode | null = null;
let comp: DynamicsCompressorNode | null = null; // Compressor para "colar" o som

// -- SCHEDULER --
let isPlaying = false;
let timerId: number | null = null;
let currentStep = 0;
let nextNoteTime = 0;
let measureCount = 0; // Conta os compassos para mudar a música

// -- CONFIG --
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_SEC = 0.1;
const STEPS_PER_BAR = 16; 

// Progressão de BPM (Doom style: começa lento e pesado, termina frenético)
const START_BPM = 120;
const TARGET_BPM = 160;
const RAMP_SECONDS = 90; // 1:30 min para atingir o clímax

// ==========================================
// 🎵 COMPOSIÇÃO MUSICAL (RIFFS & PATTERNS)
// ==========================================

type GuitarNote = { freq: number; style: 'MUTE' | 'POWER' | 'SCREAM' | 'X' }; // X = silêncio

// --- RIFF A: "A MARCHA" (Industrial Clássico - Estilo Rammstein) ---
const riffA: GuitarNote[] = [
  { freq: 73.42, style: 'POWER' }, { freq: 73.42, style: 'MUTE' }, { freq: 73.42, style: 'MUTE' }, { freq: 73.42, style: 'MUTE' },
  { freq: 87.31, style: 'POWER' }, { freq: 73.42, style: 'MUTE' }, { freq: 98.00, style: 'POWER' }, { freq: 65.41, style: 'POWER' },
  { freq: 73.42, style: 'POWER' }, { freq: 73.42, style: 'MUTE' }, { freq: 73.42, style: 'MUTE' }, { freq: 82.41, style: 'POWER' },
  { freq: 73.42, style: 'MUTE' }, { freq: 73.42, style: 'MUTE' }, { freq: 65.41, style: 'POWER' }, { freq: 110.0, style: 'SCREAM' }
];

// --- RIFF B: "O CAOS" (Thrash/Cyberpunk - Mais rápido e dissonante) ---
const riffB: GuitarNote[] = [
  { freq: 65.41, style: 'POWER' }, { freq: 65.41, style: 'MUTE' }, { freq: 123.47, style: 'POWER' }, { freq: 65.41, style: 'MUTE' },
  { freq: 65.41, style: 'POWER' }, { freq: 65.41, style: 'MUTE' }, { freq: 116.54, style: 'POWER' }, { freq: 65.41, style: 'MUTE' }, // Tritono
  { freq: 65.41, style: 'POWER' }, { freq: 65.41, style: 'MUTE' }, { freq: 65.41, style: 'MUTE' }, { freq: 65.41, style: 'MUTE' },
  { freq: 87.31, style: 'POWER' }, { freq: 98.00, style: 'POWER' }, { freq: 110.0, style: 'POWER' }, { freq: 130.8, style: 'SCREAM' }
];

// --- RIFF C: "BREAKDOWN" (Peso puro e lento) ---
const riffC: GuitarNote[] = [
  { freq: 55.00, style: 'POWER' }, { freq: 55.00, style: 'POWER' }, { freq: 0, style: 'X' }, { freq: 55.00, style: 'MUTE' },
  { freq: 55.00, style: 'POWER' }, { freq: 0, style: 'X' }, { freq: 55.00, style: 'MUTE' }, { freq: 55.00, style: 'MUTE' },
  { freq: 65.41, style: 'POWER' }, { freq: 65.41, style: 'POWER' }, { freq: 0, style: 'X' }, { freq: 65.41, style: 'MUTE' },
  { freq: 82.41, style: 'SCREAM' }, { freq: 0, style: 'X' }, { freq: 65.41, style: 'MUTE' }, { freq: 65.41, style: 'MUTE' }
];

// --- BATERIA ---
const drumStraight = ['K','H','S','H', 'K','K','S','H', 'K','H','S','H', 'K','K','S','H']; // Marcha
const drumChaos    = ['K','H','S','K', 'H','K','S','H', 'K','K','S','K', 'S','S','S','K']; // Quebrada
const drumHeavy    = ['K','C','S','-', 'K','K','S','-', 'K','C','S','-', 'K','-','S','K']; // Crash (C)

// ==========================================
// 🎛️ AUDIO ENGINE
// ==========================================

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Compressor Master (Cola a mix para soar profissional)
    comp = audioCtx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.knee.value = 30;
    comp.ratio.value = 12;
    comp.attack.value = 0.003;
    comp.release.value = 0.25;

    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.3; // Volume geral

    comp.connect(masterGain);
    masterGain.connect(audioCtx.destination);

    // Buses
    drumBus = audioCtx.createGain(); drumBus.gain.value = 0.9; drumBus.connect(comp);
    guitarBus = audioCtx.createGain(); guitarBus.gain.value = 0.8; guitarBus.connect(comp);
    synthBus = audioCtx.createGain(); synthBus.gain.value = 0.5; synthBus.connect(comp);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
};

const getProgress = () => {
  if (!audioCtx || !startTimeSec) return 0;
  return Math.min(1, (audioCtx.currentTime - startTimeSec) / RAMP_SECONDS);
};

let startTimeSec: number | null = null;
const bpmAtProgress = (p: number) => START_BPM + (TARGET_BPM - START_BPM) * p;
const stepDurationSec = (bpm: number) => (60 / bpm) / 4; // Semicolcheia

// DISTORTION CURVE (O Segredo do Metal)
const makeDistortionCurve = (amount: number) => {
  const k = amount;
  const n = 44100;
  const curve = new Float32Array(n);
  const deg = Math.PI / 180;
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
};

// --- INSTRUMENTOS ---

const playGuitar = (freq: number, style: 'MUTE'|'POWER'|'SCREAM', when: number, intensity: number) => {
    if (!audioCtx || !guitarBus) return;

    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator(); // Detune para "Chorus"
    const sub = audioCtx.createOscillator();  // Peso
    
    const distortion = audioCtx.createWaveShaper();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();

    // Configuração "Wall of Sound"
    osc1.type = 'sawtooth'; osc1.frequency.setValueAtTime(freq, when);
    
    osc2.type = 'sawtooth'; osc2.frequency.setValueAtTime(freq, when);
    osc2.detune.value = 15; // Desafinação leve deixa o som GORDO

    sub.type = 'square'; sub.frequency.setValueAtTime(freq / 2, when); // Oitava abaixo

    // Distorção brutal
    distortion.curve = makeDistortionCurve(400 + (intensity * 200));
    distortion.oversample = '4x';

    // Filtro (Simula a caixa/cabine)
    filter.type = 'lowpass';
    
    if (style === 'MUTE') {
        filter.frequency.setValueAtTime(400, when);
        gain.gain.setValueAtTime(0.4, when);
        gain.gain.exponentialRampToValueAtTime(0.01, when + 0.1); // Curto
    } else if (style === 'SCREAM') {
        filter.frequency.setValueAtTime(3000, when); // Agudo
        filter.Q.value = 10; // Gritado
        gain.gain.setValueAtTime(0.3, when);
        gain.gain.exponentialRampToValueAtTime(0.01, when + 0.6);
    } else { // POWER
        filter.frequency.setValueAtTime(2000, when);
        gain.gain.setValueAtTime(0.4, when);
        gain.gain.exponentialRampToValueAtTime(0.01, when + 0.35);
    }

    osc1.connect(distortion);
    osc2.connect(distortion);
    sub.connect(distortion);
    distortion.connect(filter);
    filter.connect(gain);
    gain.connect(guitarBus);

    osc1.start(when); osc2.start(when); sub.start(when);
    const dur = style === 'MUTE' ? 0.12 : 0.4;
    osc1.stop(when + dur); osc2.stop(when + dur); sub.stop(when + dur);
};

const playDrum = (type: string, when: number, intensity: number) => {
    if (!audioCtx || !drumBus) return;

    if (type === 'K') { // KICK (Bumbo)
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.frequency.setValueAtTime(120, when);
        osc.frequency.exponentialRampToValueAtTime(0.01, when + 0.4);
        g.gain.setValueAtTime(1.0, when);
        g.gain.exponentialRampToValueAtTime(0.01, when + 0.4);
        osc.connect(g); g.connect(drumBus);
        osc.start(when); osc.stop(when + 0.4);
    }
    else if (type === 'S') { // SNARE (Caixa Industrial)
        const noise = audioCtx.createBufferSource();
        const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.2, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for(let i=0; i<data.length; i++) data[i] = (Math.random() * 2 - 1);
        noise.buffer = buffer;
        
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;

        const g = audioCtx.createGain();
        g.gain.setValueAtTime(0.6, when);
        g.gain.exponentialRampToValueAtTime(0.01, when + 0.2);
        
        noise.connect(filter); filter.connect(g); g.connect(drumBus);
        noise.start(when);
    }
    else if (type === 'C') { // CRASH (Prato)
        const noise = audioCtx.createBufferSource();
        const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 1.0, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for(let i=0; i<data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
        noise.buffer = buffer;
        const hp = audioCtx.createBiquadFilter();
        hp.type = 'highpass'; hp.frequency.value = 3000;
        const g = audioCtx.createGain();
        g.gain.setValueAtTime(0.4, when);
        g.gain.exponentialRampToValueAtTime(0.01, when + 1.0);
        noise.connect(hp); hp.connect(g); g.connect(drumBus);
        noise.start(when);
    }
    else if (type === 'H') { // HIHAT
        const noise = audioCtx.createBufferSource();
        const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.05, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for(let i=0; i<data.length; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = buffer;
        const hp = audioCtx.createBiquadFilter();
        hp.type = 'highpass'; hp.frequency.value = 6000;
        const g = audioCtx.createGain();
        g.gain.setValueAtTime(0.2, when);
        g.gain.exponentialRampToValueAtTime(0.01, when + 0.05);
        noise.connect(hp); hp.connect(g); g.connect(drumBus);
        noise.start(when);
    }
};

const playBassSynth = (freq: number, when: number, intensity: number) => {
    if(!audioCtx || !synthBus) return;
    const osc = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const g = audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq / 2, when); // Sub-bass
    
    filter.type = 'lowpass';
    filter.Q.value = 8;
    filter.frequency.setValueAtTime(200, when);
    filter.frequency.linearRampToValueAtTime(1000 + (intensity * 2000), when + 0.1); // Wah effect
    filter.frequency.exponentialRampToValueAtTime(200, when + 0.3);

    g.gain.setValueAtTime(0.3, when);
    g.gain.exponentialRampToValueAtTime(0.01, when + 0.3);

    osc.connect(filter); filter.connect(g); g.connect(synthBus);
    osc.start(when); osc.stop(when + 0.3);
};

// --- SCHEDULER INTELIGENTE ---

const scheduleStep = (stepIndex: number, when: number) => {
    if (!audioCtx) return;
    
    const intensity = getProgress();
    const barStep = stepIndex % STEPS_PER_BAR;
    
    // Calcula em qual compasso estamos para mudar o Riff
    if (barStep === 0) measureCount++;

    // LÓGICA DE ESTRUTURA DA MÚSICA
    // 0-30% do tempo: Riff A (Marcha)
    // 30-70% do tempo: Riff B (Caos)
    // 70-100% do tempo: Riff C (Breakdown) ou B Acelerado
    
    let currentRiff = riffA;
    let currentDrums = drumStraight;

    if (intensity > 0.3 && intensity < 0.7) {
        currentRiff = riffB;
        currentDrums = drumChaos;
    } else if (intensity >= 0.7) {
        // Alterna entre B e C a cada 4 compassos no final
        currentRiff = (Math.floor(measureCount / 4) % 2 === 0) ? riffB : riffC;
        currentDrums = (currentRiff === riffC) ? drumHeavy : drumChaos;
    }

    // Toca Guitarra
    const note = currentRiff[barStep];
    if (note && note.style !== 'X') {
        playGuitar(note.freq, note.style, when, intensity);
    }

    // Toca Bateria
    const drum = currentDrums[barStep];
    if (drum && drum !== '-') playDrum(drum, when, intensity);

    // Synth Bass (Complementa nas batidas fortes ou contratempo)
    if (intensity > 0.5 && (barStep % 2 === 0)) {
        playBassSynth(note.freq, when, intensity);
    }
};

const schedulerTick = () => {
    if (!audioCtx || !isPlaying) return;
    const bpm = bpmAtProgress(getProgress());
    const stepDur = stepDurationSec(bpm);
    
    while (nextNoteTime < audioCtx.currentTime + SCHEDULE_AHEAD_SEC) {
        scheduleStep(currentStep, nextNoteTime);
        nextNoteTime += stepDur;
        currentStep++;
    }
};

// --- CONTROLES PÚBLICOS ---

// SFX genéricos para o jogo (usando a engine já carregada)
const playSimpleTone = (freq: number, type: OscillatorType, dur: number, vol: number) => {
    if(!audioCtx || !masterGain) initAudio();
    if(!audioCtx || !masterGain) return;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type; osc.frequency.value = freq;
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur);
    osc.connect(g); g.connect(masterGain);
    osc.start(); osc.stop(audioCtx.currentTime + dur);
}

export const playSound = {
    move: () => playSimpleTone(100, 'triangle', 0.1, 0.1), // Grave seco
    attack: () => {
        if(!audioCtx) return;
        playDrum('S', audioCtx.currentTime, 1); // Caixa
        playGuitar(150, 'SCREAM', audioCtx.currentTime, 1); // Guitarra aguda
    },
    damage: () => playSimpleTone(60, 'sawtooth', 0.3, 0.3),
    wall: () => playSimpleTone(80, 'square', 0.1, 0.1),
    heal: () => {
        if(!audioCtx || !masterGain) return;
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 0.3);
        g.gain.value = 0.1;
        osc.connect(g); g.connect(masterGain); osc.start(); osc.stop(audioCtx.currentTime + 0.3);
    },
    levelUp: () => playGuitar(220, 'SCREAM', audioCtx!.currentTime, 1),
    win: () => playGuitar(73.42, 'POWER', audioCtx!.currentTime, 0.5),
    gameOver: () => playSimpleTone(50, 'sawtooth', 1.0, 0.5),
};

export const toggleMusic = (play: boolean) => {
    if (!audioCtx) initAudio();
    if (!audioCtx) return;

    if (play) {
        if (isPlaying) return;
        isPlaying = true;
        currentStep = 0;
        measureCount = 0;
        startTimeSec = audioCtx.currentTime;
        nextNoteTime = audioCtx.currentTime + 0.1;
        timerId = window.setInterval(schedulerTick, LOOKAHEAD_MS);
    } else {
        isPlaying = false;
        startTimeSec = null;
        if (timerId !== null) {
            clearInterval(timerId);
            timerId = null;
        }
    }
};