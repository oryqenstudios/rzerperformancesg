#version 300 es
precision highp float;
precision highp int;
out vec4 fragColor;

uniform vec2  uRes;
uniform float uTime;
uniform int   uZero;
uniform vec3  uCamPos, uCamFwd, uCamRight, uCamUp;
uniform float uTanHalf;
uniform vec2  uShift;
uniform float uT;          // intro clock (s). >= 9.5 : car fully built
uniform float uXray;
uniform float uLights;
uniform float uBay;
uniform float uReflect;
uniform float uExposure;
uniform vec3  uDrl;
uniform vec3  uPaint;  uniform float uPaintRough; uniform float uPaintMetal;
uniform vec3  uRimCol; uniform float uRimRough;   uniform float uRimMetal;
uniform vec3  uCaliper;
uniform int   uWheel;  uniform float uRimR;
uniform int   uSpoiler, uLip, uSkirts, uDiffuser, uExhaust, uExFinish;
uniform float uRide, uWide;
uniform int   uHood, uRoof, uMirror;
uniform float uTint;

#define PI 3.14159265
const float R    = 0.345;   // tyre radius
const float FX   = 1.40;    // front axle
const float RX   = -1.32;   // rear axle
const float CEIL = 3.35;

// material ids
const float M_BODY = 1., M_TIRE = 2., M_RIM = 3., M_ROTOR = 4., M_CALIPER = 5., M_CARBON = 6.,
            M_EXH = 7., M_PAINTONLY = 8., M_CHASSIS = 9., M_ALU = 10., M_LIQUID = 11., M_SEAT = 12.,
            M_TURBO = 13., M_TRIM = 14.;

int gMode; // 0 intro, 1 car, 2 shell (xray), 3 inner (xray)

// ---------------------------------------------------------------- utils
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }
float hash11(float n){ return fract(sin(n * 127.1) * 43758.5453); }
float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);
  return mix(mix(hash21(i), hash21(i + vec2(1, 0)), u.x), mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p){ float a = 0.5, s = 0.; for(int i = 0; i < 4; i++){ s += a * vnoise(p); p *= 2.03; a *= 0.5; } return s; }

float smin(float a, float b, float k){ float h = max(k - abs(a - b), 0.) / k; return min(a, b) - h * h * k * 0.25; }
float smax(float a, float b, float k){ return -smin(-a, -b, k); }
float sdBox(vec3 p, vec3 b){ vec3 q = abs(p) - b; return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.); }
float sdRBox(vec3 p, vec3 b, float r){ return sdBox(p, b - r) - r; }
float sdBox2(vec2 p, vec2 b){ vec2 q = abs(p) - b; return length(max(q, 0.)) + min(max(q.x, q.y), 0.); }
float sdRBox2(vec2 p, vec2 b, float r){ return sdBox2(p, b - r) - r; }
float sdCap(vec3 p, vec3 a, vec3 b, float r){ vec3 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.); return length(pa - ba * h) - r; }
float sdEll(vec3 p, vec3 r){ float k0 = length(p / r); float k1 = length(p / (r * r)); return k0 * (k0 - 1.) / k1; }
void U(inout vec2 r, float d, float m){ if(d < r.x) r = vec2(d, m); }

// ---------------------------------------------------------------- body
const int NP = 20;
const vec2 PROF[NP] = vec2[NP](
  vec2( 2.16, 0.13), vec2( 2.29, 0.20), vec2( 2.34, 0.32), vec2( 2.32, 0.44), vec2( 2.22, 0.575),
  vec2( 1.95, 0.675), vec2( 1.45, 0.765), vec2( 0.98, 0.850), vec2( 0.55, 1.035), vec2( 0.20, 1.165),
  vec2(-0.20, 1.232), vec2(-0.60, 1.228), vec2(-1.00, 1.160), vec2(-1.45, 1.040), vec2(-1.90, 0.950),
  vec2(-2.22, 0.920), vec2(-2.28, 0.800), vec2(-2.31, 0.560), vec2(-2.25, 0.250), vec2(-2.10, 0.130));

float sdProfile(vec2 p){
  float d = dot(p - PROF[0], p - PROF[0]); float s = 1.;
  for(int i = 0, j = NP - 1; i < NP; j = i, i++){
    vec2 e = PROF[j] - PROF[i]; vec2 w = p - PROF[i];
    vec2 b = w - e * clamp(dot(w, e) / dot(e, e), 0., 1.);
    d = min(d, dot(b, b));
    bvec3 c = bvec3(p.y >= PROF[i].y, p.y < PROF[j].y, e.x * w.y > e.y * w.x);
    if(all(c) || all(not(c))) s *= -1.;
  }
  return s * sqrt(d);
}

float halfW(float x){
  float f = exp(-pow((x - FX) / 0.55, 2.)), r = exp(-pow((x - RX) / 0.6, 2.));
  return 0.915 + 0.035 * f + 0.055 * r + uWide * (0.065 * f + 0.075 * r);
}
float shoulderY(float x){ return mix(0.93, 0.80, smoothstep(-1.9, 1.6, x)); }
float cabinHW(vec3 pb){
  float t = pb.y - shoulderY(pb.x);
  float tumble = 0.78 * 0.5 * (t + sqrt(t * t + 0.0025));
  float tuck = 0.06 * smoothstep(0.36, 0.12, pb.y);
  return halfW(pb.x) - tumble - tuck;
}
vec2 exhaustSlot(float az, out float r){ // returns (zc, yc) of nearest tip for |z|=az
  if(uExhaust == 1){ r = 0.043; return vec2(az < 0.57 ? 0.50 : 0.64, 0.215); }
  if(uExhaust == 2){ r = 0.056; return vec2(0.085, 0.235); }
  r = 0.054; return vec2(0.56, 0.215);
}

