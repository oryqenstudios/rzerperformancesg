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
uniform float uXray;
uniform float uLights;
uniform float uBay;
uniform float uShow;       // showroom lighting: overhead spotlight on, garage lights dimmed
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
const float R     = 0.33;    // tyre radius
const float FX    = 1.31;    // front axle
const float RX    = -1.315;  // rear axle
const float TRK   = 0.755;   // wheel centre |z| (half the track)
const float CEIL  = 3.35;
const vec3  SPOT  = vec3(0.0, 3.30, 0.0);   // showroom spotlight above the car, pointing down
const vec3  SPOTC = vec3(1.0, 0.97, 0.92);
const vec2  RECT  = vec2(2.15, 0.86);       // floor rectangle the rods run out to (half extents)

// material ids
const float M_BODY = 1., M_TIRE = 2., M_RIM = 3., M_ROTOR = 4., M_CALIPER = 5., M_CARBON = 6.,
            M_EXH = 7., M_PAINTONLY = 8., M_CHASSIS = 9., M_ALU = 10., M_LIQUID = 11., M_SEAT = 12.,
            M_TURBO = 13., M_TRIM = 14., M_CHROME = 15., M_COOLER = 16.;

int gMode; // 1 car, 2 shell (xray), 3 inner (xray)

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
float sdSeg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.); return length(pa - ba * h); }
float sdCap(vec3 p, vec3 a, vec3 b, float r){ vec3 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.); return length(pa - ba * h) - r; }
float sdEll(vec3 p, vec3 r){ float k0 = length(p / r); float k1 = length(p / (r * r)); return k0 * (k0 - 1.) / k1; }
void U(inout vec2 r, float d, float m){ if(d < r.x) r = vec2(d, m); }

// ---------------------------------------------------------------- body (Evo IX-style four-door saloon)
const int NP = 20;
const vec2 PROF[NP] = vec2[NP](
  vec2( 2.17, 0.145), vec2( 2.265, 0.190), vec2( 2.295, 0.340), vec2( 2.29, 0.520), vec2( 2.25, 0.665),
  vec2( 2.13, 0.740), vec2( 1.75, 0.800), vec2( 1.25, 0.865), vec2( 0.84, 0.925), vec2( 0.42, 1.150),
  vec2( 0.03, 1.360), vec2(-0.40, 1.405), vec2(-0.95, 1.390), vec2(-1.30, 1.250), vec2(-1.62, 1.080),
  vec2(-2.17, 1.045), vec2(-2.26, 0.950), vec2(-2.285, 0.620), vec2(-2.25, 0.300), vec2(-2.12, 0.150));

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
  float f = exp(-pow((x - FX) / 0.50, 2.)), r = exp(-pow((x - RX) / 0.55, 2.));
  return 0.845 + 0.035 * f + 0.030 * r + uWide * (0.07 * f + 0.08 * r);
}
float shoulderY(float x){ return mix(1.01, 0.975, smoothstep(-1.6, 0.8, x)); }   // beltline
float cabinHW(vec3 pb){
  float t = pb.y - shoulderY(pb.x);
  float tumble = 0.56 * 0.5 * (t + sqrt(t * t + 0.0025));
  float tuck = 0.05 * smoothstep(0.34, 0.12, pb.y);
  return halfW(pb.x) - tumble - tuck;
}
vec2 exhaustSlot(float az, out float r){ // returns (zc, yc) of nearest tip for |z|=az
  if(uExhaust == 1){ r = 0.043; return vec2(az < 0.57 ? 0.50 : 0.64, 0.215); }
  if(uExhaust == 2){ r = 0.056; return vec2(0.085, 0.235); }
  r = 0.054; return vec2(0.56, 0.215);
}

