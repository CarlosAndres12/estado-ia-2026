/* Estado de la IA 2026 — seeded randomness (prompt §5.2, §5.6).
 *
 * Every random-looking choice in the art comes from here, so any frame is a pure function of its
 * inputs. Seeds are strings such as 'v02:capacidad:bubble' (numbers are accepted and stringified).
 *
 *   EIA.engine.rng.create(seed) -> r()            uniform in [0, 1), plus helpers:
 *       r.range(a, b)   float in [a, b)            r.int(a, b)     integer in [a, b] (inclusive)
 *       r.pick(arr)     one element                r.chance(p)     true with probability p
 *       r.sign()        -1 or 1                    r.jitter(a)     float in [-a, a)
 *       r.gauss(m, sd)  normal sample              r.shuffle(arr)  shuffled copy
 *       r.fork(name)    independent child generator seeded from (seed + '/' + name)
 *   EIA.engine.rng.hash(string) -> uint32           xmur3-style string hash
 *   EIA.engine.rng.mulberry32(uint32) -> () => [0, 1)
 *   EIA.engine.rng.value(seed, i) -> [0, 1)         stateless lattice value (for noise)
 *   EIA.engine.rng.noise1(x, seed) -> [-1, 1]       smooth 1D value noise (ambient motion, wobble)
 *   EIA.engine.rng.noise2(x, y, seed) -> [-1, 1]    smooth 2D value noise (textures)
 *
 * Generators are deterministic: create('a') always yields the same sequence. Never use Math.random
 * in drawing code.
 */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  var E = EIA.engine = EIA.engine || {};

  // xmur3 string hash (public-domain construction), finalized with a murmur-style avalanche.
  function hash(str) {
    str = String(str);
    var h = 1779033703 ^ str.length;
    for (var i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^ (h >>> 16)) >>> 0;
  }

  function mulberry32(a) {
    a = a >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function create(seed) {
    var key = seed == null ? '' : String(seed);
    var next = mulberry32(hash(key));
    var r = function () { return next(); };
    r.seed = key;
    r.range = function (a, b) { return a + (b - a) * next(); };
    r.int = function (a, b) { return a + Math.floor((b - a + 1) * next()); };
    r.pick = function (arr) { return arr[Math.floor(next() * arr.length)]; };
    r.chance = function (p) { return next() < p; };
    r.sign = function () { return next() < 0.5 ? -1 : 1; };
    r.jitter = function (amount) { return (next() * 2 - 1) * amount; };
    r.gauss = function (mean, sd) {
      var u = 1 - next(), v = next();
      return (mean || 0) + (sd == null ? 1 : sd) * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
    r.shuffle = function (arr) {
      var out = arr.slice();
      for (var i = out.length - 1; i > 0; i--) {
        var j = Math.floor(next() * (i + 1));
        var tmp = out[i]; out[i] = out[j]; out[j] = tmp;
      }
      return out;
    };
    r.fork = function (name) { return create(key + '/' + name); };
    return r;
  }

  // Integer lattice hash -> [0, 1). Stateless, so noise can be sampled at any t without history.
  function lattice(seedNum, i) {
    var h = (seedNum ^ Math.imul(i | 0, 0x27d4eb2d)) >>> 0;
    h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
    h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
    return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
  }

  var seedCache = {};
  function seedNumber(seed) {
    if (typeof seed === 'number') return seed >>> 0;
    var k = seed == null ? '' : String(seed);
    var v = seedCache[k];
    if (v === undefined) v = seedCache[k] = hash(k);
    return v;
  }

  function value(seed, i) { return lattice(seedNumber(seed), i); }

  function smooth(t) { return t * t * (3 - 2 * t); }

  function noise1(x, seed) {
    var s = seedNumber(seed);
    var i = Math.floor(x), f = x - i;
    var a = lattice(s, i), b = lattice(s, i + 1);
    return (a + (b - a) * smooth(f)) * 2 - 1;
  }

  function noise2(x, y, seed) {
    var s = seedNumber(seed);
    var ix = Math.floor(x), iy = Math.floor(y), fx = smooth(x - ix), fy = smooth(y - iy);
    function at(a, b) { return lattice(s, (Math.imul(a, 73856093) ^ Math.imul(b, 19349663)) | 0); }
    var v00 = at(ix, iy), v10 = at(ix + 1, iy), v01 = at(ix, iy + 1), v11 = at(ix + 1, iy + 1);
    var top = v00 + (v10 - v00) * fx, bot = v01 + (v11 - v01) * fx;
    return (top + (bot - top) * fy) * 2 - 1;
  }

  E.rng = {
    create: create,
    hash: hash,
    mulberry32: mulberry32,
    value: value,
    noise1: noise1,
    noise2: noise2
  };
})(typeof window !== 'undefined' ? window : globalThis);