float bodySDF(vec3 pb){
  float bb = sdBox(pb - vec3(0., 0.69, 0.), vec3(2.36, 0.57, 1.06 + uWide * 0.08));
  if(bb > 0.10) return bb;
  float side = sdProfile(pb.xy);
  float hwm = 0.98 + uWide * 0.08;
  float rr = pb.x > 0. ? 0.70 : 0.45;
  vec2 q = abs(pb.xz) - vec2(2.31, hwm) + rr;
  float plan = min(max(q.x, q.y), 0.) + length(max(q, 0.)) - rr;
  float sect = (abs(pb.z) - cabinHW(pb)) * 0.8;
  float d = smax(side, plan, 0.07);
  d = smax(d, sect, 0.09);
  // wheel arches
  float ax = pb.x > 0.04 ? FX : RX;
  float arch = length(pb.xy - vec2(ax, R)) - (0.40 + uWide * 0.025);
  arch = max(arch, 0.50 - abs(pb.z));
  d = smax(d, -arch, 0.03);
  // side scoop ahead of the rear wheel
  float sc = sdEll(vec3(pb.x + 0.86, pb.y - 0.52, abs(pb.z) - halfW(pb.x) - 0.035), vec3(0.42, 0.12, 0.08));
  d = smax(d, -sc, 0.05);
  // exhaust openings
  float er; vec2 ez = exhaustSlot(abs(pb.z), er);
  float hole = max(length(vec2(pb.y - ez.y, abs(pb.z) - ez.x)) - er - 0.016, pb.x + 2.13);
  d = smax(d, -hole, 0.01);
  // ducktail
  if(uSpoiler == 1){
    float dt = sdRBox(pb - vec3(-2.12, 0.95, 0.), vec3(0.18, 0.07, 0.80), 0.03);
    dt = max(dt, pb.y - (0.94 + max(-1.98 - pb.x, 0.) * 0.38));
    d = smin(d, dt, 0.06);
  }
  return d;
}

float carbonParts(vec3 pb){
  float d = 1e9;
  if(uLip > 0){
    float ext = uLip == 1 ? 0.035 : 0.085;
    vec2 q = abs(pb.xz) - vec2(2.31 + ext, 0.96 + uWide * 0.08) + 0.7;
    float pl = min(max(q.x, q.y), 0.) + length(max(q, 0.)) - 0.7;
    float lip = max(pl, abs(pb.y - 0.118) - (uLip == 1 ? 0.012 : 0.010));
    lip = max(lip, 1.62 - pb.x);
    d = min(d, lip);
    if(uLip == 2){
      vec3 c = vec3(pb.x - 2.14, pb.y - 0.36, abs(pb.z) - 0.88);
      c.xy = rot(-0.18) * c.xy;
      d = min(d, sdRBox(c, vec3(0.09, 0.006, 0.09), 0.004));
    }
  }
  if(uSkirts == 1){
    float sk = max(max(abs(pb.x) - 0.95, abs(pb.y - 0.162) - 0.036), abs(pb.z) - (halfW(pb.x) + 0.02));
    d = min(d, sk - 0.004);
  }
  if(uDiffuser == 1 && pb.x < -1.8){
    float base = sdBox(vec3(pb.x + 2.13, pb.y - 0.112, pb.z), vec3(0.22, 0.010, 0.72));
    float fz = mod(pb.z + 0.09, 0.18) - 0.09;
    float top = 0.12 + max(-pb.x - 1.95, 0.) * 0.5;
    float fin = max(abs(fz) - 0.005, max(pb.y - top, 0.10 - pb.y));
    fin = max(fin, max(abs(pb.z) - 0.64, max(pb.x + 1.92, -2.37 - pb.x)));
    d = min(d, min(base, fin));
  }
  if(uSpoiler == 2){
    vec3 l = pb - vec3(-2.25, 0.938, 0.);
    l.xy = rot(-0.35) * l.xy;
    d = min(d, sdRBox(l, vec3(0.065, 0.008, 0.80), 0.006));
  }
  if(uSpoiler == 3 && pb.x < -1.6 && pb.y > 0.85){
    vec3 w = pb - vec3(-2.04, 1.27, 0.);
    w.xy = rot(-0.16) * w.xy;
    float blade = sdRBox(w, vec3(0.17, 0.013, 0.93), 0.011);
    float plate = sdRBox(vec3(pb.x + 2.04, pb.y - 1.245, abs(pb.z) - 0.935), vec3(0.20, 0.10, 0.006), 0.004);
    float upr = sdRBox(vec3(pb.x + 1.99, pb.y - 1.10, abs(pb.z) - 0.40), vec3(0.06, 0.16, 0.007), 0.004);
    d = min(d, min(blade, min(plate, upr)));
  }
  return d;
}

float mirrorSDF(vec3 pb){
  vec3 m = vec3(pb.x - 0.80, pb.y - 0.975, abs(pb.z) - 0.985);
  if(dot(m, m) > 0.09) return length(m) - 0.2;
  float head = sdEll(m, vec3(0.075, 0.048, 0.10));
  float stalk = sdRBox(m - vec3(0.02, -0.035, -0.09), vec3(0.035, 0.012, 0.07), 0.008);
  return smin(head, stalk, 0.02);
}

float exhaustSDF(vec3 pb, out float inner){
  float r; vec2 ez = exhaustSlot(abs(pb.z), r);
  vec2 yz = vec2(pb.y - ez.y, abs(pb.z) - ez.x);
  float rr = length(yz);
  inner = rr - r + 0.004;
  return max(abs(rr - r) - 0.005, abs(pb.x + 2.27) - 0.085);
}

// ---------------------------------------------------------------- wheels
vec3 wheelLocal(vec3 p){
  float ax = p.x > 0.04 ? FX : RX;
  return vec3(p.x - ax, p.y - R, abs(p.z) - (0.80 + uWide * 0.05));
}
vec2 wheelSDF(vec3 p){
  vec3 q = wheelLocal(p);
  float bl = length(q);
  if(bl > 0.48) return vec2(bl - 0.40, M_TIRE);
  vec2 res = vec2(1e9, M_TIRE);
  float rim = uRimR;
  float r = length(q.xy);
  float rc = 0.5 * (R + rim + 0.006), hr = 0.5 * (R - rim - 0.006);
  float tire = sdRBox2(vec2(r - rc, q.z), vec2(hr, 0.128), min(0.055, hr * 0.92));
  U(res, tire, M_TIRE);
  // barrel + lip
  float barrel = sdRBox2(vec2(r - rim + 0.010, q.z), vec2(0.011, 0.118), 0.004);
  float lip = sdRBox2(vec2(r - rim + 0.006, q.z - 0.113), vec2(0.016, 0.010), 0.005);
  float rimD = min(barrel, lip);
  // face
  float faceZ = mix(0.058, 0.098, clamp(r / rim, 0., 1.));
  float a = atan(q.y, q.x);
  float n = uWheel == 1 ? 10. : (uWheel == 0 ? 5. : (uWheel == 2 ? 6. : 14.));
  float sec = 2. * PI / n;
  float ac = mod(a + sec * 0.5, sec) - sec * 0.5;
  vec2 sp = vec2(cos(ac), sin(ac)) * r;
  float d2;
  if(uWheel == 0){
    d2 = abs(abs(sp.y) - (0.010 + 0.11 * max(sp.x - 0.07, 0.))) - 0.0115;
  } else if(uWheel == 1){
    d2 = abs(sp.y) - (0.006 + 0.016 * (sp.x / rim));
    d2 = min(d2, abs(r - 0.62 * rim) - 0.006);
  } else if(uWheel == 2){
    d2 = abs(sp.y) - (0.022 + 0.085 * sp.x);
    d2 = max(d2, -(abs(sp.y) - 0.006 - 0.03 * max(sp.x - 0.1, 0.)) * step(0.1, sp.x)); // groove
  } else {
    float slot = abs(sp.y - (sp.x - 0.11) * 0.32) - 0.0125;
    slot = max(slot, max(0.105 - sp.x, sp.x - (rim - 0.034)));
    d2 = -slot;
  }
  d2 = max(d2, r - (rim - 0.008));
  d2 = min(d2, r - 0.072);
  float face = max(d2, abs(q.z - faceZ) - 0.017);
  float cap = max(r - 0.036, abs(q.z - 0.068) - 0.012);
  rimD = min(rimD, min(face, cap));
  U(res, rimD, M_RIM);
  // brakes
  float rotor = max(r - (rim - 0.036), abs(q.z + 0.020) - 0.013);
  U(res, rotor, M_ROTOR);
  float th = p.x > 0.04 ? -2.09 : -1.05;
  vec2 cq = rot(th) * q.xy;
  float cal = sdRBox(vec3(cq.x - (rim - 0.072), cq.y, q.z + 0.018), vec3(0.042, 0.095, 0.040), 0.016);
  U(res, cal, M_CALIPER);
  return res;
}