float bodySDF(vec3 pb){
  float hwm = 0.89 + uWide * 0.08;
  float bb = sdBox(pb - vec3(0., 0.80, 0.), vec3(2.33, 0.66, hwm + 0.02));
  if(bb > 0.10) return bb;
  float side = sdProfile(pb.xy);
  float rr = pb.x > 0. ? 0.42 : 0.30;
  vec2 q = abs(pb.xz) - vec2(2.29, hwm) + rr;
  float plan = min(max(q.x, q.y), 0.) + length(max(q, 0.)) - rr;
  float sect = (abs(pb.z) - cabinHW(pb)) * 0.8;
  float d = smax(side, plan, 0.06);
  d = smax(d, sect, 0.08);
  // wheel arches
  float ax = pb.x > 0. ? FX : RX;
  float arch = length(pb.xy - vec2(ax, R)) - (0.395 + uWide * 0.025);
  arch = max(arch, 0.46 - abs(pb.z));
  d = smax(d, -arch, 0.025);
  // big lower intake in the front bumper; the intercooler core shows through it
  float iz = 0.53 - (pb.y - 0.21) * 0.30;
  float intake = max(sdBox2(vec2(pb.x - 2.33, pb.y - 0.355), vec2(0.10, 0.135)), abs(pb.z) - iz);
  d = smax(d, -intake, 0.02);
  // exhaust openings
  float er; vec2 ez = exhaustSlot(abs(pb.z), er);
  float hole = max(length(vec2(pb.y - ez.y, abs(pb.z) - ez.x)) - er - 0.016, pb.x + 2.15);
  d = smax(d, -hole, 0.01);
  // factory wing: body-colour blade on two pedestals
  if(uSpoiler == 1 && pb.x < -1.80 && pb.y > 0.98){
    vec3 w = pb - vec3(-2.07, 1.17, 0.); w.xy = rot(0.10) * w.xy;
    float blade = sdRBox(w, vec3(0.12, 0.014, 0.76), 0.012);
    float ped = sdRBox(vec3(pb.x + 2.05, pb.y - 1.10, abs(pb.z) - 0.55), vec3(0.055, 0.07, 0.016), 0.012);
    d = min(d, min(blade, ped));
  }
  return d;
}

float carbonParts(vec3 pb){
  float d = 1e9;
  float hwm = 0.87 + uWide * 0.08;
  if(uLip > 0){
    float ext = uLip == 1 ? 0.03 : 0.075;
    vec2 q = abs(pb.xz) - vec2(2.25 + ext, hwm) + 0.42;
    float pl = min(max(q.x, q.y), 0.) + length(max(q, 0.)) - 0.42;
    float lip = max(pl, abs(pb.y - 0.142) - (uLip == 1 ? 0.012 : 0.010));
    lip = max(lip, 1.72 - pb.x);
    d = min(d, lip);
    if(uLip == 2){ // canards on the bumper corners
      vec3 c = vec3(pb.x - 2.15, pb.y - 0.31, abs(pb.z) - 0.80);
      c.xy = rot(-0.22) * c.xy;
      d = min(d, sdRBox(c, vec3(0.075, 0.006, 0.075), 0.004));
    }
  }
  if(uSkirts == 1){
    float sk = max(max(abs(pb.x) - 0.90, abs(pb.y - 0.175) - 0.035), abs(pb.z) - (halfW(pb.x) + 0.02));
    d = min(d, sk - 0.004);
  }
  if(uDiffuser == 1 && pb.x < -1.8){
    float base = sdBox(vec3(pb.x + 2.10, pb.y - 0.135, pb.z), vec3(0.15, 0.010, 0.70));
    float fz = mod(pb.z + 0.09, 0.18) - 0.09;
    float top = 0.14 + max(-pb.x - 1.98, 0.) * 0.5;
    float fin = max(abs(fz) - 0.005, max(pb.y - top, 0.12 - pb.y));
    fin = max(fin, max(abs(pb.z) - 0.64, max(pb.x + 1.95, -2.29 - pb.x)));
    d = min(d, min(base, fin));
  }
  if(uSpoiler == 2){
    vec3 l = pb - vec3(-2.235, 1.06, 0.);
    l.xy = rot(0.30) * l.xy;
    d = min(d, sdRBox(l, vec3(0.06, 0.008, 0.78), 0.006));
  }
  if(uSpoiler == 3 && pb.x < -1.6 && pb.y > 0.98){
    vec3 w = pb - vec3(-2.04, 1.41, 0.);
    w.xy = rot(0.13) * w.xy;
    float blade = sdRBox(w, vec3(0.17, 0.013, 0.90), 0.011);
    float plate = sdRBox(vec3(pb.x + 2.04, pb.y - 1.39, abs(pb.z) - 0.905), vec3(0.17, 0.065, 0.006), 0.004);
    float upr = sdRBox(vec3(pb.x + 2.00, pb.y - 1.22, abs(pb.z) - 0.42), vec3(0.06, 0.18, 0.007), 0.004);
    d = min(d, min(blade, min(plate, upr)));
  }
  return d;
}

float mirrorSDF(vec3 pb){
  vec3 m = vec3(pb.x - 0.70, pb.y - 1.04, abs(pb.z) - 0.90);
  if(dot(m, m) > 0.09) return length(m) - 0.2;
  float head = sdEll(m, vec3(0.07, 0.05, 0.10));
  float stalk = sdRBox(m - vec3(0.02, -0.035, -0.085), vec3(0.03, 0.012, 0.06), 0.008);
  return smin(head, stalk, 0.02);
}

