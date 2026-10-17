/* Estado de la IA 2026 — easing and interpolation (prompt §5.2, §6.3).
 *
 *   EIA.engine.easing = {
 *     clamp(x, a = 0, b = 1), lerp(a, b, t), invLerp(a, b, x), map(x, a, b, c, d),
 *     segment(p, a, b)   0 before a, 0→1 between a and b, 1 after b (beats inside a scene)
 *     in, out, inOut     cubic easings on [0, 1]
 *     sineIn, sineOut, sineInOut, smooth (smoothstep), smoother (smootherstep)
 *     back(t, s)         ease-out with a small overshoot; NEVER for data marks (they must not pass
 *                        their value on the way in)
 *     stagger(p, i, n, spread)   progress of item i of n when n items start one after another
 *     loop(t, period)    (t mod period) / period in [0, 1)
 *     pulse(t, period)   0→1→0 cosine pulse, for gentle twinkles
 *   }
 * All functions are pure.
 */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  var E = EIA.engine = EIA.engine || {};

  function clamp(x, a, b) {
    if (a == null) a = 0;
    if (b == null) b = 1;
    return x < a ? a : x > b ? b : x;
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function invLerp(a, b, x) { return b === a ? 0 : (x - a) / (b - a); }
  function map(x, a, b, c, d) { return c + (d - c) * invLerp(a, b, x); }
  function segment(p, a, b) {
    if (b <= a) return p >= b ? 1 : 0;
    return clamp((p - a) / (b - a), 0, 1);
  }

  function easeIn(t) { t = clamp(t); return t * t * t; }
  function easeOut(t) { t = 1 - clamp(t); return 1 - t * t * t; }
  function easeInOut(t) {
    t = clamp(t);
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  function sineIn(t) { return 1 - Math.cos(clamp(t) * Math.PI / 2); }
  function sineOut(t) { return Math.sin(clamp(t) * Math.PI / 2); }
  function sineInOut(t) { return -(Math.cos(Math.PI * clamp(t)) - 1) / 2; }
  function smooth(t) { t = clamp(t); return t * t * (3 - 2 * t); }
  function smoother(t) { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); }
  function back(t, s) {
    t = clamp(t);
    if (s == null) s = 1.70158;
    var u = t - 1;
    return 1 + (s + 1) * u * u * u + s * u * u;
  }

  // Item i of n starts after the previous ones; spread (0..1) is how much of the whole span each
  // item takes (1 = all at once, small = strictly one after another).
  function stagger(p, i, n, spread) {
    if (n <= 1) return clamp(p);
    if (spread == null) spread = 0.35;
    var start = (1 - spread) * (i / (n - 1));
    return segment(p, start, start + spread);
  }

  function loop(t, period) {
    var u = (t % period) / period;
    return u < 0 ? u + 1 : u;
  }
  function pulse(t, period) { return 0.5 - 0.5 * Math.cos(2 * Math.PI * loop(t, period)); }

  E.easing = {
    clamp: clamp,
    lerp: lerp,
    invLerp: invLerp,
    map: map,
    segment: segment,
    'in': easeIn,
    out: easeOut,
    inOut: easeInOut,
    sineIn: sineIn,
    sineOut: sineOut,
    sineInOut: sineInOut,
    smooth: smooth,
    smoother: smoother,
    back: back,
    stagger: stagger,
    loop: loop,
    pulse: pulse
  };
})(typeof window !== 'undefined' ? window : globalThis);
