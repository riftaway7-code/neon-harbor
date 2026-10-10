window.NH_BUILDINGS = function (env) {
  const THREE = env.THREE, scene = env.scene, solids = env.solids, wallMats = env.wallMats, NHM = env.NHM, mulberry = env.mulberry;
  const aniso = Math.min(8, env.renderer.capabilities.getMaxAnisotropy());
  const TAU = Math.PI * 2, FH = 3.6, BW = 3.4, GH = 4.8, TS = 8;
  const R = mulberry(777123);
  const rr = (a, b) => a + R() * (b - a);
  const pick = a => a[Math.floor(R() * a.length)];
  const NEON = [0xff4f8b, 0x38d6e8, 0xffb02e, 0x7dff9a, 0xb07dff];

  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const toTex = c => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = aniso; return t; };
  const LIT = ['#ffd08a', '#ffd08a', '#ffd08a', '#ffe2a8', '#bfe3ff', '#8fb0ff', '#ffb0d8'];

  function pair(w, h) {
    const d = mk(w, h), e = mk(w, h), dx = d.getContext('2d'), ex = e.getContext('2d');
    ex.fillStyle = '#000'; ex.fillRect(0, 0, w, h);
    return { d, e, dx, ex };
  }
  function brick(dx, W, H, base, r, bh, bw, mortar) {
    dx.fillStyle = mortar; dx.fillRect(0, 0, W, H);
    for (let y = 0, row = 0; y < H; y += bh, row++) {
      for (let x = -(row % 2) * bw / 2; x < W; x += bw) {
        const v = (r() - 0.5) * 26, c = base.map(k => Math.max(0, Math.min(255, Math.round(k + v))));
        dx.fillStyle = 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
        dx.fillRect(x + 1, y + 1, bw - 2, bh - 2);
      }
    }
  }
  function grime(dx, W, H, r, n, a) {
    for (let i = 0; i < n; i++) {
      const x = r() * W, y = r() * H, w = 2 + r() * 14, h = 20 + r() * 90, g = dx.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, 'rgba(20,18,14,' + (a * r()).toFixed(3) + ')'); g.addColorStop(1, 'rgba(20,18,14,0)');
      dx.fillStyle = g; dx.fillRect(x, y, w, h);
    }
    for (let i = 0; i < W * H / 260; i++) {
      dx.fillStyle = r() < 0.5 ? 'rgba(255,255,255,' + (r() * 0.05).toFixed(3) + ')' : 'rgba(0,0,0,' + (r() * 0.08).toFixed(3) + ')';
      dx.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2);
    }
  }
  function win(P, x, y, w, h, o, r) {
    const dx = P.dx, ex = P.ex, lit = r() < o.lit, f = o.fw;
    dx.fillStyle = 'rgba(0,0,0,0.42)'; dx.fillRect(x - 3, y - 2, w + 6, h + 6);
    dx.fillStyle = o.frame; dx.fillRect(x, y, w, h);
    const gx = x + f, gy = y + f, gw = w - f * 2, gh = h - f * 2, g = dx.createLinearGradient(0, gy, 0, gy + gh);
    g.addColorStop(0, '#a8c4de'); g.addColorStop(0.5, '#56769a'); g.addColorStop(1, '#27384f');
    dx.fillStyle = g; dx.fillRect(gx, gy, gw, gh);
    dx.fillStyle = 'rgba(255,255,255,0.16)'; dx.beginPath(); dx.moveTo(gx, gy + gh * 0.75); dx.lineTo(gx + gw, gy + gh * 0.18); dx.lineTo(gx + gw, gy + gh * 0.42); dx.lineTo(gx, gy + gh); dx.fill();
    dx.fillStyle = 'rgba(0,0,0,0.4)'; dx.fillRect(gx, gy, gw, Math.max(3, gh * 0.09)); dx.fillRect(gx, gy, Math.max(2, gw * 0.05), gh);
    if (lit) {
      const col = pick(LIT), eg = ex.createLinearGradient(0, gy, 0, gy + gh);
      eg.addColorStop(0, col); eg.addColorStop(1, 'rgba(255,170,90,0.75)');
      ex.fillStyle = eg; ex.fillRect(gx, gy, gw, gh);
      if (R() < 0.45) { ex.fillStyle = 'rgba(0,0,0,0.55)'; ex.fillRect(gx, gy, gw * (0.15 + R() * 0.2), gh); if (R() < 0.6) ex.fillRect(gx + gw * 0.7, gy, gw * 0.3, gh); }
      if (R() < 0.3) { ex.fillStyle = 'rgba(0,0,0,0.5)'; ex.fillRect(gx, gy + gh * 0.65, gw, gh * 0.35); }
    }
    dx.fillStyle = o.frame;
    if (o.mullV) { dx.fillRect(x + w / 2 - 1.5, y, 3, h); ex.fillStyle = '#000'; ex.fillRect(x + w / 2 - 1.5, y, 3, h); }
    if (o.rail) { dx.fillRect(x, y + h * 0.45, w, 3); ex.fillStyle = '#000'; ex.fillRect(x, y + h * 0.45, w, 3); }
    if (o.panes) {
      ex.fillStyle = '#000';
      for (let k = 1; k < o.panes[0]; k++) { dx.fillRect(x + w * k / o.panes[0] - 1.5, y, 3, h); ex.fillRect(x + w * k / o.panes[0] - 1.5, y, 3, h); }
      for (let k = 1; k < o.panes[1]; k++) { dx.fillRect(x, y + h * k / o.panes[1] - 1.5, w, 3); ex.fillRect(x, y + h * k / o.panes[1] - 1.5, w, 3); }
    }
    if (o.sill) { dx.fillStyle = o.sill; dx.fillRect(x - 6, y + h, w + 12, 7); dx.fillStyle = 'rgba(0,0,0,0.35)'; dx.fillRect(x - 6, y + h + 7, w + 12, 4); }
    if (o.lintel) { dx.fillStyle = o.lintel; dx.fillRect(x - 6, y - 9, w + 12, 8); }
  }

  const STYLES = {
    brick: {
      tints: [[1, 1, 1], [0.9, 0.82, 0.78], [1.1, 0.9, 0.8], [0.8, 0.82, 0.92], [1.15, 1.0, 0.85]], ledge: 1,
      paint(P, r) {
        brick(P.dx, 1024, 1024, [140, 76, 58], r, 8, 22, '#9a9080');
        for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) win(P, i * 128 + 36, j * 128 + 22, 56, 80, { lit: 0.38, frame: '#ece6d6', fw: 5, rail: true, sill: '#d8d0bf', lintel: '#cfc6b2' }, r);
        for (let j = 0; j < 8; j++) { P.dx.fillStyle = 'rgba(0,0,0,0.12)'; P.dx.fillRect(0, j * 128 + 120, 1024, 8); }
        grime(P.dx, 1024, 1024, r, 160, 0.16);
      }
    },
    concrete: {
      tints: [[1, 1, 1], [0.86, 0.92, 1.05], [1.08, 1.0, 0.88], [0.9, 1.0, 0.92]], ledge: 2,
      paint(P, r) {
        P.dx.fillStyle = '#a2a19c'; P.dx.fillRect(0, 0, 1024, 1024);
        for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
          const x = i * 128, y = j * 128;
          P.dx.fillStyle = 'rgba(255,255,255,0.05)'; P.dx.fillRect(x, y, 128, 128);
          P.dx.fillStyle = 'rgba(0,0,0,0.22)'; P.dx.fillRect(x, y + 98, 128, 30);
          P.dx.fillStyle = 'rgba(0,0,0,0.3)'; P.dx.fillRect(x, y + 126, 128, 2); P.dx.fillRect(x, y, 2, 128);
          win(P, x + 8, y + 22, 112, 62, { lit: 0.4, frame: '#3d424b', fw: 4, mullV: true }, r);
        }
        grime(P.dx, 1024, 1024, r, 220, 0.2);
      }
    },
    glass: {
      tints: [[0.9, 1, 1.1], [0.8, 1, 0.95], [1, 0.95, 0.85]], ledge: 0,
      paint(P, r) {
        P.dx.fillStyle = '#2b3b50'; P.dx.fillRect(0, 0, 1024, 1024);
        for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
          const x = i * 128, y = j * 128;
          win(P, x + 3, y + 3, 122, 92, { lit: 0.42, frame: '#c8d2de', fw: 3, mullV: true, rail: false, panes: [2, 1] }, r);
          P.dx.fillStyle = '#1b2838'; P.dx.fillRect(x, y + 98, 128, 30);
          P.dx.fillStyle = 'rgba(255,255,255,0.08)'; P.dx.fillRect(x, y + 98, 128, 3);
        }
        grime(P.dx, 1024, 1024, r, 80, 0.1);
      }
    },
    deco: {
      tints: [[1, 0.94, 0.82], [0.92, 0.88, 0.8], [1.05, 1.0, 0.92], [0.95, 0.85, 0.78]], ledge: 2,
      paint(P, r) {
        P.dx.fillStyle = '#b9ae94'; P.dx.fillRect(0, 0, 1024, 1024);
        for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
          const x = i * 128, y = j * 128;
          P.dx.fillStyle = '#ded7c3'; P.dx.fillRect(x, y, 16, 128); P.dx.fillRect(x + 112, y, 16, 128);
          P.dx.fillStyle = 'rgba(0,0,0,0.25)'; P.dx.fillRect(x + 16, y, 4, 128); P.dx.fillRect(x + 108, y, 4, 128);
          P.dx.fillStyle = '#a79d86'; P.dx.fillRect(x + 28, y + 100, 72, 24);
          P.dx.fillStyle = 'rgba(255,255,255,0.18)'; P.dx.fillRect(x + 32, y + 104, 64, 2); P.dx.fillRect(x + 32, y + 112, 64, 2);
          win(P, x + 34, y + 18, 60, 76, { lit: 0.4, frame: '#4e4234', fw: 5, rail: true, sill: '#e2dccb' }, r);
        }
        grime(P.dx, 1024, 1024, r, 200, 0.18);
      }
    },
    modern: {
      tints: [[1, 1, 1], [0.95, 0.97, 1.05], [1.08, 1.0, 0.9], [0.88, 0.95, 0.9]], ledge: 0,
      paint(P, r) {
        P.dx.fillStyle = '#d0ccc2'; P.dx.fillRect(0, 0, 1024, 1024);
        for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
          const x = i * 128, y = j * 128;
          P.dx.fillStyle = 'rgba(0,0,0,0.18)'; P.dx.fillRect(x + 16, y + 16, 98, 92);
          win(P, x + 22, y + 22, 84, 80, { lit: 0.36, frame: '#2b2f36', fw: 4, mullV: r() < 0.5 }, r);
          P.dx.fillStyle = 'rgba(0,0,0,0.3)'; P.dx.fillRect(x + 22, y + 102, 84, 3);
        }
        grime(P.dx, 1024, 1024, r, 150, 0.14);
      }
    },
    warehouse: {
      tints: [[1, 1, 1], [0.9, 0.85, 0.8]], ledge: 1,
      paint(P, r) {
        brick(P.dx, 1024, 1024, [116, 66, 52], r, 8, 24, '#6c6358');
        for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
          const x = i * 128, y = j * 128;
          P.dx.fillStyle = '#8a8272'; P.dx.fillRect(x + 12, y + 10, 104, 106);
          win(P, x + 18, y + 14, 92, 98, { lit: 0.32, frame: '#202c28', fw: 4, panes: [3, 4], sill: '#928a78' }, r);
        }
        grime(P.dx, 1024, 1024, r, 240, 0.24);
      }
    }
  };

  function paintShop(variant) {
    const r = mulberry(4400 + variant * 17), P = pair(1024, 256), dx = P.dx, ex = P.ex;
    dx.fillStyle = variant ? '#3b3e46' : '#8a5a48'; dx.fillRect(0, 0, 1024, 256);
    if (!variant) brick(dx, 1024, 256, [150, 88, 68], r, 8, 22, '#a89e8c');
    const signs = ['#1d2a3a', '#5a1f2a', '#1f4a3a', '#2a2a2e', '#6a4a1c', '#2c2a5a'];
    for (let i = 0; i < 8; i++) {
      const x = i * 128, kind = r(), sc = signs[Math.floor(r() * signs.length)];
      dx.fillStyle = sc; dx.fillRect(x + 6, 8, 116, 40);
      dx.fillStyle = 'rgba(255,255,255,0.12)'; dx.fillRect(x + 6, 8, 116, 3);
      if (r() < 0.75) {
        const nc = pick(['#ff4f8b', '#38d6e8', '#ffb02e', '#7dff9a', '#ffe9b0']);
        ex.fillStyle = nc; for (let k = 0; k < 4; k++) ex.fillRect(x + 14 + k * 26, 18, 8 + r() * 16, 5 + r() * 12);
        dx.fillStyle = nc; for (let k = 0; k < 4; k++) dx.fillRect(x + 14 + k * 26, 18, 6, 6);
      }
      dx.fillStyle = '#25272e'; dx.fillRect(x, 168, 128, 88);
      dx.fillStyle = 'rgba(255,255,255,0.07)'; dx.fillRect(x + 6, 176, 52, 72); dx.fillRect(x + 66, 176, 52, 72);
      if (kind < 0.12) {
        dx.fillStyle = '#8a8d94'; dx.fillRect(x + 8, 56, 112, 112);
        for (let k = 0; k < 14; k++) { dx.fillStyle = 'rgba(0,0,0,0.25)'; dx.fillRect(x + 8, 56 + k * 8, 112, 2); }
        continue;
      }
      const gx = x + 10, gy = 56, gw = 108, gh = 110, g = dx.createLinearGradient(0, gy, 0, gy + gh);
      g.addColorStop(0, '#6f8da8'); g.addColorStop(0.6, '#2f4457'); g.addColorStop(1, '#1b2733');
      dx.fillStyle = g; dx.fillRect(gx, gy, gw, gh);
      dx.fillStyle = 'rgba(255,255,255,0.15)'; dx.beginPath(); dx.moveTo(gx, gy + gh); dx.lineTo(gx + gw * 0.5, gy); dx.lineTo(gx + gw * 0.75, gy); dx.lineTo(gx + gw * 0.25, gy + gh); dx.fill();
      if (r() < 0.82) {
        const warm = r() < 0.7, eg = ex.createLinearGradient(0, gy, 0, gy + gh);
        eg.addColorStop(0, warm ? '#ffe2ae' : '#bfe3ff'); eg.addColorStop(1, warm ? '#d9944a' : '#6aa0d8');
        ex.fillStyle = eg; ex.fillRect(gx, gy, gw, gh);
        for (let k = 0; k < 3; k++) { ex.fillStyle = 'rgba(0,0,0,0.3)'; ex.fillRect(gx, gy + 28 + k * 28, gw, 3); }
        for (let k = 0; k < 7; k++) { ex.fillStyle = 'hsl(' + Math.floor(r() * 360) + ',60%,60%)'; ex.fillRect(gx + 6 + r() * 90, gy + 14 + Math.floor(r() * 3) * 28, 8 + r() * 10, 12); }
      }
      if (kind > 0.55 && kind < 0.8) {
        dx.fillStyle = '#16181d'; dx.fillRect(x + 42, 58, 44, 110);
        dx.fillStyle = '#7e8b96'; dx.fillRect(x + 46, 62, 36, 100);
        dx.fillStyle = 'rgba(255,255,255,0.2)'; dx.fillRect(x + 48, 64, 8, 96);
        dx.fillStyle = '#d9c27a'; dx.fillRect(x + 74, 112, 4, 14);
        ex.fillStyle = '#000'; ex.fillRect(x + 42, 58, 44, 110);
      }
      dx.fillStyle = '#16181d'; dx.fillRect(x, 52, 128, 5); dx.fillRect(x - 2, 56, 5, 112); dx.fillRect(x + 125, 56, 5, 112);
    }
    grime(dx, 1024, 256, r, 60, 0.2);
    return P;
  }
  function gravel() {
    const c = mk(256, 256), x = c.getContext('2d'), r = mulberry(31);
    x.fillStyle = '#4a4c54'; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 9000; i++) { const v = 50 + r() * 70 | 0; x.fillStyle = 'rgb(' + v + ',' + v + ',' + (v + 4) + ')'; x.fillRect(r() * 256, r() * 256, 1 + r() * 2, 1 + r() * 2); }
    for (let i = 0; i < 14; i++) { x.fillStyle = 'rgba(0,0,0,0.16)'; x.beginPath(); x.ellipse(r() * 256, r() * 256, 10 + r() * 30, 5 + r() * 14, r() * 3, 0, TAU); x.fill(); }
    return toTex(c);
  }

  const MATS = {}, FACADE = {};
  function ensureMats() {
    if (MATS.trim) return;
    for (const k in STYLES) {
      const P = pair(1024, 1024);
      STYLES[k].paint(P, mulberry(900 + k.length * 31 + k.charCodeAt(0)));
      FACADE[k] = new THREE.MeshLambertMaterial({ map: toTex(P.d), emissive: 0xffffff, emissiveMap: toTex(P.e), vertexColors: true });
    }
    for (let v = 0; v < 2; v++) { const P = paintShop(v); MATS['shop' + v] = new THREE.MeshLambertMaterial({ map: toTex(P.d), emissive: 0xffffff, emissiveMap: toTex(P.e), vertexColors: true }); }
    MATS.trim = new THREE.MeshLambertMaterial({ vertexColors: true });
    const gt = gravel(); gt.repeat.set(1, 1);
    MATS.roof = new THREE.MeshLambertMaterial({ map: gt, vertexColors: true });
    MATS.glowWarm = new THREE.MeshLambertMaterial({ color: 0x222222, emissive: 0xffc880, emissiveIntensity: 0 });
    MATS.glowCool = new THREE.MeshLambertMaterial({ color: 0x222222, emissive: 0x9fd6ff, emissiveIntensity: 0 });
    MATS.glowPink = new THREE.MeshLambertMaterial({ color: 0x222222, emissive: 0xff6fb0, emissiveIntensity: 0 });
    MATS.beacon = new THREE.MeshBasicMaterial({ color: 0xff3040 });
    NEON.forEach((c, i) => { MATS['neon' + i] = new THREE.MeshBasicMaterial({ color: c }); });
    wallMats.push([...Object.values(FACADE), MATS.shop0, MATS.shop1, MATS.glowWarm, MATS.glowCool, MATS.glowPink]);
    for (const k in FACADE) MATS['f_' + k] = FACADE[k];
  }

  const ACC = {};
  const A = key => ACC[key] || (ACC[key] = { p: [], n: [], u: [], c: [], i: [] });
  function quad(a, P, N, UV, C) {
    const b = a.p.length / 3, e1 = [P[1][0] - P[0][0], P[1][1] - P[0][1], P[1][2] - P[0][2]], e2 = [P[2][0] - P[0][0], P[2][1] - P[0][1], P[2][2] - P[0][2]];
    const cx = e1[1] * e2[2] - e1[2] * e2[1], cy = e1[2] * e2[0] - e1[0] * e2[2], cz = e1[0] * e2[1] - e1[1] * e2[0], n0 = N[0];
    for (let k = 0; k < 4; k++) { a.p.push(P[k][0], P[k][1], P[k][2]); a.n.push(N[k][0], N[k][1], N[k][2]); a.u.push(UV[k][0], UV[k][1]); a.c.push(C[0], C[1], C[2]); }
    if (cx * n0[0] + cy * n0[1] + cz * n0[2] >= 0) a.i.push(b, b + 1, b + 2, b, b + 2, b + 3); else a.i.push(b, b + 2, b + 1, b, b + 3, b + 2);
  }
  function box(key, cx, cy, cz, sx, sy, sz, yaw, col) {
    const a = A(key), co = Math.cos(yaw), si = Math.sin(yaw), hx = sx / 2, hy = sy / 2, hz = sz / 2;
    const T = (lx, ly, lz) => [cx + lx * co + lz * si, cy + ly, cz - lx * si + lz * co];
    const Nv = (lx, ly, lz) => [lx * co + lz * si, ly, -lx * si + lz * co];
    const faces = [
      [[-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz], [0, 0, 1]], [[hx, -hy, -hz], [-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz], [0, 0, -1]],
      [[hx, -hy, hz], [hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz], [1, 0, 0]], [[-hx, -hy, -hz], [-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz], [-1, 0, 0]],
      [[-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz], [-hx, hy, -hz], [0, 1, 0]], [[-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz], [0, -1, 0]]
    ];
    for (const f of faces) {
      const n = Nv(f[4][0], f[4][1], f[4][2]);
      quad(a, [T(...f[0]), T(...f[1]), T(...f[2]), T(...f[3])], [n, n, n, n], [[0, 0], [1, 0], [1, 1], [0, 1]], col);
    }
  }
  function orient(poly) {
    let cx = 0, cz = 0;
    for (const p of poly) { cx += p[0]; cz += p[1]; }
    cx /= poly.length; cz /= poly.length;
    const p0 = poly[0], p1 = poly[1], dx = p1[0] - p0[0], dz = p1[1] - p0[1], nx = -dz, nz = dx;
    const out = poly.slice();
    if (nx * ((p0[0] + p1[0]) / 2 - cx) + nz * ((p0[1] + p1[1]) / 2 - cz) < 0) out.reverse();
    out.cx = cx; out.cz = cz;
    return out;
  }
  const rectPoly = (cx, cz, w, d) => orient([[cx - w / 2, cz + d / 2], [cx + w / 2, cz + d / 2], [cx + w / 2, cz - d / 2], [cx - w / 2, cz - d / 2]]);
  function chamferPoly(cx, cz, w, d, c) {
    const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
    return orient([[x0 + c, z1], [x1 - c, z1], [x1, z1 - c], [x1, z0 + c], [x1 - c, z0], [x0 + c, z0], [x0, z0 + c], [x0, z1 - c]]);
  }
  function cylPoly(cx, cz, r, n) {
    const pts = [];
    for (let i = 0; i < n; i++) { const a = i / n * TAU; pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); }
    return orient(pts);
  }
  function eachEdge(poly, fn) {
    for (let i = 0; i < poly.length; i++) {
      const p0 = poly[i], p1 = poly[(i + 1) % poly.length], dx = p1[0] - p0[0], dz = p1[1] - p0[1], L = Math.hypot(dx, dz);
      fn({ x0: p0[0], z0: p0[1], x1: p1[0], z1: p1[1], L, nx: -dz / L, nz: dx / L, yaw: Math.atan2(-dz, dx), mx: (p0[0] + p1[0]) / 2, mz: (p0[1] + p1[1]) / 2, i });
    }
  }

  const PROPS = {};
  const prop = (name, x, y, z, yaw, sx, sy, sz) => { (PROPS[name] || (PROPS[name] = [])).push({ x, y, z, r: yaw, sx: sx || 1, sy: sy || sx || 1, sz: sz || sx || 1 }); };

  function wallStrip(key, e, y0, y1, nb, nf, uo, vo, col, smoothPoly) {
    const a = A(key), u0 = uo / TS, u1 = (uo + nb) / TS, v0 = vo / TS, v1 = (vo + nf) / TS;
    let n0 = [e.nx, 0, e.nz], n1 = n0;
    if (smoothPoly) {
      const k = smoothPoly.length, pa = smoothPoly[(e.i + k - 1) % k], pb = smoothPoly[e.i], pc = smoothPoly[(e.i + 1) % k], pd = smoothPoly[(e.i + 2) % k];
      const nn = (p, q) => { const dx = q[0] - p[0], dz = q[1] - p[1], L = Math.hypot(dx, dz); return [-dz / L, dx / L]; };
      const A1 = nn(pa, pb), B1 = nn(pb, pc), C1 = nn(pc, pd);
      const av = (s, t) => { const x = s[0] + t[0], z = s[1] + t[1], L = Math.hypot(x, z) || 1; return [x / L, 0, z / L]; };
      n0 = av(A1, B1); n1 = av(B1, C1);
    }
    quad(a, [[e.x0, y0, e.z0], [e.x1, y0, e.z1], [e.x1, y1, e.z1], [e.x0, y1, e.z0]], [n0, n1, n1, n0], [[u0, v0], [u1, v0], [u1, v1], [u0, v1]], col);
  }
  function cap(poly, y, col, up) {
    const a = A('roof'), cx = poly.cx, cz = poly.cz;
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length];
      quad(a, [[cx, y, cz], [p[0], y, p[1]], [q[0], y, q[1]], [q[0], y, q[1]]], [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]], [[cx / 8, cz / 8], [p[0] / 8, p[1] / 8], [q[0] / 8, q[1] / 8], [q[0] / 8, q[1] / 8]], col);
    }
  }

  function body(poly, y0, y1, o) {
    const nf = Math.max(1, Math.round((y1 - y0) / FH)), uo = Math.floor(R() * TS), vo = Math.floor(R() * TS), st = STYLES[o.style], tint = o.tint;
    const fh = (y1 - y0) / nf;
    eachEdge(poly, e => {
      const nb = Math.max(1, Math.round(e.L / BW));
      wallStrip('f_' + o.style, e, y0, y1, nb, nf, uo, vo, tint, o.smooth ? poly : null);
      if (o.cornice) box('trim', e.mx + e.nx * 0.22, y1 - 0.22, e.mz + e.nz * 0.22, e.L + 0.4, 0.5, 0.7, e.yaw, o.trimCol);
      if (o.ledge) for (let k = o.ledge; k < nf; k += o.ledge) box('trim', e.mx + e.nx * 0.1, y0 + k * fh - 0.08, e.mz + e.nz * 0.1, e.L + 0.1, 0.2, 0.32, e.yaw, o.trimCol);
      if (o.piers) for (let b = o.piers; b < nb; b += o.piers) {
        const t = (b / nb - 0.5) * e.L;
        box('trim', e.mx + Math.cos(e.yaw) * t + e.nx * 0.12, (y0 + y1) / 2, e.mz - Math.sin(e.yaw) * t + e.nz * 0.12, 0.5, y1 - y0, 0.34, e.yaw, o.trimCol);
      }
      if (o.base) box('trim', e.mx + e.nx * 0.12, y0 + 0.45, e.mz + e.nz * 0.12, e.L + 0.2, 0.9, 0.3, e.yaw, [0.34, 0.33, 0.32]);
    });
    if (o.corners) for (const p of poly) box('trim', p[0], (y0 + y1) / 2, p[1], 0.7, y1 - y0, 0.7, 0, o.trimCol);
    return { nf, fh };
  }
  function roofTop(poly, y, o) {
    cap(poly, y, [1, 1, 1]);
    if (o.parapet) eachEdge(poly, e => box('trim', e.mx - e.nx * 0.18, y + 0.45, e.mz - e.nz * 0.18, e.L + 0.1, 0.9, 0.32, e.yaw, o.trimCol));
  }
  function ground(poly, y1, variant, tint) {
    const uo = Math.floor(R() * TS), key = 'shop' + variant;
    eachEdge(poly, e => {
      const nb = Math.max(1, Math.round(e.L / BW));
      wallStrip(key, e, 0, y1, nb, TS, uo, 0, tint);
      for (let b = 0; b < nb; b++) {
        if (e.L < 6 || R() > 0.42) continue;
        const t = ((b + 0.5) / nb - 0.5) * e.L, px = e.mx + Math.cos(e.yaw) * t, pz = e.mz - Math.sin(e.yaw) * t;
        prop('awning', px + e.nx * 0.05, y1 * 0.64, pz + e.nz * 0.05, e.yaw, (e.L / nb) * 0.92, 1, 1);
        if (R() < 0.2) prop('street_planter', px + e.nx * 1.0, 0, pz + e.nz * 1.0, e.yaw, 1, 1, 1);
      }
      if (e.L > 10 && R() < 0.4) { const t = (R() - 0.5) * e.L * 0.7; prop('blade_sign', e.mx + Math.cos(e.yaw) * t + e.nx * 0.1, 4.3, e.mz - Math.sin(e.yaw) * t + e.nz * 0.1, e.yaw, 1, 1, 1); }
    });
  }
  function neonSign(poly, y, w) {
    const edges = []; eachEdge(poly, e => { if (e.L > 8) edges.push(e); });
    if (!edges.length) return;
    const e = pick(edges), t = (R() - 0.5) * e.L * 0.5, sw = Math.min(e.L * 0.5, w), k = Math.floor(R() * NEON.length);
    box('neon' + k, e.mx + Math.cos(e.yaw) * t + e.nx * 0.35, y, e.mz - Math.sin(e.yaw) * t + e.nz * 0.35, sw, 1.7, 0.2, e.yaw, [1, 1, 1]);
    box('trim', e.mx + Math.cos(e.yaw) * t + e.nx * 0.18, y, e.mz - Math.sin(e.yaw) * t + e.nz * 0.18, sw + 0.3, 2.0, 0.2, e.yaw, [0.1, 0.1, 0.12]);
  }
  function roofProps(x0, z0, x1, z1, y, avoid, o) {
    const w = x1 - x0, d = z1 - z0, area = w * d;
    if (w < 3.5 || d < 3.5) return;
    const placed = [];
    const free = (px, pz, rad) => {
      if (px < x0 + rad + 0.3 || px > x1 - rad - 0.3 || pz < z0 + rad + 0.3 || pz > z1 - rad - 0.3) return false;
      if (avoid && px > avoid[0] - rad - 1.2 && px < avoid[2] + rad + 1.2 && pz > avoid[1] - rad - 1.2 && pz < avoid[3] + rad + 1.2) return false;
      for (const q of placed) if (Math.hypot(px - q[0], pz - q[1]) < rad + q[2] + 0.4) return false;
      return true;
    };
    const put = (name, rad, sc, yawFree) => {
      for (let t = 0; t < 14; t++) {
        const px = rr(x0, x1), pz = rr(z0, z1);
        if (!free(px, pz, rad * sc)) continue;
        placed.push([px, pz, rad * sc]);
        prop(name, px, y, pz, yawFree ? R() * TAU : Math.floor(R() * 4) * Math.PI / 2, sc, sc, sc);
        return [px, pz];
      }
      return null;
    };
    if (o.shed && area > 120) put('rooftop_shed', 2.1, 1, false);
    if (o.tower && area > 90 && R() < 0.5) put('water_tower', 1.8, rr(0.9, 1.15), true);
    const nh = Math.min(5, Math.floor(area / 90) + 1 + (R() < 0.5 ? 1 : 0));
    for (let i = 0; i < nh; i++) put('hvac_unit', 1.3, rr(0.85, 1.2), false);
    for (let i = 0; i < Math.min(4, Math.floor(area / 80) + 1); i++) put('vent_stack', 0.7, rr(0.8, 1.3), true);
    if (R() < 0.45) put('sat_dish', 0.7, rr(0.8, 1.3), true);
    if (o.mast) { const m = put('antenna_mast', 0.7, rr(0.9, 1.2), true); if (m) box('beacon', m[0], y + 9.0 * 1.05 + 1.6, m[1], 0.5, 0.5, 0.5, 0, [1, 1, 1]); }
  }
  function sideProps(poly, y0, y1, o) {
    const nf = Math.max(1, Math.round((y1 - y0) / FH)), fh = (y1 - y0) / nf;
    const edges = []; eachEdge(poly, e => { if (e.L > 5) edges.push(e); });
    if (!edges.length) return;
    if (o.fire && nf >= 3) {
      const e = pick(edges), t = (R() - 0.5) * e.L * 0.5;
      for (let k = 1; k < nf; k++) prop('fire_escape', e.mx + Math.cos(e.yaw) * t + e.nx * 0.06, y0 + k * fh - 3.6 + 0.0, e.mz - Math.sin(e.yaw) * t + e.nz * 0.06, e.yaw, 1, fh / 3.6, 1);
    }
    if (o.balcony && nf >= 4) {
      let count = 0;
      for (const e of edges) {
        const nb = Math.max(1, Math.round(e.L / BW));
        for (let k = 2; k < nf && count < 40; k++) for (let b = 1; b < nb - 1; b += 2) {
          if (R() > 0.2) continue;
          const t = ((b + 0.5) / nb - 0.5) * e.L;
          prop('balcony', e.mx + Math.cos(e.yaw) * t + e.nx * 0.0, y0 + k * fh + 0.1, e.mz - Math.sin(e.yaw) * t + e.nz * 0.0, e.yaw, 1, 1, 1);
          count++;
        }
      }
    }
    const nac = Math.min(14, Math.floor(nf * edges.length * 0.7));
    for (let i = 0; i < nac; i++) {
      const e = pick(edges), nb = Math.max(1, Math.round(e.L / BW)), b = Math.floor(R() * nb), k = 1 + Math.floor(R() * Math.max(1, nf - 1)), t = ((b + 0.5) / nb - 0.5) * e.L;
      prop('window_ac', e.mx + Math.cos(e.yaw) * t + e.nx * 0.05, y0 + k * fh + 0.72, e.mz - Math.sin(e.yaw) * t + e.nz * 0.05, e.yaw, 1, 1, 1);
    }
  }

  function shrink(r, i) { return { cx: r.cx, cz: r.cz, w: Math.max(4, r.w - i * 2), d: Math.max(4, r.d - i * 2) }; }

  function add(x, z, w, d, h) {
    ensureMats();
    solids.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, h });
    const trimCol = pick([[0.72, 0.7, 0.66], [0.66, 0.66, 0.68], [0.78, 0.74, 0.66]]);
    const shop = R() < 0.55 ? 0 : 1;
    const gtint = [0.95 + R() * 0.1, 0.95 + R() * 0.1, 0.95 + R() * 0.1];
    const tintOf = k => { const t = pick(STYLES[k].tints), j = 0.94 + R() * 0.12; return [t[0] * j, t[1] * j, t[2] * j]; };
    const base = rectPoly(x, z, w, d);
    const glow = pick(['glowWarm', 'glowWarm', 'glowCool', 'glowPink']);
    if (h < 15) {
      const style = pick(['brick', 'brick', 'brick', 'warehouse', 'modern', 'deco']), tint = tintOf(style), type = R();
      ground(base, GH, shop, gtint);
      const info = body(base, GH, h, { style, tint, cornice: true, trimCol, ledge: STYLES[style].ledge, base: false });
      if (type < 0.3 && h > 9) {
        const r2 = rectPoly(x + rr(-1, 1) * w * 0.1, z + rr(-1, 1) * d * 0.1, w * rr(0.5, 0.7), d * rr(0.5, 0.7));
        roofTop(base, h, { parapet: true, trimCol });
        const h2 = h + FH * (1 + Math.floor(R() * 2));
        body(r2, h, h2, { style, tint, cornice: true, trimCol, ledge: 0 });
        roofTop(r2, h2, { parapet: true, trimCol });
        roofProps(r2.cx - w * 0.3, r2.cz - d * 0.3, r2.cx + w * 0.3, r2.cz + d * 0.3, h2, null, { tower: true });
        roofProps(x - w / 2 + 0.6, z - d / 2 + 0.6, x + w / 2 - 0.6, z + d / 2 - 0.6, h, [r2.cx - w * 0.35, r2.cz - d * 0.35, r2.cx + w * 0.35, r2.cz + d * 0.35], { tower: R() < 0.5 });
      } else if (type < 0.5 && w > 14 && d > 14) {
        const top = rectPoly(x, z, w - 5, d - 5), peak = h + 3.4;
        eachEdge(base, e => {
          const inx = top.cx, inz = top.cz, a = A('roof'), c1 = [0.2, 0.22, 0.26];
          const kx = (w - 5) / w, kz = (d - 5) / d, q0 = [e.x0, h, e.z0], q1 = [e.x1, h, e.z1];
          const shr = p => [x + (p[0] - x) * kx, peak, z + (p[2] - z) * kz];
          const t0 = shr(q0), t1 = shr(q1), n = [e.nx * 0.78, 0.62, e.nz * 0.78];
          quad(a, [q0, q1, t1, t0], [n, n, n, n], [[0, 0], [2, 0], [2, 1], [0, 1]], c1);
        });
        box('trim', x, peak + 0.05, z, w - 5.2, 0.12, d - 5.2, 0, [0.15, 0.16, 0.19]);
        cap(top, peak + 0.05, [0.4, 0.4, 0.42]);
        box('trim', x + w * 0.2, peak + 1.1, z - d * 0.1, 1.1, 2.4, 1.1, 0, [0.5, 0.36, 0.3]);
        roofProps(x - 1, z - 1, x + 1, z + 1, peak, null, {});
      } else {
        roofTop(base, h, { parapet: true, trimCol });
        roofProps(x - w / 2 + 0.6, z - d / 2 + 0.6, x + w / 2 - 0.6, z + d / 2 - 0.6, h, null, { shed: h > 8, tower: R() < 0.4 });
      }
      sideProps(base, GH, h, { fire: style === 'brick' || style === 'warehouse', balcony: false });
      if (R() < 0.35) neonSign(base, rr(5.5, Math.max(6, Math.min(h - 2, 10))), w * 0.5);
      return;
    }
    if (h < 40) {
      const type = R(), style = pick(['concrete', 'brick', 'modern', 'deco', 'glass']), tint = tintOf(style), ph = GH + FH * (2 + Math.floor(R() * 2));
      ground(base, GH, shop, gtint);
      body(base, GH, ph, { style: pick(['brick', 'deco', 'modern']), tint: tintOf('deco'), cornice: true, trimCol, ledge: 1 });
      roofTop(base, ph, { parapet: true, trimCol });
      let topPoly, topRect;
      if (type < 0.34) {
        const ins = Math.min(w, d) * rr(0.12, 0.2), sx = rr(-1, 1) * ins * 0.6, sz = rr(-1, 1) * ins * 0.6;
        topRect = { cx: x + sx, cz: z + sz, w: w - ins * 2, d: d - ins * 2 };
        topPoly = rectPoly(topRect.cx, topRect.cz, topRect.w, topRect.d);
        body(topPoly, ph, h, { style, tint, cornice: true, trimCol, ledge: STYLES[style].ledge, corners: style === 'deco' });
        const hs = h + FH * 2;
        const crown = rectPoly(topRect.cx, topRect.cz, topRect.w * 0.6, topRect.d * 0.6);
        roofTop(topPoly, h, { parapet: true, trimCol });
        body(crown, h, hs, { style, tint, cornice: true, trimCol, ledge: 0 });
        roofTop(crown, hs, { parapet: true, trimCol });
        roofProps(crown.cx - topRect.w * 0.25, crown.cz - topRect.d * 0.25, crown.cx + topRect.w * 0.25, crown.cz + topRect.d * 0.25, hs, null, { mast: h > 30 });
        roofProps(topRect.cx - topRect.w / 2 + 0.6, topRect.cz - topRect.d / 2 + 0.6, topRect.cx + topRect.w / 2 - 0.6, topRect.cz + topRect.d / 2 - 0.6, h, [crown.cx - topRect.w * 0.3 - 0.5, crown.cz - topRect.d * 0.3 - 0.5, crown.cx + topRect.w * 0.3 + 0.5, crown.cz + topRect.d * 0.3 + 0.5], { shed: true, tower: R() < 0.5 });
        box(glow, topRect.cx, h + 0.15, topRect.cz, topRect.w + 0.5, 0.2, topRect.d + 0.5, 0, [1, 1, 1]);
        roofProps(x - w / 2 + 0.8, z - d / 2 + 0.8, x + w / 2 - 0.8, z + d / 2 - 0.8, ph, [topRect.cx - topRect.w / 2, topRect.cz - topRect.d / 2, topRect.cx + topRect.w / 2, topRect.cz + topRect.d / 2], { shed: true });
        sideProps(topPoly, ph, h, { balcony: style !== 'glass' && R() < 0.6 });
      } else if (type < 0.67) {
        const cut = Math.min(w, d) * rr(0.12, 0.22), poly = chamferPoly(x, z, w - 1.4, d - 1.4, cut);
        body(poly, ph, h, { style, tint, cornice: true, trimCol, ledge: STYLES[style].ledge, corners: true, piers: style === 'deco' ? 3 : 0 });
        roofTop(poly, h, { parapet: true, trimCol });
        roofProps(x - w / 2 + 2, z - d / 2 + 2, x + w / 2 - 2, z + d / 2 - 2, h, null, { shed: true, tower: true, mast: h > 28 });
        box(glow, x, h + 0.15, z, w - 0.8, 0.2, d - 0.8, 0, [1, 1, 1]);
        roofProps(x - w / 2 + 0.8, z - d / 2 + 0.8, x + w / 2 - 0.8, z + d / 2 - 0.8, ph, [x - w / 2 + 0.7, z - d / 2 + 0.7, x + w / 2 - 0.7, z + d / 2 - 0.7], {});
        sideProps(poly, ph, h, { balcony: style !== 'glass' && R() < 0.5 });
      } else {
        const wa = w * rr(0.5, 0.62), da = d, wb = w, db = d * rr(0.45, 0.58);
        const A1 = rectPoly(x - (w - wa) / 2 + 0.05, z, wa, da - 1.6), B1 = rectPoly(x, z - (d - db) / 2 + 0.8, wb - 1.6, db);
        const ha = h, hb = h * rr(0.62, 0.8);
        body(A1, ph, ha, { style, tint, cornice: true, trimCol, ledge: STYLES[style].ledge });
        body(B1, ph, hb, { style, tint, cornice: true, trimCol, ledge: STYLES[style].ledge });
        roofTop(A1, ha, { parapet: true, trimCol });
        roofTop(B1, hb, { parapet: true, trimCol });
        roofProps(A1.cx - wa / 2 + 1, A1.cz - (da - 1.6) / 2 + 1, A1.cx + wa / 2 - 1, A1.cz + (da - 1.6) / 2 - 1, ha, null, { shed: true, tower: true, mast: ha > 28 });
        roofProps(B1.cx - (wb - 1.6) / 2 + 1, B1.cz - db / 2 + 1, B1.cx + (wb - 1.6) / 2 - 1, B1.cz + db / 2 - 1, hb, [A1.cx - wa / 2 - 1, A1.cz - (da - 1.6) / 2 - 1, A1.cx + wa / 2 + 1, A1.cz + (da - 1.6) / 2 + 1], {});
        sideProps(A1, ph, ha, { balcony: R() < 0.5 });
        sideProps(B1, ph, hb, { balcony: R() < 0.4 });
        roofProps(x - w / 2 + 0.8, z - d / 2 + 0.8, x + w / 2 - 0.8, z + d / 2 - 0.8, ph, [x - w / 2 + 0.7, z - d / 2 + 0.7, x + w / 2 - 0.7, z + d / 2 - 0.7], {});
      }
      if (R() < 0.45) neonSign(base, rr(6, 11), w * 0.5);
      return;
    }
    const type = R(), ph = GH + FH * (2 + Math.floor(R() * 3));
    ground(base, GH, shop, gtint);
    body(base, GH, ph, { style: pick(['deco', 'concrete', 'modern']), tint: tintOf('deco'), cornice: true, trimCol, ledge: 1 });
    roofTop(base, ph, { parapet: true, trimCol });
    if (type < 0.4) {
      const style = pick(['deco', 'deco', 'concrete']), tint = tintOf(style), fr = [0.55, 0.78, 0.94], ins = [Math.min(w, d) * 0.1, Math.min(w, d) * 0.24, Math.min(w, d) * 0.36, Math.min(w, d) * 0.43];
      let yb = ph, last = null;
      for (let t = 0; t < 3; t++) {
        const yt = t === 2 ? h * 0.94 : h * fr[t], poly = rectPoly(x, z, w - ins[t] * 2, d - ins[t] * 2);
        if (t === 0) body(poly, yb, yt, { style, tint, cornice: true, trimCol, ledge: 2, corners: true, piers: 3 });
        else body(poly, yb, yt, { style, tint, cornice: true, trimCol, ledge: 2, corners: true });
        roofTop(poly, yt, { parapet: true, trimCol });
        box(glow, x, yt + 0.12, z, w - ins[t] * 2 + 0.3, 0.18, d - ins[t] * 2 + 0.3, 0, [1, 1, 1]);
        if (t < 2) {
          const nx2 = t === 0 ? ins[1] : ins[2];
          roofProps(x - (w - ins[t] * 2) / 2 + 0.7, z - (d - ins[t] * 2) / 2 + 0.7, x + (w - ins[t] * 2) / 2 - 0.7, z + (d - ins[t] * 2) / 2 - 0.7, yt, [x - (w - nx2 * 2) / 2 - 0.4, z - (d - nx2 * 2) / 2 - 0.4, x + (w - nx2 * 2) / 2 + 0.4, z + (d - nx2 * 2) / 2 + 0.4], {});
        }
        last = { poly, yt, wt: w - ins[t] * 2, dt: d - ins[t] * 2 };
        yb = yt;
      }
      const sp = h * 1.1, a = A('trim');
      const top = last.poly, cxp = top.cx, czp = top.cz, apex = [cxp, h + (h * 0.12), czp];
      eachEdge(top, e => {
        const n = [e.nx * 0.8, 0.6, e.nz * 0.8];
        quad(a, [[e.x0, last.yt, e.z0], [e.x1, last.yt, e.z1], [cxp, apex[1], czp], [cxp, apex[1], czp]], [n, n, n, n], [[0, 0], [1, 0], [1, 1], [0, 1]], [0.46, 0.46, 0.5]);
      });
      box(glow, cxp, apex[1] + 3, czp, 0.4, 6, 0.4, 0, [1, 1, 1]);
      box('beacon', cxp, apex[1] + 6.3, czp, 0.6, 0.6, 0.6, 0, [1, 1, 1]);
      roofProps(x - (w) / 2 + 0.8, z - (d) / 2 + 0.8, x + w / 2 - 0.8, z + d / 2 - 0.8, ph, [x - (w - ins[0] * 2) / 2 - 0.4, z - (d - ins[0] * 2) / 2 - 0.4, x + (w - ins[0] * 2) / 2 + 0.4, z + (d - ins[0] * 2) / 2 + 0.4], {});
    } else if (type < 0.68) {
      const style = pick(['glass', 'glass', 'concrete']), tint = tintOf(style), cut = Math.min(w, d) * rr(0.14, 0.24);
      const poly = chamferPoly(x, z, w - Math.min(w, d) * 0.2, d - Math.min(w, d) * 0.2, cut), hs = h * 0.9;
      body(poly, ph, hs, { style, tint, cornice: false, trimCol, ledge: 0, corners: false });
      const top = chamferPoly(x, z, (w - Math.min(w, d) * 0.2) * 0.8, (d - Math.min(w, d) * 0.2) * 0.8, cut * 0.7);
      body(top, hs, h, { style, tint, cornice: true, trimCol, ledge: 0 });
      roofTop(top, h, { parapet: true, trimCol });
      box(glow, x, hs + 0.1, z, (w - Math.min(w, d) * 0.2) + 0.2, 0.25, (d - Math.min(w, d) * 0.2) + 0.2, 0, [1, 1, 1]);
      const sb = x - (w - Math.min(w, d) * 0.2) / 2, sz2 = z - (d - Math.min(w, d) * 0.2) / 2;
      roofProps(sb + 1, sz2 + 1, sb + (w - Math.min(w, d) * 0.2) - 1, sz2 + (d - Math.min(w, d) * 0.2) - 1, hs, [x - (w - Math.min(w, d) * 0.2) * 0.4, z - (d - Math.min(w, d) * 0.2) * 0.4, x + (w - Math.min(w, d) * 0.2) * 0.4, z + (d - Math.min(w, d) * 0.2) * 0.4], {});
      roofProps(x - 6, z - 6, x + 6, z + 6, h, null, { mast: true, shed: true });
      roofProps(x - w / 2 + 0.8, z - d / 2 + 0.8, x + w / 2 - 0.8, z + d / 2 - 0.8, ph, [x - w / 2 + Math.min(w, d) * 0.09, z - d / 2 + Math.min(w, d) * 0.09, x + w / 2 - Math.min(w, d) * 0.09, z + d / 2 - Math.min(w, d) * 0.09], {});
    } else if (type < 0.86 && w > 22 && d > 22) {
      const style = pick(['concrete', 'glass', 'modern']), tint = tintOf(style), ra = Math.min(w, d) * 0.33, N = 28;
      const poly = cylPoly(x, z, ra, N), hs = h * 0.96;
      body(poly, ph, hs, { style, tint, cornice: false, trimCol, ledge: 3, smooth: true });
      box(glow, x, hs + 0.1, z, ra * 2 + 0.6, 0.2, ra * 2 + 0.6, 0, [1, 1, 1]);
      const top = cylPoly(x, z, ra * 0.7, N);
      body(top, hs, h, { style, tint, cornice: false, trimCol, ledge: 0, smooth: true });
      cap(top, h, [1, 1, 1]);
      roofProps(x - 3, z - 3, x + 3, z + 3, h, null, { mast: true });
      roofProps(x - w / 2 + 0.8, z - d / 2 + 0.8, x + w / 2 - 0.8, z + d / 2 - 0.8, ph, [x - ra - 1, z - ra - 1, x + ra + 1, z + ra + 1], { shed: true });
    } else {
      const style = pick(['glass', 'concrete', 'modern']), tint = tintOf(style), gap = Math.max(3, Math.min(w, d) * 0.12);
      const wide = w >= d, ws = wide ? (w - gap - 3) / 2 : w - 4, ds = wide ? d - 4 : (d - gap - 3) / 2;
      const c1 = wide ? [x - (ws + gap) / 2 - 0.2, z] : [x, z - (ds + gap) / 2 - 0.2], c2 = wide ? [x + (ws + gap) / 2 + 0.2, z] : [x, z + (ds + gap) / 2 + 0.2];
      const h1 = h, h2 = h * rr(0.7, 0.85);
      const p1 = rectPoly(c1[0], c1[1], ws, ds), p2 = rectPoly(c2[0], c2[1], ws, ds);
      body(p1, ph, h1, { style, tint, cornice: true, trimCol, ledge: STYLES[style].ledge, corners: true });
      body(p2, ph, h2, { style, tint: tintOf(style), cornice: true, trimCol, ledge: STYLES[style].ledge, corners: true });
      roofTop(p1, h1, { parapet: true, trimCol }); roofTop(p2, h2, { parapet: true, trimCol });
      box(glow, c1[0], h1 + 0.12, c1[1], ws + 0.3, 0.2, ds + 0.3, 0, [1, 1, 1]);
      box(glow, c2[0], h2 + 0.12, c2[1], ws + 0.3, 0.2, ds + 0.3, 0, [1, 1, 1]);
      const by = h2 * 0.62;
      const bw = wide ? gap + 0.6 : ws * 0.5, bd = wide ? ds * 0.5 : gap + 0.6;
      box('f_' + style, x, by, z, wide ? gap + 0.6 : ws * 0.5, FH * 1.4, wide ? ds * 0.5 : gap + 0.6, 0, tint);
      box('trim', x, by + FH * 0.7 + 0.2, z, bw + 0.3, 0.4, bd + 0.3, 0, trimCol);
      roofProps(c1[0] - ws / 2 + 1, c1[1] - ds / 2 + 1, c1[0] + ws / 2 - 1, c1[1] + ds / 2 - 1, h1, null, { mast: true, shed: true });
      roofProps(c2[0] - ws / 2 + 1, c2[1] - ds / 2 + 1, c2[0] + ws / 2 - 1, c2[1] + ds / 2 - 1, h2, null, { shed: true });
      roofProps(x - w / 2 + 0.8, z - d / 2 + 0.8, x + w / 2 - 0.8, z + d / 2 - 0.8, ph, [Math.min(c1[0], c2[0]) - ws / 2 - 0.4, Math.min(c1[1], c2[1]) - ds / 2 - 0.4, Math.max(c1[0], c2[0]) + ws / 2 + 0.4, Math.max(c1[1], c2[1]) + ds / 2 + 0.4], {});
    }
    if (R() < 0.5) neonSign(base, rr(6, 11), w * 0.5);
  }

  function finish() {
    for (const key in ACC) {
      const a = ACC[key], g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(a.p), 3));
      g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(a.n), 3));
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(a.u), 2));
      g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(a.c), 3));
      g.setIndex(new THREE.BufferAttribute(new Uint32Array(a.i), 1));
      const mat = MATS[key] || MATS[key.startsWith('f_') ? key : 'trim'];
      const m = new THREE.Mesh(g, mat);
      m.frustumCulled = false;
      scene.add(m);
    }
    NHM.load('city_props').then(root => { if (root) NHM.place(scene, root, PROPS); });
  }

  return { add, finish };
};
