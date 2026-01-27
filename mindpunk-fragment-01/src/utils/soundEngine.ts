// src/utils/soundEngine.ts
// SUPER ENGINE V4.1: Bugfix Edition
// Hybrid Industrial (Metal + 8-Bit)

let audioCtx: AudioContext | null = null;

// -- MIXER --
let masterGain: GainNode | null = null;
let comp: DynamicsCompressorNode | null = null;
let drumBus: GainNode | null = null;
let guitarBus: GainNode | null = null;
let synthBus: GainNode | null = null;

// -- SCHEDULER --
let isPlaying = false;
let timerId: number | null = null;
let currentStep = 0;
let nextNoteTime = 0;
let measureCount = 0;
let currentSongIndex = 0;

// -- CONFIG --
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_SEC = 0.1;
const STEPS_PER_BAR = 16; 

// ==========================================
// 🎵 DADOS DAS MÚSICAS (CORRIGIDOS)
// ==========================================

// Interface para garantir que não erremos o nome das propriedades
interface MetalNote { freq: number; style: 'MUTE' | 'POWER' | 'SCREAM' | 'X'; }

// --- TRACK 1: "DOOM MARCH" ---
// CORREÇÃO: Agora usa 'style' explicitamente em vez de 's'
const DATA_DOOM = {
    startBpm: 120, targetBpm: 160, rampSeconds: 90,
    riffs: {
        A: [
            {freq:73.42,style:'POWER'}, {freq:73.42,style:'MUTE'}, {freq:73.42,style:'MUTE'}, {freq:73.42,style:'MUTE'},
            {freq:87.31,style:'POWER'}, {freq:73.42,style:'MUTE'}, {freq:98.00,style:'POWER'}, {freq:65.41,style:'POWER'},
            {freq:73.42,style:'POWER'}, {freq:73.42,style:'MUTE'}, {freq:73.42,style:'MUTE'}, {freq:82.41,style:'POWER'},
            {freq:73.42,style:'MUTE'},  {freq:73.42,style:'MUTE'}, {freq:65.41,style:'POWER'}, {freq:110.0,style:'SCREAM'}
        ] as MetalNote[],
        B: [
            {freq:65.41,style:'POWER'}, {freq:65.41,style:'MUTE'}, {freq:123.47,style:'POWER'},{freq:65.41,style:'MUTE'},
            {freq:65.41,style:'POWER'}, {freq:65.41,style:'MUTE'}, {freq:116.54,style:'POWER'},{freq:65.41,style:'MUTE'},
            {freq:65.41,style:'POWER'}, {freq:65.41,style:'MUTE'}, {freq:65.41,style:'MUTE'}, {freq:65.41,style:'MUTE'},
            {freq:87.31,style:'POWER'}, {freq:98.00,style:'POWER'}, {freq:110.0,style:'POWER'}, {freq:130.8,style:'SCREAM'}
        ] as MetalNote[],
        C: [
            {freq:55.00,style:'POWER'}, {freq:55.00,style:'POWER'}, {freq:0,style:'X'},      {freq:55.00,style:'MUTE'},
            {freq:55.00,style:'POWER'}, {freq:0,style:'X'},      {freq:55.00,style:'MUTE'}, {freq:55.00,style:'MUTE'},
            {freq:65.41,style:'POWER'}, {freq:65.41,style:'POWER'}, {freq:0,style:'X'},      {freq:65.41,style:'MUTE'},
            {freq:82.41,style:'SCREAM'},{freq:0,style:'X'},      {freq:65.41,style:'MUTE'}, {freq:65.41,style:'MUTE'}
        ] as MetalNote[]
    },
    drums: {
        A: ['K','H','S','H', 'K','K','S','H', 'K','H','S','H', 'K','K','S','H'],
        B: ['K','H','S','K', 'H','K','S','H', 'K','K','S','K', 'S','S','S','K'],
        C: ['K','C','S','-', 'K','K','S','-', 'K','C','S','-', 'K','-','S','K']
    }
};

// --- TRACK 2: "8-BIT FACTORY" ---
const DATA_8BIT = {
    startBpm: 112, targetBpm: 176, rampSeconds: 75,
    chipBass: [82.41,82.41,82.41,98.0, 82.41,82.41,73.42,73.42, 65.41,65.41,73.42,82.41, 98.0,92.5,82.41,73.42],
    chipLead: [329.63,0,329.63,0, 392.0,0,369.99,0, 329.63,0,293.66,0, 261.63,0,293.66,0],
    drums: ['K','H','-','H', 'K','H','S','H', 'K','H','-','H', 'K','H','S','H'],
    // f = freq, t = type (1=MUTE, 2=POWER)
    guitarRiff: [
        {f:73.42,t:2}, {f:73.42,t:1}, {f:73.42,t:1}, {f:87.31,t:2}, {f:73.42,t:1}, {f:73.42,t:1}, {f:98.0,t:2}, {f:65.41,t:2},
        {f:73.42,t:2}, {f:73.42,t:1}, {f:73.42,t:1}, {f:82.41,t:2}, {f:73.42,t:1}, {f:73.42,t:1}, {f:65.41,t:2}, {f:110.0,t:2}
    ]
};

