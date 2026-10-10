window.NH_REAL = (function () {
  const THREE = window.THREE;
  const U = new Float32Array(16);
  U[1] = 1;

  const NOISE = `
    float nhH(vec3 p) { p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419)); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
    float nhN(vec3 x) {
      vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(mix(nhH(i), nhH(i + vec3(1.0, 0.0, 0.0)), f.x), mix(nhH(i + vec3(0.0, 1.0, 0.0)), nhH(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
                 mix(mix(nhH(i + vec3(0.0, 0.0, 1.0)), nhH(i + vec3(1.0, 0.0, 1.0)), f.x), mix(nhH(i + vec3(0.0, 1.0, 1.0)), nhH(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);
    }`;

  const LITE = window.matchMedia && matchMedia('(pointer:coarse)').matches;

  const FRAG_PARS = `
    varying vec3 vNHW;
    varying vec3 vNHN;
    uniform float uNH[16];
    ${NOISE}`;

  const ALBEDO = `
    float nhPuddle = 0.0, nhUp = clamp(vNHN.y, 0.0, 1.0);
    #ifndef USE_SKINNING
    {
      vec3 wp = vNHW;
      float dist = length(cameraPosition - wp);
      float fine = clamp(1.0 - dist / 70.0, 0.0, 1.0);
      float lowf = nhN(wp * 0.045), mid = nhN(wp * 0.6), hi = nhN(wp * 5.0) * fine;
      diffuseColor.rgb *= 1.0 + uNH[1] * ((lowf - 0.5) * 0.24 + (mid - 0.5) * 0.15 + (hi - 0.5) * 0.12);
      float side = 1.0 - nhUp;
      float baseDirt = smoothstep(1.4, 0.0, wp.y) * side * (0.45 + 0.55 * nhN(wp * vec3(0.5, 0.25, 0.5)));
      diffuseColor.rgb *= 1.0 - uNH[1] * 0.42 * baseDirt;
      float streak = nhN(vec3((wp.x + wp.z) * 1.9, wp.y * 0.11, (wp.x - wp.z) * 0.35));
      diffuseColor.rgb *= 1.0 - uNH[1] * side * smoothstep(0.55, 0.92, streak) * 0.2 * smoothstep(1.0, 12.0, wp.y);
      nhPuddle = smoothstep(0.46, 0.56, nhN(vec3(wp.x * 0.33, 0.0, wp.z * 0.33))) * smoothstep(0.8, 0.96, nhUp) * smoothstep(1.2, 0.2, wp.y);
      diffuseColor.rgb *= 1.0 - uNH[0] * (0.1 + 0.12 * nhPuddle) * (0.35 + 0.65 * nhUp);
    }
    #endif`;

  const ALBEDO_LITE = `
    float nhPuddle = 0.0, nhUp = clamp(vNHN.y, 0.0, 1.0);
    #ifndef USE_SKINNING
    {
      vec3 wp = vNHW;
      float side = 1.0 - nhUp;
      diffuseColor.rgb *= 1.0 - uNH[1] * 0.3 * smoothstep(1.4, 0.0, wp.y) * side;
      diffuseColor.rgb *= 1.0 - uNH[0] * 0.12 * (0.35 + 0.65 * nhUp);
    }
    #endif`;

  const SHEEN = `
    #if defined( NH_GLOSS ) || defined( NH_GLASS )
    {
      vec3 V = normalize(cameraPosition - vNHW);
      vec3 N = normalize(vNHN);
      float fres = 0.05 + 0.95 * pow(1.0 - clamp(dot(V, N), 0.0, 1.0), 4.0);
      vec3 R = reflect(-V, N);
      vec3 hor = vec3(uNH[2], uNH[3], uNH[4]), zen = vec3(uNH[5], uNH[6], uNH[7]);
      vec3 sky = R.y > 0.0 ? mix(hor, zen, clamp(R.y * 1.4, 0.0, 1.0)) : hor * 0.32;
      #ifdef NH_GLASS
      float gk = specularStrength * 0.65;
      #else
      float gk = 0.78 + uNH[0] * 0.2;
      #endif
      outgoingLight += sky * fres * gk;
    }
    #endif
    {
      float wet = uNH[0];
      if (wet > 0.01 && nhUp > 0.35) {
        vec3 wp = vNHW;
        vec3 V = normalize(cameraPosition - wp);
        vec3 N = normalize(mix(vNHN, vec3(0.0, 1.0, 0.0), nhPuddle * 0.85));
        float ndv = clamp(dot(V, N), 0.0, 1.0);
        float fres = 0.05 + 0.95 * pow(1.0 - ndv, 4.0);
        vec3 R = reflect(-V, N);
        vec3 sky = mix(vec3(uNH[2], uNH[3], uNH[4]), vec3(uNH[5], uNH[6], uNH[7]), clamp(R.y * 1.6, 0.0, 1.0));
        float k = wet * smoothstep(0.35, 0.8, nhUp) * mix(0.14, 1.0, nhPuddle);
        outgoingLight += sky * fres * k * 0.62;
        vec3 H = normalize(V + vec3(uNH[8], uNH[9], uNH[10]));
        float sp = pow(max(dot(N, H), 0.0), mix(70.0, 700.0, nhPuddle));
        outgoingLight += vec3(uNH[11], uNH[12], uNH[13]) * sp * k * 1.3;
      }
    }`;

  function patch(lib) {
    lib.uniforms.uNH = { value: U };
    lib.vertexShader = lib.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vNHW;\nvarying vec3 vNHN;')
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
        {
          vec4 nhw = vec4(transformed, 1.0);
          #ifdef USE_INSTANCING
          nhw = instanceMatrix * nhw;
          #endif
          vNHW = (modelMatrix * nhw).xyz;
          vNHN = normalize((vec4(transformedNormal, 0.0) * viewMatrix).xyz);
        }`);
    lib.fragmentShader = lib.fragmentShader
      .replace('#include <common>', '#include <common>' + FRAG_PARS)
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + (LITE ? ALBEDO_LITE : ALBEDO))
      .replace('gl_FragColor = vec4( outgoingLight, diffuseColor.a );', SHEEN + '\n\tgl_FragColor = vec4( outgoingLight, diffuseColor.a );');
  }

  patch(THREE.ShaderLib.lambert);
  patch(THREE.ShaderLib.phong);

  const tmp = new THREE.Color();
  function update(o) {
    U[0] = o.wet; U[1] = o.grime;
    U[2] = o.hor.r; U[3] = o.hor.g; U[4] = o.hor.b;
    U[5] = o.zen.r; U[6] = o.zen.g; U[7] = o.zen.b;
    U[8] = o.sun.x; U[9] = o.sun.y; U[10] = o.sun.z;
    tmp.copy(o.sunCol);
    U[11] = tmp.r; U[12] = tmp.g; U[13] = tmp.b;
  }

  return { U, update };
})();
