/* Estado de la IA 2026 — hash router (prompt §9.1).
 *
 * Routes: #inicio #mapa #evidencia #s0 #s1…#s7 #proyecto #cifras #glosario #preguntas #referencias
 * #asistente #clase. #s0 is the AI timeline (js/ui/linea-tiempo.js). Deep links name a block after a slash:
 * #s0/alphago (a milestone), #s3/actividad, #cifras/adop-1,
 * #glosario/costo-total, #preguntas/p3, #clase/<1–7|taller> (Modo clase, js/ui/presenter.js).
 *
 *   EIA.router.parse(hash)          -> { route, block, known }   pure; unknown routes -> 'inicio'
 *   EIA.router.format(route, block) -> '#route' | '#route/block'
 *   EIA.router.neighbors(route)     -> { prev, next } in course order (null outside it)
 *   EIA.router.sessionNumber(route) -> 1…7 for s1…s7, else 0 (s0 is the timeline, not a KB session)
 *   EIA.router.start(handler)       listens to hashchange; handler(state, info) renders the view, then
 *                                   the router fires window event 'eia:route' { detail: { route, block } }.
 *                                   info = { initial, sameRoute, previous }
 *   EIA.router.go(route, block)     navigates (pushes a history entry)
 *   EIA.router.replace(route, block) rewrites the hash without a history entry or a new render
 *   EIA.router.refresh()            re-runs the handler for the current hash (same-link clicks)
 *   EIA.router.current() / previous() -> the current / previous state (previous is null at first)
 *
 * The pure part (parse, format, neighbors) runs in Node for the tests: nothing touches the DOM until
 * start() is called. */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};

  var ORDER = ['inicio', 'mapa', 'evidencia', 's0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 'proyecto'];
  var ROUTES = ORDER.concat(['cifras', 'glosario', 'preguntas', 'referencias', 'asistente', 'clase']);
  var CLASE_ARGS = ['1', '2', '3', '4', '5', '6', '7', 'taller'];
  var BLOCK_RE = /^[a-z0-9][a-z0-9-]*$/;

  function decode(s) {
    try { return decodeURIComponent(s); } catch (err) { return null; }
  }

  function parse(hash) {
    var raw = String(hash == null ? '' : hash).trim();
    if (raw.charAt(0) === '#') raw = raw.slice(1);
    raw = raw.split('?')[0];
    var whole = decode(raw);
    if (whole === null) {
      // A malformed escape: keep the route part if it decodes on its own.
      var cut = raw.indexOf('/');
      whole = (decode(cut < 0 ? raw : raw.slice(0, cut)) || '') + '/';
    }
    whole = whole.toLowerCase().replace(/^\/+/, '');
    var parts = whole.split('/');
    var route = parts[0].trim();
    var block = (parts[1] || '').trim();
    if (!route) return { route: 'inicio', block: '', known: true };
    if (ROUTES.indexOf(route) < 0) return { route: 'inicio', block: '', known: false };
    if (!BLOCK_RE.test(block)) block = '';
    if (route === 'clase' && CLASE_ARGS.indexOf(block) < 0) block = '';
    return { route: route, block: block, known: true };
  }

  function format(route, block) {
    return '#' + route + (block ? '/' + block : '');
  }

  function neighbors(route) {
    var i = ORDER.indexOf(route);
    if (i < 0) return { prev: null, next: null };
    return { prev: i > 0 ? ORDER[i - 1] : null, next: i < ORDER.length - 1 ? ORDER[i + 1] : null };
  }

  function sessionNumber(route) {
    var m = /^s([1-7])$/.exec(String(route || ''));
    return m ? Number(m[1]) : 0;
  }

  // ---------------------------------------------------------------------------------------------
  // Browser side

  var state = { route: 'inicio', block: '', known: true };
  var prev = null;
  var handler = null;
  var started = false;

  function copyState(s) { return { route: s.route, block: s.block, known: s.known }; }

  function emit() {
    var detail = { route: state.route, block: state.block };
    var ev;
    try {
      ev = new root.CustomEvent('eia:route', { detail: detail });
    } catch (err) {
      ev = root.document.createEvent('CustomEvent');
      ev.initCustomEvent('eia:route', false, false, detail);
    }
    root.dispatchEvent(ev);
  }

  function run(initial) {
    var next = parse(root.location.hash);
    var before = state;
    var sameRoute = !initial && before.route === next.route;
    if (!initial) prev = copyState(before);
    state = next;
    if (!next.known && root.history && root.history.replaceState) {
      // Unknown hashes (a stale link) land on #inicio without leaving a broken entry behind.
      try { root.history.replaceState(null, '', format('inicio')); } catch (err) { /* file:// quirks */ }
    }
    if (handler) handler(copyState(state), { initial: !!initial, sameRoute: sameRoute, previous: prev ? copyState(prev) : null });
    emit();
  }

  function start(fn) {
    handler = fn || handler;
    if (!started) {
      started = true;
      root.addEventListener('hashchange', function () { run(false); });
    }
    run(true);
  }

  function go(route, block) {
    var h = format(route, block);
    if (root.location.hash === h) run(false);
    else root.location.hash = h;
  }

  function replace(route, block) {
    var h = format(route, block);
    state = parse(h);
    if (root.history && root.history.replaceState) {
      try { root.history.replaceState(null, '', h); return; } catch (err) { /* fall through */ }
    }
    root.location.replace(h);
  }

  EIA.router = {
    ROUTES: ROUTES,
    ORDER: ORDER,
    CLASE_ARGS: CLASE_ARGS,
    parse: parse,
    format: format,
    neighbors: neighbors,
    sessionNumber: sessionNumber,
    start: start,
    go: go,
    replace: replace,
    refresh: function () { run(false); },
    current: function () { return copyState(state); },
    previous: function () { return prev ? copyState(prev) : null; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