// ---------------------------------------------------------------- chassis / engine / interior
float chassisSDF(vec3 p){
  vec3 q = vec3(p.x, p.y, abs(p.z));
  float d = sdRBox(q - vec3(0., 0.24, 0.58), vec3(2.05, 0.075, 0.05), 0.02);
  d = min(d, sdCap(q, vec3(FX, 0.30, 0.0), vec3(FX, 0.30, 0.58), 0.045));
  d = min(d, sdCap(q, vec3(RX, 0.30, 0.0), vec3(RX, 0.30, 0.58), 0.045));
  d = min(d, sdCap(q, vec3(0.30, 0.22, 0.0), vec3(0.30, 0.22, 0.58), 0.030));
  d = min(d, sdCap(q, vec3(-0.70, 0.22, 0.0), vec3(-0.70, 0.22, 0.58), 0.030));
  d = min(d, sdCap(q, vec3(2.12, 0.32, 0.0), vec3(2.12, 0.32, 0.78), 0.034));
  d = min(d, sdCap(q, vec3(-2.12, 0.32, 0.0), vec3(-2.12, 0.32, 0.78), 0.034));
  // cage
  d = min(d, sdCap(q, vec3(0.92, 0.26, 0.60), vec3(0.22, 1.10, 0.56), 0.022));
  d = min(d, sdCap(q, vec3(-0.62, 0.26, 0.62), vec3(-0.62, 1.13, 0.56), 0.024));
  d = min(d, sdCap(q, vec3(0.22, 1.10, 0.56), vec3(-0.62, 1.13, 0.56), 0.022));
  d = min(d, sdCap(q, vec3(-0.62, 1.13, 0.0), vec3(-0.62, 1.13, 0.56), 0.022));
  d = min(d, sdCap(q, vec3(-0.62, 1.13, 0.56), vec3(-1.65, 0.42, 0.60), 0.020));
  // suspension
  for(int i = 0; i < 2; i++){
    float ax = i == 0 ? FX : RX;
    float tz = 0.80 + uWide * 0.05;
    d = min(d, sdCap(q, vec3(ax - 0.18, 0.20, 0.56), vec3(ax, 0.22, tz - 0.12), 0.018));
    d = min(d, sdCap(q, vec3(ax + 0.16, 0.20, 0.56), vec3(ax, 0.22, tz - 0.12), 0.018));
    d = min(d, sdCap(q, vec3(ax - 0.14, 0.50, 0.52), vec3(ax, 0.50, tz - 0.13), 0.015));
    vec3 s = q - vec3(ax - 0.03, 0.0, tz - 0.25);
    float sh = 0.38;
    float spring = length(vec2(length(s.xz) - 0.05 - 0.008 * sin(s.y * 95.), max(abs(s.y - 0.44) - sh * 0.5, 0.))) - 0.012;
    d = min(d, spring * 0.8);
  }
  return d;
}

vec2 engineSDF(vec3 p){
  vec2 res = vec2(1e9, M_ALU);
  vec3 q = p - vec3(1.42, 0., 0.);
  U(res, sdRBox(q - vec3(0., 0.42, 0.), vec3(0.30, 0.15, 0.22), 0.04), M_ALU);
  vec3 h = vec3(q.x, q.y - 0.60, abs(q.z) - 0.16); h.yz = rot(0.55) * h.yz;
  U(res, sdRBox(h, vec3(0.30, 0.05, 0.08), 0.03), M_CHASSIS);
  U(res, sdCap(q, vec3(-0.24, 0.71, 0.), vec3(0.24, 0.71, 0.), 0.07), M_CARBON);
  vec3 t = q - vec3(0.34, 0.48, 0.30);
  U(res, length(vec2(length(t.xy) - 0.065, t.z)) - 0.045, M_TURBO);
  U(res, sdCap(q, vec3(0.34, 0.48, 0.30), vec3(0.62, 0.34, 0.26), 0.03), M_ALU);
  U(res, sdBox(p - vec3(2.07, 0.42, 0.), vec3(0.022, 0.16, 0.56)), M_CHASSIS);
  U(res, sdCap(p, vec3(1.05, 0.40, 0.), vec3(0.20, 0.36, 0.), 0.11), M_ALU);
  U(res, sdCap(p, vec3(0.20, 0.33, 0.), vec3(RX + 0.1, 0.33, 0.), 0.034), M_CHASSIS);
  U(res, length(p - vec3(RX, 0.34, 0.)) - 0.12, M_ALU);
  vec3 a = vec3(p.x, p.y, abs(p.z));
  U(res, sdCap(a, vec3(RX, 0.34, 0.), vec3(RX, 0.345, 0.70), 0.024), M_CHASSIS);
  U(res, sdCap(a, vec3(1.10, 0.22, 0.33), vec3(-2.20, 0.215, 0.56), 0.034), M_TURBO);
  // seats + wheel
  vec3 s = vec3(p.x + 0.25, p.y, abs(p.z) - 0.38);
  float seat = sdRBox(s - vec3(0., 0.36, 0.), vec3(0.24, 0.06, 0.20), 0.05);
  vec3 sb = s - vec3(-0.24, 0.66, 0.); sb.xy = rot(-0.22) * sb.xy;
  seat = min(seat, sdRBox(sb, vec3(0.06, 0.30, 0.20), 0.05));
  U(res, seat, M_SEAT);
  vec3 w = p - vec3(0.50, 0.86, 0.38); w.xy = rot(0.45) * w.xy;
  U(res, length(vec2(length(w.yz) - 0.17, w.x)) - 0.018, M_SEAT);
  return res;
}