float exhaustSDF(vec3 pb, out float inner){
  float r; vec2 ez = exhaustSlot(abs(pb.z), r);
  vec2 yz = vec2(pb.y - ez.y, abs(pb.z) - ez.x);
  float rr = length(yz);
  inner = rr - r + 0.004;
  return max(abs(rr - r) - 0.005, abs(pb.x + 2.24) - 0.07);
}

// ---------------------------------------------------------------- wheels
vec3 wheelLocal(vec3 p){
  float ax = p.x > 0.04 ? FX : RX;
  return vec3(p.x - ax, p.y - R, abs(p.z) - (TRK + uWide * 0.05));
}
vec2 wheelSDF(vec3 p){
  vec3 q = wheelLocal(p);
  float bl = length(q);
  if(bl > 0.46) return vec2(bl - 0.38, M_TIRE);
  vec2 res = vec2(1e9, M_TIRE);
  float rim = uRimR;
  float r = length(q.xy);
  float rc = 0.5 * (R + rim + 0.006), hr = 0.5 * (R - rim - 0.006);
  float tire = sdRBox2(vec2(r - rc, q.z), vec2(hr, 0.128), min(0.05, hr * 0.92));
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
  d2 = min(d2, r - 0.068);
  float face = max(d2, abs(q.z - faceZ) - 0.017);
  float cap = max(r - 0.034, abs(q.z - 0.068) - 0.012);
  rimD = min(rimD, min(face, cap));
  U(res, rimD, M_RIM);
  // brakes
  float rotor = max(r - (rim - 0.034), abs(q.z + 0.020) - 0.013);
  U(res, rotor, M_ROTOR);
  float th = p.x > 0.04 ? -2.09 : -1.05;
  vec2 cq = rot(th) * q.xy;
  float cal = sdRBox(vec3(cq.x - (rim - 0.068), cq.y, q.z + 0.018), vec3(0.040, 0.090, 0.040), 0.016);
  U(res, cal, M_CALIPER);
  return res;
}

// ---------------------------------------------------------------- chassis / engine / interior
// t once timed each group growing in for the 3D intro (now replaced by the hero film); the x-ray passes 99.
float chassisSDF(vec3 p, float t){
  vec3 q = vec3(p.x, p.y, abs(p.z));
  // perimeter frame, rising out of the rectangle the rods drew on the floor
  float kr = smoothstep(5.3, 6.0, t);
  vec2 hs = mix(RECT, vec2(2.02, 0.56), kr);
  vec2 rq = vec2(abs(sdBox2(p.xz, hs)) - mix(0.004, 0.042, kr), abs(p.y - mix(0.0105 + uRide, 0.24, kr)) - mix(0.004, 0.058, kr));
  float d = length(max(rq, 0.)) + min(max(rq.x, rq.y), 0.) - mix(0.006, 0.014, kr);
  // cross members, inner aprons and top mounts (the blobs that swell at the corners)
  float km = 1. - smoothstep(5.7, 6.35, t);
  float c = sdCap(q, vec3(FX, 0.27, 0.0), vec3(FX, 0.27, 0.56), 0.045);
  c = min(c, sdCap(q, vec3(RX, 0.27, 0.0), vec3(RX, 0.27, 0.56), 0.045));
  c = min(c, sdCap(q, vec3(0.25, 0.22, 0.0), vec3(0.25, 0.22, 0.56), 0.030));
  c = min(c, sdCap(q, vec3(-0.62, 0.22, 0.0), vec3(-0.62, 0.22, 0.56), 0.030));
  for(int i = 0; i < 2; i++){
    float ax = i == 0 ? FX : RX;
    c = min(c, sdRBox(q - vec3(ax, 0.47, 0.41), vec3(0.13, 0.23, 0.025), 0.02));
    c = min(c, sdRBox(q - vec3(ax - 0.03, 0.70, TRK - 0.25), vec3(0.08, 0.025, 0.08), 0.02));
  }
  d = smin(d, c + km * 0.10, 0.05);
  // suspension: wishbones and coilovers
  float ks = 1. - smoothstep(6.2, 6.9, t);
  float s = 1e9;
  for(int i = 0; i < 2; i++){
    float ax = i == 0 ? FX : RX;
    float tz = TRK + uWide * 0.05;
    s = min(s, sdCap(q, vec3(ax - 0.18, 0.20, 0.52), vec3(ax, 0.22, tz - 0.12), 0.018));
    s = min(s, sdCap(q, vec3(ax + 0.16, 0.20, 0.52), vec3(ax, 0.22, tz - 0.12), 0.018));
    s = min(s, sdCap(q, vec3(ax - 0.14, 0.50, 0.46), vec3(ax, 0.50, tz - 0.13), 0.015));
    vec3 sp = q - vec3(ax - 0.03, 0.0, tz - 0.25);
    float spring = length(vec2(length(sp.xz) - 0.05 - 0.008 * sin(sp.y * 95.), max(abs(sp.y - 0.46) - 0.19, 0.))) - 0.012;
    s = min(s, spring * 0.8);
  }
  d = min(d, s + ks * 0.08);
  // greenhouse frame: pillars and roof rails, there before the body pours over them
  float kc = 1. - smoothstep(7.8, 8.5, t);
  float g = sdCap(q, vec3(0.80, 0.94, 0.70), vec3(0.06, 1.33, 0.59), 0.022);
  g = min(g, sdCap(q, vec3(0.06, 1.33, 0.59), vec3(-0.95, 1.35, 0.59), 0.022));
  g = min(g, sdCap(q, vec3(-0.95, 1.35, 0.59), vec3(-1.62, 1.04, 0.72), 0.024));
  g = min(g, sdCap(q, vec3(-0.27, 0.95, 0.80), vec3(-0.30, 1.36, 0.60), 0.022));
  g = min(g, sdCap(q, vec3(0.06, 1.33, 0.0), vec3(0.06, 1.33, 0.59), 0.020));
  g = min(g, sdCap(q, vec3(-0.95, 1.35, 0.0), vec3(-0.95, 1.35, 0.59), 0.020));
  g = min(g, sdCap(q, vec3(0.82, 0.93, 0.0), vec3(0.82, 0.93, 0.74), 0.024));
  g = min(g, sdCap(q, vec3(0.80, 0.94, 0.74), vec3(0.80, 0.26, 0.58), 0.026));
  d = min(d, g + kc * 0.06);
  return d;
}

