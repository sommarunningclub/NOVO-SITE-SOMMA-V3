/**
 * O fogo da abertura em WebGL puro: dois canvas, cada um com um retângulo e um
 * shader, sem biblioteca.
 *
 *  - a arte: "SOMMA RUNNING CLUB" acende e fica em chamas
 *  - o papel: a hero inteira queima de baixo para cima conforme a rolagem
 *
 * Aqui só mora o desenho. Quem decide quando desenhar é o HeroFire.
 */

export type Rgb = [number, number, number];

/** Acima disso o ganho de nitidez da arte não se vê e o custo por quadro dobra. */
const ART_MAX_DPR = 2;
/** O papel cobre a hero inteira e a borda queimada é irregular: não precisa de mais. */
const PAPER_MAX_DPR = 1.5;

/** Quanto a frente de fogo sobe e desce em torno da média, em fração da hero. */
export const PAPER_AMP = 0.085;
/** Faixa de cinza que se desfaz atrás da frente. */
const PAPER_ASH = 0.03;
/** Até onde as fagulhas sobem acima da frente. */
const PAPER_SPARKS = 0.26;
/** Até onde a luz da brasa alcança no papel ainda inteiro. */
export const PAPER_GLOW = 0.06;

const VERTEX = /* glsl */ `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

// Simplex 2D — Ian McEwan / Ashima Arts (MIT)
const NOISE = /* glsl */ `
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}`;

const ART_FRAGMENT = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform float uTime;
uniform float uIgnite;
uniform vec2 uPaper; // x: altura da frente do papel, na medida da arte; y: calor (0 = papel inteiro)
uniform vec3 uColor;
${NOISE}

void main() {
  vec2 uv = vUv;
  float y = uv.y; // 0 na base, 1 no topo

  // três oitavas de ruído subindo, como ar quente
  float n1 = snoise(vec2(uv.x * 2.6, uv.y * 2.6 - uTime * 0.5));
  float n2 = snoise(vec2(uv.x * 6.5 + 7.3, uv.y * 6.5 - uTime * 1.1));
  float n3 = snoise(vec2(uv.x * 14.0 - 3.1, uv.y * 14.0 - uTime * 2.0));

  // A versão borrada da forma (nível alto do mipmap) mede a espessura local:
  // traço fino dá valor baixo, letra cheia dá valor alto. Fino treme, cheio fica.
  float body = texture2D(uTex, uv, 4.5).a;
  float thin = 1.0 - smoothstep(0.28, 0.7, body);
  float heat = min(uIgnite * 1.6, 1.0);
  // o papel queimando por baixo: perto da frente de fogo as chamas da arte se agitam
  float near = uPaper.y * (1.0 - smoothstep(0.0, 0.3, y - uPaper.x));
  float amp = heat * mix(0.3, 1.5, thin) * mix(0.55, 1.0, y) * (1.0 + near * 0.9);
  vec2 d = vec2(n1 * 0.0048 + n2 * 0.0030 + n3 * 0.0012, n1 * 0.0026 + n2 * 0.0042) * amp;
  float a = texture2D(uTex, uv + d).a;

  // ignição: a frente de fogo sobe com a borda irregular
  float front = mix(-0.3, 1.3, uIgnite);
  float edge = y + n1 * 0.10 + n2 * 0.05;
  float lit = 1.0 - smoothstep(front - 0.015, front + 0.015, edge);
  // faixa logo atrás da frente: incandescente, esfria para o laranja
  float ember = smoothstep(front - 0.18, front, edge) * lit * (1.0 - uIgnite * uIgnite);

  vec3 color = mix(uColor, vec3(1.0), ember * 0.9);
  float alpha = a * lit;
  gl_FragColor = vec4(color * alpha, alpha);
}`;

