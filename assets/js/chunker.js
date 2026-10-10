window.NH_CHUNK = (function () {
  const THREE = window.THREE;
  function split(attrs, index, material, parent, cell) {
    cell = cell || 140;
    const pos = attrs.position.array, names = Object.keys(attrs);
    const cells = new Map();
    for (let t = 0; t < index.length; t += 3) {
      const a = index[t], b = index[t + 1], c = index[t + 2];
      const cx = (pos[a * 3] + pos[b * 3] + pos[c * 3]) / 3, cz = (pos[a * 3 + 2] + pos[b * 3 + 2] + pos[c * 3 + 2]) / 3;
      const k = Math.floor(cx / cell) + ',' + Math.floor(cz / cell);
      let e = cells.get(k);
      if (!e) { e = { map: new Map(), idx: [], src: [] }; cells.set(k, e); }
      for (let j = 0; j < 3; j++) {
        const v = index[t + j];
        let n = e.map.get(v);
        if (n === undefined) { n = e.src.length; e.src.push(v); e.map.set(v, n); }
        e.idx.push(n);
      }
    }
    const out = [];
    for (const e of cells.values()) {
      const g = new THREE.BufferGeometry();
      for (const nm of names) {
        const s = attrs[nm].size, src = attrs[nm].array, arr = new Float32Array(e.src.length * s);
        for (let i = 0; i < e.src.length; i++) for (let j = 0; j < s; j++) arr[i * s + j] = src[e.src[i] * s + j];
        g.setAttribute(nm, new THREE.BufferAttribute(arr, s));
      }
      g.setIndex(new THREE.BufferAttribute(e.src.length > 65535 ? new Uint32Array(e.idx) : new Uint16Array(e.idx), 1));
      g.computeBoundingSphere();
      const m = new THREE.Mesh(g, material);
      parent.add(m);
      out.push(m);
    }
    return out;
  }
  return { split };
})();