// ---------------------------------------------------------------- intro
float rectR(float a){ return min(2.35 / max(abs(cos(a)), 1e-3), 1.05 / max(abs(sin(a)), 1e-3)); }

vec2 introLiquid(vec3 p, float t){
  vec2 res = vec2(1e9, M_LIQUID);
  if(t < 3.0){
    float d;
    float m1 = smoothstep(1.7, 2.35, t), m2 = smoothstep(2.35, 3.0, t);
    float drop = sdEll(p - vec3(0., 0.17, 0.), vec3(0.42, 0.33, 0.42));
    float dome = length(p) - 0.85;
    if(m1 < 1.){
      float k = smoothstep(0.0, 2.1, t);
      float pd = 1e9;
      for(int i = 0; i < 5; i++){
        float fi = float(i);
        vec3 st = vec3(-2.4 - fi * 0.45, 0., 1.5 + sin(fi * 2.3) * 0.7);
        vec3 c = mix(st, vec3(0.), smoothstep(0., 1., k * 1.15 - fi * 0.05));
        pd = smin(pd, sdEll(p - c, vec3(0.62 - fi * 0.05, 0.15, 0.42)), 0.45);
      }
      pd += 0.018 * sin(p.x * 7. + t * 3.) * sin(p.z * 6. - t * 2.);
      d = mix(pd, dome, m1);
    } else d = dome;
    d = mix(d, drop, m2);
    res.x = d;
    return res;
  }
  // spikes -> lattice
  float g = smoothstep(3.0, 3.85, t);
  float l = smoothstep(3.95, 5.0, t);
  float fade = smoothstep(5.3, 6.0, t);
  float hub = sdEll(p - vec3(0., 0.12 * (1. - g) + 0.02, 0.), vec3(0.42, 0.33, 0.42) * mix(1., 0.16, g)) ;
  float n = 30.;
  float a = atan(p.z, p.x);
  float sec = 2. * PI / n;
  float id = floor((a + sec * 0.5) / sec);
  float ac = a - id * sec;
  float rr = length(p.xz);
  vec2 lp = vec2(cos(ac), sin(ac)) * rr;
  float h = hash11(id + 3.1);
  float len = mix(g * (0.7 + 1.7 * h), rectR(id * sec), l);
  float along = clamp(lp.x / max(len, 1e-3), 0., 1.);
  float rad = mix(mix(0.07, 0.004, along), 0.0105, l) * (1. - fade);
  float yy = mix(0.03 + 0.10 * (1. - along) * g, 0.0105, l);
  vec3 q = vec3(lp.x - clamp(lp.x, 0., len), p.y - yy, lp.y);
  float sp = (length(q) - rad) * 0.85;
  // central spike
  float cs = sdCap(p, vec3(0.), vec3(0., 0.55 * g * (1. - l), 0.), 0.03 * (1. - l));
  float d = smin(hub, sp, 0.05);
  d = smin(d, cs, 0.05);
  // rectangle rings
  if(l > 0.0){
    float wr = 0.0105 * (1. - fade);
    for(int i = 0; i < 3; i++){
      float s = (float(i) + 1.) / 3.;
      float ap = smoothstep(4.15 + float(2 - i) * 0.18, 4.6 + float(2 - i) * 0.18, t);
      float ring = abs(sdBox2(p.xz, vec2(2.35, 1.05) * s)) ;
      float rd = length(vec2(ring, p.y - 0.0105)) - wr * ap;
      d = min(d, rd);
    }
  }
  if(fade > 0.) d += fade * 0.02;
  res.x = d;
  return res;
}

// ---------------------------------------------------------------- scene
vec2 carScene(vec3 p){
  float bnd = sdBox(p - vec3(0., 0.80, 0.), vec3(2.48, 0.80, 1.12 + uWide * 0.08));
  if(bnd > 0.12) return vec2(bnd, M_BODY);
  vec3 pb = vec3(p.x, p.y + uRide, p.z);
  vec2 res = vec2(1e9, M_BODY);
  U(res, bodySDF(pb), M_BODY);
  U(res, carbonParts(pb), M_CARBON);
  U(res, mirrorSDF(pb), uMirror == 1 ? M_CARBON : M_PAINTONLY);
  if(pb.x < -2.05 && pb.y < 0.4){ float inn; U(res, exhaustSDF(pb, inn), M_EXH); }
  vec2 w = wheelSDF(p);
  if(w.x < res.x) res = w;
  return res;
}

vec2 scene(vec3 p){
  if(gMode == 1) return carScene(p);
  if(gMode == 2){
    vec3 pb = vec3(p.x, p.y + uRide, p.z);
    vec2 res = vec2(bodySDF(pb), M_BODY);
    U(res, carbonParts(pb), M_CARBON);
    U(res, mirrorSDF(pb), uMirror == 1 ? M_CARBON : M_PAINTONLY);
    return res;
  }
  if(gMode == 3){
    vec3 pb = vec3(p.x, p.y + uRide, p.z);
    vec2 res = wheelSDF(p);
    U(res, chassisSDF(pb), M_CHASSIS);
    vec2 e = engineSDF(pb); if(e.x < res.x) res = e;
    if(pb.x < -2.05 && pb.y < 0.4){ float inn; U(res, exhaustSDF(pb, inn), M_EXH); }
    return res;
  }
  // intro
  float t = uT;
  vec2 res = vec2(1e9, M_LIQUID);
  if(t < 6.0) res = introLiquid(p, t);
  if(t > 5.25){
    vec3 pb = vec3(p.x, p.y + uRide, p.z);
    float c = smoothstep(5.3, 6.5, t);
    if(t < 8.4){
      U(res, chassisSDF(pb) + (1. - c) * 0.08, M_CHASSIS);
      vec2 e = engineSDF(pb); e.x += (1. - smoothstep(5.6, 6.7, t)) * 0.12; if(e.x < res.x) res = e;
    }
    vec2 w = wheelSDF(p);
    w.x += (1. - smoothstep(5.8, 6.9, t)) * 0.35;
    if(w.x < res.x) res = w;
    if(t > 6.55){
      float fill = mix(-0.05, 1.42, smoothstep(6.6, 8.1, t));
      fill += 0.03 * sin(pb.x * 5. + t * 6.) * sin(pb.z * 4. - t * 5.);
      float b = max(bodySDF(pb), pb.y - fill);
      float fm = t > 8.15 ? M_BODY : M_LIQUID;
      if(res.y == M_CHASSIS || res.y == M_ALU) b = smin(b, res.x, 0.02);
      U(res, b, fm);
      float cp = carbonParts(pb) + (1. - smoothstep(7.6, 8.3, t)) * 0.05;
      U(res, cp, M_CARBON);
      U(res, mirrorSDF(pb) + (1. - smoothstep(7.8, 8.3, t)) * 0.06, uMirror == 1 ? M_CARBON : M_PAINTONLY);
      if(pb.x < -2.05 && pb.y < 0.4 && t > 7.6){ float inn; U(res, exhaustSDF(pb, inn), M_EXH); }
    }
  }
  return res;
}

