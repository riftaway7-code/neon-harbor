window.NH_HOUSES = function (env) {
  const THREE = env.THREE, scene = env.scene, mulberry = env.mulberry;
  const aniso = Math.min(8, env.renderer.capabilities.getMaxAnisotropy());
  const TAU = Math.PI * 2;
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const toTex = c => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = aniso; return t; };
  const TILE = { siding: 1.6, brick: 1.36, shingle: 1.6, stone: 1.5, stucco: 2.0, concrete: 2.0, wood: 1.2 };

  function paintSiding() {
    const c = mk(512, 512), x = c.getContext('2d'), r = mulberry(11);
    for (let i = 0; i < 8; i++) {
      const y = i * 64, g = x.createLinearGradient(0, y, 0, y + 64);
      g.addColorStop(0, '#f2f2f0'); g.addColorStop(0.82, '#e4e4e0'); g.addColorStop(0.94, '#b9b9b4'); g.addColorStop(1, '#8c8c88');
      x.fillStyle = g; x.fillRect(0, y, 512, 64);
      for (let k = 0; k < 40; k++) { x.fillStyle = 'rgba(0,0,0,' + (r() * 0.05).toFixed(3) + ')'; x.fillRect(r() * 512, y + 2 + r() * 56, 20 + r() * 120, 1); }
      x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(0, y, 512, 2);
    }
    return c;
  }
  function paintBrick() {
    const c = mk(512, 512), x = c.getContext('2d'), r = mulberry(12);
    x.fillStyle = '#b8b0a0'; x.fillRect(0, 0, 512, 512);
    for (let row = 0, y = 0; y < 512; y += 32, row++) for (let xx = -(row % 2) * 48; xx < 512; xx += 96) {
      const v = 150 + (r() - 0.5) * 70, g = 0.55 + r() * 0.1;
      x.fillStyle = 'rgb(' + Math.round(v) + ',' + Math.round(v * g) + ',' + Math.round(v * g * 0.85) + ')';
      x.fillRect(xx + 3, y + 3, 90, 26);
      x.fillStyle = 'rgba(255,255,255,0.1)'; x.fillRect(xx + 3, y + 3, 90, 3);
      x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(xx + 3, y + 26, 90, 3);
    }
    return c;
  }
  function paintShingle() {
    const c = mk(512, 512), x = c.getContext('2d'), r = mulberry(13);
    x.fillStyle = '#2a2a2c'; x.fillRect(0, 0, 512, 512);
    for (let row = 0, y = 0; y < 512; y += 43, row++) for (let xx = -(row % 2) * 32; xx < 512; xx += 64) {
      const v = 120 + (r() - 0.5) * 60;
      x.fillStyle = 'rgb(' + v + ',' + v + ',' + (v + 4) + ')'; x.fillRect(xx + 1, y + 1, 62, 41);
      const gr = x.createLinearGradient(0, y, 0, y + 43); gr.addColorStop(0, 'rgba(255,255,255,0.08)'); gr.addColorStop(1, 'rgba(0,0,0,0.45)');
      x.fillStyle = gr; x.fillRect(xx + 1, y + 1, 62, 41);
      for (let k = 0; k < 30; k++) { x.fillStyle = 'rgba(0,0,0,' + (r() * 0.1).toFixed(3) + ')'; x.fillRect(xx + r() * 60, y + r() * 40, 2, 2); }
    }
    return c;
  }
  function paintStone() {
    const c = mk(512, 512), x = c.getContext('2d'), r = mulberry(14);
    x.fillStyle = '#6e6a62'; x.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 512;) {
      const h = 40 + r() * 36; let xx = -r() * 60;
      while (xx < 512) { const w = 50 + r() * 70, v = 120 + (r() - 0.5) * 60; x.fillStyle = 'rgb(' + v + ',' + (v - 4) + ',' + (v - 12) + ')'; x.fillRect(xx + 3, y + 3, w - 5, h - 5); x.fillStyle = 'rgba(255,255,255,0.1)'; x.fillRect(xx + 3, y + 3, w - 5, 4); x.fillStyle = 'rgba(0,0,0,0.2)'; x.fillRect(xx + 3, y + h - 7, w - 5, 4); xx += w; }
      y += h;
    }
    return c;
  }
  function paintStucco() {
    const c = mk(256, 256), x = c.getContext('2d'), r = mulberry(15);
    x.fillStyle = '#e6e2d8'; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 9000; i++) { x.fillStyle = 'rgba(' + (r() < 0.5 ? '255,255,255,' : '0,0,0,') + (r() * 0.08).toFixed(3) + ')'; x.fillRect(r() * 256, r() * 256, 1 + r() * 2, 1 + r() * 2); }
    return c;
  }
  function paintConcrete() {
    const c = mk(256, 256), x = c.getContext('2d'), r = mulberry(16);
    x.fillStyle = '#9b9a95'; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 7000; i++) { x.fillStyle = 'rgba(' + (r() < 0.5 ? '255,255,255,' : '0,0,0,') + (r() * 0.1).toFixed(3) + ')'; x.fillRect(r() * 256, r() * 256, 1 + r() * 2, 1 + r() * 2); }
    return c;
  }
  function paintWood() {
    const c = mk(256, 256), x = c.getContext('2d'), r = mulberry(17);
    x.fillStyle = '#b08a5a'; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 70; i++) { x.fillStyle = 'rgba(' + (r() < 0.5 ? '255,235,200,' : '40,20,5,') + (r() * 0.14).toFixed(3) + ')'; x.fillRect(0, r() * 256, 256, 1 + r() * 2); }
    for (let k = 0; k < 4; k++) { x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(k * 64, 0, 2, 256); }
    return c;
  }

  const MATS = {};
  function ensure() {
    if (MATS.trim) return;
    const ph = (c, spec, sh, bs) => new THREE.MeshPhongMaterial({ map: toTex(c), bumpMap: toTex(c), bumpScale: bs, specular: spec, shininess: sh, vertexColors: true });
    MATS.siding = ph(paintSiding(), 0x222222, 12, 0.8);
    MATS.brick = ph(paintBrick(), 0x111111, 6, 1.2);
    MATS.shingle = ph(paintShingle(), 0x111111, 5, 1.4);
    MATS.stone = ph(paintStone(), 0x181818, 8, 1.4);
    MATS.stucco = ph(paintStucco(), 0x111111, 4, 0.6);
    MATS.concrete = ph(paintConcrete(), 0x111111, 4, 0.6);
    MATS.wood = ph(paintWood(), 0x181818, 8, 0.8);
    MATS.trim = new THREE.MeshPhongMaterial({ vertexColors: true, specular: 0x222222, shininess: 14 });
    MATS.metal = new THREE.MeshPhongMaterial({ vertexColors: true, specular: 0x666666, shininess: 40 });
  }

  const ACC = {};
  const A = key => ACC[key] || (ACC[key] = { p: [], n: [], u: [], c: [], i: [] });
  let M = new THREE.Matrix4(), NM = new THREE.Matrix3();
  const v3 = new THREE.Vector3();
  function setFrame(m) { M = m.clone(); NM.getNormalMatrix(M); }
  function quad(a, P, N, UV, C) {
    const b = a.p.length / 3;
    const W = P.map(p => { v3.set(p[0], p[1], p[2]).applyMatrix4(M); return [v3.x, v3.y, v3.z]; });
    const n = v3.set(N[0], N[1], N[2]).applyMatrix3(NM).normalize().toArray();
    const e1 = [W[1][0] - W[0][0], W[1][1] - W[0][1], W[1][2] - W[0][2]], e2 = [W[2][0] - W[0][0], W[2][1] - W[0][1], W[2][2] - W[0][2]];
    const cx = e1[1] * e2[2] - e1[2] * e2[1], cy = e1[2] * e2[0] - e1[0] * e2[2], cz = e1[0] * e2[1] - e1[1] * e2[0];
    for (let k = 0; k < 4; k++) { a.p.push(W[k][0], W[k][1], W[k][2]); a.n.push(n[0], n[1], n[2]); a.u.push(UV[k][0], UV[k][1]); a.c.push(C[0], C[1], C[2]); }
    if (cx * n[0] + cy * n[1] + cz * n[2] >= 0) a.i.push(b, b + 1, b + 2, b, b + 2, b + 3); else a.i.push(b, b + 2, b + 1, b, b + 3, b + 2);
  }
  const hex = h => [(h >> 16 & 255) / 255, (h >> 8 & 255) / 255, (h & 255) / 255];

  function box(key, cx, cy, cz, sx, sy, sz, color, uvOff) {
    ensure();
    const a = A(key), t = TILE[key] || 1, C = hex(color), hx = sx / 2, hy = sy / 2, hz = sz / 2, x0 = cx - hx, x1 = cx + hx, y0 = cy - hy, y1 = cy + hy, z0 = cz - hz, z1 = cz + hz;
    quad(a, [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], [[x0 / t, y0 / t], [x1 / t, y0 / t], [x1 / t, y1 / t], [x0 / t, y1 / t]], C);
    quad(a, [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -1], [[-x1 / t, y0 / t], [-x0 / t, y0 / t], [-x0 / t, y1 / t], [-x1 / t, y1 / t]], C);
    quad(a, [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0], [[z1 / t, y0 / t], [z0 / t, y0 / t], [z0 / t, y1 / t], [z1 / t, y1 / t]], C);
    quad(a, [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0], [[-z0 / t, y0 / t], [-z1 / t, y0 / t], [-z1 / t, y1 / t], [-z0 / t, y1 / t]], C);
    quad(a, [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], [0, 1, 0], [[x0 / t, z1 / t], [x1 / t, z1 / t], [x1 / t, z0 / t], [x0 / t, z0 / t]], C);
    quad(a, [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0], [[x0 / t, z0 / t], [x1 / t, z0 / t], [x1 / t, z1 / t], [x0 / t, z1 / t]], C);
  }
  const trim = (cx, cy, cz, sx, sy, sz, color) => box('trim', cx, cy, cz, sx, sy, sz, color);

  function slope(key, P, color, tileU, tileV) {
    ensure();
    const a = A(key), e1 = [P[1][0] - P[0][0], P[1][1] - P[0][1], P[1][2] - P[0][2]], e2 = [P[3][0] - P[0][0], P[3][1] - P[0][1], P[3][2] - P[0][2]];
    const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]], L = Math.hypot(n[0], n[1], n[2]) || 1;
    const nn = n[1] < 0 ? [-n[0] / L, -n[1] / L, -n[2] / L] : [n[0] / L, n[1] / L, n[2] / L];
    const lu = Math.hypot(...e1) / tileU, lv = Math.hypot(...e2) / tileV;
    quad(a, P, nn, [[0, 0], [lu, 0], [lu, lv], [0, lv]], hex(color));
  }

  function gable(cx, by, cz, L, Wd, rise, roofC, endC, o) {
    o = o || {};
    const ov = o.ov === undefined ? 0.55 : o.ov, ovx = o.ovx === undefined ? 0.5 : o.ovx, x0 = cx - L / 2 - ovx, x1 = cx + L / 2 + ovx, s = rise / (Wd / 2), drop = ov * s;
    const zN = cz - Wd / 2 - ov, zP = cz + Wd / 2 + ov, yE = by - drop, yR = by + rise;
    slope('shingle', [[x0, yE, zP], [x1, yE, zP], [x1, yR, cz], [x0, yR, cz]], roofC, TILE.shingle, TILE.shingle);
    slope('shingle', [[x1, yE, zN], [x0, yE, zN], [x0, yR, cz], [x1, yR, cz]], roofC, TILE.shingle, TILE.shingle);
    const key = o.endKey || 'siding', t = TILE[key];
    for (const sx of [-1, 1]) {
      const xe = cx + sx * L / 2, a = A(key);
      quad(a, [[xe, by, cz - Wd / 2], [xe, by, cz + Wd / 2], [xe, yR, cz], [xe, yR, cz]], [sx, 0, 0], [[(cz - Wd / 2) / t, by / t], [(cz + Wd / 2) / t, by / t], [cz / t, yR / t], [cz / t, yR / t]], hex(endC));
    }
    trim(cx, yR + 0.05, cz, L + 2 * ovx + 0.1, 0.12, 0.3, o.ridge || 0x3a3a3c);
    for (const sg of [-1, 1]) {
      const zz = cz + sg * (Wd / 2 + ov);
      trim(cx, yE - 0.06, zz, L + 2 * ovx, 0.14, 0.1, o.trimC || 0xeeeeea);
      trim(cx, yE - 0.14, zz + sg * 0.03, L + 2 * ovx, 0.07, 0.07, 0x4a4c50);
    }
    for (const sx of [-1, 1]) {
      const xe = cx + sx * (L / 2 + ovx), ang = Math.atan2(rise, Wd / 2);
      for (const sg of [-1, 1]) {
        const mx = xe, my = (yE + yR) / 2, mz = cz + sg * (Wd / 4 + ov / 2), len = Math.hypot(Wd / 2 + ov, yR - yE);
        bar('trim', mx, my - 0.02, mz, 0.1, 0.16, len, sg * ang, o.trimC || 0xeeeeea, sg);
      }
    }
  }
  function bar(key, cx, cy, cz, sx, sy, sz, tilt, color, sg) {
    ensure();
    const a = A(key), C = hex(color), hx = sx / 2, hy = sy / 2, hz = sz / 2, co = Math.cos(tilt), si = Math.sin(tilt);
    const T = (lx, ly, lz) => [cx + lx, cy + ly * co - lz * si, cz + ly * si + lz * co];
    const faces = [
      [[-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz], [0, 0, 1]], [[hx, -hy, -hz], [-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz], [0, 0, -1]],
      [[hx, -hy, hz], [hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz], [1, 0, 0]], [[-hx, -hy, -hz], [-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz], [-1, 0, 0]],
      [[-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz], [-hx, hy, -hz], [0, 1, 0]], [[-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz], [0, -1, 0]]
    ];
    for (const f of faces) {
      const nl = f[4], n = [nl[0], nl[1] * co - nl[2] * si, nl[1] * si + nl[2] * co];
      quad(a, [T(...f[0]), T(...f[1]), T(...f[2]), T(...f[3])], n, [[0, 0], [1, 0], [1, 1], [0, 1]], C);
    }
  }

  function hip(cx, by, cz, L, Wd, rise, roofC, o) {
    o = o || {};
    const ov = o.ov === undefined ? 0.55 : o.ov, rl = Math.max(0.2, L - Wd), s = rise / (Wd / 2), drop = ov * s;
    const xa = cx - L / 2 - ov, xb = cx + L / 2 + ov, za = cz - Wd / 2 - ov, zb = cz + Wd / 2 + ov, yE = by - drop, yR = by + rise;
    const rx0 = cx - rl / 2, rx1 = cx + rl / 2;
    slope('shingle', [[xa, yE, zb], [xb, yE, zb], [rx1, yR, cz], [rx0, yR, cz]], roofC, TILE.shingle, TILE.shingle);
    slope('shingle', [[xb, yE, za], [xa, yE, za], [rx0, yR, cz], [rx1, yR, cz]], roofC, TILE.shingle, TILE.shingle);
    slope('shingle', [[xb, yE, zb], [xb, yE, za], [rx1, yR, cz], [rx1, yR, cz]], roofC, TILE.shingle, TILE.shingle);
    slope('shingle', [[xa, yE, za], [xa, yE, zb], [rx0, yR, cz], [rx0, yR, cz]], roofC, TILE.shingle, TILE.shingle);
    trim(cx, yR + 0.05, cz, rl + 0.4, 0.12, 0.28, o.ridge || 0x3a3a3c);
    for (const sg of [-1, 1]) trim(cx, yE - 0.06, cz + sg * (Wd / 2 + ov), L + 2 * ov, 0.14, 0.1, o.trimC || 0xeeeeea);
    for (const sx of [-1, 1]) trim(cx + sx * (L / 2 + ov), yE - 0.06, cz, 0.1, 0.14, Wd + 2 * ov, o.trimC || 0xeeeeea);
  }

  function wall(key, cx, cy, cz, sx, sy, sz, color) { box(key, cx, cy, cz, sx, sy, sz, (key === 'brick' || key === 'stone') ? 0xffffff : color); }
  function foundation(cx, cz, sx, sz) { box('concrete', cx, 0.17, cz, sx + 0.16, 0.38, sz + 0.16, 0xffffff); }
  function corners(cx, cz, sx, sz, h, color) {
    for (const ax of [-1, 1]) for (const az of [-1, 1]) trim(cx + ax * (sx / 2 + 0.03), h / 2 + 0.2, cz + az * (sz / 2 + 0.03), 0.16, h - 0.1, 0.16, color);
  }

  function window(x, y, z, face, o) {
    o = o || {};
    const w = o.w || 1.3, h = o.h || 1.4, f = 0.07, tc = o.trim || env.pal().trim, sx = face === '+z' || face === '-z';
    const sg = face[0] === '+' ? 1 : -1;
    const put = (lx, ly, sxx, syy, c) => { if (sx) trim(x + lx, y + ly, z + sg * 0.045, sxx, syy, 0.09, c); else trim(x + sg * 0.045, y + ly, z + lx, 0.09, syy, sxx, c); };
    put(0, h / 2 + f / 2, w + f * 2, f, tc); put(0, -h / 2 - f / 2, w + f * 2, f, tc);
    put(-w / 2 - f / 2, 0, f, h, tc); put(w / 2 + f / 2, 0, f, h, tc);
    if (o.mull !== false) { put(0, 0, 0.05, h, tc); put(0, 0, w, 0.05, tc); }
    if (sx) trim(x, y - h / 2 - f - 0.04, z + sg * 0.12, w + 0.34, 0.07, 0.2, tc); else trim(x + sg * 0.12, y - h / 2 - f - 0.04, z, 0.2, 0.07, w + 0.34, tc);
    if (o.header) put(0, h / 2 + f + 0.08, w + 0.4, 0.1, o.header);
    if (o.shutters) for (const k of [-1, 1]) { const off = k * (w / 2 + f + 0.28); if (sx) trim(x + off, y, z + sg * 0.06, 0.5, h + 0.1, 0.07, o.shutters); else trim(x + sg * 0.06, y, z + off, 0.07, h + 0.1, 0.5, o.shutters); }
    if (o.box) { if (sx) { trim(x, y - h / 2 - 0.25, z + sg * 0.2, w + 0.1, 0.22, 0.26, 0x5a4330); box('wood', x, y - h / 2 - 0.08, z + sg * 0.2, w, 0.1, 0.3, 0x5a8a3a); } }
    env.glass(x, y, z, face, w, h);
  }
  function door(x, z, face, o) {
    o = o || {};
    const dc = o.color || env.pal().door, sx = face === '+z' || face === '-z', sg = face[0] === '+' ? 1 : -1, w = o.w || 1.1, h = o.h || 2.2, tc = env.pal().trim;
    const put = (lx, ly, sxx, syy, dd, c) => { if (sx) trim(x + lx, ly, z + sg * dd, sxx, syy, 0.1, c); else trim(x + sg * dd, ly, z + lx, 0.1, syy, sxx, c); };
    put(0, h / 2, w, h, 0.07, dc);
    const dd = ((dc >> 1) & 0x7f7f7f) | 0x101010;
    for (const py of [0.55, 1.6]) for (const px of [-0.25, 0.25]) put(px, py, 0.3, py > 1 ? 0.6 : 0.8, 0.12, dd);
    put(0, h + 0.07, w + 0.3, 0.14, 0.08, tc); put(-w / 2 - 0.08, h / 2, 0.14, h + 0.1, 0.08, tc); put(w / 2 + 0.08, h / 2, 0.14, h + 0.1, 0.08, tc);
    put(0.38, 1.05, 0.1, 0.1, 0.16, 0xc9a24a);
    if (o.glass) env.glass2(x, 1.75, z, face, 0.6, 0.5);
    if (sx) trim(x, 0.07, z + sg * 0.55, w + 1, 0.14, 1.0, 0xa8a49b); else trim(x + sg * 0.55, 0.07, z, 1.0, 0.14, w + 1, 0xa8a49b);
  }
  function chimney(x, z, by, h, brick) {
    box(brick ? 'brick' : 'stone', x, by + h / 2, z, 1.2, h, 1.2, 0xffffff);
    trim(x, by + h + 0.08, z, 1.45, 0.16, 1.45, 0x9b9a95); trim(x, by + h + 0.26, z, 0.7, 0.2, 0.7, 0x222222);
    box('concrete', x, by + 0.4, z, 1.35, 0.25, 1.35, 0xffffff);
  }
  function porch(cx, z, w, d, h, o) {
    o = o || {};
    box('wood', cx, 0.27, z + d / 2, w, 0.16, d, 0xcdc6b6);
    for (let k = -1; k <= 1; k += 2) trim(cx + k * (w / 2 - 0.15), h / 2 + 0.3, z + d - 0.2, 0.22, h, 0.22, o.col || 0xf2f1ea);
    trim(cx, h + 0.35, z + d - 0.2, w + 0.2, 0.2, 0.3, o.col || 0xf2f1ea);
    if (o.roof) gable(cx, h + 0.45, z + d / 2, w, d + 0.4, 0.85, o.roof, o.col || 0xeeeeea, { ov: 0.3, ovx: 0.3, endKey: 'siding' });
    if (o.rail) for (let i = 0; i <= Math.round(w / 0.5); i++) trim(cx - w / 2 + 0.1 + i * (w - 0.2) / Math.round(w / 0.5), 0.85, z + d - 0.1, 0.06, 0.8, 0.06, o.col || 0xf2f1ea);
    if (o.rail) { trim(cx, 1.25, z + d - 0.1, w, 0.08, 0.1, o.col || 0xf2f1ea); trim(cx, 0.5, z + d - 0.1, w, 0.08, 0.1, o.col || 0xf2f1ea); }
  }
  function garage(cx, z, w, h, color) {
    box('trim', cx, h / 2, z + 0.07, w, h, 0.1, color || 0xe8e8e4);
    for (let k = 1; k < 5; k++) trim(cx, k * h / 5, z + 0.14, w, 0.05, 0.05, 0xb9b9b4);
    trim(cx, h + 0.1, z + 0.1, w + 0.4, 0.2, 0.14, 0xeeeeea); trim(cx - w / 2 - 0.1, h / 2, z + 0.1, 0.2, h, 0.14, 0xeeeeea); trim(cx + w / 2 + 0.1, h / 2, z + 0.1, 0.2, h, 0.14, 0xeeeeea);
    for (let k = 0; k < 4; k++) env.glass2(cx - w * 0.33 + k * w * 0.22, h * 0.82, z + 0.12, '+z', w * 0.18, 0.34);
    trim(cx, 0.05, z + 0.6, w, 0.1, 1.2, 0xa8a49b);
  }
  function gutterRun(cx, y, z, len) { trim(cx, y, z, len, 0.1, 0.12, 0x6a6c70); }
  function downspout(x, z) { trim(x, 1.6, z, 0.09, 3.2, 0.09, 0x6a6c70); }

  const P = {};
  function finish() {
    ensure();
    for (const key in ACC) {
      const a = ACC[key], g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(a.p), 3));
      g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(a.n), 3));
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(a.u), 2));
      g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(a.c), 3));
      g.setIndex(new THREE.BufferAttribute(new Uint32Array(a.i), 1));
      const m = new THREE.Mesh(g, MATS[key] || MATS.trim);
      m.frustumCulled = false; scene.add(m);
    }
  }

  function rotated(cx, cz, ang, fn) {
    const keep = M.clone(), r = new THREE.Matrix4().makeTranslation(cx, 0, cz).multiply(new THREE.Matrix4().makeRotationY(ang));
    setFrame(keep.clone().multiply(r)); fn(); setFrame(keep);
  }
  const wk = () => env.pal().mat || 'siding';
  const MODELS = {
    Ranch() {
      const p = env.pal(), k = wk();
      foundation(0, 0, 18, 9); wall(k, 0, 1.5, 0, 18, 3, 9, p.wall); gable(0, 3, 0, 18, 9, 2.2, p.roof, p.wall, { trimC: p.trim, endKey: k });
      foundation(12.5, 0, 7, 7); wall(k, 12.5, 1.35, 0, 7, 2.7, 7, p.wall2); gable(12.5, 2.7, 0, 7, 7, 1.6, p.roof, p.wall2, { trimC: p.trim, endKey: k });
      garage(12.5, 3.5, 5.2, 2.2);
      corners(0, 0, 18, 9, 3, p.trim); corners(12.5, 0, 7, 7, 2.7, p.trim);
      door(-3, 4.5, '+z'); window(-6.5, 1.7, 4.5, '+z', { shutters: p.door, box: true }); window(1, 1.7, 4.5, '+z', { shutters: p.door }); window(5.5, 1.7, 4.5, '+z', { shutters: p.door });
      window(-9, 1.7, 0, '-x'); window(9, 1.7, -2, '+x', { w: 1.1 });
      chimney(-5, -1.5, 3.0, 3.8, true);
      trim(-3, 0.12, 5.4, 2.2, 0.2, 1.8, 0xa8a49b);
      gutterRun(0, 2.88, 4.9, 18.6); gutterRun(12.5, 2.58, 3.9, 7.6); downspout(8.9, 4.7);
    },
    Colonial() {
      const p = env.pal(), k = wk();
      foundation(0, 0, 12, 9); wall(k, 0, 3.1, 0, 12, 6.2, 9, p.wall); gable(0, 6.2, 0, 12, 9, 3, p.roof, p.wall, { trimC: p.trim, endKey: k });
      corners(0, 0, 12, 9, 6.2, p.trim); trim(0, 3.2, 4.53, 12.1, 0.14, 0.08, p.trim);
      chimney(-5, 0, 6.2, 3.9, true);
      door(0, 4.5, '+z', { glass: true, color: p.door }); porch(0, 4.5, 3.6, 2.2, 2.8, { roof: p.roof, col: p.trim });
      for (const x of [-4, 4]) window(x, 1.9, 4.5, '+z', { shutters: 0x2f4a38, header: p.trim });
      for (const x of [-4, 0, 4]) window(x, 4.9, 4.5, '+z', { shutters: 0x2f4a38, header: p.trim });
      for (const z of [-1.5, 1.5]) { window(-6, 1.9, z, '-x'); window(6, 1.9, z, '+x'); window(-6, 4.9, z, '-x'); window(6, 4.9, z, '+x'); }
      gutterRun(0, 6.08, 5.0, 13.2); gutterRun(0, 6.08, -5.0, 13.2); downspout(6.2, 4.8); downspout(-6.2, 4.8);
    },
    Cottage() {
      const p = env.pal(), k = wk();
      foundation(0, 0, 9, 8); wall(k, 0, 1.5, 0, 9, 3, 8, p.wall);
      rotated(0, 0, Math.PI / 2, () => gable(0, 3, 0, 8, 9, 4.2, p.roof, p.wall, { trimC: p.trim, endKey: k }));
      corners(0, 0, 9, 8, 3, p.trim);
      door(-1.5, 4, '+z'); trim(-1.5, 2.85, 5.1, 3.2, 0.12, 2.3, p.roof); for (const x of [-3, 0]) trim(x, 1.4, 6.0, 0.2, 2.7, 0.2, 0x8a6b4a);
      window(2.3, 1.6, 4, '+z', { shutters: p.door, box: true }); window(0, 4.3, 4, '+z', { w: 1.2, h: 1.2, mull: false });
      window(-4.5, 1.6, 0, '-x'); window(4.5, 1.6, 0, '+x');
      chimney(3.2, -1, 3.0, 4.6, false);
    },
    Modern() {
      const p = env.pal();
      foundation(0, 0, 14, 10); wall('stucco', 0, 1.6, 0, 14, 3.2, 10, p.wall); wall('stucco', -2.5, 4.7, 0, 8, 3, 8, p.wall2);
      box('trim', 0, 3.35, 0, 14.6, 0.3, 10.6, 0x2d2f33); box('trim', -2.5, 6.35, 0, 8.6, 0.3, 8.6, 0x2d2f33);
      box('wood', -5.2, 1.6, 5.04, 2.4, 3.2, 0.14, 0xffffff); door(-5.2, 5.12, '+z', { color: p.door });
      env.glass(2.5, 1.7, 5.0, '+z', 5, 2.3); trim(2.5, 2.9, 5.05, 5.2, 0.1, 0.1, 0x222428); trim(2.5, 0.5, 5.05, 5.2, 0.1, 0.1, 0x222428); for (const x of [0, 2.5, 5]) trim(x, 1.7, 5.05, 0.08, 2.4, 0.1, 0x222428);
      env.glass(-2.5, 4.8, 4.0, '+z', 5.5, 1.8); for (const x of [-5.25, -2.5, 0.25]) trim(x, 4.8, 4.05, 0.08, 1.9, 0.1, 0x222428);
      env.glass(7.0, 1.7, 0, '+x', 5, 1.8); env.glass(-6.5, 4.8, 0, '-x', 4, 1.6);
      for (let i = 0; i < 6; i++) box('wood', 6.5, 0.4 + i * 0.5, 4.6, 0.06, 0.4, 0.6, 0xffffff);
      box('concrete', 0, 0.08, 7, 6, 0.16, 3, 0xffffff);
    },
    'Split-level'() {
      const p = env.pal(), k = wk();
      foundation(-4.5, 0, 9, 9); wall(k, -4.5, 1.6, 0, 9, 3.2, 9, p.wall); gable(-4.5, 3.2, 0, 9, 9, 2.2, p.roof, p.wall, { trimC: p.trim, endKey: k });
      foundation(4.5, -0.5, 9, 8); wall(k, 4.5, 2.95, -0.5, 9, 5.9, 8, p.wall2); gable(4.5, 5.9, -0.5, 9, 8, 2.6, p.roof, p.wall2, { trimC: p.trim, endKey: k });
      corners(-4.5, 0, 9, 9, 3.2, p.trim); corners(4.5, -0.5, 9, 8, 5.9, p.trim);
      door(-2, 4.5, '+z'); window(-6.5, 1.7, 4.5, '+z', { shutters: p.door });
      for (const x of [2.2, 6.8]) { window(x, 1.8, 3.5, '+z', { box: true }); window(x, 4.4, 3.5, '+z', { shutters: p.door }); }
      window(9, 1.8, -1, '+x'); window(9, 4.4, -1, '+x'); window(-9, 1.7, 0, '-x');
      chimney(-1.0, -2.5, 3.2, 4.3, true);
    },
    Bungalow() {
      const p = env.pal(), k = wk();
      foundation(0, 0, 13, 10); wall(k, 0, 1.7, 0, 13, 3.4, 10, p.wall); hip(0, 3.4, 0, 13, 10, 2.6, p.roof, { trimC: p.trim });
      corners(0, 0, 13, 10, 3.4, p.trim);
      box('wood', 0, 0.2, 6.2, 13, 0.25, 2.5, 0xffffff); gable(0, 3.1, 6.2, 13, 2.8, 0.7, p.roof, p.trim, { ov: 0.3, ovx: 0.3 });
      for (const x of [-6, -2, 2, 6]) { trim(x, 1.6, 7.1, 0.22, 2.8, 0.22, p.trim); trim(x, 0.3, 7.1, 0.34, 0.5, 0.34, 0xa8a49b); }
      door(0, 5.0, '+z'); window(-4, 1.8, 5.0, '+z', { header: p.trim }); window(4, 1.8, 5.0, '+z', { header: p.trim }); window(-6.5, 1.8, 0, '-x'); window(6.5, 1.8, 0, '+x');
      chimney(3.5, -2, 3.4, 4.2, false);
    },
    'L-shape'() {
      const p = env.pal(), k = wk();
      foundation(-1.5, -1, 16, 8); wall(k, -1.5, 1.8, -1, 16, 3.6, 8, p.wall); gable(-1.5, 3.6, -1, 16, 8, 2.6, p.roof, p.wall, { trimC: p.trim, endKey: k });
      foundation(5.5, 3, 7, 9); wall(k, 5.5, 1.8, 3, 7, 3.6, 9, p.wall2); rotated(5.5, 3, Math.PI / 2, () => gable(0, 3.6, 0, 9, 7, 2.8, p.roof, p.wall2, { trimC: p.trim, endKey: k }));
      corners(-1.5, -1, 16, 8, 3.6, p.trim); corners(5.5, 3, 7, 9, 3.6, p.trim);
      door(-1, 3, '+z'); window(-6, 1.8, 3, '+z', { shutters: p.door }); window(-3.5, 1.8, 3, '+z', { shutters: p.door });
      env.glass(5.5, 1.8, 7.5, '+z', 2.6, 1.6); trim(5.5, 2.7, 7.55, 2.8, 0.1, 0.1, p.trim); trim(5.5, 0.9, 7.55, 2.8, 0.1, 0.1, p.trim); window(5.5, 4.6, 7.5, '+z', { w: 1.2, h: 1.2, mull: false });
      window(9, 1.8, 3, '+x'); chimney(-8, -2, 3.6, 4.6, true);
    },
    Tudor() {
      const p = env.pal(), cream = 0xece3cc, dk = 0x3a2a20;
      foundation(0, 0, 13, 9); wall('stucco', 0, 2.9, 0, 13, 5.8, 9, cream); gable(0, 5.8, 0, 13, 9, 3.4, p.roof, cream, { trimC: dk, endKey: 'stucco' });
      wall('stucco', -2.2, 2.9, 5.6, 5.5, 5.8, 2.2, cream); rotated(-2.2, 4.2, Math.PI / 2, () => gable(0, 5.8, 0, 5, 5.5, 3.2, p.roof, cream, { trimC: dk, endKey: 'stucco' }));
      trim(0, 3.0, 4.6, 13.2, 0.25, 0.1, dk); for (const x of [-5.5, -3.6, -1.5, 1.5, 3.2, 5.5]) trim(x, 4.4, 4.6, 0.22, 2.8, 0.1, dk);
      for (const x of [-6.4, -2, 2, 6.4]) trim(x, 1.5, 4.6, 0.2, 3.0, 0.1, dk);
      trim(-2.2, 3.0, 6.75, 5.5, 0.22, 0.1, dk); for (const x of [-4.6, -2.2, 0.2]) trim(x, 4.4, 6.75, 0.2, 2.8, 0.1, dk);
      door(-2.2, 6.7, '+z', { color: p.door }); trim(-2.2, 2.5, 7.2, 1.8, 0.14, 1.0, dk);
      for (const [x, y] of [[3, 1.8], [5.4, 1.8], [3, 4.5], [5.4, 4.5], [-5.2, 1.8], [-5.2, 4.5]]) window(x, y, 4.5, '+z', { trim: dk });
      window(-2.2, 4.5, 6.7, '+z', { trim: dk });
      chimney(5.2, -1, 5.8, 3.4, true);
    },
    Manor() {
      const p = env.pal(), k = wk(), slate = 0x3f434a;
      foundation(0, 0, 16, 11); wall(k, 0, 3.5, 0, 16, 7, 11, p.wall); hip(0, 7, 0, 16, 11, 3.4, slate, { trimC: p.trim });
      for (const sx of [-9.7, 9.7]) { foundation(sx, -0.5, 5, 9); wall(k, sx, 2.5, -0.5, 5, 5, 9, p.wall2); hip(sx, 5, -0.5, 5, 9, 2.0, slate, { trimC: p.trim }); window(sx, 2.2, 4.0, '+z', { w: 2, shutters: p.door }); window(sx, 3.9, 4.0, '+z', { w: 1.4 }); window(sx > 0 ? 12.2 : -12.2, 2.4, -0.5, sx > 0 ? '+x' : '-x', { w: 1.6 }); }
      corners(0, 0, 16, 11, 7, p.trim);
      for (const x of [-3.6, -1.2, 1.2, 3.6]) { trim(x, 3.6, 8.2, 0.42, 7.2, 0.42, 0xf4f1ea); trim(x, 0.15, 8.2, 0.7, 0.3, 0.7, 0xdcd8cc); trim(x, 7.3, 8.2, 0.7, 0.3, 0.7, 0xdcd8cc); }
      box('trim', 0, 7.35, 6.7, 9.6, 0.4, 3.4, 0xf4f1ea); gable(0, 7.55, 6.7, 9.6, 3.4, 1.6, 0xf4f1ea, 0xf4f1ea, { ov: 0.2, ovx: 0.2 });
      box('concrete', 0, 0.15, 7.4, 8, 0.3, 2.2, 0xffffff); door(0, 5.55, '+z', { color: p.door, w: 1.8, h: 3, glass: true });
      for (const x of [-6.2, -4, 4, 6.2]) window(x, 1.9, 5.5, '+z', { shutters: p.door, header: p.trim });
      for (const x of [-6.2, -3.1, 0, 3.1, 6.2]) window(x, 5.2, 5.5, '+z', { header: p.trim });
      for (const z of [-2, 2]) { window(-8, 1.9, z, '-x'); window(8, 1.9, z, '+x'); window(-8, 5.2, z, '-x'); window(8, 5.2, z, '+x'); }
      chimney(5.5, -3, 7, 4.2, true); chimney(-5.5, -3, 7, 4.2, true);
    },
    'A-frame'() {
      const p = env.pal(), wood = 0x7a5232;
      rotated(0, 0, Math.PI / 2, () => gable(0, 0, 0, 11, 9, 7.2, 0x6e2f2a, wood, { endKey: 'wood', ov: 0.4, trimC: 0x3a2a20 }));
      env.glass(1.2, 1.3, 5.6, '+z', 3.2, 2); env.glass(0, 3.5, 5.6, '+z', 3.6, 1.8); env.glass(0, 5.2, 5.6, '+z', 1.4, 1.5);
      for (const x of [-0.6, 1.2, 3.0]) trim(x, 1.3, 5.65, 0.1, 2.1, 0.1, 0x2a1a10); trim(0, 3.5, 5.65, 3.8, 0.1, 0.1, 0x2a1a10);
      door(-2.2, 5.64, '+z', { color: p.door }); box('wood', 0, 0.25, 7, 9, 0.3, 3, 0xffffff);
      for (const x of [-4.3, 4.3]) trim(x, 0.9, 8.4, 0.15, 1, 0.15, 0x7a5232); trim(0, 1.4, 8.4, 8.8, 0.1, 0.1, 0x7a5232);
      chimney(1.2, -1.5, 5.4, 2.4, false);
    }
  };
  const API = { setFrame, box, trim, wall, gable, hip, foundation, corners, window, door, chimney, porch, garage, gutterRun, downspout, bar, finish, rotated, models: MODELS };
  return API;
};