vec2 engineSDF(vec3 p, float t){
  vec2 res = vec2(1e9, M_ALU);
  vec3 a = vec3(p.x, p.y, abs(p.z));
  // transverse turbo four: block, cam cover, intake plenum
  float ke = (1. - smoothstep(6.6, 7.4, t)) * 0.12;
  vec3 q = p - vec3(1.50, 0., -0.05);
  U(res, sdRBox(q - vec3(0., 0.46, 0.), vec3(0.19, 0.16, 0.30), 0.035) + ke, M_ALU);
  U(res, sdRBox(q - vec3(-0.02, 0.655, 0.), vec3(0.12, 0.04, 0.27), 0.03) + ke, M_CHASSIS);
  U(res, sdCap(q, vec3(0.17, 0.60, -0.24), vec3(0.17, 0.60, 0.24), 0.055) + ke, M_CARBON);
  // turbo and downpipe on the bulkhead side
  vec3 tq = q - vec3(-0.27, 0.47, 0.10);
  U(res, length(vec2(length(tq.xy) - 0.06, tq.z)) - 0.042 + ke, M_TURBO);
  U(res, sdCap(q, vec3(-0.27, 0.47, 0.10), vec3(-0.42, 0.22, 0.10), 0.034) + ke, M_TURBO);
  // front-mount intercooler and its pipes
  float kc = (1. - smoothstep(7.0, 7.6, t)) * 0.10;
  U(res, sdRBox(p - vec3(2.12, 0.355, 0.), vec3(0.03, 0.12, 0.48), 0.01) + kc, M_COOLER);
  U(res, sdCap(a, vec3(2.08, 0.40, 0.46), vec3(1.72, 0.56, 0.36), 0.03) + kc, M_ALU);
  // four-wheel-drive driveline and exhaust
  float kd = (1. - smoothstep(6.8, 7.5, t)) * 0.10;
  U(res, sdRBox(p - vec3(1.42, 0.34, 0.36), vec3(0.16, 0.12, 0.10), 0.04) + kd, M_ALU);
  U(res, sdCap(p, vec3(1.25, 0.28, 0.), vec3(RX + 0.1, 0.30, 0.), 0.034) + kd, M_CHASSIS);
  U(res, length(p - vec3(RX, 0.33, 0.)) - 0.11 + kd, M_ALU);
  U(res, sdCap(a, vec3(RX, 0.33, 0.), vec3(RX, 0.33, TRK - 0.06), 0.024) + kd, M_CHASSIS);
  U(res, sdCap(a, vec3(FX, 0.33, 0.), vec3(FX, 0.33, TRK - 0.06), 0.024) + kd, M_CHASSIS);
  U(res, sdCap(a, vec3(1.0, 0.20, 0.12), vec3(-2.18, 0.215, 0.56), 0.034) + kd, M_TURBO);
  // seats and steering wheel (right-hand drive, +z)
  float kk = (1. - smoothstep(7.6, 8.2, t)) * 0.10;
  vec3 s = vec3(p.x + 0.12, p.y, abs(p.z) - 0.38);
  float seat = sdRBox(s - vec3(0., 0.38, 0.), vec3(0.24, 0.06, 0.20), 0.05);
  vec3 sb = s - vec3(-0.24, 0.68, 0.); sb.xy = rot(-0.22) * sb.xy;
  seat = min(seat, sdRBox(sb, vec3(0.06, 0.30, 0.20), 0.05));
  seat = min(seat, sdRBox(vec3(p.x + 1.02, p.y - 0.42, p.z), vec3(0.24, 0.07, 0.60), 0.05));
  seat = min(seat, sdRBox(vec3(p.x + 1.26, p.y - 0.70, p.z), vec3(0.06, 0.26, 0.60), 0.05));
  U(res, seat + kk, M_SEAT);
  vec3 w = p - vec3(0.42, 0.90, 0.38); w.xy = rot(0.45) * w.xy;
  U(res, length(vec2(length(w.yz) - 0.17, w.x)) - 0.018 + kk, M_SEAT);
  return res;
}