const PAPER_FRAGMENT = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uFront;  // altura da frente de fogo (0 = base da hero, 1 = topo)
uniform float uCover;  // até onde a seção de baixo já subiu
uniform float uHeat;   // 0 a 1: brasa com a rolagem parada, chama com ela andando
uniform float uAspect; // largura / altura
uniform float uPx;     // um pixel, em fração da altura
uniform vec3 uFire;
uniform vec3 uInk;
uniform vec3 uUnder;
${NOISE}

const float AMP = ${PAPER_AMP.toFixed(3)};
const float ASH = ${PAPER_ASH.toFixed(3)};
const float SPARKS = ${PAPER_SPARKS.toFixed(3)};
const float GLOW = ${PAPER_GLOW.toFixed(3)};

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

vec4 over(vec4 base, vec3 color, float alpha) {
  return vec4(base.rgb * (1.0 - alpha) + color * alpha, base.a * (1.0 - alpha) + alpha);
}

// Relevo do papel. É parado de propósito: papel que queimou não volta. O termo em módulo dá a forma de papel queimado: o fogo avança em arcos e o
// papel sobra em pontas.
float relief(vec2 q) {
  return 0.4 * snoise(q * 1.5) + 0.38 * (1.0 - 2.0 * abs(snoise(q * 2.9 + 5.2))) + 0.15 * snoise(q * 8.7 - 2.6) + 0.07 * snoise(q * 21.0 + 9.1);
}

float sparks(vec2 q, float scale, float speed, float seed, float density) {
  vec2 g = q * scale;
  // cada coluna sobe no seu passo, para não parecer uma estampa deslizando
  g.y -= uTime * scale * speed * (0.7 + 0.6 * hash(vec2(floor(g.x), seed)));
  vec2 id = floor(g);
  float r = hash(id + seed);
  vec2 o = vec2(hash(id + seed + 3.1), hash(id + seed + 8.7)) - 0.5;
  o.x = o.x * 0.5 + 0.14 * sin(uTime * 2.3 + r * 40.0);
  float dist = length(fract(g) - 0.5 - vec2(o.x, o.y * 0.6));
  float size = mix(0.06, 0.14, hash(id + seed + 1.7));
  float blink = 0.55 + 0.45 * sin(uTime * (5.0 + 9.0 * r) + r * 60.0);
  return step(1.0 - density, r) * (1.0 - smoothstep(0.0, size, dist)) * blink;
}

// Fagulhas: saem da frente, sobem e somem. A cor volta já multiplicada pelo alfa.
vec4 flying(vec2 q, float e) {
  float band = smoothstep(0.004, 0.03, e) * (1.0 - smoothstep(0.05, SPARKS, e));
  float fly = sparks(q, 24.0, 0.22, 0.0, mix(0.04, 0.2, uHeat)) + sparks(q, 41.0, 0.32, 17.0, mix(0.03, 0.16, uHeat));
  float a = min(fly, 1.0) * band * (0.35 + 0.65 * uHeat);
  return vec4(mix(uFire, vec3(1.0), 0.45) * a, a);
}

// O papel ainda inteiro, perto da frente: vira carvão, brilha e solta fagulha.
vec4 paperSide(vec2 q, float e, float glowing) {
  vec4 c = vec4(0.0);
  // carvão: uma faixa de limite nítido e irregular junto da borda (com degradê
  // suave a arte parece desfocada), e um escurecido leve logo acima dela
  float charred = 0.028 + 0.014 * snoise(q * 11.0 + 1.7);
  c = over(c, uInk * 0.5, max(1.0 - smoothstep(charred - 0.006, charred + 0.006, e), 0.3 * (1.0 - smoothstep(charred, charred + 0.05, e))) * 0.96);
  // brasa: forte e curta na borda, mais um halo que zera em 2 × GLOW
  float halo = 1.0 - smoothstep(0.0, 2.0 * GLOW, e);
  c = over(c, uFire, min((exp(-max(e, 0.0) / 0.012) * 0.92 + halo * halo * 0.16) * glowing, 1.0));
  vec4 f = flying(q, e);
  return vec4(c.rgb * (1.0 - f.a) + f.rgb, c.a * (1.0 - f.a) + f.a);
}

