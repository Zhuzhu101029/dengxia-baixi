// The instruments share a quiet room return. All sources are generated locally.
(() => {
  'use strict';
  let ctx, bus, room, noise, ambience, currentStage = 0, muted = false;
  const lastPlayed = new Map();
  const cooldown = { step: .22, slide: .085, turn: .06, tick: .045, blocked: .35, bell: .28 };
  const rooms = [
    { air: 410, volume: .018, hum: 94, speed: .14 },   // backstage, canvas stirring
    { air: 290, volume: .014, hum: 73, speed: .18 },   // bench and lamp
    { air: 1650, volume: .029, hum: 57, speed: .09 },  // rainy stone bridge
    { air: 910, volume: .020, hum: 68, speed: .13 },   // wind through the lattice
    { air: 360, volume: .014, hum: 110, speed: .07 }   // empty auditorium
  ];

  function createRoom() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    bus = ctx.createGain();
    bus.gain.value = .63;
    bus.connect(ctx.destination);
    room = ctx.createConvolver();
    const length = Math.ceil(ctx.sampleRate * .9);
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        data[i] = i < ctx.sampleRate * .018 ? 0 : (Math.random() * 2 - 1) * Math.pow(1 - i / length, 4);
      }
    }
    room.buffer = impulse;
    const wet = ctx.createGain();
    wet.gain.value = .15;
    room.connect(wet).connect(bus);
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const samples = noise.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  }

  function buildAmbience() {
    const hiss = ctx.createBufferSource();
    hiss.buffer = noise;
    hiss.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = .55;
    const air = ctx.createGain();
    air.gain.value = 0;
    hiss.connect(filter).connect(air).connect(bus);
    const hum = ctx.createOscillator(), humLevel = ctx.createGain();
    humLevel.gain.value = .003;
    hum.connect(humLevel).connect(bus);
    const drift = ctx.createOscillator(), depth = ctx.createGain();
    depth.gain.value = 95;
    drift.connect(depth).connect(filter.frequency);
    hiss.start(); hum.start(); drift.start();
    ambience = { filter, air, hum, drift };
    scene(currentStage);
  }

  function unlock() {
    if (muted || document.hidden || !(window.AudioContext || window.webkitAudioContext)) return;
    if (!ctx && navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
    try {
      if (!ctx) { createRoom(); buildAmbience(); }
      if (ctx.state !== 'running') ctx.resume().catch(() => {});
    } catch { /* Audio may be unavailable in restricted embedded browsers. */ }
  }

  function scene(stage) {
    currentStage = Number.isInteger(stage) ? Math.max(0, Math.min(4, stage)) : 0;
    if (!ambience) return;
    const preset = rooms[currentStage], now = ctx.currentTime;
    for (const [parameter, value] of [
      [ambience.filter.frequency, preset.air], [ambience.air.gain, preset.volume],
      [ambience.hum.frequency, preset.hum], [ambience.drift.frequency, preset.speed]
    ]) parameter.setTargetAtTime(value, now, .38);
  }

  function envelope(t, duration, level, attack) {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(.00001, t);
    gain.gain.exponentialRampToValueAtTime(level, t + attack);
    gain.gain.exponentialRampToValueAtTime(.00001, t + duration);
    gain.connect(bus);
    gain.connect(room);
    return gain;
  }

  function tone(t, hz, decay, amplitude, endHz = hz, type = 'sine') {
    const oscillator = ctx.createOscillator(), gain = envelope(t, decay, amplitude, .004);
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(hz, t);
    oscillator.frequency.exponentialRampToValueAtTime(endHz, t + decay);
    oscillator.connect(gain);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(t); oscillator.stop(t + decay + .01);
  }

  function brush(t, hz, endHz, decay, level, attack = .006, q = .9) {
    const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter();
    source.buffer = noise; source.loop = true;
    filter.type = 'bandpass'; filter.Q.value = q;
    filter.frequency.setValueAtTime(hz, t);
    filter.frequency.exponentialRampToValueAtTime(endHz, t + decay);
    const gain = envelope(t, decay, level, attack);
    source.connect(filter).connect(gain);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
    source.start(t, Math.random()); source.stop(t + decay + .01);
  }

  function strikeBell(t, root, level) {
    for (const [ratio, decay, gain] of [[1, 1.4, 1], [2.67, .82, .4], [4.13, .5, .19], [5.48, .22, .09]]) {
      tone(t, root * ratio, decay, gain * level, root * ratio * .997);
    }
    brush(t, 3300, 1500, .035, level * .65);
  }

  function play(name) {
    if (!ctx || ctx.state !== 'running' || muted || document.hidden) return;
    const t = ctx.currentTime + .006, pitch = .96 + Math.random() * .08;
    if (t - (lastPlayed.get(name) ?? -1) < (cooldown[name] || .12)) return;
    lastPlayed.set(name, t);
    switch (name) {
      case 'tick':
      case 'turn':
        brush(t, 3800, 1100, .028, .14);
        tone(t + .008, 950 * pitch, .036, .05, 620, 'triangle');
        if (name === 'turn') brush(t + .018, 1050, 520, .09, .06);
        break;
      case 'slide':
        brush(t, 1200 * pitch, 460, .16, .17, .021);
        tone(t + .013, 205 * pitch, .08, .031, 155, 'triangle');
        break;
      case 'lamp':
        brush(t, 2900, 1500, .09, .18);
        brush(t + .05, 400, 1700, .47, .15, .065);
        tone(t + .12, 196, .46, .029, 220); break;
      case 'bell': strikeBell(t, 523, .13); break;
      case 'step':
        tone(t, (currentStage === 2 ? 133 : 101) * pitch, .09, .086, 55);
        brush(t + .015, currentStage === 2 ? 1900 : 810, 370, .1, .095); break;
      case 'transition':
        brush(t, 250, 1650, .75, .15, .21);
        tone(t + .08, 110, .76, .041, 147); break;
      case 'blocked':
        tone(t, 117, .13, .09, 70, 'triangle');
        brush(t, 470, 220, .11, .09); break;
      case 'open':
        brush(t, 780, 260, .22, .18, .025);
        tone(t + .15, 172, .12, .087, 90, 'triangle'); break;
      case 'end':
        [392, 523.25, 587.33, 783.99].forEach((hz, i) => strikeBell(t + i * .22, hz, .068)); break;
      case 'swap':
        brush(t, 1800, 620, .22, .095, .035);
        tone(t, 330, .26, .032, 392); break;
    }
  }

  function setMuted(value) {
    muted = Boolean(value);
    if (ctx && muted) ctx.suspend().catch(() => {});
    else if (!muted) unlock();
  }
  document.addEventListener('pointerdown', unlock, { capture: true, passive: true });
  document.addEventListener('keydown', unlock, true);
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend().catch(() => {});
    else unlock();
  });
  window.stageSound = { unlock, play, scene, setMuted };
})();
