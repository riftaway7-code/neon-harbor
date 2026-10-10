window.NH_HUMAN = function (env) {
  const THREE = env.THREE, NHM = env.NHM, hShade = env.hShade, hMix = env.hMix;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  const BONES = [
    ['hips', null, [0, 0.93, 0]], ['upper', 'hips', [0, 0.93, 0]], ['neck', 'upper', [0, 1.46, 0]], ['head', 'neck', [0, 1.585, 0.012]],
    ['armL', 'upper', [-0.188, 1.40, 0]], ['elbowL', 'armL', [-0.202, 1.13, 0]], ['handL', 'elbowL', [-0.248, 0.865, 0]],
    ['armR', 'upper', [0.188, 1.40, 0]], ['elbowR', 'armR', [0.202, 1.13, 0]], ['handR', 'elbowR', [0.248, 0.865, 0]],
    ['legL', 'hips', [-0.095, 0.93, 0]], ['kneeL', 'legL', [-0.095, 0.485, 0.01]], ['footL', 'kneeL', [-0.095, 0.10, 0]],
    ['legR', 'hips', [0.095, 0.93, 0]], ['kneeR', 'legR', [0.095, 0.485, 0.01]], ['footR', 'kneeR', [0.095, 0.10, 0]]
  ];
  const CANON = BONES.map(b => b[0]);
  const MAT = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, skinning: true });
  let T = null;

  function init(root) {
    if (!root) return false;
    const parts = {};
    root.traverse(o => { if (o.isSkinnedMesh) parts[o.name] = o; });
    if (!parts.body_m) return false;
    T = {};
    for (const name in parts) {
      const m = parts[name], g = m.geometry, names = m.skeleton.bones.map(b => b.name);
      T[name] = { g, map: names.map(n => CANON.indexOf(n)) };
    }
    return true;
  }

  function palette(stem, o, extra) {
    const skin = hMix(hShade(o.skin, 0.9), 0xb5603c, 0.14), hair = o.hair, shirt = o.shirt, pants = o.pants, shoes = o.shoes;
    switch (stem) {
      case 'body': return [skin, skin, skin];
      case 'head': return [skin, hMix(skin, 0x9a4f4a, 0.38), skin];
      case 'eyes': return [0xf3f0e8, o.eye || 0x2b1b12, 0x111111];
      case 'brows': return [hShade(hair, 0.62), hShade(hair, 0.62), hair];
      case 'jacket': case 'long': case 'tee': return [shirt, hShade(shirt, 0.78), shirt];
      case 'pants': return [pants, hShade(pants, 0.82), pants];
      case 'shorts': return [pants, hShade(pants, 0.82), pants];
      case 'skirt': return [extra || pants, hShade(extra || pants, 0.8), pants];
      case 'shoes': return [shoes, (shoes >> 16 & 255) > 190 ? 0xc9cad0 : 0xe9e6dc, hShade(shoes, 1.25)];
      case 'hair': return [hair, hShade(hair, 0.85), hair];
      case 'beard': return [o.beardColor || hair, o.beardColor || hair, hair];
      case 'cap': return [o.capColor || 0x20242c, o.capColor || 0x20242c, 0xffffff];
      case 'shades': return [0x0b0e12, 0x0b0e12, 0x0b0e12];
      default: return [0xffffff, 0xffffff, 0xffffff];
    }
  }

  function plan(o, full) {
    const F = !!o.female, sfx = F ? '_f' : '_m', outfit = o.outfit || (o.sleeves === false ? 'tee' : 'long');
    const list = [];
    const add = (name, stem, extra) => { if (T[name]) list.push({ name, stem, extra }); };
    const dress = outfit === 'dress', skirt = outfit === 'skirt', shorts = outfit === 'shorts';
    const top = (outfit === 'jacket' || outfit === 'hoodie') ? 'jacket' : (outfit === 'tee' || dress || skirt || shorts) ? 'tee' : 'long';
    const cover = { torso: true, armsLong: top === 'jacket' || top === 'long', armsShort: top === 'tee', legs: !(dress || skirt || shorts), legsShort: shorts, skirt: dress || skirt };
    add('body' + sfx, 'body');
    add('head', 'head');
    if (full !== false) { add('eyes', 'eyes'); add('brows', 'brows'); }
    add(top + sfx, top);
    if (dress && T.skirt_f) add('skirt_f', 'skirt', o.shirt);
    else if (skirt && T.skirt_f) add('skirt_f', 'skirt', o.pants);
    else if (shorts) add('shorts' + sfx, 'shorts');
    else add('pants' + sfx, 'pants');
    add('shoes' + sfx, 'shoes');
    const style = o.style || (F ? 'long' : 'crop');
    const hairMap = { crop: ['hair_crop'], sidepart: ['hair_crop'], buzz: ['hair_buzz'], bald: [], curly: ['hair_curly'], afro: ['hair_afro'], long: ['hair_long'], bob: ['hair_long'], ponytail: ['hair_long', 'bun'], bun: ['hair_bun', 'bun'] };
    for (const hn of (hairMap[style] || ['hair_crop'])) add(hn, 'hair');
    if (o.beard) add('beard', 'beard');
    if (o.cap) add('cap', 'cap');
    if (o.shades) add('shades', 'shades');
    return { list, cover };
  }

  function bodyCovered(cx, cy, cz, cv) {
    const ax = Math.abs(cx);
    if (cy < 0.125 && !(ax > 0.2 && cy > 0.7)) return true;
    if (ax > 0.172 && cy < 0.87) return false;
    if (cy > 1.5) return false;
    if (ax < 0.1 && cy > 1.43) return false;
    if (cy >= 0.9) {
      if (ax < 0.172) return cv.torso;
      if (cv.armsLong) return cy > 0.865;
      if (cv.armsShort) return cy > 1.14 ? true : false;
      return false;
    }
    if (cy >= 0.1 && cy < 0.985) {
      if (cv.legs) return !(ax > 0.2 && cy > 0.7);
      if (cv.legsShort) return cy > 0.58 && !(ax > 0.2 && cy > 0.7);
      if (cv.skirt) return cy > 0.56 && ax < 0.19 && cy > 0.9;
    }
    return false;
  }

  function merge(pl, o) {
    let nv = 0, ni = 0;
    for (const it of pl.list) { const g = T[it.name].g; nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
    const P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), C = new Float32Array(nv * 3), SI = new Uint16Array(nv * 4), SW = new Float32Array(nv * 4), I = new Uint32Array(ni);
    let vo = 0, io = 0;
    const col = new THREE.Color();
    for (const it of pl.list) {
      const t = T[it.name], g = t.g, pa = g.attributes.position, na = g.attributes.normal, ca = g.attributes.color, sa = g.attributes.skinIndex, wa = g.attributes.skinWeight, n = pa.count;
      const pal = palette(it.stem, o, it.extra).map(h => { col.setHex(h); return [col.r, col.g, col.b]; });
      const cs = ca ? ca.itemSize : 0;
      for (let i = 0; i < n; i++) {
        const k = vo + i;
        P[k * 3] = pa.array[i * 3]; P[k * 3 + 1] = pa.array[i * 3 + 1]; P[k * 3 + 2] = pa.array[i * 3 + 2];
        N[k * 3] = na.array[i * 3]; N[k * 3 + 1] = na.array[i * 3 + 1]; N[k * 3 + 2] = na.array[i * 3 + 2];
        const r = ca ? ca.array[i * cs] : 0, c = pal[r < 0.25 ? 0 : r < 0.75 ? 1 : 2], ao = ca && cs > 2 ? 0.45 + 0.55 * ca.array[i * cs + 1] : 1;
        C[k * 3] = c[0] * ao; C[k * 3 + 1] = c[1] * ao; C[k * 3 + 2] = c[2] * ao;
        for (let j = 0; j < 4; j++) { SI[k * 4 + j] = t.map[sa.array[i * 4 + j]] < 0 ? 0 : t.map[sa.array[i * 4 + j]]; SW[k * 4 + j] = wa.array[i * 4 + j]; }
      }
      const idx = g.index ? g.index.array : null, cnt = idx ? idx.length : n, body = it.stem === 'body';
      for (let f = 0; f < cnt; f += 3) {
        const a = idx ? idx[f] : f, b = idx ? idx[f + 1] : f + 1, c2 = idx ? idx[f + 2] : f + 2;
        if (body) {
          const cx = (P[(vo + a) * 3] + P[(vo + b) * 3] + P[(vo + c2) * 3]) / 3, cy = (P[(vo + a) * 3 + 1] + P[(vo + b) * 3 + 1] + P[(vo + c2) * 3 + 1]) / 3, cz = (P[(vo + a) * 3 + 2] + P[(vo + b) * 3 + 2] + P[(vo + c2) * 3 + 2]) / 3;
          if (bodyCovered(cx, cy, cz, pl.cover)) continue;
        }
        I[io++] = vo + a; I[io++] = vo + b; I[io++] = vo + c2;
      }
      vo += n;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(N, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(C, 3));
    geo.setAttribute('skinIndex', new THREE.BufferAttribute(SI, 4));
    geo.setAttribute('skinWeight', new THREE.BufferAttribute(SW, 4));
    geo.setIndex(new THREE.BufferAttribute(I.slice(0, io), 1));
    return geo;
  }

  function fill(rig, o, full) {
    const root = rig.root;
    while (root.children.length) root.remove(root.children[0]);
    const bones = {}, inv = [], arr = [];
    for (const [name, parent, h] of BONES) {
      const b = new THREE.Bone(); b.name = name;
      const ph = parent ? BONES.find(x => x[0] === parent)[2] : [0, 0, 0];
      b.position.set(h[0] - ph[0], h[1] - ph[1], h[2] - ph[2]);
      if (parent) bones[parent].add(b);
      bones[name] = b; arr.push(b);
      inv.push(new THREE.Matrix4().makeTranslation(-h[0], -h[1], -h[2]));
    }
    const pl = plan(o, full), geo = merge(pl, o);
    const mesh = new THREE.SkinnedMesh(geo, MAT);
    mesh.frustumCulled = false;
    mesh.add(bones.hips);
    mesh.bind(new THREE.Skeleton(arr, inv), new THREE.Matrix4());
    root.add(mesh);
    rig.body = mesh; rig.upper = bones.upper; rig.hips = bones.hips; rig.neck = bones.neck; rig.head = bones.head;
    for (const k of ['L', 'R']) {
      rig['arm' + k] = bones['arm' + k]; rig['elbow' + k] = bones['elbow' + k]; rig['hand' + k] = bones['hand' + k];
      rig['leg' + k] = bones['leg' + k]; rig['knee' + k] = bones['knee' + k]; rig['foot' + k] = bones['foot' + k];
    }
    if (o.backpack) {
      const bp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.14), new THREE.MeshLambertMaterial({ color: o.backpack }));
      bp.position.set(0, 1.27 - 0.93, -0.17); bones.upper.add(bp);
    }
    const bu = Math.min(1.3, Math.max(0.8, o.build || 1)), hf = Math.min(1.4, Math.max(0.8, o.heft || 1));
    root.scale.set(env.scale * (1 + (bu - 1) * 0.6) * (1 + (hf - 1) * 0.45), env.scale * (1 + (bu - 1) * 0.5), env.scale * (1 + (bu - 1) * 0.6) * (1 + (hf - 1) * 0.35));
    rig.hv = true; rig.vs = 0; rig.airK = 0;
    if (env.onRebuild) env.onRebuild(rig);
    return rig;
  }

  const KEYS = {
    hipA: [[0, 0], [1.0, 0.30], [1.7, 0.40], [3.5, 0.55], [5.2, 0.70], [7.5, 0.85], [9.5, 0.95]],
    kneeP: [[0, 0], [1.0, 0.70], [1.7, 0.95], [3.5, 1.15], [5.2, 1.35], [7.5, 1.50], [9.5, 1.65]],
    armA: [[0, 0], [1.0, 0.22], [1.7, 0.34], [3.5, 0.50], [5.2, 0.65], [7.5, 0.85], [9.5, 0.95]],
    elbow0: [[0, 0.12], [1.0, 0.18], [1.7, 0.22], [3.5, 0.8], [5.2, 1.15], [7.5, 1.35], [9.5, 1.45]],
    lean: [[0, 0], [1.0, 0.01], [1.7, 0.03], [3.5, 0.08], [5.2, 0.14], [7.5, 0.24], [9.5, 0.30]],
    bob: [[0, 0], [1.0, 0.012], [1.7, 0.02], [3.5, 0.035], [5.2, 0.045], [7.5, 0.055], [9.5, 0.06]],
    pYaw: [[0, 0], [1.0, 0.08], [1.7, 0.10], [3.5, 0.12], [5.2, 0.14], [7.5, 0.16], [9.5, 0.18]],
    sYaw: [[0, 0], [1.0, 0.10], [1.7, 0.14], [3.5, 0.18], [5.2, 0.22], [7.5, 0.26], [9.5, 0.28]],
    run: [[0, 0], [2.2, 0], [4.5, 1], [9.5, 1]]
  };
  const K = (key, v) => {
    const k = KEYS[key];
    if (v <= k[0][0]) return k[0][1];
    for (let i = 1; i < k.length; i++) if (v <= k[i][0]) { const t = (v - k[i - 1][0]) / (k[i][0] - k[i - 1][0]); return lerp(k[i - 1][1], k[i][1], t); }
    return k[k.length - 1][1];
  };
  const wrap = p => ((p % TAU) + TAU) % TAU;
  const bump = (p, c, w) => { let d = wrap(p) - c; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return Math.exp(-(d * d) / (w * w)); };

  function leg(p, g) {
    const sw = Math.max(0, Math.cos(p + 0.25));
    const knee = g.kneeP * Math.pow(sw, 1.25) + g.load * Math.max(0, Math.sin(2 * p - Math.PI));
    const thigh = -(g.hipA * Math.sin(p) + g.hipOff);
    const heel = bump(p, Math.PI / 2 - 0.05, 0.3), toe = bump(p, Math.PI * 1.5 - 0.35, 0.45);
    const ankle = -0.24 * heel + 0.55 * (1 - g.run * 0.3) * toe - Math.max(0, Math.cos(p)) * 0.15;
    const st = clamp(0.5 - Math.cos(p) * 1.5, 0, 1);
    return { thigh, knee, ankle, flat: lerp(0.4, 1, st) };
  }

  function pose(h, ph, amp, spd, ex) {
    const t = env.clock(), seed = h.seed || 0;
    const vIn = spd === undefined ? amp * 8 : spd;
    h.vs = h.vs === undefined ? vIn : h.vs + (vIn - h.vs) * 0.22;
    const vs = h.vs, w = sstep(0.18, 0.7, vs), run = K('run', vs);
    const g = { hipA: K('hipA', vs), kneeP: K('kneeP', vs), hipOff: 0.04 + K('lean', vs) * 0.25, load: 0.14 * (1 - run * 0.6), run };
    const lean = K('lean', vs), armA = K('armA', vs), el0 = K('elbow0', vs), bobA = K('bob', vs), pY = K('pYaw', vs), sY = K('sYaw', vs);
    const sn = Math.sin(ph), cs = Math.cos(ph);
    const L = leg(ph, g), Rr = leg(ph + Math.PI, g);
    const aL = armA * sn, aR = -armA * sn;
    const fwdL = Math.max(0, -aL / Math.max(armA, 1e-3)), fwdR = Math.max(0, -aR / Math.max(armA, 1e-3));
    const eL = -(el0 + 0.3 * (0.4 + run * 0.3) * fwdL), eR = -(el0 + 0.3 * (0.4 + run * 0.3) * fwdR);
    const br = Math.sin(t * 1.7 + seed), sway = Math.sin(t * 0.33 + seed * 1.7), look = Math.sin(t * 0.41 + seed) * Math.sin(t * 0.13 + seed * 2.3);
    const idle = {
      legL: -0.03, legR: -0.015, kneeL: 0.05, kneeR: 0.04, armL: 0.03 + 0.02 * br, armR: 0.03 - 0.02 * br, elbowL: -0.13, elbowR: -0.16,
      upX: 0.02 + 0.012 * br, hipsZ: 0.025 * sway, hipsY: 0.04 * look, upZ: -0.02 * sway, upY: -0.04 * look, headY: 0.35 * look, headX: -0.02 + 0.015 * Math.sin(t * 0.7 + seed), rootX: 0.01 * sway, rootY: 0
    };
    const gait = {
      legL: L.thigh, legR: Rr.thigh, kneeL: L.knee, kneeR: Rr.knee, armL: aL, armR: aR, elbowL: eL, elbowR: eR,
      upX: lean, hipsZ: 0.03 * (1 - run * 0.5) * sn, hipsY: pY * sn, upZ: -0.025 * sn, upY: -(pY + sY) * sn, headY: 0, headX: -lean * 0.85,
      rootX: 0.012 * (1 - run) * cs, rootY: bobA * lerp(1, -1, run) * (0.5 + 0.5 * Math.cos(2 * ph))
    };
    const m = (k) => lerp(idle[k], gait[k], w);
    let legLx = m('legL'), legRx = m('legR'), kneeLx = m('kneeL'), kneeRx = m('kneeR'), armLx = m('armL'), armRx = m('armR'), elbL = m('elbowL'), elbR = m('elbowR');
    let upX = m('upX'), hipsZ = m('hipsZ'), hipsY = m('hipsY'), upZ = m('upZ'), upY = m('upY'), headY = m('headY'), headX = m('headX'), rootX = m('rootX'), rootY = m('rootY');
    let ftL = lerp(-(legLx + kneeLx), -(legLx + kneeLx) * lerp(1, L.flat, w) + L.ankle * w, 1), ftR = lerp(-(legRx + kneeRx), -(legRx + kneeRx) * lerp(1, Rr.flat, w) + Rr.ankle * w, 1);
    let splay = 0.07 + 0.06 * run * w, zLeg = 0;
    h.airK = h.airK || 0;
    const air = ex && ex.air ? 1 : 0;
    h.airK += (air - h.airK) * 0.3;
    if (h.airK > 0.01) {
      const a = h.airK, up = ex && ex.vy > 0 ? 1 : 0;
      const tl = up ? -0.75 : -0.25, tr = up ? 0.35 : 0.1, kl = up ? 1.2 : 0.35, kr = up ? 0.7 : 0.25;
      legLx = lerp(legLx, tl, a); legRx = lerp(legRx, tr, a); kneeLx = lerp(kneeLx, kl, a); kneeRx = lerp(kneeRx, kr, a);
      ftL = lerp(ftL, 0.3, a); ftR = lerp(ftR, 0.5, a);
      armLx = lerp(armLx, up ? -1.5 : -0.6, a); armRx = lerp(armRx, up ? -1.35 : -0.5, a);
      elbL = lerp(elbL, -0.5, a); elbR = lerp(elbR, -0.45, a); splay = lerp(splay, up ? 0.45 : 0.85, a);
      upX = lerp(upX, up ? 0.05 : 0.0, a); rootY = lerp(rootY, 0, a); rootX = lerp(rootX, 0, a);
    }
    h.legL.rotation.set(legLx, 0, 0); h.legR.rotation.set(legRx, 0, 0);
    h.kneeL.rotation.set(kneeLx, 0, 0); h.kneeR.rotation.set(kneeRx, 0, 0);
    h.footL.rotation.set(ftL, 0, 0); h.footR.rotation.set(ftR, 0, 0);
    h.armL.rotation.set(armLx, 0, -splay); h.armR.rotation.set(armRx, 0, splay);
    h.elbowL.rotation.set(elbL, 0, 0); h.elbowR.rotation.set(elbR, 0, 0);
    h.hips.rotation.set(0, hipsY, hipsZ);
    h.upper.rotation.set(upX, upY, upZ);
    h.neck.rotation.set(-upX * 0.35, -upY * 0.4 + headY * 0.35, -upZ * 0.5);
    h.head.rotation.set(headX + upX * 0.0, headY * 0.65 - upY * 0.35, -upZ * 0.4);
    h.root.position.set(rootX, rootY, 0);
  }

  return { init, fill, pose, get ready() { return !!T; } };
};