vec3 calcN(vec3 p, float e){
  vec3 n = vec3(0.);
  for(int i = uZero; i < 4; i++){
    vec3 k = 0.5773 * (2. * vec3((((i + 3) >> 1) & 1), ((i >> 1) & 1), (i & 1)) - 1.);
    n += k * scene(p + k * e).x;
  }
  return normalize(n);
}

vec2 boxHit(vec3 ro, vec3 rd, vec3 bmin, vec3 bmax){
  vec3 inv = 1. / rd;
  vec3 t0 = (bmin - ro) * inv, t1 = (bmax - ro) * inv;
  vec3 tn = min(t0, t1), tf = max(t0, t1);
  return vec2(max(max(tn.x, tn.y), tn.z), min(min(tf.x, tf.y), tf.z));
}

void sceneBox(out vec3 bmin, out vec3 bmax){
  if(gMode == 0){ bmin = vec3(-5.2, -0.05, -3.0); bmax = vec3(3.0, 1.62, 3.0); }
  else { bmin = vec3(-2.62, -0.01, -1.22); bmax = vec3(2.62, 1.62, 1.22); }
}

vec2 march(vec3 ro, vec3 rd, float tmax, int steps){
  vec3 bmin, bmax; sceneBox(bmin, bmax);
  vec2 bh = boxHit(ro, rd, bmin, bmax);
  if(bh.x > bh.y || bh.y < 0.) return vec2(-1., 0.);
  float t = max(bh.x, 0.0);
  float t1 = min(bh.y, tmax);
  float k = gMode == 0 ? 0.8 : 0.92;
  for(int i = uZero; i < steps; i++){
    if(t > t1) break;
    vec2 h = scene(ro + rd * t);
    if(h.x < 0.0005 + 0.0008 * t) return vec2(t, h.y);
    t += h.x * k;
  }
  return vec2(-1., 0.);
}

float calcAO(vec3 p, vec3 n){
  float occ = 0., sc = 1.;
  for(int i = uZero; i < 4; i++){
    float h = 0.03 + 0.12 * float(i);
    float d = scene(p + n * h).x;
    occ += (h - d) * sc;
    sc *= 0.75;
  }
  return clamp(1. - 1.6 * occ, 0., 1.);
}

// ---------------------------------------------------------------- environment
float tubes(vec2 c, float w){
  float lx = mod(c.x + 1.5, 3.0) - 1.5;
  float lz = mod(c.y + 1.75, 3.5) - 1.75;
  float a = 1. - smoothstep(0.045 - w, 0.045 + w, abs(lx));
  float b = 1. - smoothstep(0.78 - w, 0.78 + w, abs(lz));
  float norm = 0.06 / (0.06 + w);
  return (a * b) * norm + exp(-abs(lx) * 7.) * b * 0.05;
}

vec3 headlightPos(float s){ return vec3(2.27, 0.535 - uRide, 0.66 * s); }

vec3 envCol(vec3 p, vec3 r, float rough){
  vec3 c;
  if(r.y > 0.){
    float t = (CEIL - p.y) / max(r.y, 1e-3);
    vec2 cp = p.xz + r.xz * t;
    float w = 0.02 + rough * 0.55 + t * 0.003;
    c = vec3(0.010) + vec3(1.0, 0.98, 0.95) * tubes(cp, w) * 7.5 * exp(-t * 0.035);
    c += vec3(0.008) * smoothstep(0.9, 0.2, r.y);
    c = mix(vec3(0.018), c, smoothstep(0.0, 0.22, r.y));
  } else {
    float t = -p.y / min(r.y, -1e-3);
    vec2 fp = p.xz + r.xz * t;
    float lx = mod(fp.x + 1.5, 3.0) - 1.5;
    c = vec3(0.012) * (0.5 + exp(-lx * lx * 0.35));
    c = mix(vec3(0.018), c, smoothstep(0.0, -0.2, r.y));
  }
  // distant aisle glow at the horizon defines side surfaces
  c += vec3(0.16, 0.16, 0.17) * exp(-abs(r.y) * 38.) * (0.35 + 0.65 * smoothstep(0.3, 1., abs(r.x)));
  // lit side bays: a soft wall glow the body sides can pick up
  c += vec3(0.075, 0.075, 0.08) * smoothstep(0.35, 0.95, abs(r.z)) * smoothstep(0.45, 0.0, abs(r.y - 0.05));
  // configurator bay: tall softboxes either side
  if(uBay > 0.){
    float side = smoothstep(0.55, 0.75, abs(r.z)) * smoothstep(0.55, 0.05, abs(r.y - 0.12)) * smoothstep(0.9, 0.3, abs(r.x));
    c += vec3(0.85, 0.87, 0.9) * side * uBay * 0.6 * (1. - rough * 0.6);
  }
  return c;
}

vec3 headlightPool(vec3 p){
  vec3 acc = vec3(0.);
  for(int i = 0; i < 2; i++){
    vec3 lp = headlightPos(i == 0 ? 1. : -1.);
    vec3 L = p - lp; float d = length(L); L /= d;
    float cs = dot(L, normalize(vec3(1., -0.11, (i == 0 ? 0.06 : -0.06))));
    float spot = smoothstep(0.86, 0.985, cs);
    acc += spot / (1. + d * d * 0.6);
  }
  return acc * vec3(1.0, 0.97, 0.92) * 1.4;
}