// ---------------------------------------------------------------- scene
vec2 carScene(vec3 p){
  float bnd = sdBox(p - vec3(0., 0.80, 0.), vec3(2.42, 0.80, 1.06 + uWide * 0.08));
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
    U(res, chassisSDF(pb, 99.), M_CHASSIS);
    vec2 e = engineSDF(pb, 99.); if(e.x < res.x) res = e;
    if(pb.x < -2.05 && pb.y < 0.4){ float inn; U(res, exhaustSDF(pb, inn), M_EXH); }
    return res;
  }
  return carScene(p);
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
  bmin = vec3(-2.62, -0.01, -1.22); bmax = vec3(2.62, 1.62, 1.22);
}

vec2 march(vec3 ro, vec3 rd, float tmax, int steps){
  vec3 bmin, bmax; sceneBox(bmin, bmax);
  vec2 bh = boxHit(ro, rd, bmin, bmax);
  if(bh.x > bh.y || bh.y < 0.) return vec2(-1., 0.);
  float t = max(bh.x, 0.0);
  float t1 = min(bh.y, tmax);
  float k = 0.92;
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

// overhead spotlight cone at p, 0..1 (no shadowing)
float spotAt(vec3 p){
  vec3 L = SPOT - p;
  float c = L.y / length(L);
  return smoothstep(0.74, 0.90, c) * (0.8 + 0.2 * smoothstep(0.93, 0.995, c));
}

vec3 headlightPos(float s){ return vec3(2.24, 0.643 - uRide, 0.62 * s); }

vec3 envCol(vec3 p, vec3 r, float rough){
  vec3 c;
  if(r.y > 0.){
    float t = (CEIL - p.y) / max(r.y, 1e-3);
    vec2 cp = p.xz + r.xz * t;
    float w = 0.02 + rough * 0.55 + t * 0.003;
    c = vec3(0.010) + vec3(1.0, 0.98, 0.95) * tubes(cp, w) * 7.5 * exp(-t * 0.035) * mix(1., 0.22, uShow);
    c += vec3(0.008) * smoothstep(0.9, 0.2, r.y);
    // the spotlight's lens and its soft halo
    float ds = length(cp - SPOT.xz);
    c += SPOTC * uShow * (30. * (1. - smoothstep(0.16, 0.16 + w * 2., ds)) + 0.5 * exp(-ds * ds * 1.5));
    c = mix(vec3(0.018), c, smoothstep(0.0, 0.22, r.y));
  } else {
    float t = -p.y / min(r.y, -1e-3);
    vec2 fp = p.xz + r.xz * t;
    float lx = mod(fp.x + 1.5, 3.0) - 1.5;
    c = vec3(0.012) * (0.5 + exp(-lx * lx * 0.35)) * mix(1., 0.3, uShow);
    c += vec3(0.24) * uShow * spotAt(vec3(fp.x, 0., fp.y));   // the lit pool on the floor
    c = mix(vec3(0.018), c, smoothstep(0.0, -0.2, r.y));
  }
  // distant aisle glow at the horizon defines side surfaces
  c += vec3(0.16, 0.16, 0.17) * exp(-abs(r.y) * 38.) * (0.35 + 0.65 * smoothstep(0.3, 1., abs(r.x))) * mix(1., 0.4, uShow);
  // lit side bays: a soft wall glow the body sides can pick up
  c += vec3(0.075, 0.075, 0.08) * smoothstep(0.35, 0.95, abs(r.z)) * smoothstep(0.45, 0.0, abs(r.y - 0.05)) * mix(1., 0.45, uShow);
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
  return alb * E * mix(1., 0.3, uShow);
}


vec3 shadeObj(vec3 p, vec3 rd, float mat, vec3 n, float ao, float t){
  vec3 v = -rd;
  float ndv = max(dot(n, v), 0.);
  vec3 r = reflect(rd, n);
  vec3 pb = vec3(p.x, p.y + uRide, p.z);
  vec3 base = vec3(0.02); float rough = 0.3, metal = 0., coat = 0., gap = 0.;
  vec3 emis = vec3(0.);

  if(mat == M_BODY || mat == M_PAINTONLY){
    base = uPaint; rough = uPaintRough; metal = uPaintMetal; coat = 1.;
    if(mat == M_BODY){
      float az = abs(pb.z);
      float sy = shoulderY(pb.x);
      float edge = cabinHW(pb) - az;
      bool upper = pb.y > sy + 0.02;
      bool roof = pb.y > 1.30 && n.y > 0.75 && pb.x > -0.92 && pb.x < 0.0;
      bool glass = false, black = false;
      if(upper){
        float prof = sdProfile(pb.xy);
        if(pb.x > 0.07 && pb.x < 0.86 && n.x > 0.25 && edge > 0.07) glass = true;            // windscreen
        float front = 0.77 - (pb.y - 0.925) * 1.86;   // follows the A-pillar
        float rear  = -1.17 + (pb.y - 1.0) * 0.45;    // C-pillar
        if(abs(n.z) > 0.45 && pb.x < front && pb.x > rear && prof < -0.045){                  // side glass
          glass = true;
          if(abs(pb.x + 0.27) < 0.045){ glass = false; black = true; }                         // B-pillar
        }
        if(pb.x < -0.97 && pb.x > -1.58 && n.y > 0.35 && edge > 0.08) glass = true;             // rear screen
      }
      if(glass){ base = mix(vec3(0.03, 0.032, 0.035), vec3(0.002), uTint); rough = 0.; metal = 0.; coat = 0.; }
      if(black){ base = vec3(0.004); rough = 0.; metal = 0.; coat = 1.; }
      if(roof && uRoof == 1) mat = M_CARBON;
      // wheel wells: the inside of the arch cut stays dark
      if(length(pb.xy - vec2(pb.x > 0. ? FX : RX, R)) < 0.42 + uWide * 0.025 && az < cabinHW(pb) - 0.015){
        base = vec3(0.006); rough = 0.6; metal = 0.; coat = 0.;
      }
      // bonnet: optional carbon, factory vents either way
      bool hood = pb.x > 0.95 && pb.x < 2.13 && n.y > 0.5 && pb.y > 0.72 && az < 0.71;
      if(hood){
        if(uHood == 1) mat = M_CARBON;
        float sl = 0.;
        if(az < 0.20 && pb.x > 1.50 && pb.x < 1.86) sl = 1. - smoothstep(0.30, 0.45, abs(fract(pb.x * 26.) - 0.5));
        if(az > 0.30 && az < 0.52 && pb.x > 1.05 && pb.x < 1.40) sl = 1. - smoothstep(0.30, 0.45, abs(fract(pb.x * 24.) - 0.5));
        gap = max(gap, sl * 0.9);
      }
      // panel gaps: four doors, handles, bonnet and boot shut lines
      if(abs(n.z) > 0.4 && pb.y < sy + 0.005 && pb.y > 0.22){
        gap = max(gap, 1. - smoothstep(0.0, 0.006, abs(pb.x - (0.80 - (pb.y - 0.95) * 0.12))));
        gap = max(gap, 1. - smoothstep(0.0, 0.006, abs(pb.x + 0.27)));
        if(pb.y > 0.62) gap = max(gap, 1. - smoothstep(0.0, 0.006, abs(pb.x + 1.02)));
        if(abs(pb.y - 0.89) < 0.011 && (abs(pb.x - 0.20) < 0.075 || abs(pb.x + 0.62) < 0.075)) gap = max(gap, 0.8);
      }
      if(n.y > 0.4 && pb.x > 0.95 && pb.x < 2.10) gap = max(gap, 1. - smoothstep(0.0, 0.006, abs(az - 0.71)));
      if(n.y > 0.4 && az < 0.71 && pb.x > 0.92 && pb.x < 0.98) gap = max(gap, 1. - smoothstep(0.0, 0.006, abs(pb.x - 0.95)));
      if(n.y > 0.4 && pb.x < -1.64) gap = max(gap, 1. - smoothstep(0.0, 0.006, abs(az - 0.68)));
      // front end
      if(pb.x > 1.95){
        // lower intake: the intercooler core behind the opening
        if(pb.x < 2.27 && pb.y > 0.21 && pb.y < 0.50 && az < 0.53 - (pb.y - 0.21) * 0.30){
          base = vec3(0.06) * (0.35 + 0.65 * step(0.45, fract(pb.y * 70.))); rough = 0.35; metal = 1.; coat = 0.; mat = M_TRIM;
        }
        if(n.x > 0.2){
          // headlights: clear lens over a dark housing, two projectors each with a halo ring
          float y0 = 0.578 + (0.84 - az) * 0.05, y1 = 0.705 - (az - 0.42) * 0.02;
          if(az > 0.40 && az < 0.85 && pb.y > y0 && pb.y < y1){
            base = vec3(0.02); rough = 0.; metal = 0.5; coat = 1.; mat = M_TRIM;
            float ring = 0., lens = 0.;
            for(int i = 0; i < 2; i++){
              float dd = length(vec2(az - (i == 0 ? 0.53 : 0.71), pb.y - 0.643));
              ring = max(ring, 1. - smoothstep(0.004, 0.009, abs(dd - 0.040)));
              lens = max(lens, 1. - smoothstep(0.020, 0.026, dd));
            }
            emis = uDrl * (ring * 10. + lens * 5.) * uLights;
            base += vec3(0.25) * max(ring, lens * 0.6) * (1. - uLights);
          }
          // upper grille between the lights, and the corner intakes
          bool grille = az < 0.37 && pb.y > 0.60 && pb.y < 0.70;
          bool corner = az > 0.60 && az < 0.83 && pb.y > 0.24 && pb.y < 0.40;
          if(grille || corner){
            vec2 hp = vec2(pb.z, pb.y) * 38.; hp.x += mod(floor(hp.y), 2.) * 0.5;
            float hex = smoothstep(0.25, 0.4, length(fract(hp) - 0.5));
            base = vec3(0.004 + 0.02 * hex); coat = 0.3; rough = 0.4; metal = 0.; mat = M_TRIM;
          }
        }
      }
      // rear end: round tail lamps in the corners
      if(pb.x < -2.10 && n.x < -0.15){
        float az2 = abs(pb.z);
        if(az2 > 0.40 && az2 < 0.86 && pb.y > 0.80 && pb.y < 0.955 - (az2 - 0.40) * 0.06){
          base = vec3(0.07, 0.0, 0.0); coat = 1.; rough = 0.; metal = 0.;
          float ring = 0.;
          for(int i = 0; i < 2; i++){
            float dd = length(vec2(az2 - (i == 0 ? 0.56 : 0.74), pb.y - 0.875));
            ring = max(ring, 1. - smoothstep(0.006, 0.014, abs(dd - 0.045)));
          }
          emis = vec3(1.0, 0.03, 0.02) * (0.25 + 3.2 * uLights) * (0.05 + ring);
        }
        if(pb.y < 0.30){ base = vec3(0.006); rough = 0.5; coat = 0.2; metal = 0.; }
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
    rough = 0.12; coat = 1.; metal = 0.;
  }
  if(mat == M_EXH){
    float inn; exhaustSDF(pb, inn);
    float u = clamp((pb.x + 2.31) / 0.14, 0., 1.);
    if(uExFinish == 1){ base = mix(mix(vec3(0.20, 0.35, 0.80), vec3(0.50, 0.25, 0.62), u), vec3(0.80, 0.58, 0.28), u * u); rough = 0.12; metal = 1.; }
    else if(uExFinish == 2){ base = vec3(0.035); rough = 0.45; coat = 0.4; }
    else { base = vec3(0.92); rough = 0.04; metal = 1.; }
    if(inn < 0.) { base *= 0.15; }
  }
  if(mat == M_CHASSIS){ base = vec3(0.014); rough = 0.12; coat = 1.; }
  if(mat == M_ALU){ base = vec3(0.55, 0.56, 0.58); rough = 0.35; metal = 1.; }
  if(mat == M_TURBO){ base = vec3(0.62, 0.50, 0.40); rough = 0.25; metal = 1.; }
  if(mat == M_SEAT){ base = vec3(0.02); rough = 0.6; }
  if(mat == M_CHROME){ base = vec3(0.92); rough = 0.03; metal = 1.; }
  if(mat == M_COOLER){ base = vec3(0.10) * (0.4 + 0.6 * step(0.45, fract(p.y * 70.))); rough = 0.35; metal = 1.; }

  float sky = 0.5 + 0.5 * n.y;
  float spot = uShow * spotAt(p) * max(dot(n, normalize(SPOT - p)), 0.);
  // light bouncing up off the lit floor pool onto the body sides
  float bounce = uShow * spotAt(vec3(p.x + n.x * 0.7, 0., p.z + n.z * 0.7)) * (0.5 - 0.5 * n.y) * 0.45;
  vec3 diff = base * (1. - metal) * ((0.05 + 0.55 * sky * sky) * mix(1., 0.4, uShow) + spot * 1.5 + bounce) * ao;
  diff += base * metal * (spot * 0.9 + bounce * 0.6) * ao;   // metallic flake picks up the spot
  vec3 F0 = mix(vec3(0.04), base, metal);
  vec3 F = F0 + (1. - F0) * pow(1. - ndv, 5.) * (1. - rough * 0.7);
  vec3 spec = envCol(p, r, rough) * F;
  if(coat > 0.){
    float fc = 0.04 + 0.96 * pow(1. - ndv, 5.);
    spec += envCol(p, r, 0.0) * fc * coat * (mat == M_BODY && uPaintRough > 0.3 ? 0.15 : 1.);
  }
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
  float E = (0.05 + 0.20 * exp(-lx * lx * 0.30) * (0.65 + 0.35 * exp(-lz * lz * 0.2))) * mix(1., 0.28, uShow);
  E += uShow * 0.50 * spotAt(p);
  float ao = 1.;
  {
    // analytic contact shadow: the car's footprint plus four wheel patches
    float fp = sdRBox2(p.xz, vec2(2.24, 0.84 + uWide * 0.07), 0.42);
    ao = mix(0.10, 1., smoothstep(-0.25, 0.9, fp)) * mix(0.25, 1., smoothstep(-0.35, 0.35, fp + 0.3));
    for(int i = 0; i < 4; i++){
      vec2 c = vec2(i < 2 ? FX : RX, (i % 2 == 0 ? 1. : -1.) * (TRK + uWide * 0.05));
      float dw = sdRBox2(p.xz - c, vec2(0.16, 0.13), 0.08);
      ao *= mix(0.15, 1., smoothstep(-0.05, 0.35, dw));
    }
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
  vec3 c = vec3(0.012) + tubes(p.xz, 0.004 + tCeil * 0.0012) * vec3(1., 0.98, 0.95) * 7.5 * mix(1., 0.25, uShow);
  float ds = length(p.xz - SPOT.xz);   // the spotlight fixture
  c += SPOTC * uShow * (14. * (1. - smoothstep(0.15, 0.17, ds)) + 0.25 * exp(-ds * ds * 3.));
  return c;
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

  bool xray = uXray > 0.002;
  gMode = xray ? 3 : 1;
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
    } else if(kind == 0 && !xray && floorBg && uReflect > 0.){
      vec3 fp = ro + rd * tFloor;
      vec3 r = reflect(rd, vec3(0., 1., 0.));
      float fr = 0.02 + 0.35 * pow(1. - max(-rd.y, 0.), 5.);
      reflW = uReflect * (0.20 + 0.45 * fr) * (1. - smoothstep(6., 14., tFloor)) * (1. + 0.5 * uShow);
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

  // the spotlight beam hanging in the air
  if(uShow > 0.01){
    float dd = dot(rd.xz, rd.xz);
    float ts = dd > 1e-5 ? -dot(ro.xz - SPOT.xz, rd.xz) / dd : 0.;
    float behind = step(tf, ts);
    ts = clamp(ts, 0., tf);
    vec3 ps = ro + rd * ts;
    float hgt = clamp(ps.y, 0., CEIL);
    float coneR = (SPOT.y - hgt) * 0.68 + 0.10;
    float rad = length(ps.xz - SPOT.xz);
    float beam = exp(-rad * rad / (coneR * coneR) * 2.4) * min(1.6, coneR / max(sqrt(dd), 0.3));
    beam *= 0.35 + 0.65 * smoothstep(0., SPOT.y, hgt);
    col += SPOTC * beam * uShow * 0.085 * (1. - 0.6 * behind);
  }

  col = mix(col, vec3(0.001, 0.001, 0.0012), 1. - exp(-tf * 0.06));
  col *= uExposure;
  col = aces(col);
  col = pow(col, vec3(1. / 2.2));
  vec2 q = gl_FragCoord.xy / uRes;
  col *= 0.55 + 0.45 * pow(16. * q.x * q.y * (1. - q.x) * (1. - q.y), 0.18);
  col += (hash21(gl_FragCoord.xy + fract(uTime) * 91.) - 0.5) * 0.018;
  fragColor = vec4(col, 1.);
}