const SONGS = [
    { title: "DOOM MARCH", type: 'METAL_RIFFS', data: DATA_DOOM },
    { title: "8-BIT FACTORY", type: 'INDUSTRIAL_8BIT', data: DATA_8BIT }
];

// ==========================================
// 🎛️ AUDIO ENGINE CORE
// ==========================================

const initAudio = () => {
  if (!audioCtx) {
    // @ts-ignore
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    comp = audioCtx.createDynamicsCompressor();
    comp.threshold.value = -20; comp.knee.value = 30; comp.ratio.value = 12; 
    comp.attack.value = 0.003; comp.release.value = 0.25;

    masterGain = audioCtx.createGain(); masterGain.gain.value = 0.25;
    comp.connect(masterGain); masterGain.connect(audioCtx.destination);

    drumBus = audioCtx.createGain(); drumBus.gain.value = 0.95; drumBus.connect(comp);
    guitarBus = audioCtx.createGain(); guitarBus.gain.value = 0.85; guitarBus.connect(comp);
    synthBus = audioCtx.createGain(); synthBus.gain.value = 0.70; synthBus.connect(comp);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
};

let startTimeSec: number | null = null;

const getProgress = () => {
  if (!audioCtx || !startTimeSec) return 0;
  const song = SONGS[currentSongIndex].data;
  return Math.max(0, Math.min(1, (audioCtx.currentTime - startTimeSec) / song.rampSeconds));
};

const bpmAtProgress = (p: number) => {
    const s = SONGS[currentSongIndex].data;
    return s.startBpm + (s.targetBpm - s.startBpm) * p;
};

const stepDurationSec = (bpm: number) => (60 / bpm) / 4;

const makeDistortionCurve = (amount: number) => {
  const k = amount; const n = 44100; const curve = new Float32Array(n); const deg = Math.PI / 180;
  for (let i = 0; i < n; i++) { const x = (i * 2) / n - 1; curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x)); }
  return curve;
};

// ==========================================
// 🎸 INSTRUMENTOS
// ==========================================

// 1. Guitarra Metal
const playMetalGuitar = (freq: number, style: 'MUTE'|'POWER'|'SCREAM', when: number, intensity: number) => {
    if (!audioCtx || !guitarBus) return;
    const osc1 = audioCtx.createOscillator(); const osc2 = audioCtx.createOscillator(); const sub = audioCtx.createOscillator();
    const dist = audioCtx.createWaveShaper(); const filter = audioCtx.createBiquadFilter(); const gain = audioCtx.createGain();

    osc1.type = 'sawtooth'; osc1.frequency.setValueAtTime(freq, when);
    osc2.type = 'sawtooth'; osc2.frequency.setValueAtTime(freq, when); osc2.detune.value = 15;
    sub.type = 'square'; sub.frequency.setValueAtTime(freq/2, when);

    dist.curve = makeDistortionCurve(400 + (intensity * 200)); dist.oversample = '4x';
    filter.type = 'lowpass';

    if (style === 'MUTE') { filter.frequency.setValueAtTime(400, when); gain.gain.setValueAtTime(0.4, when); gain.gain.exponentialRampToValueAtTime(0.01, when+0.1); }
    else if (style === 'SCREAM') { filter.frequency.setValueAtTime(3000, when); filter.Q.value=10; gain.gain.setValueAtTime(0.3, when); gain.gain.exponentialRampToValueAtTime(0.01, when+0.6); }
    else { filter.frequency.setValueAtTime(2000, when); gain.gain.setValueAtTime(0.4, when); gain.gain.exponentialRampToValueAtTime(0.01, when+0.35); }

    osc1.connect(dist); osc2.connect(dist); sub.connect(dist); dist.connect(filter); filter.connect(gain); gain.connect(guitarBus);
    osc1.start(when); osc2.start(when); sub.start(when);
    const dur = style === 'MUTE' ? 0.12 : 0.4;
    osc1.stop(when+dur); osc2.stop(when+dur); sub.stop(when+dur);
};