float pillarHit(vec3 ro, vec3 rd, out vec3 n){
  float best = 1e9; n = vec3(0.);
  for(int k = uZero; k < 7; k++){
    float px = -28.5 + 7.5 * float(k);
    for(int s = 0; s < 2; s++){
      vec3 c = vec3(px, CEIL * 0.5, s == 0 ? 6.6 : -6.6);
      vec3 b = vec3(0.32, CEIL * 0.5, 0.32);
      vec2 h = boxHit(ro, rd, c - b, c + b);
      if(h.x < h.y && h.x > 0. && h.x < best){
        best = h.x;
        vec3 lp = ro + rd * h.x - c;
        vec3 a = abs(lp) / b;
        n = a.x > a.z ? vec3(sign(lp.x), 0., 0.) : vec3(0., 0., sign(lp.z));
      }
    }
  }
  return best;
}

vec3 shadePillar(vec3 p, vec3 n){
  float u = p.x + p.z;
  vec3 alb = vec3(0.24) * (0.8 + 0.3 * fbm(vec2(u, p.y) * 3.));
  if(p.y < 1.05){
    float st = step(0.5, fract((p.y + u) * 2.2));
    alb = mix(vec3(0.02), vec3(0.62, 0.45, 0.03), st);
  }
  float lx = mod(p.x + 1.5, 3.0) - 1.5;
  float E = 0.10 + 0.22 * smoothstep(3.3, 1.0, p.y) * (0.5 + 0.5 * exp(-lx * lx));
  return alb * E;
}


vec3 shadeObj(vec3 p, vec3 rd, float mat, vec3 n, float ao, float t){
  vec3 v = -rd;
  float ndv = max(dot(n, v), 0.);
  vec3 r = reflect(rd, n);
  vec3 pb = vec3(p.x, p.y + uRide, p.z);
  vec3 base = vec3(0.02); float rough = 0.3, metal = 0., coat = 0., gap = 0.;
  vec3 emis = vec3(0.);
  float xrayGrid = 0.;

  if(mat == M_BODY || mat == M_PAINTONLY){
    base = uPaint; rough = uPaintRough; metal = uPaintMetal; coat = 1.;
    if(mat == M_BODY){
      float sy = shoulderY(pb.x);
      float edge = cabinHW(pb) - abs(pb.z);
      bool upper = pb.y > sy + 0.035;
      bool roof = pb.y > 1.15 && pb.x > -0.98 && pb.x < 0.16;
      bool glass = false;
      if(upper && !roof){
        if(pb.x < 0.98 && pb.x > 0.15 && n.x > 0.25 && edge > 0.075) glass = true;               // windscreen
        if(abs(n.z) > 0.55 && pb.x > -0.95 && pb.x < 0.86 && pb.y > sy + 0.035 + max(-0.5 - pb.x, 0.) * 0.28) glass = true; // side
        if(pb.x < -0.98 && pb.x > -1.50 && n.y > 0.6 && edge > 0.10) glass = true;                // rear
      }
      if(glass){
        base = mix(vec3(0.03, 0.032, 0.035), vec3(0.002), uTint); rough = 0.0; metal = 0.; coat = 0.;
        base *= 1.0;
      }
      if(roof && uRoof == 1){ mat = M_CARBON; }
      // hood
      bool hood = pb.x > 1.0 && pb.x < 2.12 && n.y > 0.55 && pb.y > 0.70;
      if(hood && uHood == 1){
        mat = M_CARBON;
        float vz = abs(pb.z);
        if(vz > 0.22 && vz < 0.56 && pb.x > 1.25 && pb.x < 1.72){
          float sl = smoothstep(0.35, 0.5, abs(fract(pb.x * 22.) - 0.5));
          gap = max(gap, 1. - sl);
        }
      }
      // panel gaps
      if(abs(n.z) > 0.4 && pb.y < sy + 0.01){
        gap = max(gap, 1. - smoothstep(0.0, 0.006, abs(pb.x - (0.90 - (pb.y - 0.3) * 0.12))));
        gap = max(gap, 1. - smoothstep(0.0, 0.006, abs(pb.x - (-0.62 + (pb.y - 0.3) * 0.18))));
        if(pb.x < -0.30 && pb.x > -0.46 && abs(pb.y - 0.79) < 0.012) gap = max(gap, 0.85);
      }
      if(n.y > 0.4 && pb.x > 1.0 && pb.x < 2.05) gap = max(gap, 1. - smoothstep(0.0, 0.006, abs(abs(pb.z) - 0.70)));
      // front end
      if(pb.x > 1.9 && n.x > 0.15){
        float az = abs(pb.z);
        float yc = 0.535 - (az - 0.40) * 0.06;
        if(az > 0.36 && az < 0.86 && abs(pb.y - yc) < 0.040){
          base = vec3(0.004); rough = 0.; metal = 0.; coat = 1.; mat = M_TRIM;
          float strip = (1. - smoothstep(0.003, 0.007, abs(pb.y - (yc + 0.022)))) * step(0.40, az) * step(az, 0.84);
          float fang = 0.;
          float proj = 0.;
          for(int i = 0; i < 2; i++){ float zc = i == 0 ? 0.62 : 0.74; proj = max(proj, 1. - smoothstep(0.014, 0.02, length(vec2(az - zc, pb.y - yc + 0.004)))); }
          float m = max(strip, fang);
          emis = uDrl * (m * 9. + proj * 4.) * uLights;
          base += vec3(0.35) * max(m, proj * 0.6) * (1. - uLights);
        }
        if(pb.x > 2.2 && pb.y > 0.18 && pb.y < 0.40){
          float hc = (az < 0.50 && pb.y < 0.37) ? 1. : ((az > 0.62 && az < 0.84 && pb.y < 0.31) ? 1. : 0.);
          if(hc > 0.){
            vec2 hp = vec2(pb.z, pb.y) * 38.; hp.x += mod(floor(hp.y), 2.) * 0.5;
            float hex = smoothstep(0.25, 0.4, length(fract(hp) - 0.5));
            base = vec3(0.004 + 0.02 * hex); coat = 0.3; rough = 0.4; mat = M_TRIM;
          }
        }
      }
      // rear end
      if(pb.x < -2.12 && n.x < -0.15){
        float az = abs(pb.z);
        if(abs(pb.y - 0.795) < 0.016 && az < 0.92){
          base = vec3(0.06, 0.0, 0.0); coat = 1.; rough = 0.;
          emis = vec3(1.0, 0.03, 0.02) * (0.25 + 3.2 * uLights) * (1. - smoothstep(0.004, 0.012, abs(pb.y - 0.795)));
        }
        if(pb.y < 0.30) { base = vec3(0.006); rough = 0.5; coat = 0.2; }
      }
    }
  }
  if(mat == M_TIRE){
    base = vec3(0.016); rough = 0.7;
    vec3 q = wheelLocal(p);
    float r = length(q.xy);
    if(q.z > 0.08 && r > uRimR + 0.03 && r < R - 0.04){ // sidewall lettering band
      float a = atan(q.y, q.x);
      float band = step(abs(r - (uRimR + R) * 0.5), 0.01) * step(0.5, fract(a * 9.));
      base += vec3(0.012) * band;
    }
  }
  if(mat == M_RIM){ base = uRimCol; rough = uRimRough; metal = uRimMetal; coat = uRimMetal < 0.5 ? 1. : 0.; }
  if(mat == M_ROTOR){
    vec3 q = wheelLocal(p); float a = atan(q.y, q.x);
    base = vec3(0.30) * (0.8 + 0.2 * step(0.5, fract(a * 6. + length(q.xy) * 20.))); rough = 0.35; metal = 1.;
  }
  if(mat == M_CALIPER){ base = uCaliper; rough = 0.2; coat = 1.; }
  if(mat == M_CARBON){
    vec3 an = abs(n);
    vec2 uv = an.y > 0.6 ? pb.xz : (an.x > 0.6 ? pb.zy : pb.xy);
    uv *= 55.;
    vec2 cell = floor(uv);
    float dir = mod(cell.x + cell.y, 4.) < 2. ? 1. : 0.;
    float fib = dir > 0.5 ? 0.5 + 0.5 * sin(uv.y * PI * 6.) : 0.5 + 0.5 * sin(uv.x * PI * 6.);
    float contrast = smoothstep(7.0, 1.5, t);
    base = vec3(0.022, 0.023, 0.026) * (1. + contrast * (0.9 * dir - 0.45 + 0.35 * fib));
    rough = 0.12; coat = 1.;
  }
  if(mat == M_EXH){
    float inn; exhaustSDF(pb, inn);
    float u = clamp((pb.x + 2.36) / 0.18, 0., 1.);
    if(uExFinish == 1){ base = mix(mix(vec3(0.20, 0.35, 0.80), vec3(0.50, 0.25, 0.62), u), vec3(0.80, 0.58, 0.28), u * u); rough = 0.12; metal = 1.; }
    else if(uExFinish == 2){ base = vec3(0.035); rough = 0.45; coat = 0.4; }
    else { base = vec3(0.92); rough = 0.04; metal = 1.; }
    if(inn < 0.) { base *= 0.15; }
  }
  if(mat == M_CHASSIS){ base = vec3(0.014); rough = 0.12; coat = 1.; }
  if(mat == M_ALU){ base = vec3(0.55, 0.56, 0.58); rough = 0.35; metal = 1.; }
  if(mat == M_TURBO){ base = vec3(0.62, 0.50, 0.40); rough = 0.25; metal = 1.; }
  if(mat == M_SEAT){ base = vec3(0.02); rough = 0.6; }
  if(mat == M_LIQUID){ base = vec3(0.004); rough = 0.0; coat = 1.; }

  float sky = 0.5 + 0.5 * n.y;
  vec3 diff = base * (1. - metal) * (0.05 + 0.55 * sky * sky) * ao;
  vec3 F0 = mix(vec3(0.04), base, metal);
  vec3 F = F0 + (1. - F0) * pow(1. - ndv, 5.) * (1. - rough * 0.7);
  vec3 spec = envCol(p, r, rough) * F;
  if(coat > 0.){
    float fc = 0.04 + 0.96 * pow(1. - ndv, 5.);
    spec += envCol(p, r, 0.0) * fc * coat * (mat == M_BODY && uPaintRough > 0.3 ? 0.15 : 1.);
  }
  // headlight bounce on nearby surfaces
  vec3 col = diff + spec * mix(1., ao, 0.65);
  col *= 1. - 0.9 * gap;
  col += emis;
  return col;
}

