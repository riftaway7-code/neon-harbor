window.NH_SOUND = function (env) {
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const rnd = (a, b) => a + Math.random() * (b - a);
  let AC = null, bus = null, ready = false;
  const B = {};
  const beds = {};
  const pool = [];
  const S = { stepT: 0, foot: 0, murmurT: 0, thunderT: rnd(20, 50), birdT: 0, skid: null, wind: null, shop: null, lastWet: 0, fall: 0, wasAir: false };

  function mkNoise(kind) {
    const len = AC.sampleRate * 4, buf = AC.createBuffer(1, len, AC.sampleRate), d = buf.getChannelData(0);
    let a = 0, b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === 'white') d[i] = w * 0.5;
      else if (kind === 'brown') { a = (a + 0.02 * w) / 1.02; d[i] = a * 3.4; }
      else { b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.12; }
    }
    for (let i = 0; i < 3000; i++) { const k = i / 3000; d[i] *= k; d[len - 1 - i] *= k; }
    return buf;
  }
  function loop(kind, chain, gain0) {
    const s = AC.createBufferSource(); s.buffer = B[kind]; s.loop = true; s.loopStart = 0.05; s.loopEnd = 3.95;
    const g = AC.createGain(); g.gain.value = gain0 || 0;
    let node = s;
    for (const f of chain) { const bq = AC.createBiquadFilter(); bq.type = f[0]; bq.frequency.value = f[1]; if (f[2]) bq.Q.value = f[2]; node.connect(bq); node = bq; }
    node.connect(g); g.connect(bus); s.start(AC.currentTime + Math.random());
    return { s, g };
  }
  function init() {
    const a = env.audio(); if (!a || !a.AC) return false;
    AC = a.AC; bus = AC.createGain(); bus.gain.value = 2.4; bus.connect(a.master);
    B.white = mkNoise('white'); B.brown = mkNoise('brown'); B.pink = mkNoise('pink');
    beds.traffic = loop('brown', [['lowpass', 320]]);
    beds.hiss = loop('pink', [['bandpass', 1700, 0.6]]);
    beds.city = loop('pink', [['bandpass', 650, 0.5]]);
    beds.wind = loop('pink', [['bandpass', 520, 0.45]]);
    beds.sea = loop('brown', [['lowpass', 900]]);
    beds.seaHi = loop('white', [['bandpass', 3200, 0.7]]);
    beds.hum = loop('brown', [['lowpass', 140]]);
    beds.rain = null;
    S.skid = loop('white', [['bandpass', 2300, 5]]);
    S.wind = loop('white', [['highpass', 600], ['lowpass', 3500]]);
    for (let i = 0; i < 3; i++) {
      const o = AC.createOscillator(); o.type = 'sawtooth'; const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420; const g = AC.createGain(); g.gain.value = 0; const p = AC.createStereoPanner ? AC.createStereoPanner() : null;
      o.connect(f); f.connect(g); if (p) { g.connect(p); p.connect(bus); } else g.connect(bus); o.start(); pool.push({ o, f, g, p });
    }
    ready = true; return true;
  }
  const ramp = (g, v, t) => g.gain.setTargetAtTime(v, AC.currentTime, t || 0.4);

  function pan(x, z) {
    const m = env.camera.matrixWorld.elements, dx = x - env.camera.position.x, dz = z - env.camera.position.z, d = Math.hypot(dx, dz) || 1;
    return clamp((dx * m[0] + dz * m[2]) / d, -1, 1);
  }
  function out(p, vol) {
    if (!AC.createStereoPanner) { const g = AC.createGain(); g.gain.value = vol; g.connect(bus); return { in: g, g }; }
    const g = AC.createGain(), st = AC.createStereoPanner(); g.gain.value = vol; st.pan.value = p || 0; g.connect(st); st.connect(bus); return { in: g, g };
  }
  function noiseShot(kind, type, f0, f1, dur, vol, pn, q) {
    if (!ready || env.muted()) return;
    const t = AC.currentTime, s = AC.createBufferSource(), f = AC.createBiquadFilter(), o = out(pn, vol);
    s.buffer = B[kind]; s.loop = true; f.type = type; f.frequency.setValueAtTime(f0, t); if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); if (q) f.Q.value = q;
    o.g.gain.setValueAtTime(vol, t); o.g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(o.in); s.start(t, Math.random() * 2); s.stop(t + dur + 0.02);
  }
  function thump(f0, f1, dur, vol, pn, type) {
    if (!ready || env.muted()) return;
    const t = AC.currentTime, os = AC.createOscillator(), o = out(pn, vol);
    os.type = type || 'sine'; os.frequency.setValueAtTime(f0, t); os.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    o.g.gain.setValueAtTime(vol, t); o.g.gain.exponentialRampToValueAtTime(0.0001, t + dur); os.connect(o.in); os.start(t); os.stop(t + dur + 0.02);
  }
  function chirp(base, pn, vol) {
    if (!ready || env.muted()) return;
    const t = AC.currentTime, n = 2 + Math.floor(Math.random() * 4), o = out(pn, vol);
    for (let i = 0; i < n; i++) {
      const os = AC.createOscillator(), g = AC.createGain(), t0 = t + i * rnd(0.07, 0.12);
      os.type = 'sine'; os.frequency.setValueAtTime(base * rnd(0.95, 1.1), t0); os.frequency.exponentialRampToValueAtTime(base * rnd(1.2, 1.7), t0 + 0.07);
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(1, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.085);
      os.connect(g); g.connect(o.in); os.start(t0); os.stop(t0 + 0.1);
    }
  }
  function voice(pn, vol, base) {
    if (!ready || env.muted()) return;
    const t = AC.currentTime, o = out(pn, vol), os = AC.createOscillator(), f1 = AC.createBiquadFilter(), f2 = AC.createBiquadFilter(), g = AC.createGain();
    os.type = 'sawtooth'; os.frequency.setValueAtTime(base, t); os.frequency.linearRampToValueAtTime(base * rnd(0.85, 1.2), t + 0.2);
    f1.type = 'bandpass'; f1.frequency.value = rnd(420, 760); f1.Q.value = 6; f2.type = 'bandpass'; f2.frequency.value = rnd(1100, 2200); f2.Q.value = 7;
    const n = Math.floor(rnd(2, 4)), seg = 0.11;
    g.gain.setValueAtTime(0, t);
    for (let i = 0; i < n; i++) { g.gain.linearRampToValueAtTime(1, t + i * seg + 0.03); g.gain.linearRampToValueAtTime(0.12, t + i * seg + seg * 0.85); }
    g.gain.linearRampToValueAtTime(0, t + n * seg + 0.05);
    os.connect(f1); os.connect(f2); f1.connect(g); f2.connect(g); g.connect(o.in); os.start(t); os.stop(t + n * seg + 0.1);
  }

  function surfaceAt(x, z) {
    if (env.inShop()) return 'wood';
    if (env.onSand(x, z)) return 'sand';
    if (env.onGrass(x, z)) return 'grass';
    return 'stone';
  }
  function step(sprint, x, z, wet, heavy) {
    const sf = surfaceAt(x, z), v = (sprint ? 1 : 0.65) * (heavy ? 1.3 : 1), f = S.foot ^= 1, pn = (f ? 0.15 : -0.15);
    if (sf === 'stone') { noiseShot('white', 'bandpass', 2200 + f * 400, 900, 0.07, 0.07 * v, pn, 1.2); thump(120 - f * 10, 60, 0.09, 0.09 * v, pn); }
    else if (sf === 'grass') { noiseShot('pink', 'bandpass', 1100, 500, 0.14, 0.11 * v, pn, 0.7); thump(90, 55, 0.08, 0.04 * v, pn); }
    else if (sf === 'sand') { noiseShot('pink', 'lowpass', 1400, 400, 0.18, 0.09 * v, pn, 0.5); }
    else { noiseShot('white', 'bandpass', 1500, 700, 0.06, 0.05 * v, pn, 1.4); thump(160, 90, 0.1, 0.1 * v, pn, 'triangle'); }
    if (wet) noiseShot('white', 'highpass', 3500, 2500, 0.09, 0.03 * v, pn, 0.7);
  }

  const api = {
    reload() { noiseShot('white', 'bandpass', 3000, 1800, 0.05, 0.06, 0, 2); thump(900, 500, 0.06, 0.05, 0, 'square'); setTimeout(() => { noiseShot('white', 'bandpass', 2400, 1200, 0.08, 0.07, 0, 2); thump(300, 150, 0.1, 0.08, 0, 'square'); }, 700); },
    equip() { noiseShot('white', 'bandpass', 2600, 1500, 0.07, 0.06, 0, 2); thump(500, 250, 0.08, 0.06, 0, 'square'); },
    door() { thump(140, 70, 0.14, 0.2, 0, 'triangle'); noiseShot('white', 'bandpass', 900, 400, 0.1, 0.07, 0, 1); },
    dry() { noiseShot('white', 'bandpass', 3500, 2800, 0.03, 0.06, 0, 3); },
    cash() { thump(1300, 1300, 0.08, 0.05, 0, 'sine'); setTimeout(() => thump(1750, 1750, 0.12, 0.05, 0, 'sine'), 60); },
    land(v) { thump(110, 50, 0.16, clamp(v / 12, 0.08, 0.3)); noiseShot('white', 'lowpass', 900, 300, 0.12, clamp(v / 14, 0.05, 0.16), 0, 0.7); },
    splash() { noiseShot('white', 'bandpass', 2200, 600, 0.35, 0.12, 0, 0.5); },
    update(dt) {
      if (!ready) { if (!init()) return; }
      const live = env.state() === 'play' && !env.muted();
      const rp = env.ref(), car = env.car(), plane = env.plane(), onFoot = !car && !plane, now = AC.currentTime;
      const x = rp.x, z = rp.z, inShop = env.inShop();
      const gains = { traffic: 0, hiss: 0, city: 0, wind: 0, sea: 0, seaHi: 0, hum: 0 };
      if (live) {
        const downtown = Math.abs(x) < 360 && Math.abs(z) < 360 && !env.onGrass(x, z) ? 1 : 0, inside = inShop ? 1 : 0;
        const near = env.trafficNear(x, z, 80), k = clamp(near / 10, 0, 1), vol = (inside ? 0.12 : 1);
        gains.traffic = (0.05 + 0.1 * k) * downtown * vol + 0.012 * (1 - downtown) * vol;
        gains.hiss = 0.006 * k * vol; gains.city = (0.03 + 0.035 * downtown) * (1 - inside * 0.8) * (x > 340 ? 0.5 : 1);
        const open = clamp((x > 340 ? 1 : 0) * 0.5 + (x > 900 ? 0.4 : 0), 0, 1);
        const alt = plane ? clamp(plane.y / 400, 0, 1) : 0, spd = plane ? Math.hypot(plane.vx, plane.vz) : 0;
        gains.wind = (0.012 + 0.04 * open + 0.02 * Math.min(1, env.rain() * 1.2) + 0.04 * alt) * (1 - inside);
        const cd = env.coastDist(x, z), sea = clamp(1 - cd / 260, 0, 1) * (1 - inside * 0.85);
        const swell = 0.55 + 0.45 * Math.sin(now * 0.8 + Math.sin(now * 0.31) * 2);
        gains.sea = sea * 0.2 * swell; gains.seaHi = sea * 0.045 * swell * swell;
        gains.hum = inside ? 0.05 : 0;
        if (plane) { gains.traffic *= 0.1; gains.city *= 0.1; gains.sea *= 0.4; gains.wind = 0.01; }
      }
      for (const k in gains) if (beds[k]) ramp(beds[k].g, gains[k], 0.6);
      if (car && live) {
        const sp = Math.hypot(car.vx, car.vz), vl = Math.abs(car.vx * Math.cos(car.h) - car.vz * Math.sin(car.h)), sq = clamp((vl - 3.2) / 8, 0, 1) * clamp(sp / 12, 0, 1);
        ramp(S.skid.g, car.ctrl === 'player' ? sq * 0.09 : 0, 0.05); ramp(S.wind.g, clamp((sp - 12) / 30, 0, 1) * 0.05, 0.3);
      } else { ramp(S.skid.g, 0, 0.1); ramp(S.wind.g, plane && live ? clamp(Math.hypot(plane.vx, plane.vz) / 150, 0, 1) * 0.05 : 0, 0.3); }
      const sp = pool, cx = x, cz = z;
      if (live && !plane) {
        const list = env.trafficList(cx, cz, 70, 3);
        for (let i = 0; i < pool.length; i++) {
          const v = pool[i], c = list[i];
          if (!c) { ramp(v.g, 0, 0.1); continue; }
          const dx = c.x - cx, dz = c.z - cz, d = Math.hypot(dx, dz) || 1, rv = (c.vx * dx + c.vz * dz) / d, speed = Math.hypot(c.vx, c.vz), dop = 343 / (343 + rv * 3);
          v.o.frequency.setTargetAtTime((46 + speed * 3.4) * dop, now, 0.06); v.f.frequency.setTargetAtTime(260 + speed * 18, now, 0.1);
          ramp(v.g, clamp(1 - d / 70, 0, 1) ** 1.6 * (c.kind === 'cop' ? 0.06 : 0.045), 0.08); if (v.p) v.p.pan.setTargetAtTime(pan(c.x, c.z), now, 0.05);
        }
      } else for (const v of pool) ramp(v.g, 0, 0.2);
      if (!live) return;
      if (onFoot) {
        const spd = Math.hypot(env.player.vx, env.player.vz), grounded = env.player.grounded && (env.player.sink || 0) < 0.3;
        if (grounded && spd > 0.9) {
          S.stepT -= dt * (spd * 1.02);
          if (S.stepT <= 0) { S.stepT = spd > 7 ? 2.2 : 1.55; step(spd > 7, x, z, env.rain() > 0.4, false); }
        } else S.stepT = Math.min(S.stepT, 0.3);
        if (!grounded && !S.wasAir) S.wasAir = true;
        if (grounded && S.wasAir) { S.wasAir = false; if (-S.fall > 3) api.land(-S.fall); }
        S.fall = env.player.vy;
        if ((env.player.sink || 0) > 0.3 && spd > 1) { S.murmurT -= dt; if (S.murmurT <= 0) { S.murmurT = 0.3; noiseShot('white', 'bandpass', 1800, 700, 0.3, 0.07, 0, 0.5); } }
      }
      S.murmurT -= dt;
      if (S.murmurT <= 0 && !inShop) {
        const p = env.pedNear(x, z, 15);
        S.murmurT = p ? rnd(0.9, 2.4) : 0.5;
        if (p && Math.random() < 0.6) { const d = Math.hypot(p.x - x, p.z - z); voice(pan(p.x, p.z), clamp(1 - d / 15, 0, 1) * 0.07, p.female ? rnd(200, 260) : rnd(105, 145)); }
      }
      S.birdT -= dt;
      if (S.birdT <= 0) {
        S.birdT = rnd(2.5, 7);
        const day = env.hour() > 5.5 && env.hour() < 19 && env.rain() < 0.4;
        if (day && (env.onGrass(x, z) || x > 340) && !inShop) chirp(rnd(2600, 4200), rnd(-0.8, 0.8), rnd(0.012, 0.03));
        else if (!day && env.rain() < 0.4 && x > 340 && !inShop) { thump(5200, 5200, 0.05, 0.01, rnd(-0.6, 0.6), 'square'); }
      }
      S.thunderT -= dt;
      if (S.thunderT <= 0) {
        S.thunderT = rnd(18, 50);
        if (env.rain() > 0.55) { noiseShot('brown', 'lowpass', 900, 120, 3.4, 0.5, rnd(-0.4, 0.4), 0.7); setTimeout(() => noiseShot('brown', 'lowpass', 500, 90, 2.4, 0.3, 0, 0.7), 450); }
      }
    }
  };
  return api;
};