// 2. Guitarra Industrial (8-bit style)
const playIndustrialGuitar = (freq: number, mute: boolean, when: number, intensity: number) => {
    if (!audioCtx || !guitarBus) return;
    const osc = audioCtx.createOscillator(); const osc2 = audioCtx.createOscillator();
    const dist = audioCtx.createWaveShaper(); const filter = audioCtx.createBiquadFilter(); const gain = audioCtx.createGain();

    osc.type = "sawtooth"; osc.frequency.setValueAtTime(freq, when);
    osc2.type = "square"; osc2.frequency.setValueAtTime(freq/2, when);

    dist.curve = makeDistortionCurve(280 + intensity * 520); dist.oversample = "4x";
    filter.type = "lowpass";

    if (mute) { filter.frequency.setValueAtTime(360 + intensity*140, when); gain.gain.setValueAtTime(0.22, when); gain.gain.exponentialRampToValueAtTime(0.01, when+0.11); }
    else { filter.frequency.setValueAtTime(2200 + intensity*1600, when); gain.gain.setValueAtTime(0.28, when); gain.gain.exponentialRampToValueAtTime(0.01, when+0.48); }

    osc.connect(dist); osc2.connect(dist); dist.connect(filter); filter.connect(gain); gain.connect(guitarBus);
    osc.start(when); osc2.start(when);
    const dur = mute ? 0.12 : 0.5;
    osc.stop(when + dur); osc2.stop(when + dur);
};

// 3. Chip Bass
const playChipBass = (freq: number, when: number, intensity: number) => {
    if (!audioCtx || !synthBus || freq <= 0) return;
    const osc = audioCtx.createOscillator(); const g = audioCtx.createGain(); const filter = audioCtx.createBiquadFilter();
    osc.type = "triangle"; osc.frequency.setValueAtTime(freq, when);
    filter.type = "lowpass"; filter.frequency.setValueAtTime(650 + intensity*1000, when);
    g.gain.setValueAtTime(0.18, when); g.gain.exponentialRampToValueAtTime(0.001, when+0.18);
    osc.connect(filter); filter.connect(g); g.connect(synthBus); osc.start(when); osc.stop(when+0.2);
};

// 4. Chip Lead
const playChipLead = (freq: number, when: number, intensity: number) => {
    if (!audioCtx || !synthBus || freq <= 0) return;
    const osc = audioCtx.createOscillator(); const g = audioCtx.createGain(); const filter = audioCtx.createBiquadFilter(); const sat = audioCtx.createWaveShaper();
    osc.type = "square"; osc.frequency.setValueAtTime(freq, when);
    sat.curve = makeDistortionCurve(40 + intensity*180);
    filter.type = "bandpass"; filter.Q.setValueAtTime(6, when); filter.frequency.setValueAtTime(freq*2.2, when);
    g.gain.setValueAtTime(0.12, when); g.gain.exponentialRampToValueAtTime(0.001, when+0.12);
    osc.connect(sat); sat.connect(filter); filter.connect(g); g.connect(synthBus); osc.start(when); osc.stop(when+0.14);
};

// 5. Bateria
const playDrum = (type: string, when: number, _intensity: number) => { // _intensity (unused variable fix)
    if (!audioCtx || !drumBus) return;
    if (type === 'K') { 
        const osc = audioCtx.createOscillator(); const g = audioCtx.createGain();
        osc.frequency.setValueAtTime(160, when); osc.frequency.exponentialRampToValueAtTime(0.01, when+0.5);
        g.gain.setValueAtTime(0.9, when); g.gain.exponentialRampToValueAtTime(0.01, when+0.5);
        osc.connect(g); g.connect(drumBus); osc.start(when); osc.stop(when+0.5);
    } else if (type === 'S') { 
        const noise = audioCtx.createBufferSource(); const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate*0.2, audioCtx.sampleRate);
        const data = buffer.getChannelData(0); for(let i=0;i<data.length;i++) data[i]=(Math.random()*2-1);
        noise.buffer = buffer; const hp = audioCtx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=900;
        const g = audioCtx.createGain(); g.gain.setValueAtTime(0.6, when); g.gain.exponentialRampToValueAtTime(0.01, when+0.2);
        noise.connect(hp); hp.connect(g); g.connect(drumBus); noise.start(when);
    } else if (type === 'H') { 
        const noise = audioCtx.createBufferSource(); const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate*0.05, audioCtx.sampleRate);
        const data = buffer.getChannelData(0); for(let i=0;i<data.length;i++) data[i]=Math.random()*2-1;
        noise.buffer = buffer; const hp = audioCtx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=6000;
        const g = audioCtx.createGain(); g.gain.setValueAtTime(0.15, when); g.gain.exponentialRampToValueAtTime(0.01, when+0.05);
        noise.connect(hp); hp.connect(g); g.connect(drumBus); noise.start(when);
    } else if (type === 'C') { 
        const noise = audioCtx.createBufferSource(); const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate*1.0, audioCtx.sampleRate);
        const data = buffer.getChannelData(0); for(let i=0;i<data.length;i++) data[i]=Math.random()*2-1;
        noise.buffer = buffer; const hp = audioCtx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=3000;
        const g = audioCtx.createGain(); g.gain.setValueAtTime(0.4, when); g.gain.exponentialRampToValueAtTime(0.01, when+1.0);
        noise.connect(hp); hp.connect(g); g.connect(drumBus); noise.start(when);
    }
};

