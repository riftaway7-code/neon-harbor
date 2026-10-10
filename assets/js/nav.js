window.NH_NAV = function (env) {
  const TAU = Math.PI * 2;
  const nodes = [], adj = [], hash = new Map();
  const MERGE = 7.5, CELL = 16;
  const key = (i, j) => i + ',' + j;
  function node(x, z) {
    const ci = Math.floor(x / CELL), cj = Math.floor(z / CELL);
    for (let i = ci - 1; i <= ci + 1; i++) for (let j = cj - 1; j <= cj + 1; j++) {
      const b = hash.get(key(i, j)); if (!b) continue;
      for (const n of b) if (Math.hypot(nodes[n].x - x, nodes[n].z - z) < MERGE) return n;
    }
    const id = nodes.length; nodes.push({ x, z }); adj.push([]);
    const k = key(ci, cj); if (!hash.has(k)) hash.set(k, []); hash.get(k).push(id);
    return id;
  }
  function link(a, b) {
    if (a === b) return;
    const d = Math.hypot(nodes[a].x - nodes[b].x, nodes[a].z - nodes[b].z);
    if (!adj[a].some(e => e.to === b)) { adj[a].push({ to: b, d }); adj[b].push({ to: a, d }); }
  }
  function poly(pts, step) {
    let prev = -1;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (i > 0 && step) {
        const q = pts[i - 1], L = Math.hypot(p[0] - q[0], p[1] - q[1]), n = Math.max(1, Math.ceil(L / step));
        for (let k = 1; k < n; k++) { const id = node(q[0] + (p[0] - q[0]) * k / n, q[1] + (p[1] - q[1]) * k / n); if (prev >= 0) link(prev, id); prev = id; }
      }
      const id = node(p[0], p[1]); if (prev >= 0) link(prev, id); prev = id;
    }
  }

  const R = env.R, PITCH = env.PITCH;
  for (let i = -R; i <= R; i++) for (let j = -R; j <= R; j++) {
    const a = node(i * PITCH, j * PITCH);
    if (i < R) link(a, node((i + 1) * PITCH, j * PITCH));
    if (j < R) link(a, node(i * PITCH, (j + 1) * PITCH));
  }
  poly([[312, -312], [560, -312], [700, -312], [862, -312], [1090, -312], [1090, -250], [1190, -250], [1470, -250], [1580, -250]], 120);
  poly([[560, -312], [560, -502], [560, -612]], 120);
  poly([[700, -312], [700, -122]], 120);
  poly([[560, -502], [348, -502]], 120);
  poly([[1190, -250], [1190, -225]], 0); poly([[1470, -250], [1470, -225]], 0);
  poly([[312, 156], [318, 156]], 0);
  for (const r of env.SROADS) { const pts = []; for (let i = 0; i < r.rs.pts.length; i += 5) pts.push([r.rs.pts[i].x, r.rs.pts[i].z]); const l = r.rs.pts[r.rs.pts.length - 1]; pts.push([l.x, l.z]); poly(pts, 0); }
  const dx = env.SGDX, dz = env.SGDZ, nsx = env.SGNS.map(n => n.x + dx).sort((p, q) => p - q);
  for (const s of env.SGEW) poly([[s.x0 + dx, s.z + dz]].concat(nsx.map(x => [x, s.z + dz])).concat([[s.x1 + dx, s.z + dz]]), 0);
  for (const s of env.SGNS) {
    const x = s.x + dx, zs = env.SGEW.map(e => e.z + dz).filter(z => z >= s.z0 + dz - 1 && z <= s.z1 + dz + 1).sort((p, q) => p - q);
    const pts = [[x, s.z0 + dz]].concat(zs.map(z => [x, z])).concat([[x, s.z1 + dz]]); if (Math.abs(x) < 1) pts.unshift([0, 312]); poly(pts, 0);
  }

  function nearestNode(x, z) { let b = -1, bd = 1e12; for (let i = 0; i < nodes.length; i++) { const d = (nodes[i].x - x) ** 2 + (nodes[i].z - z) ** 2; if (d < bd) { bd = d; b = i; } } return b; }
  function nearestEdge(x, z) {
    let best = null, bd = 1e12;
    for (let a = 0; a < nodes.length; a++) for (const e of adj[a]) {
      if (e.to < a) continue;
      const A = nodes[a], B = nodes[e.to], ex = B.x - A.x, ez = B.z - A.z, L2 = ex * ex + ez * ez, t = Math.max(0, Math.min(1, ((x - A.x) * ex + (z - A.z) * ez) / L2)), px = A.x + ex * t, pz = A.z + ez * t, d = (x - px) ** 2 + (z - pz) ** 2;
      if (d < bd) { bd = d; best = { a, b: e.to, t, px, pz, d: Math.sqrt(d) }; }
    }
    return best;
  }
  function dijkstra(src, dst) {
    const n = nodes.length, dist = new Float64Array(n).fill(1e18), prev = new Int32Array(n).fill(-1), done = new Uint8Array(n);
    dist[src] = 0;
    for (let it = 0; it < n; it++) {
      let u = -1, bd = 1e18; for (let i = 0; i < n; i++) if (!done[i] && dist[i] < bd) { bd = dist[i]; u = i; }
      if (u < 0 || u === dst) break; done[u] = 1;
      for (const e of adj[u]) { const nd = dist[u] + e.d; if (nd < dist[e.to]) { dist[e.to] = nd; prev[e.to] = u; } }
    }
    if (dist[dst] >= 1e17) return null;
    const path = []; for (let v = dst; v >= 0; v = prev[v]) path.push(v); path.reverse();
    return { path, d: dist[dst] };
  }

  const NAV = { open: false, dest: null, route: null, pts: [], remain: 0, turn: '', t: 0, arrived: false, ver: 0 };
  const panel = document.createElement('div');
  panel.style.cssText = 'position:fixed;left:18px;top:70px;width:340px;max-height:calc(100vh - 300px);overflow:auto;display:none;padding:14px 14px 10px;background:rgba(10,14,24,.9);border:1px solid rgba(255,255,255,.16);border-radius:8px;color:#fff;font:600 14px/1.3 system-ui,sans-serif;z-index:6;box-shadow:0 10px 40px rgba(0,0,0,.6)';
  document.body.appendChild(panel);
  const css = document.createElement('style');
  css.textContent = '.navrow{display:flex;align-items:center;gap:10px;padding:8px 6px;border-bottom:1px solid rgba(255,255,255,.08)}.navrow b{flex:1;font-weight:700}.navrow small{opacity:.6;font-weight:600;min-width:54px;text-align:right}.navgo{background:#ffd25a;color:#10131c;border:0;border-radius:4px;padding:6px 12px;font:800 12px system-ui,sans-serif;letter-spacing:.06em;cursor:pointer}.navgo:hover{background:#fff}.navhead{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font:800 12px system-ui,sans-serif;letter-spacing:.16em;color:#ffd25a}.navx{background:none;border:1px solid rgba(255,255,255,.3);color:#fff;border-radius:4px;padding:3px 8px;font:700 11px system-ui,sans-serif;cursor:pointer}';
  document.head.appendChild(css);
  const banner = document.createElement('div');
  banner.style.cssText = 'position:fixed;left:12px;bottom:200px;display:none;max-width:200px;padding:6px 10px;background:rgba(10,14,24,.8);border:1px solid rgba(255,210,90,.5);border-radius:6px;color:#fff;font:700 13px/1.3 system-ui,sans-serif;z-index:3;pointer-events:none;text-shadow:0 1px 4px #000';
  document.body.appendChild(banner);

  function fmt(m) { return m >= 1000 ? (m / 1000).toFixed(1) + ' km' : Math.round(m / 10) * 10 + ' m'; }
  function render() {
    const rp = env.pos(), list = env.pois();
    let h = '<div class="navhead"><span>GPS  ·  WHERE TO?</span><button class="navx" id="navClose">CLOSE (M)</button></div>';
    if (NAV.dest) h += '<div class="navrow"><b style="color:#ffd25a">Route: ' + NAV.dest.name + '</b><button class="navx" id="navCancel">CANCEL</button></div>';
    list.forEach((p, i) => { const d = Math.hypot(p.x - rp.x, p.z - rp.z); h += '<div class="navrow"><b>' + p.name + '</b><small>' + fmt(d) + '</small><button class="navgo" data-i="' + i + '">GO</button></div>'; });
    panel.innerHTML = h;
    panel.querySelector('#navClose').onclick = () => NAV.setOpen(false);
    const c = panel.querySelector('#navCancel'); if (c) c.onclick = () => { NAV.clear(); render(); };
    panel.querySelectorAll('.navgo').forEach(b => { b.onclick = () => { NAV.go(list[+b.dataset.i]); NAV.setOpen(false); }; });
  }
  NAV.setOpen = function (v) {
    NAV.open = v; panel.style.display = v ? 'block' : 'none';
    if (v) { render(); if (document.pointerLockElement && document.exitPointerLock) document.exitPointerLock(); }
  };
  NAV.toggle = function () { NAV.setOpen(!NAV.open); };
  NAV.go = function (p) {
    NAV.dest = { name: p.name, x: p.x, z: p.z, node: nearestNode(p.x, p.z) }; NAV.arrived = false; NAV.t = 0; NAV.recompute();
    env.toast('Route set', p.name, 'var(--cyan)');
  };
  NAV.clear = function () { NAV.dest = null; NAV.route = null; NAV.pts = []; banner.style.display = 'none'; };
  NAV.recompute = function () {
    if (!NAV.dest) return;
    const car = env.car(), pos = car || env.pos();
    const hx = car ? Math.sin(car.h) : 0, hz = car ? Math.cos(car.h) : 0, cand = [], near = nearestNode(pos.x, pos.z), nn = nodes[near];
    if (Math.hypot(nn.x - pos.x, nn.z - pos.z) < 14) {
      if (near === NAV.dest.node) { cand.push({ id: near, cost: 0, r: { path: [near], d: 0 }, e: { px: nn.x, pz: nn.z } }); }
      for (const ed of adj[near]) {
        const n = nodes[ed.to], dxn = n.x - nn.x, dzn = n.z - nn.z, L = Math.hypot(dxn, dzn) || 1, dot = (dxn * hx + dzn * hz) / L, pen = car && dot < -0.35 ? 90 : 0;
        const r = ed.to === NAV.dest.node ? { path: [ed.to], d: 0 } : dijkstra(ed.to, NAV.dest.node);
        if (r) cand.push({ id: ed.to, cost: ed.d + r.d + pen, r: { path: [near].concat(r.path), d: r.d }, e: { px: pos.x, pz: pos.z } });
      }
    } else {
      const e = nearestEdge(pos.x, pos.z); if (!e) return;
      for (const id of [e.a, e.b]) {
        const n = nodes[id], ahead = (n.x - pos.x) * hx + (n.z - pos.z) * hz > 0 || !car, pen = ahead ? 0 : 70;
        const r = id === NAV.dest.node ? { path: [id], d: 0 } : dijkstra(id, NAV.dest.node);
        if (r) cand.push({ id, cost: Math.hypot(n.x - e.px, n.z - e.pz) + r.d + pen, r, e });
      }
    }
    if (!cand.length) return;
    cand.sort((a, b) => a.cost - b.cost);
    const best = cand[0], pts = [{ x: pos.x, z: pos.z }, { x: best.e.px, z: best.e.pz }];
    for (const id of best.r.path) pts.push({ x: nodes[id].x, z: nodes[id].z });
    pts.push({ x: NAV.dest.x, z: NAV.dest.z });
    NAV.pts = pts; NAV.remain = best.cost + Math.hypot(nodes[NAV.dest.node].x - NAV.dest.x, nodes[NAV.dest.node].z - NAV.dest.z);
    const nid = best.r.path;
    NAV.turn = turnText(car, pts);
  };
  function turnText(car, pts) {
    if (!car || pts.length < 4) return 'Continue';
    let acc = 0, prev = Math.atan2(pts[1].x - pts[0].x, pts[1].z - pts[0].z);
    for (let i = 1; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], seg = Math.hypot(a.x - pts[i - 1].x, a.z - pts[i - 1].z); acc += seg;
      if (Math.hypot(b.x - a.x, b.z - a.z) < 1) continue;
      const ang = Math.atan2(b.x - a.x, b.z - a.z); let d = ang - prev; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU;
      if (Math.abs(d) > 0.5) { if (acc < 18) { prev = ang; continue; } return (Math.abs(d) > 2.4 ? 'Make a U-turn' : d < 0 ? 'Turn left' : 'Turn right') + ' in ' + fmt(acc); }
      prev = ang;
    }
    return 'Straight ahead for ' + fmt(acc);
  }
  NAV.update = function (dt) {
    if (!NAV.dest) { banner.style.display = 'none'; return; }
    const car = env.car();
    if (!car) { banner.style.display = 'none'; return; }
    NAV.t -= dt;
    if (NAV.t <= 0) { NAV.t = 0.5; NAV.recompute(); }
    if (Math.hypot(car.x - NAV.dest.x, car.z - NAV.dest.z) < 22) { env.toast('You have arrived', NAV.dest.name, 'var(--good)'); NAV.clear(); return; }
    banner.style.display = 'block'; banner.innerHTML = '<span style="color:#ffd25a">' + NAV.dest.name + '</span><br>' + NAV.turn + '<br><span style="opacity:.7">' + fmt(NAV.remain) + ' to go</span>';
  };
  NAV.drawMini = function (mc, s) {
    if (!NAV.dest || NAV.pts.length < 2) return;
    mc.save(); mc.lineJoin = 'round'; mc.lineCap = 'round';
    mc.beginPath(); mc.moveTo(NAV.pts[0].x, NAV.pts[0].z); for (let i = 1; i < NAV.pts.length; i++) mc.lineTo(NAV.pts[i].x, NAV.pts[i].z);
    mc.strokeStyle = '#0a0e18'; mc.lineWidth = 9 / s; mc.stroke();
    mc.strokeStyle = '#27e4ff'; mc.lineWidth = 5.5 / s; mc.stroke();
    mc.fillStyle = '#ffd25a'; mc.strokeStyle = '#0a0e18'; mc.lineWidth = 3 / s; mc.beginPath(); mc.arc(NAV.dest.x, NAV.dest.z, 7 / s, 0, TAU); mc.stroke(); mc.fill();
    mc.restore();
  };
  NAV.drawBig = function (g, X, Z, k) {
    if (!NAV.dest || NAV.pts.length < 2) return;
    g.save(); g.lineJoin = 'round'; g.beginPath(); g.moveTo(X(NAV.pts[0].x), Z(NAV.pts[0].z)); for (let i = 1; i < NAV.pts.length; i++) g.lineTo(X(NAV.pts[i].x), Z(NAV.pts[i].z));
    g.strokeStyle = '#0a0e18'; g.lineWidth = 7; g.stroke(); g.strokeStyle = '#27e4ff'; g.lineWidth = 4; g.stroke();
    g.fillStyle = '#ffd25a'; g.strokeStyle = '#0a0e18'; g.lineWidth = 3; g.beginPath(); g.arc(X(NAV.dest.x), Z(NAV.dest.z), 8, 0, TAU); g.stroke(); g.fill();
    g.font = '800 13px sans-serif'; g.fillStyle = '#fff1c4'; g.fillText(NAV.dest.name, X(NAV.dest.x) + 12, Z(NAV.dest.z) + 4); g.restore();
  };
  NAV.nodeCount = () => nodes.length;
  return NAV;
};
