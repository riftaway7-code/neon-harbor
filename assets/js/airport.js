window.NH_AIRPORT = function (env) {
  const THREE = env.THREE, scene = env.scene, camera = env.camera, NHM = env.NHM, solids = env.solids, ENV = env.ENV, player = env.player, keys = env.keys;
  const clamp = env.clamp, lerp = env.lerp, rnd = env.rnd, cvs = env.cvs, tex = env.tex, po = env.po;
  const TAU = Math.PI * 2;
  const AP = { x0: 868, x1: 2260, z0: -640, z1: -60 };
  const RW = { x0: 1040, x1: 2140, z: -540, w: 46 };
  const TWY = { z: -486, x0: 1070, x1: 2110, w: 20, links: [1200, 1620, 2060] };
  const APRON = { x0: 1180, x1: 1490, z0: -478, z1: -332 };
  const TERM = { z: -310, x0: 1190, x1: 1470, cores: 1330 };
  const GATES = [1250, 1330, 1410];
  const GA = { x0: 1690, x1: 1920, z0: -470, z1: -372, hz: -355, hx: [1730, 1776, 1822, 1868] };
  const TOWER = { x: 1530, z: -300 };
  const rr = env.mulberry(4242);
  const R = (a, b) => a + rr() * (b - a);
  const PAVED = [];
  const state = { flying: null, view: 0, kit: null, planes: [], lit: [], dish: null, socks: [], beacon: null, hudOn: false, instr: 0 };

  const softTex = (() => { const c = cvs(64, 64), x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const slab = (x0, z0, x1, z1, mat, y) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2), mat); m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); scene.add(m); return m; };
  const noiseSpecks = (x, W, H, n, a) => { for (let i = 0; i < n; i++) { x.fillStyle = rr() < 0.5 ? 'rgba(255,255,255,' + (rr() * a).toFixed(3) + ')' : 'rgba(0,0,0,' + (rr() * a * 2).toFixed(3) + ')'; x.fillRect(rr() * W, rr() * H, 1 + rr() * 2, 1 + rr() * 2); } };

  (function ground() {
    const GW = AP.x1 - AP.x0, GD = AP.z1 - AP.z0, gt = env.grassTex.clone(); gt.needsUpdate = true; gt.repeat.set(GW / 8, GD / 8);
    const g = slab(AP.x0, AP.z0, AP.x1, AP.z1, env.groundDetail(new THREE.MeshLambertMaterial({ map: gt }), 1.8, 0.1, 0.4), 0.02);
    g.userData.noShadow = false;
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(24000, 24000).rotateX(-Math.PI / 2), env.waterMat || new THREE.MeshBasicMaterial({ color: 0x1b4a74 }));
    sea.position.set(0, -0.45, 0); scene.add(sea);
    const sand = new THREE.MeshLambertMaterial({ color: 0xc9b98a });
    slab(AP.x1 - 6, AP.z0, AP.x1 + 26, AP.z1, sand, 0.015);
    slab(AP.x0, AP.z1, AP.x1, AP.z1 + 18, sand, 0.015);
    slab(AP.x0, AP.z0 - 18, AP.x1, AP.z0, sand, 0.015);
  })();

  function runwayTex(len, wd, labA, labB) {
    const PPM = 4, W = len * PPM, H = wd * PPM, c = cvs(W, H), x = c.getContext('2d');
    x.fillStyle = '#2b2d32'; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) { x.fillStyle = 'rgba(' + (rr() < 0.5 ? '255,255,255' : '0,0,0') + ',' + (0.02 + rr() * 0.03).toFixed(3) + ')'; x.fillRect(rr() * W, 0, 40 + rr() * 300, H); }
    noiseSpecks(x, W, H, 24000, 0.06);
    for (const e of [0, 1]) {
      for (let k = 0; k < 7; k++) {
        const x0 = (e ? W - 2200 : 300) + rr() * 120, len = 500 + rr() * 900, yy = H / 2 + (rr() - 0.5) * 70;
        const g = x.createLinearGradient(x0, 0, x0 + len, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(0,0,0,0.34)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = g; x.fillRect(x0, yy - 4 - rr() * 6, len, 8 + rr() * 8);
      }
    }
    x.fillStyle = '#e8e8e2';
    x.fillRect(0, 5, W, 5); x.fillRect(0, H - 10, W, 5);
    for (let px = 90 * PPM; px < W - 90 * PPM; px += 50 * PPM) x.fillRect(px, H / 2 - 2, 30 * PPM, 4);
    for (const e of [0, 1]) {
      const s = e ? -1 : 1, x0 = e ? W - 8 * PPM : 8 * PPM;
      for (let k = 0; k < 12; k++) { const yy = 16 + k * ((H - 32) / 11) - 3; if (Math.abs(yy - H / 2) < 8) continue; x.fillRect(e ? x0 - 30 * PPM : x0, yy, 30 * PPM, 6); }
      for (const dist of [150, 300, 450]) {
        const bx = e ? W - dist * PPM : dist * PPM, bw = dist === 300 ? 45 : 22, off = dist === 300 ? 9 : 5.5, bh = dist === 300 ? 6 : 3.4;
        for (const side of [-1, 1]) x.fillRect(e ? bx - bw * PPM : bx, H / 2 + side * off * PPM - bh * PPM / 2, bw * PPM, bh * PPM);
      }
      x.save(); x.translate(e ? W - 62 * PPM : 62 * PPM, H / 2); x.rotate(e ? -Math.PI / 2 : Math.PI / 2); x.fillStyle = '#ecece6'; x.font = '900 ' + (13 * PPM) + 'px Arial,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e ? labB : labA, 0, 0); x.restore();
    }
    const t = new THREE.CanvasTexture(c); t.anisotropy = env.aniso; return t;
  }
  function taxiTex(len, wd) {
    const PPM = 2, W = Math.min(4096, len * PPM), H = (wd || 20) * PPM, c = cvs(W, H), x = c.getContext('2d');
    x.fillStyle = '#35373d'; x.fillRect(0, 0, W, H); noiseSpecks(x, W, H, 6000, 0.05);
    x.fillStyle = '#d8b42a'; x.fillRect(0, H / 2 - 1, W, 2.4);
    x.fillStyle = '#d8b42a'; x.fillRect(0, 2, W, 2); x.fillRect(0, H - 4, W, 2);
    const t = new THREE.CanvasTexture(c); t.anisotropy = env.aniso; return t;
  }
  function apronTex() {
    const c = cvs(512, 512), x = c.getContext('2d');
    x.fillStyle = '#8c8d90'; x.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const v = 128 + ((rr() - 0.5) * 22); x.fillStyle = 'rgb(' + v + ',' + v + ',' + (v + 2) + ')'; x.fillRect(i * 128 + 2, j * 128 + 2, 124, 124); }
    noiseSpecks(x, 512, 512, 3500, 0.06);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = env.aniso; return t;
  }
  function apronMarks() {
    const PPM = 3, W = (APRON.x1 - APRON.x0) * PPM, H = (APRON.z1 - APRON.z0) * PPM, c = cvs(W, H), x = c.getContext('2d');
    const X = v => (v - APRON.x0) * PPM, Z = v => (v - APRON.z0) * PPM;
    x.strokeStyle = '#e0b42a'; x.lineWidth = 1.2 * PPM; x.lineCap = 'butt';
    GATES.forEach((gx, i) => {
      const jx = gx - 2.5;
      x.beginPath(); x.moveTo(X(jx), Z(TWY.z + 12)); x.lineTo(X(jx), Z(-361.4 + 4)); x.stroke();
      x.beginPath(); x.moveTo(X(jx - 3.2), Z(-346)); x.lineTo(X(jx + 3.2), Z(-346)); x.stroke();
      x.fillStyle = '#e0b42a'; x.font = '800 ' + (3 * PPM) + 'px Arial'; x.textAlign = 'center'; x.fillText('' + (i + 1), X(jx), Z(-372));
      x.strokeStyle = 'rgba(210,60,50,0.9)'; x.lineWidth = 0.4 * PPM; x.setLineDash([6 * PPM, 4 * PPM]);
      x.strokeRect(X(jx - 20), Z(-380), 40 * PPM, 46 * PPM); x.setLineDash([]); x.strokeStyle = '#e0b42a'; x.lineWidth = 1.2 * PPM;
    });
    x.strokeStyle = 'rgba(255,255,255,0.7)'; x.lineWidth = 0.5 * PPM;
    x.strokeRect(X(APRON.x0 + 3), Z(-340), (APRON.x1 - APRON.x0 - 6) * PPM, 4 * PPM);
    const t = new THREE.CanvasTexture(c); t.anisotropy = env.aniso; return t;
  }
  function roadTex(L, w, dashed) {
    const c = cvs(512, 64), x = c.getContext('2d');
    x.fillStyle = '#3a3c42'; x.fillRect(0, 0, 512, 64); noiseSpecks(x, 512, 64, 3000, 0.06);
    x.fillStyle = '#d8d8d0'; x.fillRect(0, 3, 512, 2); x.fillRect(0, 59, 512, 2);
    x.fillStyle = dashed ? '#d8d8d0' : '#e0b42a';
    if (dashed) { for (let i = 0; i < 512; i += 128) x.fillRect(i, 31, 64, 2); } else { x.fillRect(0, 29, 512, 2); x.fillRect(0, 33, 512, 2); }
    return tex(c, L / (w * 4), 1);
  }
  function lotTex(w, d) {
    const PPM = 3, c = cvs(w * PPM, d * PPM), x = c.getContext('2d');
    x.fillStyle = '#34363c'; x.fillRect(0, 0, c.width, c.height); noiseSpecks(x, c.width, c.height, 12000, 0.06);
    x.strokeStyle = '#d8d8d0'; x.lineWidth = 0.18 * PPM;
    const rowH = 5.2, aisle = 7;
    for (let rowZ = 4; rowZ + rowH * 2 + aisle < d; rowZ += rowH * 2 + aisle + 2) {
      for (let r = 0; r < 2; r++) {
        const z0 = rowZ + r * (rowH + aisle);
        for (let sx = 3; sx < w - 3; sx += 2.7) { x.beginPath(); x.moveTo(sx * PPM, z0 * PPM); x.lineTo(sx * PPM, (z0 + rowH) * PPM); x.stroke(); }
      }
    }
    const t = new THREE.CanvasTexture(c); t.anisotropy = env.aniso; return t;
  }

  (function paving() {
    const rw = slab(RW.x0, RW.z - RW.w / 2, RW.x1, RW.z + RW.w / 2, new THREE.MeshLambertMaterial({ map: runwayTex(RW.x1 - RW.x0, RW.w, '09', '27'), ...po(-4, -4) }), 0.05);
    PAVED.push([RW.x0 - 10, RW.z - RW.w / 2 - 12, RW.x1 + 10, RW.z + RW.w / 2 + 12]);
    const tl = TWY.x1 - TWY.x0, tmat = new THREE.MeshLambertMaterial({ map: taxiTex(tl, 20), ...po(-4, -4) });
    slab(TWY.x0, TWY.z - TWY.w / 2, TWY.x1, TWY.z + TWY.w / 2, tmat, 0.05);
    PAVED.push([TWY.x0 - 6, TWY.z - TWY.w / 2 - 6, TWY.x1 + 6, TWY.z + TWY.w / 2 + 6]);
    for (const lx of TWY.links) {
      const y0 = RW.z + RW.w / 2, y1 = TWY.z - TWY.w / 2, c = cvs(64, 128), x = c.getContext('2d');
      x.fillStyle = '#35373d'; x.fillRect(0, 0, 64, 128); noiseSpecks(x, 64, 128, 1200, 0.05); x.fillStyle = '#d8b42a'; x.fillRect(31, 0, 2, 128);
      slab(lx - 10, y0, lx + 10, y1, new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(c), ...po(-4, -4) }), 0.052);
      PAVED.push([lx - 14, y0, lx + 14, y1]);
    }
    const at = apronTex(); at.repeat.set((APRON.x1 - APRON.x0) / 30, (APRON.z1 - APRON.z0) / 30);
    slab(APRON.x0, APRON.z0, APRON.x1, APRON.z1, new THREE.MeshLambertMaterial({ map: at, ...po(-3, -3) }), 0.04);
    slab(APRON.x0, APRON.z0, APRON.x1, APRON.z1, new THREE.MeshLambertMaterial({ map: apronMarks(), transparent: true, depthWrite: false, ...po(-5, -5) }), 0.055);
    slab(APRON.x0 + 40, TWY.z + TWY.w / 2, APRON.x0 + 60, APRON.z0, new THREE.MeshLambertMaterial({ map: apronTex(), ...po(-3, -3) }), 0.041);
    PAVED.push([APRON.x0 - 6, APRON.z0 - 6, APRON.x1 + 6, APRON.z1 + 30]);
    const ga = apronTex(); ga.repeat.set((GA.x1 - GA.x0) / 30, (GA.z1 - GA.z0) / 30);
    slab(GA.x0, GA.z0, GA.x1, GA.z1 + 18, new THREE.MeshLambertMaterial({ map: ga, ...po(-3, -3) }), 0.04);
    slab(GA.x0 + 40, TWY.z + TWY.w / 2, GA.x0 + 70, GA.z0, new THREE.MeshLambertMaterial({ map: ga, ...po(-3, -3) }), 0.041);
    PAVED.push([GA.x0 - 6, TWY.z - 8, GA.x1 + 6, GA.z1 + 24]);
    const roads = [[[862, -312], [1090, -312], 12, false], [[1090, -312], [1090, -250], 12, false], [[1090, -250], [1580, -250], 14, true], [[1190, -250], [1190, -225], 10, false], [[1470, -250], [1470, -225], 10, false]];
    for (const [a, b, w, d] of roads) {
      const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), ang = Math.atan2(-dz, dx);
      const m = slab(0, 0, L, w, new THREE.MeshLambertMaterial({ map: roadTex(L, w, d), ...po(-4, -4) }), 0.052);
      m.position.set((a[0] + b[0]) / 2, 0.052, (a[1] + b[1]) / 2); m.rotation.y = ang;
      const e = slab(0, 0, L, w + 4, new THREE.MeshLambertMaterial({ color: 0x7d7358, ...po(-3, -3) }), 0.045);
      e.position.copy(m.position).setY(0.045); e.rotation.y = ang;
      PAVED.push([Math.min(a[0], b[0]) - w, Math.min(a[1], b[1]) - w, Math.max(a[0], b[0]) + w, Math.max(a[1], b[1]) + w]);
    }
    for (const lot of [[1150, -228, 1340, -92], [1350, -228, 1540, -92]]) {
      slab(lot[0], lot[1], lot[2], lot[3], new THREE.MeshLambertMaterial({ map: lotTex(lot[2] - lot[0], lot[3] - lot[1]), ...po(-3, -3) }), 0.043);
      PAVED.push([lot[0] - 3, lot[1] - 3, lot[2] + 3, lot[3] + 3]);
    }
    slab(1100, -272, 1500, -262, new THREE.MeshLambertMaterial({ color: 0x9a9ca2, ...po(-5, -5) }), 0.056);
    PAVED.push([1090, -300, 1500, -240]);
    PAVED.push([TERM.x0 - 10, -335, TERM.x1 + 10, -285], [TOWER.x - 20, TOWER.z - 20, TOWER.x + 20, TOWER.z + 20], [1590, -300, 1700, -190]);
  })();

  env.GRASS.addZone(AP.x0 + 140, AP.z0 + 4, AP.x1 - 8, AP.z1 - 4, (x, z) => {
    for (const p of PAVED) if (x > p[0] && x < p[2] && z > p[1] && z < p[3]) return false;
    return !env.pointInSolid(x, z, 0.1);
  });

  const LIGHTSETS = [];
  function makeLights(spec, parent) {
    const pts = [], cols = [], phase = [], strobe = [];
    const add = (x, y, z, r, g, b, ph) => { pts.push(x, y, z); cols.push(r, g, b); phase.push(ph || 0); };
    const rw = spec.rw, tz = spec.twyZ, dirW = spec.approach === 'west';
    for (let x = rw.x0 + 5; x <= rw.x1 - 5; x += 30) { add(x, 0.6, rw.z - rw.w / 2 + 0.6, 1, 0.95, 0.85); add(x, 0.6, rw.z + rw.w / 2 - 0.6, 1, 0.95, 0.85); }
    for (let x = rw.x0 + 12; x <= rw.x1 - 12; x += 15) add(x, 0.5, rw.z, 1, 0.97, 0.9);
    for (let k = -11; k <= 11; k++) { add(rw.x0 + 1.5, 0.6, rw.z + k * 2.0, 0.2, 1, 0.35); add(rw.x1 - 1.5, 0.6, rw.z + k * 2.0, 1, 0.15, 0.15); }
    for (let x = spec.twyX0; x <= spec.twyX1; x += 25) { add(x, 0.6, tz - 10 + 0.5, 0.2, 0.4, 1); add(x, 0.6, tz + 10 - 0.5, 0.2, 0.4, 1); }
    for (const lx of spec.links) for (let z = rw.z + rw.w / 2 + 6; z < tz - 10; z += 12) { add(lx - 10, 0.6, z, 0.2, 0.4, 1); add(lx + 10, 0.6, z, 0.2, 0.4, 1); }
    for (let i = 0; i < 16; i++) { const x = rw.x0 - 14 - i * 8; for (let k = -1; k <= 1; k++) { strobe.push(pts.length / 3); add(x, 0.9, rw.z + k * 2.4, 1, 0.97, 0.9, i); } }
    for (let i = 0; i < 6; i++) { const x = rw.x0 - 14 - i * 30; for (let k = -6; k <= 6; k++) if (Math.abs(k) > 1) add(x, 0.9, rw.z + k * 2.2, 1, 0.97, 0.9, i * 2); }
    for (const sx of [rw.x0 + 300, rw.x1 - 300]) for (let k = 0; k < 4; k++) add(sx, 0.8, rw.z + rw.w / 2 + 14 + k * 1.4, 1, k < 2 ? 0.1 : 0.95, k < 2 ? 0.1 : 0.9);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    const mat = new THREE.PointsMaterial({ size: 12, sizeAttenuation: false, map: softTex, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 });
    const P = new THREE.Points(geo, mat); P.frustumCulled = false; (parent || scene).add(P);
    const L = { P, mat, phase, n: pts.length / 3, base: cols.slice(), colAttr: geo.attributes.color, strobe };
    LIGHTSETS.push(L); return L;
  }
  makeLights({ rw: RW, twyZ: TWY.z, twyX0: TWY.x0, twyX1: TWY.x1, links: TWY.links });

  const LAMB = new THREE.MeshLambertMaterial({ vertexColors: true }), BASIC = new THREE.MeshBasicMaterial({ vertexColors: true });
  const KG = {};
  const place = (name, x, y, z, ry, mat, sc, parent) => {
    const g = KG[name]; if (!g) return null;
    const m = new THREE.Mesh(g, mat || LAMB); m.position.set(x, y, z); m.rotation.y = ry || 0; if (sc) m.scale.set(sc, sc, sc); (parent || scene).add(m); return m;
  };
  const litList = [];
  const placeLit = (name, x, y, z, ry, parent) => { const m = place(name, x, y, z, ry, BASIC, 0, parent); if (m) { m.userData.noShadow = true; litList.push(m); } return m; };
  const sol = (x0, x1, z0, z1, h) => solids.push({ x0, x1, z0, z1, h });

  function addTexSign(x, y, z, ry, w, h, draw, parent) {
    const c = cvs(1024, Math.round(1024 * h / w)), g = c.getContext('2d'); draw(g, c.width, c.height);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.rotation.y = ry; (parent || scene).add(m); return m;
  }

  function buildKit(root) {
    root.traverse(o => { if (o.isMesh) KG[o.name] = o.geometry; });
    for (const gx of GATES) { place('ap_jetbridge', gx, 0, -330.4, 0); sol(gx - 1.8, gx + 1.8, -351, -330, 6); }
    const modsX = [1210, 1250, 1290, 1370, 1410, 1450];
    for (const x of modsX) { place('ap_terminal', x, 0, TERM.z, 0); placeLit('ap_terminal_lit', x, 0, TERM.z, 0); sol(x - 20, x + 20, -330, -290, 14); }
    place('ap_core', TERM.cores, 0, TERM.z, 0); placeLit('ap_core_lit', TERM.cores, 0, TERM.z, 0); sol(TERM.cores - 20, TERM.cores + 20, -332, -288, 22);
    sol(TERM.cores - 20, TERM.cores + 20, -288, -276, 7.8);
    addTexSign(TERM.cores, 24.2, TERM.z + 22.2, 0, 24, 3.6, (g, W, H) => { g.fillStyle = '#10244a'; g.fillRect(0, 0, W, H); g.fillStyle = '#ffffff'; g.font = '800 ' + H * 0.36 + 'px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('HARBORVIEW  INTERNATIONAL', W / 2, H / 2); });
    place('ap_tower', TOWER.x, 0, TOWER.z, 0); placeLit('ap_tower_lit', TOWER.x, 0, TOWER.z, 0); sol(TOWER.x - 5, TOWER.x + 5, TOWER.z - 5, TOWER.z + 5, 40);
    place('ap_radarbase', TOWER.x + 40, 0, TOWER.z + 6, 0); state.dish = place('ap_dish', TOWER.x + 40, 7.4, TOWER.z + 6, 0); sol(TOWER.x + 38, TOWER.x + 42, TOWER.z + 4, TOWER.z + 8, 8);
    GA.hx.forEach(x => { place('ap_hangar', x, 0, GA.hz, Math.PI); sol(x - 19, x + 19, GA.hz - 17, GA.hz + 17, 11); });
    for (let i = 0; i < 4; i++) { const x = 1620 + (i % 2) * 15, z = -240 + Math.floor(i / 2) * 15; place('ap_tank', x, 0, z, 0); sol(x - 6.5, x + 6.5, z - 6.5, z + 6.5, 11); }
    const masts = [[1190, -400], [1300, -400], [1410, -400], [1480, -352], [1740, -400], [1860, -400], [1190, -352], [1620, -330]];
    for (const [x, z] of masts) { place('ap_flood', x, 0, z, 0); placeLit('ap_flood_lit', x, 0, z, 0); sol(x - 0.5, x + 0.5, z - 0.5, z + 0.5, 30); }
    for (const [x, z] of [[1500, -585], [1160, -574]]) { place('ap_windpole', x, 0, z, 0); const s = place('ap_sock', x, 7.5, z, 0); s.rotation.order = 'YXZ'; state.socks.push(s); }
    place('ap_fueltruck', 1290, 0, -368, 0.4); sol(1288, 1292, -373, -363, 3);
    place('ap_tug', 1318, 0, -372, -0.3); place('ap_cart', 1318, 0, -376.5, -0.3); place('ap_cart', 1319, 0, -381, -0.25);
    place('ap_stairs', 1360, 0, -372, 0.2);
    place('ap_tug', 1760, 0, -432, 0.6);
    addTexSign(985, 6.2, -312 + 9.5, 0.0, 22, 6, (g, W, H) => { g.fillStyle = '#0f2a58'; g.fillRect(0, 0, W, H); g.fillStyle = '#fff'; g.font = '800 ' + H * 0.3 + 'px Arial'; g.textAlign = 'center'; g.fillText('HARBORVIEW', W / 2, H * 0.4); g.font = '700 ' + H * 0.2 + 'px Arial'; g.fillText('INTERNATIONAL AIRPORT', W / 2, H * 0.64); g.fillStyle = '#ffd25a'; g.font = '700 ' + H * 0.16 + 'px Arial'; g.fillText('TERMINAL  ·  GENERAL AVIATION  ·  PARKING', W / 2, H * 0.88); });
    for (const sx of [974.5, 995.5]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.6, 6, 0.6), new THREE.MeshLambertMaterial({ color: 0x40444c })); m.position.set(sx, 3, -312 + 9.5); scene.add(m); }
    sol(974, 976, -303.2, -302, 6); sol(995, 996.6, -303.2, -302, 6);
    state.tug = place('ap_tug', 0, -50, 0, 0); if (state.tug) state.tug.visible = false;
  }

  const hash2 = (i, j, s) => { let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const vnoise = (x, z, s) => { const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz); return lerp(lerp(hash2(i, j, s), hash2(i + 1, j, s), u), lerp(hash2(i, j + 1, s), hash2(i + 1, j + 1, s), u), v); };
  const fbm = (x, z, s) => { let a = 0.5, f = 1, t = 0; for (let k = 0; k < 4; k++) { t += a * vnoise(x * f, z * f, s + k * 17); f *= 2.03; a *= 0.5; } return t; };
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  const ISLANDS = [
    { id: 'PCA', code: 'PCA', name: 'Palm Cay', cx: 7600, cz: -1400, rx: 1900, rz: 1100, seed: 11, tint: [0.34, 0.5, 0.22] },
    { id: 'IRW', code: 'IRW', name: 'Ironwood Isle', cx: -1800, cz: -8300, rx: 1700, rz: 1000, seed: 23, tint: [0.22, 0.4, 0.2] },
    { id: 'SSK', code: 'SSK', name: 'Sunset Key', cx: 3800, cz: 7300, rx: 1800, rz: 1100, seed: 37, tint: [0.4, 0.5, 0.22] }
  ];
  const FIELDS = {
    HVN: { code: 'HVN', name: 'Harborview', x: 1600, z: -540, rect: [1030, -580, 2150, -332] }
  };
  for (const I of ISLANDS) {
    I.field = { x0: I.cx - 650, x1: I.cx + 650, z: I.cz, w: 46, twyZ: I.cz + 54, apx0: I.cx - 320, apx1: I.cx - 20, apz0: I.cz + 66, apz1: I.cz + 200, tz: I.cz + 232 };
    FIELDS[I.code] = { code: I.code, name: I.name, x: I.cx, z: I.cz + 60, rect: [I.cx - 720, I.cz - 70, I.cx + 720, I.cz + 215], island: I };
  }
  const rectDist = (I, x, z) => { const dx = Math.max(I.cx - 3600 - x, 0, x - (I.cx + 3600)), dz = Math.max(I.cz - 170 - z, 0, z - (I.cz + 300)); return Math.hypot(dx, dz); };
  function isleR(I, x, z) {
    const dx = (x - I.cx) / I.rx, dz = (z - I.cz) / I.rz, ang = Math.atan2(dz, dx);
    const wob = 1 + 0.14 * Math.sin(ang * 3 + I.seed) + 0.09 * Math.sin(ang * 5 + I.seed * 2.3) + 0.05 * Math.sin(ang * 9 + I.seed * 1.7) + 0.06 * (fbm(x * 0.0009, z * 0.0009, I.seed) - 0.5);
    return Math.hypot(dx, dz) / wob;
  }
  function isleH(I, x, z) {
    const r = isleR(I, x, z);
    if (r > 1.4) return -9;
    let h = 0;
    if (r > 0.8) h = -Math.pow(Math.min(1, (r - 0.8) / 0.22), 1.4) * 1.9 - (r > 1.02 ? (r - 1.02) * 30 : 0);
    const m = sstep(70, 380, rectDist(I, x, z)) * (1 - sstep(0.5, 0.84, r));
    if (m > 0) h += m * (Math.pow(fbm(x * 0.0026 + 3, z * 0.0026, I.seed), 1.7) * 230 - 8);
    return h;
  }
  function gh(x, z) {
    for (const I of ISLANDS) {
      if (Math.abs(x - I.cx) > I.rx * 1.6 || Math.abs(z - I.cz) > I.rz * 1.6) continue;
      const h = isleH(I, x, z); return h < -0.45 ? -0.45 : Math.max(h, -0.45);
    }
    if (x > -380 && x < AP.x1 + 30 && z > -660 && z < 420) return 0;
    return -0.45;
  }

  function buildIsland(I) {
    if (I.built || !state.kit) return;
    I.built = true;
    const g = new THREE.Group(); I.g = g; scene.add(g);
    const W = I.rx * 2.8, D = I.rz * 2.8, NX = 220, NZ = 130;
    const geo = new THREE.PlaneGeometry(W, D, NX, NZ).rotateX(-Math.PI / 2);
    const pos = geo.attributes.position, n = pos.count, col = new Float32Array(n * 3), Hs = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = pos.getX(i) + I.cx, z = pos.getZ(i) + I.cz; const h = isleH(I, x, z); Hs[i] = h; pos.setXYZ(i, pos.getX(i), Math.max(h, -3.5), pos.getZ(i)); }
    const cell = W / NX;
    for (let i = 0; i < n; i++) {
      const ix = i % (NX + 1), iz = Math.floor(i / (NX + 1)), h = Hs[i], hx = Hs[Math.min(n - 1, i + 1)], hz = Hs[Math.min(n - 1, i + NX + 1)];
      const slope = Math.max(Math.abs(hx - h), Math.abs(hz - h)) / cell, x = pos.getX(i) + I.cx, z = pos.getZ(i) + I.cz, nz = fbm(x * 0.006, z * 0.006, I.seed + 5);
      let r, gg, b;
      const rad = isleR(I, x, z), beach = sstep(0.78, 0.86, rad);
      if (h < 0.3 && beach > 0.5) { const t = sstep(-1.6, 0.3, h); r = lerp(0.62, 0.86, t); gg = lerp(0.56, 0.78, t); b = lerp(0.42, 0.55, t); }
      else {
        const f = clamp((h - 0.9) / 6, 0, 1), forest = sstep(10, 70, h + nz * 30), sand = beach * (1 - sstep(0.3, 2.2, h));
        r = lerp(I.tint[0] * (0.95 + nz * 0.2), I.tint[0] * (0.85 + nz * 0.3), f); gg = lerp(I.tint[1] * (0.95 + nz * 0.2), I.tint[1] * (0.85 + nz * 0.3), f); b = lerp(I.tint[2], I.tint[2], f);
        r = lerp(r, 0.86, sand); gg = lerp(gg, 0.78, sand); b = lerp(b, 0.55, sand);
        r = lerp(r, 0.14, forest * 0.6); gg = lerp(gg, 0.26, forest * 0.55); b = lerp(b, 0.12, forest * 0.6);
        if (slope > 0.55 || h > 130) { const k = clamp((slope - 0.45) * 3 + (h - 110) / 80, 0, 1); r = lerp(r, 0.46, k); gg = lerp(gg, 0.43, k); b = lerp(b, 0.4, k); }
      }
      const f2 = (h > -0.4 && h < 0.5) ? sstep(0, 1, rectDist(I, x, z) / 80) : 0;
      col[i * 3] = r; col[i * 3 + 1] = gg; col[i * 3 + 2] = b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true })); mesh.position.set(I.cx, 0, I.cz); g.add(mesh); mesh.userData.noShadow = true;
    const lag = (() => { const c = cvs(128, 128), x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 20, 64, 64, 64); gr.addColorStop(0, 'rgba(120,235,225,0.0)'); gr.addColorStop(0.62, 'rgba(110,230,220,0.5)'); gr.addColorStop(0.82, 'rgba(60,190,200,0.28)'); gr.addColorStop(1, 'rgba(40,150,190,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
    const lm = new THREE.Mesh(new THREE.PlaneGeometry(I.rx * 3.0, I.rz * 3.0).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: lag, transparent: true, depthWrite: false, fog: true })); lm.position.set(I.cx, -0.3, I.cz); g.add(lm); lm.renderOrder = 1;
    const F = I.field, Z0 = I.cz;
    const addSlab = (x0, z0, x1, z1, mat, y) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2), mat); m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); g.add(m); return m; };
    addSlab(F.x0, I.cz - 23, F.x1, I.cz + 23, new THREE.MeshLambertMaterial({ map: runwayTex(F.x1 - F.x0, 46, I.code === 'PCA' ? '08' : I.code === 'IRW' ? '10' : '09', I.code === 'PCA' ? '26' : I.code === 'IRW' ? '28' : '27'), ...po(-4, -4) }), 0.06);
    addSlab(F.x0 + 30, F.twyZ - 10, F.x1 - 30, F.twyZ + 10, new THREE.MeshLambertMaterial({ map: taxiTex(F.x1 - F.x0 - 60, 20), ...po(-4, -4) }), 0.06);
    const at = apronTex(); at.repeat.set((F.apx1 - F.apx0) / 30, (F.apz1 - F.apz0) / 30);
    addSlab(F.apx0, F.apz0, F.apx1, F.apz1, new THREE.MeshLambertMaterial({ map: at, ...po(-3, -3) }), 0.05);
    for (const lx of [F.x0 + 140, F.x1 - 140, I.cx - 170]) { const c = cvs(64, 128), x = c.getContext('2d'); x.fillStyle = '#35373d'; x.fillRect(0, 0, 64, 128); x.fillStyle = '#d8b42a'; x.fillRect(31, 0, 2, 128); addSlab(lx - 10, I.cz + 23, lx + 10, F.twyZ - 10, new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(c), ...po(-4, -4) }), 0.062); }
    makeLights({ rw: { x0: F.x0, x1: F.x1, z: I.cz, w: 46 }, twyZ: F.twyZ, twyX0: F.x0 + 30, twyX1: F.x1 - 30, links: [F.x0 + 140, F.x1 - 140, I.cx - 170] }, g);
    const tz = F.tz, mods = [I.cx - 250, I.cx - 210, I.cx - 130, I.cx - 90];
    for (const x of mods) { place('ap_terminal', x, 0, tz, 0, null, 0, g); placeLit('ap_terminal_lit', x, 0, tz, 0, g); }
    place('ap_core', I.cx - 170, 0, tz, 0, null, 0, g); placeLit('ap_core_lit', I.cx - 170, 0, tz, 0, g);
    addTexSign(I.cx - 170, 24.2, tz + 22.2, 0, 24, 3.6, (gx, Wd, H) => { gx.fillStyle = '#0d5a66'; gx.fillRect(0, 0, Wd, H); gx.fillStyle = '#fff'; gx.font = '800 ' + H * 0.4 + 'px Arial'; gx.textAlign = 'center'; gx.textBaseline = 'middle'; gx.fillText(I.name.toUpperCase() + '  AIRPORT', Wd / 2, H / 2); }, g);
    place('ap_tower', I.cx - 20, 0, tz, 0, null, 0, g); placeLit('ap_tower_lit', I.cx - 20, 0, tz, 0, g);
    place('ap_hangar', I.cx + 180, 0, tz + 20, Math.PI, null, 0, g); place('ap_hangar', I.cx + 230, 0, tz + 20, Math.PI, null, 0, g);
    for (const x of [I.cx - 260, I.cx - 180, I.cx - 100]) { place('ap_flood', x, 0, F.apz0 + 20, 0, null, 0, g); placeLit('ap_flood_lit', x, 0, F.apz0 + 20, 0, g); }
    place('ap_windpole', I.cx + 380, 0, I.cz - 40, 0, null, 0, g); { const s = place('ap_sock', I.cx + 380, 7.5, I.cz - 40, 0, null, 0, g); s.rotation.order = 'YXZ'; state.socks.push(s); }
    place('ap_fueltruck', I.cx - 110, 0, F.apz0 + 55, 0.5, null, 0, g);
    sol(I.cx - 290, I.cx - 70, tz - 22, tz + 22, 20); sol(I.cx - 25, I.cx - 15, tz - 5, tz + 5, 40);
    state.dishes = state.dishes || [];
    const land = { palm_a: [], palm_b: [], palm_c: [], shrub_a: [], shrub_b: [], shrub_c: [] }, rg = env.mulberry(I.seed * 77);
    let tries = 0;
    while (tries++ < 3200 && land.palm_a.length + land.palm_b.length + land.palm_c.length < 330) {
      const x = I.cx + (rg() - 0.5) * I.rx * 2.2, z = I.cz + (rg() - 0.5) * I.rz * 2.2, h = isleH(I, x, z);
      if (h < 0.4 || h > 75 || rectDist(I, x, z) < 120) continue;
      const nm = ['palm_a', 'palm_b', 'palm_c'][Math.floor(rg() * 3)], s = 0.9 + rg() * 0.7;
      land[nm].push({ x, y: h, z, r: rg() * TAU, sx: s, sy: s, sz: s });
      if (rg() < 0.5) land[['shrub_a', 'shrub_b', 'shrub_c'][Math.floor(rg() * 3)]].push({ x: x + (rg() - 0.5) * 12, y: isleH(I, x, z), z: z + (rg() - 0.5) * 12, r: rg() * TAU, sx: 1.2, sy: 1.2, sz: 1.2 });
    }
    NHM.load('plants').then(root => { if (root) for (const im of NHM.place(g, root, land)) im.userData.noShadow = true; });
  }

  const T = {
    cessna: { K: 0.019, thr: 5.2, vmax: 105, cd0: 0.05, cdi: 0.048, aMax: 0.17, pg: 2.4, rr: 2.1, yr: 0.55, gcap: 0.2, steer: 0.7, coast: 0.3, brake: 5.0, rotV: 20, a0: 6, a1: 24, low: 32, impact: 9, thrRate: 0.55,
      cp: [[0, 0, 2.2], [1.3, 0, 0.22], [-1.3, 0, 0.22]], hard: [[0, 1.15, -4.7], [5.4, 2.1, 0.9], [-5.4, 2.1, 0.9], [0, 1.5, 3.3], [0, 2.9, 0.6], [0, 3.2, -4.5]], pts: [[0, 1.2, 3.2], [0, 1.4, -4.8], [5.3, 2.2, 0.8], [-5.3, 2.2, 0.8], [0, 1.8, 0]],
      cam: { d: 17, h: 4.6, cock: [0, 1.82, 0.5], alt: [0, 1.4, 3.6] }, name: 'Cessna 172' },
    airliner: { K: 0.00386, thr: 6.4, vmax: 230, cd0: 0.032, cdi: 0.045, aMax: 0.15, pg: 1.5, rr: 0.95, yr: 0.22, gcap: 0.17, steer: 0.32, coast: 0.3, brake: 4.6, rotV: 50, a0: 12, a1: 45, low: 52, impact: 6.5, thrRate: 0.32, rev: 2.6,
      cp: [[0, 0.17, 13], [3.8, 0, -1.4], [-3.8, 0, -1.4]], hard: [[0, 3.6, -17], [17.8, 3.5, -8.4], [-17.8, 3.5, -8.4], [5.7, 0.45, 3], [-5.7, 0.45, 3], [0, 3.0, 18.5]], pts: [[0, 3.4, 18.8], [0, 6, -17], [17.8, 3.4, -8.4], [-17.8, 3.4, -8.4], [0, 3.4, 0]],
      cam: { d: 58, h: 15, cock: [0, 4.5, 16.4], alt: [0, 13.2, -16.5] }, name: 'Airliner' }
  };
  const planes = state.planes;
  function makeCessna(color, x, z, heading) {
    const g = new THREE.Group();
    const P = { type: 'cessna', T: T.cessna, g, color, x, y: 0, z, vx: 0, vy: 0, vz: 0, q: new THREE.Quaternion(), thr: 0, ctrl: 'parked', home: { x, z, h: heading }, rpm: 0, ail: 0, ele: 0, rud: 0, wheelRot: 0, grounded: true, crashT: 0, solids: [], prop: null, parts: {}, wheels: [], disc: null, stall: 0, gearDown: true, hold: false };
    const paint = new THREE.Mesh(KG['cessna_paint'], new THREE.MeshLambertMaterial({ color, vertexColors: true }));
    const detail = new THREE.Mesh(KG['cessna_detail'], LAMB), lit = new THREE.Mesh(KG['cessna_lit'], BASIC);
    g.add(paint, detail, lit); P.paintMat = paint.material; P.lit = lit; lit.userData.noShadow = true;
    const piv = (name, mat, px, py, pz) => { const gr = new THREE.Group(); gr.position.set(px, py, pz); const m = new THREE.Mesh(KG[name], mat); gr.add(m); g.add(gr); P.parts[name] = gr; return gr; };
    piv('cessna_ailL', paint.material, 3.95, 2.3, 0.258); piv('cessna_ailR', paint.material, -3.95, 2.3, 0.258);
    piv('cessna_flapL', paint.material, 1.7, 2.3, 0.141); piv('cessna_flapR', paint.material, -1.7, 2.3, 0.141);
    piv('cessna_elev', paint.material, 0, 1.45, -4.558); piv('cessna_rudder', paint.material, 0, 1.45, -4.196);
    P.prop = piv('cessna_prop', LAMB, 0, 1.24, 3.07);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.98, 28), new THREE.MeshBasicMaterial({ color: 0x20222a, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
    disc.position.set(0, 1.24, 3.14); g.add(disc); P.disc = disc;
    for (const [wx, wy, wz] of [[1.3, 0.3, 0.22], [-1.3, 0.3, 0.22], [0, 0.3, 2.2]]) { const w = new THREE.Mesh(KG['cessna_wheel'], LAMB); w.position.set(wx, wy, wz); g.add(w); P.wheels.push(w); }
    scene.add(g); return P;
  }
  function makeJet(model, gateX, ix) {
    const g = new THREE.Group(), hx = gateX - 2.5, hz = -361.4;
    const P = { type: 'airliner', T: T.airliner, g, color: 0, x: hx, y: 0, z: hz, vx: 0, vy: 0, vz: 0, q: new THREE.Quaternion(), thr: 0, ctrl: 'parked', home: { x: hx, z: hz, h: 0 }, gate: gateX, rpm: 0, ail: 0, ele: 0, rud: 0, wheelRot: 0, grounded: true, crashT: 0, solids: [], parts: {}, wheels: [], stall: 0, gearDown: true, hold: false, model };
    const body = new THREE.Mesh(KG[model], LAMB); P.paintMat = body.material; P.body = body;
    const gear = new THREE.Mesh(KG['jet_gear'], LAMB), lit = new THREE.Mesh(KG['jet_lit'], BASIC), nav = new THREE.Mesh(KG['jet_nav'], BASIC);
    lit.userData.noShadow = true; nav.userData.noShadow = true;
    g.add(body, gear, lit, nav); P.gear = gear; P.lit = lit; P.nav = nav;
    scene.add(g); return P;
  }
  function setSolids(P, on) {
    for (const s of P.solids) { s.x0 = s.x1 = s.z0 = s.z1 = -9e9; }
    if (!on) return;
    _fwd.set(0, 0, 1).applyQuaternion(P.q); const along = Math.abs(_fwd.x) > 0.7;
    const defs = P.type === 'airliner' ? [[2.5, 19, 8, 0, 0], [18, 6, 5, 0, -3], [7, 3, 5, 0, -15]] : [[1, 4.6, 2.2, 0, 0]];
    while (P.solids.length < defs.length) { const s = { x0: 0, x1: 0, z0: 0, z1: 0, h: 2 }; P.solids.push(s); solids.push(s); }
    defs.forEach((d, i) => { const s = P.solids[i], hw = along ? d[1] : d[0], hd = along ? d[0] : d[1], ox = along ? d[4] * Math.sign(_fwd.x) : 0, oz = along ? 0 : d[4] * Math.sign(_fwd.z); s.x0 = P.x + ox - hw; s.x1 = P.x + ox + hw; s.z0 = P.z + oz - hd; s.z1 = P.z + oz + hd; s.h = d[2]; });
  }
  function sync(P) { P.g.position.set(P.x, P.y, P.z); P.g.quaternion.copy(P.q); }
  function parkPlane(P) {
    const h = P.home; P.x = h.x; P.z = h.z; P.y = 0; P.vx = P.vy = P.vz = 0; P.thr = 0; P.ctrl = 'parked'; P.grounded = true; P.crashT = 0; P.rpm = 0; P.hold = false; P.gearDown = true;
    P.q.setFromAxisAngle(_v.set(0, 1, 0), h.h); P.g.visible = true;
    if (P.type === 'cessna') { P.paintMat.color.setHex(P.color); P.disc.material.opacity = 0; } else P.gear.visible = true;
    setSolids(P, true); sync(P);
  }

  const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _inv = new THREE.Quaternion(), _fwd = new THREE.Vector3(), _up = new THREE.Vector3(), _left = new THREE.Vector3(), _e = new THREE.Euler();

  function liftCurve(a) {
    const s = 0.27, aa = Math.abs(a);
    if (aa < s) return 5.2 * a + 0.28;
    return Math.sign(a) * Math.max(0.35, 5.2 * s - (aa - s) * 4.2);
  }

  function crash(P, why) {
    if (P.ctrl === 'wreck') return;
    const was = state.flying === P;
    P.ctrl = 'wreck'; P.crashT = 0;
    if (P.type === 'cessna') { P.paintMat.color.setHex(0x1d1f25); P.disc.material.opacity = 0; } else P.body.material = LAMB_DARK;
    const n = P.type === 'airliner' ? 2.2 : 1;
    for (let i = 0; i < 46 * n; i++) env.emit(P.x, P.y + 1, P.z, rnd(-9, 9) * n, rnd(2, 12), rnd(-9, 9) * n, rnd(0.6, 1.6), 1, rnd(0.35, 0.8), 0.12);
    for (let i = 0; i < 26 * n; i++) env.emit(P.x, P.y + 1.5, P.z, rnd(-4, 4) * n, rnd(3, 9), rnd(-4, 4) * n, rnd(1.2, 2.4), 0.12, 0.12, 0.14);
    env.noiseBurst(0.9, 0.5);
    P.vx *= 0.2; P.vy = 0; P.vz *= 0.2;
    if (was) { env.shake(1); env.toast('Crashed', why || '', 'var(--red)'); state.respawnT = 3.2; if (JOB.st !== 'none') { env.toast('Flight lost', 'The airline is not impressed', 'var(--red)'); JOB.st = 'none'; hideJob(); } }
  }
  const LAMB_DARK = new THREE.MeshLambertMaterial({ vertexColors: true, color: 0x24262c });

  function stepPlane(P, dt, I) {
    const TT = P.T, q = P.q;
    P.rpm += ((0.18 + P.thr * 0.82) * (I ? 1 : 0) - P.rpm) * Math.min(1, dt * 2.5);
    _fwd.set(0, 0, 1).applyQuaternion(q); _up.set(0, 1, 0).applyQuaternion(q); _left.set(1, 0, 0).applyQuaternion(q);
    _v.set(P.vx, P.vy, P.vz);
    const V = _v.length();
    _inv.copy(q).invert(); _v2.copy(_v).applyQuaternion(_inv);
    const vl = _v2;
    let alpha = Math.atan2(-vl.y, Math.max(vl.z, 0.001));
    if (vl.z < 0) alpha = Math.atan2(-vl.y, 0.001) * 0.9;
    const CL = liftCurve(alpha), dyn = 0.5 * V * V * TT.K;
    P.stall = !P.grounded && alpha > 0.17 && P.vy < -1.5 && V < TT.low * 1.1 ? 1 : 0;
    let ax = 0, ay = -9.81, az = 0;
    const thrust = P.thr * TT.thr * (1 - clamp(V / TT.vmax, 0, 1)) * (I ? 1 : 0);
    ax += _fwd.x * thrust; ay += _fwd.y * thrust; az += _fwd.z * thrust;
    const la = CL * dyn * (P.grounded && P.thr < 0.3 ? 0.45 : 1);
    ax += _up.x * la; ay += _up.y * la; az += _up.z * la;
    if (V > 0.01) {
      const CD = TT.cd0 + TT.cdi * CL * CL + (P.grounded ? 0.008 : 0) + 0.7 * Math.sin(alpha) * Math.sin(alpha) * (Math.abs(alpha) > 0.3 ? 1 : 0.2) + (P.grounded && V > 25 && P.thr < 0.3 ? 0.06 : 0);
      const d = CD * dyn / V; ax -= _v.x * d; ay -= _v.y * d; az -= _v.z * d;
    }
    const side = -vl.x * Math.min(V, 60) * 0.045;
    ax += _left.x * side; ay += _left.y * side; az += _left.z * side;
    P.vx += ax * dt; P.vy += ay * dt; P.vz += az * dt;
    const auth = clamp((V - TT.a0) / (TT.a1 - TT.a0), 0, 1);
    const ail = I ? I.roll : 0, ele = I ? I.pitch : 0, rud = I ? I.yaw : 0;
    P.ail += (ail - P.ail) * Math.min(1, dt * 8); P.ele += (ele - P.ele) * Math.min(1, dt * 8); P.rud += (rud - P.rud) * Math.min(1, dt * 8);
    const bank = Math.atan2(_left.y, _up.y);
    const clreq = clamp(9.81 * Math.max(_up.y, 0.2) / Math.max(dyn, 1), -0.2, 1.8), trim = clamp((clreq - 0.28) / 5.2, -0.08, 0.25);
    const at = P.ele >= 0 ? trim + P.ele * (TT.aMax - trim) : trim + P.ele * (trim + 0.2);
    let wp = (clamp(alpha, -0.7, 0.7) - at) * TT.pg * auth, wr = P.ail * TT.rr * auth, wy = -P.rud * TT.yr * auth;
    if (Math.abs(P.ail) < 0.1 && Math.abs(bank) < 1.3 && !P.grounded) wr += -bank * 0.4 * Math.max(auth, 0.6);
    if (!P.grounded && V < TT.low) wp += clamp((TT.low - V) / (TT.low * 0.4), 0, 1) * 0.7;
    if (!P.grounded) wy += -9.81 * Math.tan(clamp(bank, -1.2, 1.2)) / Math.max(V, 25) * (_up.y > 0.2 ? 1 : 0) * auth;
    P.wp = lerp(P.wp || 0, wp, Math.min(1, dt * 6)); P.wr = lerp(P.wr || 0, wr, Math.min(1, dt * 6)); P.wy = lerp(P.wy || 0, wy, Math.min(1, dt * 6));
    _e.set(P.wp * dt, P.wy * dt, P.wr * dt, 'YXZ');
    _q2.setFromEuler(_e); q.multiply(_q2).normalize();
    P.x += P.vx * dt; P.y += P.vy * dt; P.z += P.vz * dt;

    let minH = 1e9, wet = false;
    for (const c of TT.cp) { _v.set(c[0], c[1], c[2]).applyQuaternion(q); const gw = gh(P.x + _v.x, P.z + _v.z); if (gw < -0.3) wet = true; const h = P.y + _v.y - gw; if (h < minH) minH = h; }
    let hard = false;
    for (const c of TT.hard) { _v.set(c[0], c[1], c[2]).applyQuaternion(q); const gw = gh(P.x + _v.x, P.z + _v.z); if (gw < -0.3) wet = true; if (P.y + _v.y < gw + 0.02) hard = true; }
    if (minH < 0 || hard) {
      const impact = -P.vy;
      if (hard && P.ctrl !== 'wreck' && V > 3) { crash(P, wet ? 'Ditched in the sea' : 'Hit the ground'); return; }
      if (wet && (impact > 1.5 || V > 10)) { crash(P, 'Ditched in the sea'); return; }
      if (minH < 0) P.y -= minH;
      if (P.vy < 0) {
        if (impact > TT.impact || (Math.abs(bank) > 0.55 && V > 12) || (_fwd.y < -0.38 && V > 12)) { crash(P, impact > TT.impact ? 'Landed too hard' : 'Bad landing'); return; }
        if (!P.grounded) P.landVy = impact;
        if (impact > 3.5) { env.toast('Hard landing', '', 'var(--red)'); env.shake(0.5); }
        P.vy = impact > 2 ? impact * 0.1 : 0;
      }
      P.grounded = true;
    } else if (minH > 0.35) P.grounded = false;
    if (P.grounded) {
      _fwd.set(0, 0, 1).applyQuaternion(q); _fwd.y = 0; if (_fwd.lengthSq() < 1e-4) _fwd.set(0, 0, 1); _fwd.normalize();
      _left.set(_fwd.z, 0, -_fwd.x);
      let vf = P.vx * _fwd.x + P.vz * _fwd.z, vlat = P.vx * _left.x + P.vz * _left.z;
      const braking = I && I.brake, sp = Math.abs(vf);
      let decel = braking ? TT.brake : TT.coast;
      if (!braking && I && I.rev && TT.rev && vf > 3) decel += TT.rev;
      if (V < 0.4 && thrust < 0.3 && !braking) vf = 0; else if (braking && sp < 0.6 && thrust < 0.5) vf = 0; else vf -= Math.sign(vf) * Math.min(sp, (decel + 0.0001 * vf * vf) * dt);
      vlat *= Math.exp(-10 * dt);
      P.vx = _fwd.x * vf + _left.x * vlat; P.vz = _fwd.z * vf + _left.z * vlat;
      const steer = I && !I.hold ? -I.yaw : 0;
      if (Math.abs(vf) > 0.3) { _q2.setFromAxisAngle(_v.set(0, 1, 0), steer * TT.steer * clamp(Math.abs(vf) / 5, 0, 1) * clamp(1.4 - Math.abs(vf) / (TT.vmax * 0.4), 0.35, 1) * Math.sign(vf) * dt); q.premultiply(_q2).normalize(); }
      const rotating = I && I.pitch > 0.15 && V > TT.rotV;
      _e.setFromQuaternion(q, 'YXZ');
      _e.x += ((rotating ? _e.x : 0) - _e.x) * Math.min(1, dt * (rotating ? 0.6 : 2.4));
      _e.z += (0 - _e.z) * Math.min(1, dt * 5);
      if (_e.x < -TT.gcap) _e.x = -TT.gcap;
      q.setFromEuler(_e);
      P.vy = Math.max(P.vy, 0);
      P.wheelRot += vf * dt / 0.4;
    }
    for (const c of TT.pts) {
      _v.set(c[0], c[1], c[2]).applyQuaternion(q);
      const wx = P.x + _v.x, wz = P.z + _v.z, wy = P.y + _v.y;
      if (env.pointInSolid(wx, wz, wy)) { crash(P, 'Hit a building'); return; }
      if (wy < gh(wx, wz) - 0.2 && V > 3) { crash(P, 'Hit the terrain'); return; }
    }
    if (P.y > 4000) P.vy = Math.min(P.vy, 0);
    sync(P);
  }

  function animate(P, dt) {
    if (P.type === 'cessna') {
      P.prop.rotation.z += P.rpm * 62 * dt;
      P.disc.material.opacity = clamp((P.rpm - 0.3) * 0.5, 0, 0.32) * (P.ctrl === 'wreck' ? 0 : 1);
      P.prop.visible = P.rpm < 0.55;
      const pa = P.parts;
      pa.cessna_ailL.rotation.x = P.ail * 0.45; pa.cessna_ailR.rotation.x = -P.ail * 0.45;
      pa.cessna_elev.rotation.x = -P.ele * 0.4; pa.cessna_rudder.rotation.y = P.rud * 0.45;
      for (let i = 0; i < 3; i++) P.wheels[i].rotation.x = P.wheelRot;
      P.lit.visible = ENV.lamp > 0.3 || P.ctrl === 'player';
    } else {
      const V = Math.hypot(P.vx, P.vy, P.vz);
      if (P.ctrl === 'player') {
        if (P.grounded) P.gearDown = true;
        else if (P.y > 70 && P.vy > -2) P.gearDown = false;
        else if (P.y < 45 || P.vy < -3.5) P.gearDown = true;
      }
      P.gear.visible = P.gearDown;
      const night = ENV.lamp > 0.3, live = P.ctrl === 'player' || P.ctrl === 'parked' && P.gate !== undefined && JOB.P === P;
      P.nav.visible = (night || P.ctrl === 'player') && ((state.t * 1.4) % 1.6 < 1.15 || P.ctrl !== 'player');
    }
  }

  const JOB = { st: 'none', P: null, from: 'HVN', to: null, pax: 0, board: 0, t: 0, dur: 0, total: 0, legs: 0, no: 100, push: false, startDist: 0, landed: 0 };
  const jobEl = (() => {
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;left:50%;top:84px;transform:translateX(-50%);display:none;min-width:360px;padding:8px 16px;background:rgba(10,14,24,.78);border:1px solid rgba(255,210,90,.45);color:#fff;font:700 13px/1.35 system-ui,sans-serif;letter-spacing:.05em;border-radius:6px;z-index:3;pointer-events:none;text-align:center;font-variant-numeric:tabular-nums';
    d.innerHTML = '<div id="jbA" style="color:#ffd25a;font-size:11px;letter-spacing:.16em"></div><div id="jbB" style="font-size:15px"></div><div id="jbBar" style="height:5px;background:rgba(255,255,255,.18);margin-top:5px;display:none"><div id="jbFill" style="height:100%;background:#ffd25a;width:0"></div></div>';
    document.body.appendChild(d); return { d, a: d.querySelector('#jbA'), b: d.querySelector('#jbB'), bar: d.querySelector('#jbBar'), fill: d.querySelector('#jbFill') };
  })();
  function hideJob() { jobEl.d.style.display = 'none'; }
  const distTo = (P, F) => Math.hypot(F.x - P.x, F.z - P.z);
  function pickDest(from) {
    if (from !== 'HVN') return 'HVN';
    const list = ISLANDS.map(i => i.code); let c = list[Math.floor(Math.random() * list.length)]; if (c === JOB.lastTo && Math.random() < 0.7) c = list[(list.indexOf(c) + 1) % list.length];
    return c;
  }
  function fieldAt(x, z) { for (const k in FIELDS) { const r = FIELDS[k].rect; if (x > r[0] && x < r[2] && z > r[1] && z < r[3]) return k; } return null; }
  function startJob(P) {
    const here = fieldAt(P.x, P.z) || (Math.hypot(P.x - 1600, P.z + 540) < 1200 ? 'HVN' : 'HVN');
    JOB.P = P; JOB.from = here; JOB.to = pickDest(here); JOB.lastTo = JOB.to; JOB.pax = 112 + Math.floor(Math.random() * 74); JOB.board = 0; JOB.t = 0; JOB.dur = 11 + Math.random() * 4; JOB.st = 'boarding'; JOB.no++;
    JOB.push = P.gate !== undefined && Math.hypot(P.x - P.home.x, P.z - P.home.z) < 4; JOB.total = 0; JOB.legs = 0; P.hold = true;
    const I = ISLANDS.find(i => i.code === JOB.to); if (I) buildIsland(I);
    env.toast('Harborview Air', 'Flight HV ' + JOB.no + ' to ' + FIELDS[JOB.to].name + '. Boarding passengers.', 'var(--cyan)');
  }
  function endJob(msg) {
    if (JOB.st !== 'none' && msg) env.toast(msg, JOB.total ? 'Earned $' + JOB.total.toLocaleString('en-US') + ' this shift' : '', 'var(--cyan)');
    JOB.st = 'none'; if (JOB.P) JOB.P.hold = false; JOB.P = null; hideJob();
    if (state.tug) state.tug.visible = false;
  }
  function updateJob(dt) {
    const P = JOB.P; if (JOB.st === 'none' || !P) return;
    const F = FIELDS[JOB.to], d = distTo(P, F);
    if (JOB.st === 'boarding') {
      JOB.t += dt; if (keys.KeyS) JOB.t = JOB.dur; JOB.board = Math.min(JOB.pax, Math.floor(JOB.pax * JOB.t / JOB.dur));
      jobEl.a.textContent = 'FLIGHT HV ' + JOB.no + '  ·  BOARDING'; jobEl.b.textContent = JOB.board + ' / ' + JOB.pax + ' passengers  ·  hold S to skip'; jobEl.bar.style.display = 'block'; jobEl.fill.style.width = (100 * JOB.t / JOB.dur) + '%';
      if (JOB.t >= JOB.dur) { if (JOB.push) { JOB.st = 'pushback'; JOB.t = 0; JOB.dur = 20; state.tug.visible = true; env.toast('Pushback', 'Doors closed. Pushing back from the gate.', 'var(--cyan)'); } else { JOB.st = 'enroute'; P.hold = false; env.toast('Cleared for takeoff', 'Fly to ' + F.name + '. Follow the yellow line on the minimap.', 'var(--good)'); } JOB.landed = 0; }
    } else if (JOB.st === 'pushback') {
      JOB.t += dt * (keys.KeyS ? 6 : 1); const s = clamp(JOB.t / JOB.dur, 0, 1), e = s * s * (3 - 2 * s);
      P.x = P.home.x; P.z = P.home.z - 52 * e; P.q.setFromAxisAngle(_v.set(0, 1, 0), Math.PI * e); P.vx = P.vy = P.vz = 0; sync(P);
      if (state.tug) { _v.set(0, 0, 15.5).applyQuaternion(P.q); state.tug.position.set(P.x + _v.x, 0, P.z + _v.z); state.tug.rotation.y = Math.PI * e + Math.PI; }
      jobEl.a.textContent = 'FLIGHT HV ' + JOB.no + '  ·  PUSHBACK'; jobEl.b.textContent = 'Stand by  ·  hold S to speed up'; jobEl.fill.style.width = (100 * s) + '%';
      if (s >= 1) { JOB.st = 'enroute'; P.hold = false; state.tug.visible = false; setSolids(P, false); env.toast('Cleared to taxi', 'Fly to ' + F.name + '. Follow the yellow line on the minimap.', 'var(--good)'); }
    } else if (JOB.st === 'enroute') {
      const V = Math.hypot(P.vx, P.vz), eta = Math.max(0, Math.round(d / Math.max(V, 60)));
      jobEl.a.textContent = 'HV ' + JOB.no + '  ·  ' + F.name.toUpperCase() + ' (' + F.code + ')'; jobEl.b.textContent = (d / 1000).toFixed(1) + ' km  ·  ETA ' + Math.floor(eta / 60) + ':' + ('0' + (eta % 60)).slice(-2) + '  ·  ' + JOB.pax + ' pax'; jobEl.bar.style.display = 'none';
      if (P.grounded && !JOB.landed) JOB.landed = P.landVy || 1;
      if (P.grounded && fieldAt(P.x, P.z) === JOB.to && V < 3.5) {
        const km = Math.hypot(FIELDS[JOB.from].x - F.x, FIELDS[JOB.from].z - F.z) / 1000, lv = JOB.landed || 1;
        const smooth = lv < 1.6 ? 300 : lv < 3 ? 140 : lv < 4.5 ? 40 : 0, base = Math.round((250 + km * 150) * (0.75 + JOB.pax / 190 * 0.5)), pay = Math.round((base + smooth) / 10) * 10;
        JOB.total += pay; JOB.legs++; env.addCash(pay);
        env.toast('Passengers deplaning  +$' + pay.toLocaleString('en-US'), (smooth >= 300 ? 'Butter landing. ' : smooth > 0 ? 'Nice landing. ' : 'Rough landing, no bonus. ') + JOB.pax + ' passengers · ' + km.toFixed(1) + ' km', 'var(--good)');
        JOB.from = JOB.to; JOB.st = 'deplane'; JOB.t = 0; JOB.dur = 7; P.hold = true;
      }
    } else if (JOB.st === 'deplane') {
      JOB.t += dt; jobEl.a.textContent = 'FLIGHT HV ' + JOB.no + '  ·  ARRIVED'; jobEl.b.textContent = 'Deplaning ' + Math.round(JOB.pax * (1 - JOB.t / JOB.dur)) + ' passengers'; jobEl.bar.style.display = 'block'; jobEl.fill.style.width = (100 * JOB.t / JOB.dur) + '%';
      if (JOB.t >= JOB.dur) {
        JOB.to = pickDest(JOB.from); JOB.lastTo = JOB.to; JOB.pax = 112 + Math.floor(Math.random() * 74); JOB.t = 0; JOB.dur = 11 + Math.random() * 4; JOB.st = 'boarding'; JOB.push = false; JOB.no++;
        const I = ISLANDS.find(i => i.code === JOB.to); if (I) buildIsland(I);
        env.toast('Next flight', 'HV ' + JOB.no + ' to ' + FIELDS[JOB.to].name + '. Boarding passengers.', 'var(--cyan)');
      }
    }
    jobEl.d.style.display = 'block';
  }

  const hud = (() => {
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);display:none;gap:18px;padding:10px 20px;background:rgba(10,14,24,.72);border:1px solid rgba(255,255,255,.14);color:#fff;font:700 15px/1.1 system-ui,sans-serif;letter-spacing:.06em;border-radius:6px;align-items:center;z-index:3;pointer-events:none;font-variant-numeric:tabular-nums';
    d.innerHTML = '<div><small style="display:block;opacity:.6;font-size:10px">SPEED</small><span id="fhS" style="font-size:26px">0</span> km/h</div><div><small style="display:block;opacity:.6;font-size:10px">ALT</small><span id="fhA" style="font-size:26px">0</span> m</div><div><small style="display:block;opacity:.6;font-size:10px">CLIMB</small><span id="fhV">0</span> m/s</div><div><small style="display:block;opacity:.6;font-size:10px">HDG</small><span id="fhH">000</span><span id="fhB" style="opacity:.7;font-size:12px"></span></div><div style="width:92px"><small style="display:block;opacity:.6;font-size:10px">THROTTLE</small><div style="height:8px;background:rgba(255,255,255,.18);margin-top:5px"><div id="fhT" style="height:100%;background:#7ae0ff;width:0"></div></div></div><div id="fhG" style="min-width:56px;font-size:12px;opacity:.85"></div><div id="fhW" style="color:#ff5a64;min-width:96px"></div>';
    document.body.appendChild(d);
    const help = document.createElement('div');
    help.style.cssText = 'position:fixed;left:176px;bottom:16px;display:none;padding:10px 14px;background:rgba(10,14,24,.72);border:1px solid rgba(255,255,255,.14);color:#dfe6f2;font:600 12px/1.55 system-ui,sans-serif;border-radius:6px;z-index:3;pointer-events:none';
    help.innerHTML = '<b style="color:#fff">W/S</b> pitch &nbsp; <b style="color:#fff">A/D</b> roll &nbsp; <b style="color:#fff">Q/E</b> rudder / steer<br><b style="color:#fff">Shift</b> throttle up &nbsp; <b style="color:#fff">Z</b> down (hold on the ground for reverse)<br><b style="color:#fff">Space</b> wheel brakes &nbsp; <b style="color:#fff">C</b> camera &nbsp; <b style="color:#fff">F</b> get out';
    document.body.appendChild(help);
    return { d, help, s: d.querySelector('#fhS'), a: d.querySelector('#fhA'), v: d.querySelector('#fhV'), h: d.querySelector('#fhH'), b: d.querySelector('#fhB'), t: d.querySelector('#fhT'), w: d.querySelector('#fhW'), g: d.querySelector('#fhG') };
  })();

  const snd = { on: false };
  function audioStart() {
    const a = env.audio(); if (!a || !a.AC || snd.on) return;
    const AC = a.AC;
    try {
      snd.o1 = AC.createOscillator(); snd.o1.type = 'sawtooth'; snd.o2 = AC.createOscillator(); snd.o2.type = 'square';
      snd.f = AC.createBiquadFilter(); snd.f.type = 'lowpass'; snd.f.frequency.value = 520; snd.g = AC.createGain(); snd.g.gain.value = 0;
      snd.o1.connect(snd.f); snd.o2.connect(snd.f); snd.f.connect(snd.g); snd.g.connect(a.master); snd.o1.start(); snd.o2.start();
      const nb = env.noiseBuffer(); if (nb) { snd.ns = AC.createBufferSource(); snd.ns.buffer = nb; snd.ns.loop = true; snd.nf = AC.createBiquadFilter(); snd.nf.type = 'bandpass'; snd.nf.frequency.value = 900; snd.nf.Q.value = 0.5; snd.ng = AC.createGain(); snd.ng.gain.value = 0; snd.ns.connect(snd.nf); snd.nf.connect(snd.ng); snd.ng.connect(a.master); snd.ns.start(); }
      snd.on = true;
    } catch (e) { snd.on = false; }
  }
  function audioUpdate(P) {
    if (!snd.on) return;
    const a = env.audio(), t = a.AC.currentTime, vol = a.muted ? 0 : 1, jet = P && P.type === 'airliner';
    const rpm = P ? P.rpm : 0, V = P ? Math.hypot(P.vx, P.vy, P.vz) : 0;
    snd.o1.frequency.setTargetAtTime(jet ? 38 + rpm * 46 : 48 + rpm * 74, t, 0.08); snd.o2.frequency.setTargetAtTime(jet ? 76 + rpm * 90 : 96 + rpm * 148, t, 0.08);
    snd.f.frequency.setTargetAtTime(jet ? 380 + rpm * 700 : 520, t, 0.1);
    snd.g.gain.setTargetAtTime(P ? (jet ? 0.03 + rpm * 0.06 : 0.04 + rpm * 0.07) * vol : 0, t, 0.15);
    if (snd.ng) snd.ng.gain.setTargetAtTime(P ? clamp((jet ? V / 160 : V / 90) + (jet ? rpm * 0.4 : 0), 0, 1) * (jet ? 0.2 : 0.12) * vol : 0, t, 0.2);
  }

  function nearPlane() {
    if (state.flying || !state.kit) return null;
    let best = null, bd = 99;
    for (const P of planes) {
      if (P.ctrl === 'wreck') continue;
      _fwd.set(0, 0, 1).applyQuaternion(P.q);
      const rx = player.x - P.x, rz = player.z - P.z, len = P.type === 'airliner' ? 16 : 3, lim = P.type === 'airliner' ? 10 : 6;
      const t = clamp(rx * _fwd.x + rz * _fwd.z, -len, len), d = Math.hypot(rx - _fwd.x * t, rz - _fwd.z * t);
      if (d < lim && d < bd) { bd = d; best = P; }
    }
    return best;
  }
  function enter(P) {
    state.flying = P; P.ctrl = 'player'; player.plane = P; player.g.visible = false; player.vx = player.vz = 0;
    setSolids(P, false);
    camera.far = 16000; camera.near = 1.2; camera.updateProjectionMatrix();
    state.camDir = new THREE.Vector3(0, 0, 1).applyQuaternion(P.q); state.camDir.y = 0; state.camDir.normalize();
    hud.d.style.display = 'flex'; hud.help.style.display = 'block'; hud.help.style.opacity = 1; audioStart();
    if (P.type === 'airliner') {
      if (JOB.st === 'none') startJob(P);
      else if (JOB.P !== P) { endJob(); startJob(P); }
    } else env.toast('Cessna 172', 'Shift to add power, then pull back (S) at 110 km/h', 'var(--cyan)');
    state.instr = 14; env.setCamYaw(Math.atan2(state.camDir.x, state.camDir.z) + Math.PI);
  }
  function exit() {
    const P = state.flying; if (!P) return;
    const V = Math.hypot(P.vx, P.vy, P.vz);
    if (!P.grounded || V > 4) { env.toast('Land first', 'Slow below 15 km/h on the ground', 'var(--red)'); return; }
    _left.set(1, 0, 0).applyQuaternion(P.q); _left.y = 0; _left.normalize();
    const off = P.type === 'airliner' ? 6.5 : 3.2;
    player.x = P.x + _left.x * off; player.z = P.z + _left.z * off; player.y = 0; player.h = Math.atan2(_left.x, _left.z); player.g.visible = true; player.vx = player.vz = 0;
    P.ctrl = 'parked'; P.thr = 0; P.vx = P.vy = P.vz = 0; P.hold = false; P.left = state.t;
    setSolids(P, true);
    if (JOB.P === P) endJob(JOB.st === 'enroute' || JOB.st === 'boarding' ? 'Flight cancelled' : 'Shift over');
    state.flying = null; player.plane = null; hud.d.style.display = 'none'; hud.help.style.display = 'none';
    camera.far = 900; camera.near = 0.5; camera.updateProjectionMatrix(); env.setFog(null);
  }
  function respawnAfterCrash() {
    const P = state.flying; if (!P) return;
    state.flying = null; player.plane = null; hud.d.style.display = 'none'; hud.help.style.display = 'none';
    camera.far = 900; camera.near = 0.5; camera.updateProjectionMatrix(); env.setFog(null);
    env.fadeOut(() => {
      player.x = 1330; player.z = -262; player.y = 0; player.vx = player.vz = 0; player.hp = 100; player.g.visible = true; player.h = 0;
      env.camSnap(player.x, player.z);
      setTimeout(() => { for (const Q of planes) if (Q.ctrl === 'wreck') { if (JOB.P === Q) endJob(); parkPlane(Q); } }, 8000);
    });
  }

  function inputs(P) {
    const up = keys.ShiftLeft || keys.ShiftRight || keys.ArrowUp, dn = keys.KeyZ || keys.ArrowDown;
    return { pitch: (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0), roll: (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0), yaw: (keys.KeyE ? 1 : 0) - (keys.KeyQ ? 1 : 0), brake: !!keys.Space, up, dn, rev: !!dn };
  }

  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), _cq = new THREE.Quaternion();
  function updateCam(dt) {
    const P = state.flying; if (!P) return false;
    const C = P.T.cam;
    _fwd.set(0, 0, 1).applyQuaternion(P.q);
    if (state.view === 1) {
      _v.set(C.cock[0], C.cock[1], C.cock[2]).applyQuaternion(P.q); camera.position.set(P.x + _v.x, P.y + _v.y, P.z + _v.z);
      _cq.setFromAxisAngle(_v.set(0, 1, 0), Math.PI); camera.quaternion.copy(P.q).multiply(_cq); camera.fov = 78;
    } else if (state.view === 2) {
      _v.set(C.alt[0], C.alt[1], C.alt[2]).applyQuaternion(P.q); camera.position.set(P.x + _v.x, P.y + _v.y, P.z + _v.z);
      _cq.setFromAxisAngle(_v.set(0, 1, 0), Math.PI); camera.quaternion.copy(P.q).multiply(_cq); camera.fov = 70;
    } else {
      const dirT = _v2.copy(_fwd); dirT.y *= 0.35; if (dirT.lengthSq() < 1e-3) dirT.copy(state.camDir); dirT.normalize();
      state.camDir.lerp(dirT, 1 - Math.exp(-dt * 3.2)).normalize();
      const dist = C.d * env.camScale(), h = C.h * (1 + clamp(_fwd.y, -1, 1) * -0.6);
      camPos.set(P.x - state.camDir.x * dist, P.y + C.h * 0.7 + h * 0.3 - state.camDir.y * dist * 0.6, P.z - state.camDir.z * dist);
      const gg = gh(camPos.x, camPos.z); if (camPos.y < gg + 1.5) camPos.y = gg + 1.5;
      const k = 1 - Math.exp(-dt * 9);
      camera.position.lerp(camPos, k);
      camLook.set(P.x + _fwd.x * C.d * 0.55, P.y + _fwd.y * C.d * 0.55 + C.h * 0.18, P.z + _fwd.z * C.d * 0.55);
      camera.lookAt(camLook);
      const fov = 66 + clamp(Math.hypot(P.vx, P.vy, P.vz) * (P.type === 'airliner' ? 0.08 : 0.18), 0, 14); camera.fov = lerp(camera.fov, fov, 0.1);
    }
    camera.updateProjectionMatrix();
    return true;
  }

  function updateHud(P, dt) {
    const V = Math.hypot(P.vx, P.vy, P.vz);
    hud.s.textContent = Math.round(V * 3.6); hud.a.textContent = Math.max(0, Math.round(P.y));
    hud.v.textContent = (P.vy >= 0 ? '+' : '') + P.vy.toFixed(1);
    _fwd.set(0, 0, 1).applyQuaternion(P.q); let hd = Math.atan2(_fwd.x, -_fwd.z) * 180 / Math.PI; hd = (hd + 360) % 360;
    hud.h.textContent = ('00' + Math.round(hd)).slice(-3);
    const F = JOB.to && (JOB.st === 'enroute') ? FIELDS[JOB.to] : null;
    if (F) { let br = Math.atan2(F.x - P.x, -(F.z - P.z)) * 180 / Math.PI; br = (br + 360) % 360; hud.b.textContent = '  ▸' + ('00' + Math.round(br)).slice(-3); } else hud.b.textContent = '';
    hud.t.style.width = Math.round(P.thr * 100) + '%';
    hud.g.textContent = P.type === 'airliner' ? (P.gearDown ? 'GEAR DOWN' : 'GEAR UP') : '';
    let w = '';
    if (P.ctrl === 'wreck') w = 'WRECKED'; else if (P.stall) w = 'STALL'; else if (!P.grounded && P.vy < -9 && P.y < 120) w = 'PULL UP'; else if (P.grounded && keys.Space && V > 0.5) w = 'BRAKES'; else if (P.hold) w = JOB.st === 'pushback' ? 'PUSHBACK' : 'PARKED'; else if (P.grounded && V < 1 && P.thr < 0.05) w = 'ENGINE IDLE';
    hud.w.textContent = w; hud.w.style.color = w === 'BRAKES' || w === 'PARKED' || w === 'PUSHBACK' ? '#ffd25a' : '#ff5a64';
    if (state.instr > 0) { state.instr -= dt; hud.help.style.opacity = state.instr <= 0 ? 0.35 : 1; }
  }

  function update(dt) {
    state.t = (state.t || 0) + dt;
    const night = ENV.lamp, dark = clamp((night - 0.2) / 0.6, 0, 1);
    for (const L of LIGHTSETS) {
      L.mat.opacity = dark * 0.95; L.P.visible = dark > 0.02;
      if (L.P.visible && L.strobe.length) {
        const ca = L.colAttr, arr = ca.array, seq = Math.floor(state.t * 7) % 22;
        for (const i of L.strobe) { const on = (L.phase[i] === 15 - (seq % 16) && seq < 16) ? 1 : 0.16; arr[i * 3] = L.base[i * 3] * on; arr[i * 3 + 1] = L.base[i * 3 + 1] * on; arr[i * 3 + 2] = L.base[i * 3 + 2] * on; }
        ca.needsUpdate = true;
      }
    }
    BASIC.color.setScalar(clamp(0.25 + night * 0.75, 0.25, 1));
    if (state.dish) state.dish.rotation.y += dt * 1.4;
    for (const s of state.socks) { const g = 0.5 + 0.5 * Math.sin(state.t * 0.35); s.rotation.y = 0.5 + Math.sin(state.t * 0.1) * 0.3; s.rotation.x = lerp(1.15, 0.12, g); }
    const ref = player.plane || player;
    for (const I of ISLANDS) {
      const d = Math.hypot(ref.x - I.cx, ref.z - I.cz);
      if (!I.built && d < 5200 && state.kit) { if (!state.builtThisFrame) { buildIsland(I); state.builtThisFrame = true; } }
      if (I.g) I.g.visible = d < 16000;
    }
    state.builtThisFrame = false;
    for (const P of planes) {
      if (P.ctrl === 'player') {
        const I = P.hold ? { pitch: 0, roll: 0, yaw: 0, brake: true, hold: true } : inputs(P);
        let thr = P.thr; if (P.hold) thr = 0; else { if (I.up) thr += dt * P.T.thrRate; if (I.dn) thr -= dt * P.T.thrRate; } thr = clamp(thr, 0, 1);
        P.thr = thr;
        if (JOB.st === 'pushback' && JOB.P === P) { P.rpm += (0.18 - P.rpm) * Math.min(1, dt * 2); } else stepPlane(P, dt, I);
        if (state.flying === P) {
          updateHud(P, dt); player.x = P.x; player.z = P.z; player.vx = P.vx; player.vz = P.vz;
          _fwd.set(0, 0, 1).applyQuaternion(P.q); env.setCamYaw(Math.atan2(_fwd.x, _fwd.z) + Math.PI);
          const fa = clamp(440 + P.y * 38, 440, 9500);
          env.setFog(fa);
        }
      } else if (P.ctrl === 'wreck') {
        P.crashT += dt;
        if (P.crashT < 8 && Math.random() < dt * 14) env.emit(P.x + rnd(-1, 1), P.y + 1.2, P.z + rnd(-1, 1), rnd(-0.5, 0.5), rnd(1.5, 3), rnd(-0.5, 0.5), rnd(1, 1.8), 0.15, 0.15, 0.17);
        P.vx *= Math.exp(-3 * dt); P.vz *= Math.exp(-3 * dt); P.x += P.vx * dt; P.z += P.vz * dt;
        P.y = Math.max(0, P.y + P.vy * dt); P.vy -= 9.8 * dt; if (P.y <= 0) { P.y = 0; P.vy = 0; }
        sync(P);
      } else if (P.ctrl === 'parked' && P.left !== undefined && (Math.hypot(P.x - P.home.x, P.z - P.home.z) > 3)) {
        if (state.t - P.left > 100 && Math.hypot(P.x - player.x, P.z - player.z) > 450) { P.left = undefined; parkPlane(P); }
      }
      animate(P, dt);
    }
    updateJob(dt);
    if (state.flying && state.flying.ctrl === 'wreck' && state.respawnT !== undefined) { state.respawnT -= dt; if (state.respawnT <= 0) { state.respawnT = undefined; respawnAfterCrash(); } }
    audioUpdate(state.flying);
    const rp = player;
    if (!state.greeted && Math.hypot(rp.x - 1330, rp.z + 300) < 220 && !player.car) { state.greeted = true; env.toast('Harborview International', 'Hop in an airliner at the gates to start flying passengers', 'var(--cyan)'); }
  }

  function drawMap(g, X, Z, k, big) {
    const R2 = (x0, z0, x1, z1, col) => { g.fillStyle = col; g.fillRect(X(x0), Z(z0), (x1 - x0) * k, (z1 - z0) * k); };
    R2(AP.x0, AP.z0, AP.x1, AP.z1, '#3a6a3f'); R2(AP.x1 - 6, AP.z0, AP.x1 + 26, AP.z1, '#c9b98a');
    R2(RW.x0, RW.z - RW.w / 2, RW.x1, RW.z + RW.w / 2, '#2b2d32');
    g.fillStyle = '#e8e8e2'; for (let x = RW.x0 + 60; x < RW.x1 - 60; x += 50) g.fillRect(X(x), Z(RW.z) - 1, 30 * k, 2);
    R2(TWY.x0, TWY.z - 10, TWY.x1, TWY.z + 10, '#4a4c52');
    for (const lx of TWY.links) R2(lx - 10, RW.z + RW.w / 2, lx + 10, TWY.z - 10, '#4a4c52');
    R2(APRON.x0, APRON.z0, APRON.x1, APRON.z1, '#7a7b80'); R2(GA.x0, GA.z0, GA.x1, GA.z1 + 18, '#7a7b80');
    R2(TERM.x0, -330, TERM.x1, -290, '#c9ccd2');
    GA.hx.forEach(x => R2(x - 19, GA.hz - 17, x + 19, GA.hz + 17, '#a9adb4'));
    R2(1150, -228, 1340, -92, '#3a3c42'); R2(1350, -228, 1540, -92, '#3a3c42');
    g.strokeStyle = '#4a4c52'; g.lineWidth = Math.max(2, 12 * k);
    for (const [a, b] of [[[862, -312], [1090, -312]], [[1090, -312], [1090, -250]], [[1090, -250], [1580, -250]]]) { g.beginPath(); g.moveTo(X(a[0]), Z(a[1])); g.lineTo(X(b[0]), Z(b[1])); g.stroke(); }
    R2(TOWER.x - 5, TOWER.z - 5, TOWER.x + 5, TOWER.z + 5, '#e8e8e2');
    if (big) { g.fillStyle = '#d8f0d0'; g.font = '800 15px sans-serif'; g.fillText('HARBORVIEW AIRPORT', X(1160), Z(-596)); g.fillStyle = '#ffe9a8'; g.font = '700 12px sans-serif'; g.fillText('RWY 09 / 27', X(1560), Z(-556)); }
  }
  function drawBlips(g, X, Z, k) {
    g.fillStyle = '#7ae0ff'; g.strokeStyle = '#0a0e18'; g.lineWidth = 2;
    for (const P of planes) { g.beginPath(); g.arc(X(P.x), Z(P.z), 4, 0, TAU); g.stroke(); g.fill(); }
    const F = JOB.to && JOB.st !== 'none' ? FIELDS[JOB.to] : null, P = player.plane;
    if (F && P) {
      g.strokeStyle = '#ffd25a'; g.lineWidth = 3; g.setLineDash([10, 7]); g.beginPath(); g.moveTo(X(P.x), Z(P.z)); g.lineTo(X(F.x), Z(F.z)); g.stroke(); g.setLineDash([]);
      const ang = Math.atan2(F.z - P.z, F.x - P.x), ex = X(P.x) + Math.cos(ang) * 120, ey = Z(P.z) + Math.sin(ang) * 120;
      g.fillStyle = '#ffd25a'; g.beginPath(); g.moveTo(ex + Math.cos(ang) * 14, ey + Math.sin(ang) * 14); g.lineTo(ex + Math.cos(ang + 2.5) * 12, ey + Math.sin(ang + 2.5) * 12); g.lineTo(ex + Math.cos(ang - 2.5) * 12, ey + Math.sin(ang - 2.5) * 12); g.closePath(); g.fill();
      g.font = '800 14px sans-serif'; g.fillStyle = '#ffe9a8'; g.fillText(F.name.toUpperCase() + '  ' + (distTo(P, F) / 1000).toFixed(1) + ' km', ex + 14, ey - 12);
    }
  }
  function drawRoute(mc, th, s, hw, rp) {
    if (JOB.st === 'none' || !JOB.to) return;
    const F = FIELDS[JOB.to], rx = F.x - rp.x, rz = F.z - rp.z, c = Math.cos(th), sn = Math.sin(th);
    const sx = (rx * c + rz * sn) * s, sy = (-rx * sn + rz * c) * s, d = Math.hypot(sx, sy), lim = hw - 14, k = d > lim ? lim / d : 1;
    mc.save(); mc.strokeStyle = '#0a0e18'; mc.lineWidth = 6; mc.setLineDash([]); mc.beginPath(); mc.moveTo(hw, hw); mc.lineTo(hw + sx * k, hw + sy * k); mc.stroke();
    mc.strokeStyle = '#ffd25a'; mc.lineWidth = 3; mc.setLineDash([9, 6]); mc.lineDashOffset = -(state.t * 24 % 15); mc.beginPath(); mc.moveTo(hw, hw); mc.lineTo(hw + sx * k, hw + sy * k); mc.stroke(); mc.setLineDash([]);
    const ang = Math.atan2(sy, sx), ex = hw + sx * k, ey = hw + sy * k;
    mc.fillStyle = '#ffd25a'; mc.strokeStyle = '#0a0e18'; mc.lineWidth = 2; mc.beginPath(); mc.moveTo(ex + Math.cos(ang) * 9, ey + Math.sin(ang) * 9); mc.lineTo(ex + Math.cos(ang + 2.5) * 9, ey + Math.sin(ang + 2.5) * 9); mc.lineTo(ex + Math.cos(ang - 2.5) * 9, ey + Math.sin(ang - 2.5) * 9); mc.closePath(); mc.stroke(); mc.fill();
    mc.font = '800 11px sans-serif'; mc.textAlign = 'center'; mc.fillStyle = '#ffffff'; mc.strokeStyle = '#0a0e18'; mc.lineWidth = 3; const lab = F.code + ' ' + (Math.hypot(rx, rz) / 1000).toFixed(1) + ' km'; mc.strokeText(lab, hw, hw + hw - 18); mc.fillText(lab, hw, hw + hw - 18);
    mc.restore();
  }

  const loadP = NHM.load('aircraft').then(a => NHM.load('airport_kit').then(b => {
    if (!a || !b) return;
    state.root = [a, b]; a.traverse(o => { if (o.isMesh) KG[o.name] = o.geometry; });
    buildKit(b);
    const cols = [0xcc2b2b, 0x2a5aa8, 0xe0b020, 0x2a9a5a];
    GA.hx.forEach((hx, i) => { const P = makeCessna(cols[i], hx - 2, -418 + (i % 2) * 10, Math.PI); planes.push(P); parkPlane(P); });
    GATES.forEach((gx, i) => { const P = makeJet(i === 1 ? 'jet_red' : 'jet_blue', gx, i); planes.push(P); parkPlane(P); });
    state.kit = true;
  }));

  return {
    AP, RW, state, update, nearPlane, enter, exit, updateCam, drawMap, drawBlips, drawRoute, planes, ISLANDS, FIELDS, JOB, gh,
    get flying() { return state.flying; },
    cycleView() { state.view = (state.view + 1) % 3; env.toast(['Chase camera', 'Cockpit camera', 'Tail camera'][state.view], '', 'var(--cyan)'); },
    promptText() { const P = nearPlane(); return P ? '<b>F</b>' + (P.type === 'airliner' ? 'Fly this airliner and earn money' : 'Fly this Cessna') : ''; },
    zone(x, z) {
      if (x > AP.x0 + 20 && x < AP.x1 + 40 && z > AP.z0 - 20 && z < AP.z1) return 'Harborview Airport';
      for (const I of ISLANDS) if (Math.abs(x - I.cx) < I.rx * 1.2 && Math.abs(z - I.cz) < I.rz * 1.2) return I.name;
      return '';
    }
  };
};