vec3 shadeFloor(vec3 p, vec3 rd, float t, out float aoOut){
  float n1 = fbm(p.xz * 1.1), n2 = fbm(p.xz * 6.5);
  vec3 alb = vec3(0.24, 0.24, 0.25) * (0.72 + 0.30 * n1 + 0.14 * n2);
  // lane markings
  float lane = (1. - smoothstep(0.045, 0.06, abs(abs(p.z) - 3.2))) * step(0.45, fract(p.x * 0.22));
  float bay = (1. - smoothstep(0.045, 0.06, abs(mod(p.x + 1.25, 2.5) - 1.25))) * step(3.3, abs(p.z)) * step(abs(p.z), 6.0);
  alb = mix(alb, vec3(0.62, 0.62, 0.6), max(lane, bay) * 0.8);
  float lx = mod(p.x + 1.5, 3.0) - 1.5;
  float lz = mod(p.z + 1.75, 3.5) - 1.75;
  float E = 0.05 + 0.20 * exp(-lx * lx * 0.30) * (0.65 + 0.35 * exp(-lz * lz * 0.2));
  float ao = 1.;
  if(gMode != 0 || uT > 5.3){
    float kb = gMode != 0 ? 1. : smoothstep(5.4, 8.0, uT);
    float fp = sdRBox2(p.xz, vec2(2.30, 0.93 + uWide * 0.07), 0.5);
    float a1 = mix(0.10, 1., smoothstep(-0.25, 0.9, fp));
    a1 *= mix(0.25, 1., smoothstep(-0.35, 0.35, fp + 0.3));
    ao = mix(mix(1., 0.55 + 0.45 * smoothstep(-0.2, 0.5, fp), smoothstep(5.3, 6.4, uT)), a1, kb);
    float kw = gMode != 0 ? 1. : smoothstep(5.9, 6.9, uT);
    for(int i = 0; i < 4; i++){
      vec2 c = vec2(i < 2 ? FX : RX, (i % 2 == 0 ? 1. : -1.) * (0.80 + uWide * 0.05));
      float dw = sdRBox2(p.xz - c, vec2(0.17, 0.14), 0.08);
      ao *= mix(1., mix(0.15, 1., smoothstep(-0.05, 0.35, dw)), kw);
    }
  } else if(uT > 3.0){
    float hubR = 0.42 * mix(1., 0.16, smoothstep(3.0, 3.85, uT));
    ao = mix(0.2, 1., smoothstep(-0.05, 0.6, length(p.xz) - hubR));
  } else if(abs(p.x) < 5.5 && abs(p.z) < 3.3){
    float occ = 0.;
    for(int i = uZero; i < 4; i++){
      float h = 0.10 + 0.22 * float(i);
      float d = scene(p + vec3(0., h, 0.)).x;
      occ += max(h - d, 0.) * (1.0 - 0.18 * float(i));
    }
    ao = clamp(1. - 1.3 * occ, 0.05, 1.);
  }
  aoOut = ao;
  vec3 col = alb * E * ao;
  vec3 r = reflect(rd, vec3(0., 1., 0.));
  float fr = 0.02 + 0.35 * pow(1. - max(-rd.y, 0.), 5.);
  col += envCol(p, r, 0.6) * fr * 0.6 * ao;
  col += headlightPool(p) * uLights * alb * 0.9 * ao;
  if(uBay > 0.){
    float e = length(p.xz * vec2(0.60, 1.0)) - 2.05;
    col += vec3(0.9, 0.92, 0.95) * exp(-e * e * 1800.) * 0.8 * uBay;
    col *= mix(1., 0.55 + 0.45 * smoothstep(3.6, 1.2, length(p.xz * vec2(0.6, 1.))), uBay);
  }
  return col;
}

