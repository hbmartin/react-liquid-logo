export const vertexShaderSource = /* glsl */ `#version 300 es
precision mediump float;

in vec2 a_position;
out vec2 vUv;

void main() {
    vUv = .5 * (a_position + 1.);
    gl_Position = vec4(a_position, 0.0, 1.0);
}`

export interface NoiseLayerConfig {
  frequency?: number
  timeFactor?: number
  weight?: number
}

export interface CausticConfig {
  freq1?: number
  freq2?: number
  time1?: [number, number]
  time2?: [number, number]
  bias?: number
  exponent?: number
  intensity?: number
}

export interface EdgeThresholdConfig {
  base?: number
  range?: number
  fadeLow?: number
  fadeHigh?: number
}

export interface ShimmerConfig {
  power?: number
  intensity?: number
}

export interface FilmicCoefficients {
  a: number
  b: number
  c: number
  d: number
  e: number
}

export interface LiquidShaderConfig {
  timeScale?: number
  noise?: {
    slow?: NoiseLayerConfig
    medium?: NoiseLayerConfig
    fast?: NoiseLayerConfig
  }
  caustics?: CausticConfig
  edge?: EdgeThresholdConfig
  shimmer?: ShimmerConfig
  filmic?: Partial<FilmicCoefficients>
}

type CompleteNoiseLayerConfig = Required<NoiseLayerConfig>

type CompleteShaderConfig = {
  timeScale: number
  noise: {
    slow: CompleteNoiseLayerConfig
    medium: CompleteNoiseLayerConfig
    fast: CompleteNoiseLayerConfig
  }
  caustics: Required<CausticConfig>
  edge: Required<EdgeThresholdConfig>
  shimmer: Required<ShimmerConfig>
  filmic: FilmicCoefficients
}

const defaultLiquidShaderConfig: CompleteShaderConfig = {
  timeScale: 0.0005,
  noise: {
    slow: { frequency: 1.2, timeFactor: 0.5, weight: 0.65 },
    medium: { frequency: 2.4, timeFactor: 0.9, weight: 0.28 },
    fast: { frequency: 6.0, timeFactor: 1.5, weight: 0.07 },
  },
  caustics: {
    freq1: 3.2,
    freq2: 5.0,
    time1: [0.9, 0.4],
    time2: [0.5, 0.8],
    bias: 0.35,
    exponent: 1.6,
    intensity: 0.12,
  },
  edge: {
    base: 0.9,
    range: 0.2,
    fadeLow: 0.07,
    fadeHigh: 0.02,
  },
  shimmer: {
    power: 4.0,
    intensity: 0.05,
  },
  filmic: {
    a: 2.51,
    b: 0.03,
    c: 2.43,
    d: 0.59,
    e: 0.14,
  },
}

const mergeNoiseLayer = (
  defaults: CompleteNoiseLayerConfig,
  override?: NoiseLayerConfig
): CompleteNoiseLayerConfig => ({
  frequency: override?.frequency ?? defaults.frequency,
  timeFactor: override?.timeFactor ?? defaults.timeFactor,
  weight: override?.weight ?? defaults.weight,
})

const mergeShaderConfig = (overrides: LiquidShaderConfig = {}): CompleteShaderConfig => ({
  timeScale: overrides.timeScale ?? defaultLiquidShaderConfig.timeScale,
  noise: {
    slow: mergeNoiseLayer(defaultLiquidShaderConfig.noise.slow, overrides.noise?.slow),
    medium: mergeNoiseLayer(defaultLiquidShaderConfig.noise.medium, overrides.noise?.medium),
    fast: mergeNoiseLayer(defaultLiquidShaderConfig.noise.fast, overrides.noise?.fast),
  },
  caustics: {
    freq1: overrides.caustics?.freq1 ?? defaultLiquidShaderConfig.caustics.freq1,
    freq2: overrides.caustics?.freq2 ?? defaultLiquidShaderConfig.caustics.freq2,
    time1: overrides.caustics?.time1 ?? defaultLiquidShaderConfig.caustics.time1,
    time2: overrides.caustics?.time2 ?? defaultLiquidShaderConfig.caustics.time2,
    bias: overrides.caustics?.bias ?? defaultLiquidShaderConfig.caustics.bias,
    exponent: overrides.caustics?.exponent ?? defaultLiquidShaderConfig.caustics.exponent,
    intensity: overrides.caustics?.intensity ?? defaultLiquidShaderConfig.caustics.intensity,
  },
  edge: {
    base: overrides.edge?.base ?? defaultLiquidShaderConfig.edge.base,
    range: overrides.edge?.range ?? defaultLiquidShaderConfig.edge.range,
    fadeLow: overrides.edge?.fadeLow ?? defaultLiquidShaderConfig.edge.fadeLow,
    fadeHigh: overrides.edge?.fadeHigh ?? defaultLiquidShaderConfig.edge.fadeHigh,
  },
  shimmer: {
    power: overrides.shimmer?.power ?? defaultLiquidShaderConfig.shimmer.power,
    intensity: overrides.shimmer?.intensity ?? defaultLiquidShaderConfig.shimmer.intensity,
  },
  filmic: {
    a: overrides.filmic?.a ?? defaultLiquidShaderConfig.filmic.a,
    b: overrides.filmic?.b ?? defaultLiquidShaderConfig.filmic.b,
    c: overrides.filmic?.c ?? defaultLiquidShaderConfig.filmic.c,
    d: overrides.filmic?.d ?? defaultLiquidShaderConfig.filmic.d,
    e: overrides.filmic?.e ?? defaultLiquidShaderConfig.filmic.e,
  },
})

