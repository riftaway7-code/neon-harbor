window.NH_ATMOS = function (env) {
  const THREE = env.THREE, scene = env.scene, camera = env.camera;

  const NOISE = `
    float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
    float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
  `;
  const SKYFN = `
    uniform vec3 uTop, uMid, uHor, uFog, uSunDir, uSunCol, uMoonDir;
    uniform float uTime, uCover, uRain, uNight, uSunH;
    vec3 skyBase(vec3 d, bool full) {
      float h = clamp(d.y, 0.0, 1.0);
      vec3 col = mix(uHor, uMid, smoothstep(0.0, 0.32, h));
      col = mix(col, uTop, smoothstep(0.2, 0.85, h));
      float sd = max(dot(d, uSunDir), 0.0);
      float day = clamp(uSunH * 3.0 + 0.35, 0.0, 1.0) * (1.0 - uRain * 0.85);
      col += uSunCol * (pow(sd, 6.0) * 0.07 + pow(sd, 40.0) * 0.14 + pow(sd, 700.0) * 0.8) * day;
      float low = pow(1.0 - h, 5.0);
      col += uSunCol * low * pow(sd, 3.0) * 0.35 * (1.0 - uRain);
      if (full) {
        float disc = smoothstep(0.99955, 0.99975, sd) * 4.0 * day;
        col += uSunCol * disc;
        float md = dot(d, uMoonDir);
        col += vec3(0.8, 0.86, 1.0) * (smoothstep(0.99965, 0.99985, md) * 1.6 + pow(max(md, 0.0), 120.0) * 0.12) * uNight * (1.0 - uRain);
        if (d.y > 0.0 && uNight > 0.01) {
          vec3 q = d * 160.0; vec3 id = floor(q); float rnd = fract(sin(dot(id, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
          vec3 fq = fract(q) - 0.5; float st = step(0.9965, rnd) * smoothstep(0.35, 0.0, length(fq));
          col += vec3(0.9, 0.93, 1.0) * st * (0.6 + 0.4 * sin(uTime * 3.0 + rnd * 90.0)) * uNight * smoothstep(0.0, 0.2, d.y) * (1.0 - uRain);
        }
      }
      return col;
    }
  `;

  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false,
    uniforms: {
      uTop: { value: new THREE.Color() }, uMid: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uFog: { value: new THREE.Color() },
      uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunCol: { value: new THREE.Color() }, uMoonDir: { value: new THREE.Vector3(0, -1, 0) },
      uTime: { value: 0 }, uCover: { value: 0.4 }, uRain: { value: 0 }, uNight: { value: 0 }, uSunH: { value: 1 }, uWind: { value: new THREE.Vector2(0.004, 0.0015) }
    },
    vertexShader: `varying vec3 vDir; void main() { vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
    fragmentShader: `
      varying vec3 vDir;
      uniform vec2 uWind;
      ${SKYFN}
      ${NOISE}
      void main() {
        vec3 d = normalize(vDir);
        vec3 col = skyBase(d, true);
        if (d.y > 0.008) {
          vec2 uv = d.xz / (d.y + 0.2) * 0.85 + uWind * uTime * 60.0;
          float n = fbm(uv);
          float cov = mix(0.64, 0.26, uCover);
          float dens = smoothstep(cov, cov + 0.2, n);
          if (dens > 0.004) {
          float n2 = fbm(uv + uSunDir.xz * 0.07);
          float lit = clamp(0.55 + (n - n2) * 4.0, 0.0, 1.0);
          float dayAmt = clamp(uSunH * 2.5 + 0.2, 0.0, 1.0);
          vec3 lightC = mix(uHor * 1.05 + uSunCol * 0.4, uSunCol * 0.7 + vec3(0.22), clamp(uSunH * 1.4, 0.0, 1.0));
          vec3 shadeC = uMid * 0.6 + vec3(0.05);
          vec3 cc = mix(shadeC, lightC, lit);
          cc = mix(cc, vec3(0.3, 0.32, 0.36) * (0.3 + 0.7 * dayAmt), uRain * 0.85);
          cc *= mix(1.0, 0.16 + 0.1 * dayAmt, uNight);
          cc += vec3(0.5, 0.55, 0.7) * uNight * 0.05 * max(dot(d, uMoonDir), 0.0);
          float fade = smoothstep(0.008, 0.22, d.y);
          col = mix(col, cc, dens * fade * (0.55 + 0.45 * (1.0 - uRain * 0.2)));
          }
        }
        float below = 1.0 - smoothstep(0.0, 0.1, d.y);
        col = mix(col, uFog, below);
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(820, 36, 18), skyMat);
  dome.frustumCulled = false; dome.renderOrder = 1000; scene.add(dome);

  const WAVES = `
    float wave(vec2 p, float t, out vec2 grad) {
      float h = 0.0; grad = vec2(0.0);
      vec2 D[6]; float K[6]; float A[6]; float S[6];
      D[0] = normalize(vec2(1.0, 0.35)); K[0] = 0.16; A[0] = 0.55; S[0] = 0.55;
      D[1] = normalize(vec2(-0.5, 1.0)); K[1] = 0.27; A[1] = 0.32; S[1] = 0.7;
      D[2] = normalize(vec2(0.8, -0.7)); K[2] = 0.55; A[2] = 0.16; S[2] = 0.9;
      D[3] = normalize(vec2(-1.0, -0.25)); K[3] = 1.1; A[3] = 0.07; S[3] = 1.3;
      D[4] = normalize(vec2(0.3, 1.0)); K[4] = 2.3; A[4] = 0.032; S[4] = 1.8;
      D[5] = normalize(vec2(-0.9, 0.6)); K[5] = 4.4; A[5] = 0.014; S[5] = 2.4;
      for (int i = 0; i < 6; i++) {
        float ph = dot(D[i], p) * K[i] + t * S[i];
        h += A[i] * sin(ph);
        grad += D[i] * A[i] * K[i] * cos(ph);
      }
      return h;
    }
  `;
  const waterMat = new THREE.ShaderMaterial({
    fog: false,
    uniforms: {
      uTop: { value: new THREE.Color() }, uMid: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uFog: { value: new THREE.Color() },
      uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunCol: { value: new THREE.Color() }, uMoonDir: { value: new THREE.Vector3(0, -1, 0) },
      uTime: { value: 0 }, uCover: { value: 0.4 }, uRain: { value: 0 }, uNight: { value: 0 }, uSunH: { value: 1 },
      uFogNear: { value: 70 }, uFogFar: { value: 440 }
    },
    vertexShader: `varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `
      varying vec3 vW;
      uniform float uFogNear, uFogFar;
      ${SKYFN}
      ${WAVES}
      void main() {
        vec3 V = normalize(cameraPosition - vW);
        float dist = length(cameraPosition - vW);
        vec2 g;
        float h = wave(vW.xz, uTime, g);
        float damp = 1.0 / (1.0 + dist * 0.012);
        vec3 n = normalize(vec3(-g.x * damp, 1.0, -g.y * damp));
        float fres = 0.02 + 0.98 * pow(1.0 - max(dot(n, V), 0.0), 5.0);
        vec3 R = reflect(-V, n);
        R.y = abs(R.y);
        vec3 refl = skyBase(normalize(R), false);
        float day = clamp(uSunH * 3.0 + 0.35, 0.0, 1.0);
        vec3 deep = mix(vec3(0.015, 0.075, 0.13), vec3(0.01, 0.025, 0.05), uNight) * (0.55 + 0.6 * day);
        vec3 shallow = mix(vec3(0.04, 0.2, 0.26), vec3(0.01, 0.04, 0.07), uNight) * (0.5 + 0.7 * day);
        vec3 body = mix(deep, shallow, smoothstep(-0.6, 0.8, h) * 0.6 + pow(1.0 - max(dot(n, V), 0.0), 2.0) * 0.4);
        vec3 col = mix(body, refl, fres);
        float sd = max(dot(R, uSunDir), 0.0);
        col += uSunCol * (pow(sd, 700.0) * 5.0 + pow(sd, 90.0) * 0.5) * day * (1.0 - uRain * 0.85);
        float md = max(dot(R, uMoonDir), 0.0);
        col += vec3(0.7, 0.8, 1.0) * pow(md, 500.0) * 2.0 * uNight;
        float crest = smoothstep(0.5, 0.95, h / 0.9 + (g.x * g.x + g.y * g.y) * 0.35);
        col = mix(col, vec3(0.85, 0.92, 0.96) * (0.35 + 0.65 * day), crest * 0.22 * damp);
        float f = clamp((dist - uFogNear) / (uFogFar - uFogNear), 0.0, 1.0);
        col = mix(col, uFog, f);
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });

  const sd = new THREE.Vector3(), md = new THREE.Vector3();
  function update(dt, ENV, CUR, rn, a) {
    const u = skyMat.uniforms, w = waterMat.uniforms;
    sd.set(-Math.cos(a), Math.sin(a), -0.45).normalize(); md.copy(sd).negate();
    const night = Math.min(1, Math.max(0, (ENV.lamp - 0.3) / 0.6));
    const fogc = scene.fog.color, cover = Math.min(1, 0.32 + rn * 0.7);
    for (const U of [u, w]) {
      U.uTop.value.copy(CUR.top); U.uMid.value.copy(CUR.mid); U.uHor.value.copy(CUR.hor); U.uFog.value.copy(fogc);
      U.uSunDir.value.copy(sd); U.uSunCol.value.copy(CUR.sc); U.uMoonDir.value.copy(md);
      U.uTime.value += dt; U.uCover.value = cover; U.uRain.value = rn; U.uNight.value = night; U.uSunH.value = sd.y;
    }
    w.uFogNear.value = scene.fog.near; w.uFogFar.value = scene.fog.far;
    dome.position.copy(camera.position);
  }
  return { update, water: waterMat, dome };
};