// ==========================================
// 🧠 SCHEDULER INTELIGENTE (CORRIGIDO)
// ==========================================

const scheduleStep = (stepIndex: number, when: number) => {
    if (!audioCtx) return;
    
    const intensity = getProgress();
    const barStep = stepIndex % STEPS_PER_BAR;
    const song = SONGS[currentSongIndex];

    if (barStep === 0) measureCount++;

    // --- LÓGICA 1: METAL RIFFS (DOOM) ---
    if (song.type === 'METAL_RIFFS') {
        const data = song.data as typeof DATA_DOOM;
        let currentRiff = data.riffs.A;
        let currentDrums = data.drums.A;

        if (intensity > 0.3 && intensity < 0.7) { currentRiff = data.riffs.B; currentDrums = data.drums.B; }
        else if (intensity >= 0.7) {
            currentRiff = (Math.floor(measureCount / 4) % 2 === 0) ? data.riffs.B : data.riffs.C;
            currentDrums = (currentRiff === data.riffs.C) ? data.drums.C : data.drums.B;
        }

        // Guitarra (CORRIGIDO: usa 'style' explicitamente)
        const note = currentRiff[barStep];
        if (note && note.style !== 'X') playMetalGuitar(note.freq, note.style, when, intensity);
        
        const drum = currentDrums[barStep];
        if (drum && drum !== '-') playDrum(drum, when, intensity);
    }

    // --- LÓGICA 2: INDUSTRIAL 8-BIT ---
    else if (song.type === 'INDUSTRIAL_8BIT') {
        const data = song.data as typeof DATA_8BIT;
        
        const d = data.drums[barStep];
        if (d !== '-') playDrum(d, when, intensity);

        playChipBass(data.chipBass[barStep], when, intensity);

        if (intensity > 0.18) playChipLead(data.chipLead[barStep], when, intensity);

        if (intensity > 0.50) {
            const riff = data.guitarRiff[barStep];
            const mute = riff.t === 1 || intensity < 0.62;
            playIndustrialGuitar(riff.f, mute, when, intensity);
        }
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

// ==========================================
// 🎮 CONTROLES PÚBLICOS
// ==========================================

const playTone = (freq: number, type: OscillatorType, duration: number, vol = 0.1) => {
    if(!audioCtx || !masterGain) initAudio();
    if(!audioCtx || !masterGain) return;
    const osc = audioCtx.createOscillator(); const g = audioCtx.createGain();
    osc.type = type; osc.frequency.value = freq;
    g.gain.setValueAtTime(vol, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(g); g.connect(masterGain); osc.start(); osc.stop(audioCtx.currentTime + duration);
}

export const playSound = {
    move: () => playTone(80, "triangle", 0.05, 0.1),
    attack: () => { if(audioCtx) { playDrum('S', audioCtx.currentTime, 1); playMetalGuitar(150, 'SCREAM', audioCtx.currentTime, 1); } },
    damage: () => { playTone(120, "sawtooth", 0.2, 0.2); playTone(60, "sawtooth", 0.2, 0.2); },
    wall: () => playTone(60, "square", 0.1, 0.1),
    heal: () => { playTone(400, "sine", 0.1, 0.1); setTimeout(() => playTone(600, "sine", 0.1, 0.1), 100); },
    levelUp: () => { playTone(220, "square", 0.1, 0.1); setTimeout(() => playTone(440, "square", 0.1, 0.1), 100); },
    win: () => { playTone(523, "sine", 0.2, 0.1); setTimeout(() => playTone(659, "sine", 0.2, 0.1), 150); },
    gameOver: () => { playTone(100, "sawtooth", 0.5, 0.3); setTimeout(() => playTone(50, "sawtooth", 1.0, 0.3), 300); },
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
        nextNoteTime = audioCtx.currentTime + 0.05;
        timerId = window.setInterval(schedulerTick, LOOKAHEAD_MS);
    } else {
        isPlaying = false;
        startTimeSec = null;
        if (timerId !== null) { clearInterval(timerId); timerId = null; }
    }
};

export const nextTrack = () => {
    currentSongIndex = (currentSongIndex + 1) % SONGS.length;
    measureCount = 0;
    if (audioCtx) startTimeSec = audioCtx.currentTime; 
    return SONGS[currentSongIndex].title;
};

export const getCurrentTrackName = () => SONGS[currentSongIndex].title;