const formatNumber = (value: number) => {
  const str = Number(value).toString()
  if (str.includes('.') || str.includes('e') || str.includes('E')) {
    return str
  }
  return `${str}.0`
}

const applyShaderPlaceholders = (template: string, replacements: Record<string, string>) => {
  let result = template
  for (const [token, value] of Object.entries(replacements)) {
    result = result.replaceAll(token, value)
  }
  return result
}

const liquidFragSourceTemplate = /* glsl */ `#version 300 es
precision mediump float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D u_image_texture;
uniform float u_time;
uniform float u_ratio;
uniform float u_img_ratio;
uniform float u_patternScale;
uniform float u_refraction;
uniform float u_edge;
uniform float u_patternBlur;
uniform float u_liquid;


#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846

const vec3 FILMIC_A = vec3(__FILMIC_A__);
const vec3 FILMIC_B = vec3(__FILMIC_B__);
const vec3 FILMIC_C = vec3(__FILMIC_C__);
const vec3 FILMIC_D = vec3(__FILMIC_D__);
const vec3 FILMIC_E = vec3(__FILMIC_E__);


vec3 mod289(vec3 x) { return x - floor(x * (1. / 289.)) * 289.; }
vec2 mod289(vec2 x) { return x - floor(x * (1. / 289.)) * 289.; }
vec3 permute(vec3 x) { return mod289(((x*34.)+1.)*x); }
float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1., 0.) : vec2(0., 1.);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0., i1.y, 1.)) + i.x + vec3(0., i1.x, 1.));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.);
    m = m*m;
    m = m*m;
    vec3 x = 2. * fract(p * C.www) - 1.;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130. * dot(m, g);
}

vec2 get_img_uv() {
    vec2 img_uv = vUv;
    img_uv -= .5;
    if (u_ratio > u_img_ratio) {
        img_uv.x = img_uv.x * u_ratio / u_img_ratio;
    } else {
        img_uv.y = img_uv.y * u_img_ratio / u_ratio;
    }
    float scale_factor = 1.;
    img_uv *= scale_factor;
    img_uv += .5;

    img_uv.y = 1. - img_uv.y;

    return img_uv;
}
vec2 rotate(vec2 uv, float th) {
    return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}
float get_color_channel(float c1, float c2, float stripe_p, vec3 w, float extra_blur, float b) {
    float ch = c2;
    float border = 0.;
    float blur = u_patternBlur + extra_blur;

    ch = mix(ch, c1, smoothstep(.0, blur, stripe_p));

    border = w[0];
    ch = mix(ch, c2, smoothstep(border - blur, border + blur, stripe_p));

    b = smoothstep(.2, .8, b);
    border = w[0] + .4 * (1. - b) * w[1];
    ch = mix(ch, c1, smoothstep(border - blur, border + blur, stripe_p));

    border = w[0] + .5 * (1. - b) * w[1];
    ch = mix(ch, c2, smoothstep(border - blur, border + blur, stripe_p));

    border = w[0] + w[1];
    ch = mix(ch, c1, smoothstep(border - blur, border + blur, stripe_p));

    float gradient_t = (stripe_p - w[0] - w[1]) / w[2];
    float gradient = mix(c1, c2, smoothstep(0., 1., gradient_t));
    ch = mix(ch, gradient, smoothstep(border - blur, border + blur, stripe_p));

    return ch;
}

float get_img_frame_alpha(vec2 uv, float img_frame_width) {
    float img_frame_alpha = smoothstep(0., img_frame_width, uv.x) * smoothstep(1., 1. - img_frame_width, uv.x);
    img_frame_alpha *= smoothstep(0., img_frame_width, uv.y) * smoothstep(1., 1. - img_frame_width, uv.y);
    return img_frame_alpha;
}

void main() {
    vec2 uv = vUv;
    uv.y = 1. - uv.y;
    uv.x *= u_ratio;

    float diagonal = uv.x - uv.y;

    float t = __TIME_SCALE__ * u_time;

    vec2 img_uv = get_img_uv();
    vec4 img = texture(u_image_texture, img_uv);

    vec3 color = vec3(0.);
    float opacity = 1.;

    // Rich gold palette with more contrast for depth
    vec3 goldSpecular = vec3(1.0, 0.95, 0.7);   // Hot specular highlight
    vec3 goldBright = vec3(1.0, 0.85, 0.4);     // Bright gold
    vec3 goldMid = vec3(0.85, 0.6, 0.15);       // Rich mid-tone
    vec3 goldDeep = vec3(0.45, 0.25, 0.05);     // Deep shadow (darker for contrast)
    
    float edge = img.r;

    vec2 transformedUv = uv;
    transformedUv -= .5;

    float dist = length(transformedUv + vec2(0., .2 * diagonal));

    transformedUv = rotate(transformedUv, (.25 - .2 * diagonal) * PI);

    float bulge = pow(1.8 * dist, 1.2);
    bulge = 1. - bulge;
    bulge *= pow(uv.y, .3);

    // === MULTI-FREQUENCY NOISE FOR SHIMMER & LIQUID MOTION ===
    // Slow, large-scale liquid flow
    float slowNoise = snoise(uv * __NOISE_FREQ_SLOW__ - t * __NOISE_TIME_SLOW__);
    // Medium organic movement  
    float medNoise = snoise(uv * __NOISE_FREQ_MED__ - t * __NOISE_TIME_MED__ + 10.0);
    // Fast micro-shimmer (the "sparkle")
    float fastNoise = snoise(uv * __NOISE_FREQ_FAST__ - t * __NOISE_TIME_FAST__ + 25.0);
    // Combined liquid noise
    float noise = slowNoise * __NOISE_WEIGHT_SLOW__ + medNoise * __NOISE_WEIGHT_MED__ + fastNoise * __NOISE_WEIGHT_FAST__;
    
    // Caustic-like bright ripples (simulates light refracting through liquid surface)
    float caustic1 = snoise(uv * __CAUSTIC_FREQ_1__ + vec2(t * __CAUSTIC_TIME_1_X__, t * __CAUSTIC_TIME_1_Y__));
    float caustic2 = snoise(uv * __CAUSTIC_FREQ_2__ - vec2(t * __CAUSTIC_TIME_2_X__, t * __CAUSTIC_TIME_2_Y__) + 50.0);
    float caustics = pow(max(0.0, caustic1 * caustic2 + __CAUSTIC_BIAS__), __CAUSTIC_EXPONENT__);

    float cycle_width = u_patternScale;
    float thin_strip_1_ratio = .12 / cycle_width * (1. - .4 * bulge);
    float thin_strip_2_ratio = .07 / cycle_width * (1. + .4 * bulge);
    float wide_strip_ratio = (1. - thin_strip_1_ratio - thin_strip_2_ratio);

    float thin_strip_1_width = cycle_width * thin_strip_1_ratio;
    float thin_strip_2_width = cycle_width * thin_strip_2_ratio;

    float edgeThreshold = __EDGE_BASE__ - __EDGE_RANGE__ * u_edge;
    opacity = 1. - smoothstep(edgeThreshold - __EDGE_FADE_LOW__, edgeThreshold + __EDGE_FADE_HIGH__, edge);
    opacity *= get_img_frame_alpha(img_uv, 0.01);

    // Liquid edge distortion - makes edges feel fluid
    float interiorMask = smoothstep(0.05, 0.4, 1. - edge);
    float liquidEdge = edge + interiorMask * u_liquid * noise * 0.8;
    liquidEdge = mix(liquidEdge, edge, smoothstep(0.85, 0.97, edge));

    float refr = 0.;
    refr += (1. - bulge);
    refr = clamp(refr, 0., 1.);

    float dir = transformedUv.x;

    dir += diagonal;

    // More organic liquid distortion
    float interiorLiquid = smoothstep(0.1, 0.6, 1. - liquidEdge);
    dir -= 1.6 * noise * diagonal * interiorLiquid;
    dir += slowNoise * 0.08 * u_liquid;  // Additional slow drift

    bulge *= clamp(pow(uv.y, .1), .3, 1.);
    dir *= (.15 + (1.05 - liquidEdge) * bulge);

    float crestMask = smoothstep(0.1, 0.6, bulge);

    dir *= smoothstep(1., .7, liquidEdge);

    dir += .18 * (smoothstep(.1, .2, uv.y) * smoothstep(.4, .2, uv.y));
    dir += .03 * (smoothstep(.1, .2, 1. - uv.y) * smoothstep(.4, .2, 1. - uv.y));

    dir *= (.5 + .5 * pow(uv.y, 2.));

    dir *= cycle_width;

    dir -= t;

    // Chromatic aberration with liquid warping
    float refr_r = refr;
    refr_r += 0.018 * bulge * noise;
    refr_r += medNoise * 0.01 * u_liquid;  // Extra liquid wobble
    float refr_b = 0.35 * refr;

    float bulgeGlow = smoothstep(.4, .6, bulge) * smoothstep(1., .4, bulge);
    refr_r += 1.8 * (smoothstep(-.1, .2, uv.y) * smoothstep(.5, .1, uv.y)) * bulgeGlow * crestMask;
    refr_r -= diagonal * 0.4;

    float bulgeShadow = smoothstep(.4, .6, bulge) * smoothstep(.8, .4, bulge);
    refr_b += 0.2 * (smoothstep(0., .4, uv.y) * smoothstep(.8, .1, uv.y)) * bulgeShadow * crestMask;
    refr_b -= 0.05 * liquidEdge;

    refr_r *= u_refraction;
    refr_b *= u_refraction;

    vec3 w = vec3(thin_strip_1_width, thin_strip_2_width, wide_strip_ratio);
    w[1] -= .02 * smoothstep(.0, 1., liquidEdge + bulge);
    
    float stripe_r = mod(dir + refr_r, 1.);
    float r = get_color_channel(goldBright.r, goldDeep.r, stripe_r, w, 0.02 + .03 * u_refraction * bulge, bulge);
    float stripe_g = mod(dir + refr_r * 0.6, 1.);
    float g = get_color_channel(goldBright.g, goldDeep.g, stripe_g, w, 0.012 / (1. - diagonal), bulge);
    float stripe_b = mod(dir - refr_b, 1.);
    float b = get_color_channel(goldBright.b, goldDeep.b, stripe_b, w, .008, bulge);

    color = vec3(r, g, b);
    
    // === DEPTH & SHIMMER ENHANCEMENTS ===
    float lum = dot(color, vec3(0.299, 0.587, 0.114));
    
    // Subtle hue shifts for cooler shadows / warmer highlights
    float shadowWeight = smoothstep(0.25, 0.65, 1. - lum);
    vec3 coolShadow = vec3(0.74, 0.6, 0.5);
    color = mix(color, color * coolShadow, shadowWeight * 0.15);
    float highlightWeight = smoothstep(0.55, 0.9, lum) * crestMask;
    vec3 warmHighlight = vec3(1.06, 0.98, 0.78);
    color = mix(color, color * warmHighlight, highlightWeight * 0.2);
    
    // Micro-shimmer: fast sparkle overlay based on luminance
    float shimmer = fastNoise * 0.5 + 0.5;
    shimmer = pow(shimmer, __SHIMMER_POWER__) * smoothstep(0.45, 0.8, lum) * crestMask;
    color += goldSpecular * shimmer * __SHIMMER_INTENSITY__;
    
    // Caustic light ripples - bright dancing highlights
    float causticIntensity = caustics * smoothstep(0.25, 0.55, bulge) * smoothstep(0.5, 0.85, lum) * crestMask;
    color += goldSpecular * causticIntensity * __CAUSTIC_INTENSITY__;
    
    // Pull toward gold spectrum to prevent color drift
    vec3 pureGold = mix(goldDeep, goldBright, lum);
    color = mix(color, pureGold, 0.2);
    
    // Fresnel-like edge brightening (liquid metal reflects more at glancing angles)
    float fresnelEdge = smoothstep(0.3, 0.7, liquidEdge) * smoothstep(0.9, 0.5, liquidEdge);
    color += goldMid * fresnelEdge * 0.12;
    
    // Depth darkening - recessed areas go darker and more saturated
    float depthFactor = smoothstep(0.05, 0.45, lum);
    vec3 deepColor = mix(goldDeep * 0.78, color, depthFactor);
    color = mix(deepColor, color, 0.75 + bulge * 0.25);
    
    // Primary specular highlights - moving hot spots with directional cue
    float spec1 = smoothstep(0.82, 0.97, lum) * smoothstep(0.35, 0.65, bulge);
    vec2 lightDir = normalize(vec2(0.25, 0.97));
    vec2 pseudoNormal = normalize(transformedUv + vec2(0.0001));
    float spec2 = smoothstep(0.74, 0.9, lum) * clamp(dot(lightDir, pseudoNormal), 0., 1.);
    float specular = (spec1 * 0.7 + spec2 * 0.3) * crestMask;
    color += goldSpecular * specular * 0.18;
    
    // Filmic tonemapping for gentle highlight compression
    vec3 filmic = (color * (FILMIC_A * color + FILMIC_B)) / (color * (FILMIC_C * color + FILMIC_D) + FILMIC_E);
    color = clamp(filmic, 0., 1.);

    color *= opacity;

    fragColor = vec4(color, opacity);
}`

