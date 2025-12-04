export const vertexShaderSource = /* glsl */ `#version 300 es
precision mediump float;

in vec2 a_position;
out vec2 vUv;

void main() {
    vUv = .5 * (a_position + 1.);
    gl_Position = vec4(a_position, 0.0, 1.0);
}`

export const liquidFragSource = /* glsl */ `#version 300 es
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

    float t = 0.0005 * u_time;

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

    vec2 grad_uv = uv;
    grad_uv -= .5;

    float dist = length(grad_uv + vec2(0., .2 * diagonal));

    grad_uv = rotate(grad_uv, (.25 - .2 * diagonal) * PI);

    float bulge = pow(1.8 * dist, 1.2);
    bulge = 1. - bulge;
    bulge *= pow(uv.y, .3);

    // === MULTI-FREQUENCY NOISE FOR SHIMMER & LIQUID MOTION ===
    // Slow, large-scale liquid flow
    float slowNoise = snoise(uv * 1.2 - t * 0.5);
    // Medium organic movement  
    float medNoise = snoise(uv * 2.4 - t * 0.9 + 10.0);
    // Fast micro-shimmer (the "sparkle")
    float fastNoise = snoise(uv * 6.0 - t * 1.5 + 25.0);
    // Combined liquid noise
    float noise = slowNoise * 0.65 + medNoise * 0.28 + fastNoise * 0.07;
    
    // Caustic-like bright ripples (simulates light refracting through liquid surface)
    float caustic1 = snoise(uv * 3.2 + vec2(t * 0.9, t * 0.4));
    float caustic2 = snoise(uv * 5.0 - vec2(t * 0.5, t * 0.8) + 50.0);
    float caustics = pow(max(0.0, caustic1 * caustic2 + 0.35), 1.6);

    float cycle_width = u_patternScale;
    float thin_strip_1_ratio = .12 / cycle_width * (1. - .4 * bulge);
    float thin_strip_2_ratio = .07 / cycle_width * (1. + .4 * bulge);
    float wide_strip_ratio = (1. - thin_strip_1_ratio - thin_strip_2_ratio);

    float thin_strip_1_width = cycle_width * thin_strip_1_ratio;
    float thin_strip_2_width = cycle_width * thin_strip_2_ratio;

    float edgeThreshold = 0.9 - 0.2 * u_edge;
    opacity = 1. - smoothstep(edgeThreshold - 0.07, edgeThreshold + 0.02, edge);
    opacity *= get_img_frame_alpha(img_uv, 0.01);

    // Liquid edge distortion - makes edges feel fluid
    float interiorMask = smoothstep(0.05, 0.4, 1. - edge);
    float liquidEdge = edge + interiorMask * u_liquid * noise * 0.8;
    liquidEdge = mix(liquidEdge, edge, smoothstep(0.85, 0.97, edge));

    float refr = 0.;
    refr += (1. - bulge);
    refr = clamp(refr, 0., 1.);

    float dir = grad_uv.x;

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
    shimmer = pow(shimmer, 4.0) * smoothstep(0.45, 0.8, lum) * crestMask;
    color += goldSpecular * shimmer * 0.05;
    
    // Caustic light ripples - bright dancing highlights
    float causticIntensity = caustics * smoothstep(0.25, 0.55, bulge) * smoothstep(0.5, 0.85, lum) * crestMask;
    color += goldSpecular * causticIntensity * 0.12;
    
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
    vec2 pseudoNormal = normalize(grad_uv + vec2(0.0001));
    float spec2 = smoothstep(0.74, 0.9, lum) * clamp(dot(lightDir, pseudoNormal), 0., 1.);
    float specular = (spec1 * 0.7 + spec2 * 0.3) * crestMask;
    color += goldSpecular * specular * 0.18;
    
    // Filmic tonemapping for gentle highlight compression
    vec3 filmic = (color * (vec3(2.51) * color + vec3(0.03))) / (color * (vec3(2.43) * color + vec3(0.59)) + vec3(0.14));
    color = clamp(filmic, 0., 1.);

    color *= opacity;

    fragColor = vec4(color, opacity);
}`