// O que já queimou: aparece o que está embaixo, com a cinza se desfazendo atrás da borda.
vec4 goneSide(vec2 q, float e, float glowing, out float ash) {
  float k = clamp(-e / ASH, 0.0, 1.0);
  float fleck = 0.5 + 0.5 * (0.7 * snoise(q * 55.0) + 0.3 * snoise(q * 130.0 + 3.0));
  // a cinza some antes de encostar na seção que sobe, para a emenda não aparecer
  ash = smoothstep(k * 1.1 - 0.1, k * 1.1 + 0.1, fleck) * (1.0 - k * k) * smoothstep(uCover, uCover + 0.02, q.y);
  return over(vec4(uUnder, 1.0), mix(uInk, uFire, exp(min(e, 0.0) / 0.009) * glowing * 0.9), ash);
}

void main() {
  float y = vUv.y;
  float d = y - uFront;
  // longe da frente não há conta a fazer: papel inteiro acima, nada abaixo
  if (d > AMP + SPARKS) { gl_FragColor = vec4(0.0); return; }
  if (d < -(AMP + ASH) || y < uCover) { gl_FragColor = vec4(uUnder, 1.0); return; }

  vec2 q = vec2(vUv.x * uAspect, y);
  // junto da base a frente é quase reta (o papel pega fogo pela borda); subindo, fica irregular
  float e = d + AMP * (1.0 - exp(-y / 0.1)) * relief(q);
  // acima do alcance da brasa o papel está inteiro: só passam as fagulhas
  if (e > 2.0 * GLOW) { gl_FragColor = flying(q, e); return; }

  float flick = 0.8 + 0.2 * snoise(vec2(q.x * 7.0, uTime * 2.6));
  float hot = smoothstep(-0.3, 0.5, snoise(vec2(q.x * 2.3 + 4.0, q.y * 2.3 - uTime * 0.35)));
  float glowing = uHeat * flick;

  float ash = 1.0;
  vec4 color;
  if (e >= uPx) color = paperSide(q, e, glowing);
  else if (e <= -uPx) color = goneSide(q, e, glowing, ash);
  else color = mix(goneSide(q, e, glowing, ash), paperSide(q, e, glowing), smoothstep(-uPx, uPx, e));

  // a linha incandescente, bem na borda: branca nos trechos mais quentes
  float core = (1.0 - smoothstep(0.0, 0.0045, abs(e))) * (0.3 + 0.7 * hot) * mix(0.45, 1.0, uHeat);
  gl_FragColor = over(color, mix(uFire, vec3(1.0), (0.3 + 0.7 * hot) * uHeat), core * (e > 0.0 ? 1.0 : ash));
}`;

/** "#ff4800" ou "rgb(255, 72, 0)" → [1, 0.28, 0]. */
export function cssColor(value: string, fallback: Rgb): Rgb {
  const hex = value.trim().match(/^#([0-9a-f]{6})$/i);
  if (hex) return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16) / 255) as Rgb;
  const rgb = value.match(/[\d.]+/g);
  if (rgb && rgb.length >= 3) return [Number(rgb[0]) / 255, Number(rgb[1]) / 255, Number(rgb[2]) / 255];
  return fallback;
}

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

type Scene = {
  gl: WebGLRenderingContext;
  uniform: (name: string) => WebGLUniformLocation | null;
  /** Ajusta o canvas ao tamanho na tela. Devolve `true` se mudou (e portanto apagou o desenho). */
  fit: () => boolean;
  dispose: () => void;
};

/** Um canvas, um shader e um retângulo cobrindo tudo. `null` se o WebGL não der. */
function scene(canvas: HTMLCanvasElement, fragment: string, maxDpr: number): Scene | null {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
  });
  if (!gl || gl.isContextLost()) return null;

  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const pixels = compile(gl, gl.FRAGMENT_SHADER, fragment);
  const program = gl.createProgram();
  if (!vertex || !pixels || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, pixels);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  return {
    gl,
    uniform: (name) => gl.getUniformLocation(program, name),
    fit: () => {
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width === width && canvas.height === height) return false;
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      return true;
    },
    // Sem `loseContext()`: no desenvolvimento o React monta o efeito duas vezes
    // no mesmo canvas, e um contexto perdido não volta.
    dispose: () => {
      gl.deleteShader(vertex);
      gl.deleteShader(pixels);
      gl.deleteProgram(program);
      gl.deleteBuffer(quad);
    },
  };
}

export type ArtLayer = {
  /** `paperFront` é a altura da frente do papel na medida da arte; `paperHeat`, o calor dela. */
  draw: (time: number, ignite: number, paperFront: number, paperHeat: number) => void;
  dispose: () => void;
};

/** A arte tribal. A textura é o próprio <img> já baixado: nenhum download a mais. */
export function createArt(canvas: HTMLCanvasElement, image: HTMLImageElement, color: Rgb): ArtLayer | null {
  const base = scene(canvas, ART_FRAGMENT, ART_MAX_DPR);
  if (!base) return null;
  const { gl } = base;

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  try {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  } catch {
    base.dispose();
    return null;
  }
  // os dois arquivos são potência de 2 (1024 e 2048), então o mipmap vale em WebGL 1
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const uTime = base.uniform("uTime");
  const uIgnite = base.uniform("uIgnite");
  const uPaper = base.uniform("uPaper");
  gl.uniform3fv(base.uniform("uColor"), color);
  gl.clearColor(0, 0, 0, 0);

  return {
    draw: (time, ignite, paperFront, paperHeat) => {
      base.fit();
      gl.uniform1f(uTime, time);
      gl.uniform1f(uIgnite, ignite);
      gl.uniform2f(uPaper, paperFront, paperHeat);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    dispose: () => {
      gl.deleteTexture(texture);
      base.dispose();
    },
  };
}

export type PaperLayer = {
  /** Ajusta o tamanho; `true` se o canvas foi apagado e precisa ser redesenhado. */
  fit: () => boolean;
  /** `front` e `cover` em fração da altura da hero, a partir da base. */
  draw: (time: number, front: number, cover: number, heat: number) => void;
  /** Papel inteiro: canvas transparente. */
  clear: () => void;
  /** Papel todo queimado: só o que está embaixo. */
  fill: () => void;
  dispose: () => void;
};

/** O papel que queima. `ink` é a cor do papel; `under`, a do que aparece quando ele some. */
export function createPaper(canvas: HTMLCanvasElement, colors: { fire: Rgb; ink: Rgb; under: Rgb }): PaperLayer | null {
  const base = scene(canvas, PAPER_FRAGMENT, PAPER_MAX_DPR);
  if (!base) return null;
  const { gl } = base;

  const uTime = base.uniform("uTime");
  const uFront = base.uniform("uFront");
  const uCover = base.uniform("uCover");
  const uHeat = base.uniform("uHeat");
  const uAspect = base.uniform("uAspect");
  const uPx = base.uniform("uPx");
  gl.uniform3fv(base.uniform("uFire"), colors.fire);
  gl.uniform3fv(base.uniform("uInk"), colors.ink);
  gl.uniform3fv(base.uniform("uUnder"), colors.under);

  const wipe = (r: number, g: number, b: number, a: number) => {
    base.fit();
    gl.clearColor(r, g, b, a);
    gl.clear(gl.COLOR_BUFFER_BIT);
  };

  return {
    fit: base.fit,
    draw: (time, front, cover, heat) => {
      wipe(0, 0, 0, 0);
      gl.uniform1f(uTime, time);
      gl.uniform1f(uFront, front);
      gl.uniform1f(uCover, cover);
      gl.uniform1f(uHeat, heat);
      gl.uniform1f(uAspect, canvas.width / canvas.height);
      gl.uniform1f(uPx, 1 / canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    clear: () => wipe(0, 0, 0, 0),
    fill: () => wipe(...colors.under, 1),
    dispose: base.dispose,
  };
}