vec3 background(vec3 ro, vec3 rd, float tp, vec3 pn, float tFloor, float tCeil){
  if(tp < min(tFloor, tCeil)) return shadePillar(ro + rd * tp, pn);
  if(tFloor < tCeil){ float ao; return shadeFloor(ro + rd * tFloor, rd, tFloor, ao); }
  vec3 p = ro + rd * tCeil;
  return vec3(0.012) + tubes(p.xz, 0.004 + tCeil * 0.0012) * vec3(1., 0.98, 0.95) * 7.5;
}

vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0., 1.); }

void main(){
  vec2 uv = (gl_FragCoord.xy / uRes) * 2. - 1.;
  float aspect = uRes.x / uRes.y;
  vec2 suv = uv - uShift;
  vec3 rd = normalize(uCamFwd + uCamRight * suv.x * uTanHalf * aspect + uCamUp * suv.y * uTanHalf);
  vec3 ro = uCamPos;

  float tFloor = rd.y < 0. ? -ro.y / rd.y : 1e9;
  float tCeil = rd.y > 0. ? (CEIL - ro.y) / rd.y : 1e9;
  vec3 pn; float tp = pillarHit(ro, rd, pn);
  float tb = min(tp, min(tFloor, tCeil));
  bool floorBg = tFloor <= tCeil && tFloor < tp;

  bool intro = uT < 9.5;
  bool xray = !intro && uXray > 0.002;
  gMode = intro ? 0 : (xray ? 3 : 1);
  vec3 bg = background(ro, rd, tp, pn, tFloor, tCeil);
  if(xray) bg *= mix(1., 0.35, uXray);

  vec3 col = bg;
  float tHit = 1e9;
  vec3 pro = ro, prd = rd; float ptmax = tb; float tOff = 0.;
  float reflW = 0.;
  int kind = 0; // 0 primary, 1 shell, 2 reflection

  for(int pass = uZero; pass < 2; pass++){
    if(pass == 1){
      if(xray){ gMode = 2; kind = 1; pro = ro; prd = rd; ptmax = min(tHit, tb); }
      else if(reflW > 0.){ kind = 2; }
      else break;
    }
    vec2 h = march(pro, prd, ptmax, kind == 2 ? 56 : 120);
    if(h.x > 0.){
      vec3 p = pro + prd * h.x;
      vec3 n = calcN(p, 0.0012);
      float ao = kind == 2 ? 1. : calcAO(p, n);
      vec3 c = shadeObj(p, prd, h.y, n, ao, h.x + tOff);
      if(kind == 0){
        col = c; tHit = h.x;
        if(xray) col += vec3(0.55, 0.62, 0.75) * pow(1. - max(dot(n, -rd), 0.), 2.) * 0.35 * uXray;
      } else if(kind == 1){
        float fr = pow(1. - abs(dot(n, rd)), 2.5);
        float alpha = mix(1., 0.03 + 0.42 * fr, uXray);
        c = mix(c, c * 0.45, uXray);
        vec3 pb = vec3(p.x, p.y + uRide, p.z);
        float grid = max(1. - smoothstep(0.0, 0.004, abs(fract(pb.x * 6.) - 0.5) - 0.495), 1. - smoothstep(0.0, 0.004, abs(fract(pb.y * 6.) - 0.5) - 0.495));
        col = mix(col, c, alpha) + vec3(0.62, 0.72, 0.9) * (fr * fr * 0.55 + grid * 0.05) * uXray;
        tHit = min(tHit, h.x);
      } else {
        col = mix(col, c, reflW);
      }
    } else if(kind == 0 && !intro && !xray && floorBg && uReflect > 0.){
      vec3 fp = ro + rd * tFloor;
      vec3 r = reflect(rd, vec3(0., 1., 0.));
      float fr = 0.02 + 0.35 * pow(1. - max(-rd.y, 0.), 5.);
      reflW = uReflect * (0.20 + 0.45 * fr) * (1. - smoothstep(6., 14., tFloor));
      pro = fp + r * 0.002; prd = r; ptmax = 6.; tOff = tFloor;
    }
  }

  // headlight flare
  if(uLights > 0.01){
    for(int i = 0; i < 2; i++){
      vec3 lp = headlightPos(i == 0 ? 1. : -1.);
      vec3 w = lp - ro;
      float tc = dot(w, rd);
      if(tc > 0. && tc < tHit + 0.03){
        float d = length(w - rd * tc);
        float facing = smoothstep(-0.2, 0.6, dot(normalize(ro - lp), vec3(1., 0., 0.)));
        float z = dot(w, uCamFwd);
        vec2 sp = vec2(dot(w, uCamRight) / (z * uTanHalf * aspect), dot(w, uCamUp) / (z * uTanHalf)) + uShift;
        float streak = exp(-abs(uv.y - sp.y) * 140.) * exp(-abs(uv.x - sp.x) * 3.2) * 0.35;
        vec3 fl = uDrl * (exp(-d * d * 2500.) * 3.0 + exp(-d * 18.) * 0.18 + streak);
        col += fl * facing * uLights;
      }
    }
  }

  float tf = min(tHit, tb);
  col = mix(col, vec3(0.001, 0.001, 0.0012), 1. - exp(-tf * 0.06));
  col *= uExposure;
  col = aces(col);
  col = pow(col, vec3(1. / 2.2));
  vec2 q = gl_FragCoord.xy / uRes;
  col *= 0.55 + 0.45 * pow(16. * q.x * q.y * (1. - q.x) * (1. - q.y), 0.18);
  col += (hash21(gl_FragCoord.xy + fract(uTime) * 91.) - 0.5) * 0.018;
  fragColor = vec4(col, 1.);
}
