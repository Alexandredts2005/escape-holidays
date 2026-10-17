// WebGL renderer with a cartoon post-process: ink outlines from depth (silhouettes + creases), warm grading, vignette.
import * as THREE from 'three';

const POST_VS = `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const POST_FS = `
precision highp float;
uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform vec2 res;
uniform mat4 projInv;
uniform float near;
uniform float far;
uniform float edge;
uniform float vignette;
uniform float flash;
uniform vec3 tint;
uniform float sat;
varying vec2 vUv;

vec3 viewPos(vec2 uv) {
  float d = texture2D(tDepth, uv).r;
  vec4 p = projInv * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);
  return p.xyz / p.w;
}

void main() {
  vec4 col = texture2D(tColor, vUv);
  vec2 px = 1.0 / res;
  float d0 = texture2D(tDepth, vUv).r;
  float ink = 0.0;
  if (edge > 0.0) {
    vec3 c = viewPos(vUv);
    vec3 l = viewPos(vUv - vec2(px.x, 0.0));
    vec3 r = viewPos(vUv + vec2(px.x, 0.0));
    vec3 u = viewPos(vUv + vec2(0.0, px.y));
    vec3 dn = viewPos(vUv - vec2(0.0, px.y));
    float z = -c.z;
    // silhouettes: relative depth jumps
    float jump = max(max(abs(l.z - c.z), abs(r.z - c.z)), max(abs(u.z - c.z), abs(dn.z - c.z))) / max(z, 0.001);
    float sil = smoothstep(0.035 + z * 0.0006, 0.07 + z * 0.0009, jump);
    // creases: direction change of the surface on each side of the pixel
    vec3 a1 = normalize(c - l), a2 = normalize(r - c);
    vec3 b1 = normalize(c - dn), b2 = normalize(u - c);
    float bend = max(1.0 - dot(a1, a2), 1.0 - dot(b1, b2));
    float crease = smoothstep(0.06, 0.16, bend);
    float fade = 1.0 - smoothstep(28.0, 70.0, z);
    ink = max(sil, crease * 0.85) * fade * edge;
    if (d0 >= 0.99999) ink = 0.0;
  }
  vec3 rgb = col.rgb;
  // warm cartoon grading
  float luma = dot(rgb, vec3(0.299, 0.587, 0.114));
  rgb = mix(vec3(luma), rgb, sat);
  rgb *= tint;
  rgb = mix(rgb, vec3(0.13, 0.09, 0.12), ink * 0.92);
  vec2 q = vUv - 0.5;
  rgb *= 1.0 - dot(q, q) * vignette;
  rgb = mix(rgb, vec3(1.0), flash);
  gl_FragColor = vec4(rgb, 1.0);
  #include <colorspace_fragment>
}`;

export class Renderer {
  constructor(container, quality = 'high') {
    this.r = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', stencil: false });
    this.r.outputColorSpace = THREE.SRGBColorSpace;
    this.r.toneMapping = THREE.NoToneMapping;
    this.r.shadowMap.enabled = true;
    this.r.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.r.domElement);
    this.quality = quality;
    this.post = new THREE.ShaderMaterial({
      vertexShader: POST_VS,
      fragmentShader: POST_FS,
      uniforms: {
        tColor: { value: null }, tDepth: { value: null }, res: { value: new THREE.Vector2(1, 1) }, projInv: { value: new THREE.Matrix4() },
        near: { value: 0.1 }, far: { value: 500 }, edge: { value: 1 }, vignette: { value: 0.75 }, flash: { value: 0 },
        tint: { value: new THREE.Vector3(1.03, 1.0, 0.96) }, sat: { value: 1.12 },
      },
      depthTest: false, depthWrite: false,
    });
    const tri = new THREE.BufferGeometry();
    tri.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    tri.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
    this.quad = new THREE.Mesh(tri, this.post);
    this.quad.frustumCulled = false;
    this.postScene = new THREE.Scene();
    this.postScene.add(this.quad);
    this.postCam = new THREE.OrthographicCamera();
    this.setQuality(quality);
    window.addEventListener('resize', () => this.resize());
  }

  setQuality(q) {
    this.quality = q;
    const dpr = Math.min(window.devicePixelRatio || 1, q === 'low' ? 0.75 : q === 'medium' ? 1 : 1.5);
    this.dpr = dpr;
    this.samples = q === 'low' ? 0 : 4;
    this.r.shadowMap.enabled = q !== 'low';
    this.resize();
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.r.setPixelRatio(this.dpr);
    this.r.setSize(w, h);
    const pw = Math.floor(w * this.dpr);
    const ph = Math.floor(h * this.dpr);
    if (this.rt) { this.rt.dispose(); this.rt.depthTexture.dispose(); }
    const depth = new THREE.DepthTexture(pw, ph);
    depth.type = THREE.UnsignedIntType;
    this.rt = new THREE.WebGLRenderTarget(pw, ph, { samples: this.samples, depthTexture: depth, type: THREE.UnsignedByteType });
    this.rt.texture.colorSpace = THREE.LinearSRGBColorSpace;
    this.post.uniforms.res.value.set(pw, ph);
    if (this.onResize) this.onResize(w, h);
  }

  render(scene, camera) {
    const u = this.post.uniforms;
    this.r.setRenderTarget(this.rt);
    this.r.render(scene, camera);
    this.r.setRenderTarget(null);
    u.tColor.value = this.rt.texture;
    u.tDepth.value = this.rt.depthTexture;
    u.projInv.value.copy(camera.projectionMatrixInverse);
    u.near.value = camera.near;
    u.far.value = camera.far;
    this.r.render(this.postScene, this.postCam);
  }
}