export function buildLiquidFragSource(overrides?: LiquidShaderConfig) {
  const merged = mergeShaderConfig(overrides)
  const replacements: Record<string, string> = {
    __TIME_SCALE__: formatNumber(merged.timeScale),
    __NOISE_FREQ_SLOW__: formatNumber(merged.noise.slow.frequency),
    __NOISE_TIME_SLOW__: formatNumber(merged.noise.slow.timeFactor),
    __NOISE_WEIGHT_SLOW__: formatNumber(merged.noise.slow.weight),
    __NOISE_FREQ_MED__: formatNumber(merged.noise.medium.frequency),
    __NOISE_TIME_MED__: formatNumber(merged.noise.medium.timeFactor),
    __NOISE_WEIGHT_MED__: formatNumber(merged.noise.medium.weight),
    __NOISE_FREQ_FAST__: formatNumber(merged.noise.fast.frequency),
    __NOISE_TIME_FAST__: formatNumber(merged.noise.fast.timeFactor),
    __NOISE_WEIGHT_FAST__: formatNumber(merged.noise.fast.weight),
    __CAUSTIC_FREQ_1__: formatNumber(merged.caustics.freq1),
    __CAUSTIC_TIME_1_X__: formatNumber(merged.caustics.time1[0]),
    __CAUSTIC_TIME_1_Y__: formatNumber(merged.caustics.time1[1]),
    __CAUSTIC_FREQ_2__: formatNumber(merged.caustics.freq2),
    __CAUSTIC_TIME_2_X__: formatNumber(merged.caustics.time2[0]),
    __CAUSTIC_TIME_2_Y__: formatNumber(merged.caustics.time2[1]),
    __CAUSTIC_BIAS__: formatNumber(merged.caustics.bias),
    __CAUSTIC_EXPONENT__: formatNumber(merged.caustics.exponent),
    __CAUSTIC_INTENSITY__: formatNumber(merged.caustics.intensity),
    __EDGE_BASE__: formatNumber(merged.edge.base),
    __EDGE_RANGE__: formatNumber(merged.edge.range),
    __EDGE_FADE_LOW__: formatNumber(merged.edge.fadeLow),
    __EDGE_FADE_HIGH__: formatNumber(merged.edge.fadeHigh),
    __SHIMMER_POWER__: formatNumber(merged.shimmer.power),
    __SHIMMER_INTENSITY__: formatNumber(merged.shimmer.intensity),
    __FILMIC_A__: formatNumber(merged.filmic.a),
    __FILMIC_B__: formatNumber(merged.filmic.b),
    __FILMIC_C__: formatNumber(merged.filmic.c),
    __FILMIC_D__: formatNumber(merged.filmic.d),
    __FILMIC_E__: formatNumber(merged.filmic.e),
  }
  return applyShaderPlaceholders(liquidFragSourceTemplate, replacements)
}

export const liquidFragSource = buildLiquidFragSource()
