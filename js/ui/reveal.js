/* Estado de la IA 2026 — scroll reveals (prompt §10.13): cards settle like paper placed on a desk,
 * underlines and dividers draw on, signs drift in a little. The motion itself is CSS (classes
 * .reveal → .reveal.is-in, css/components.css [page-shell]); with prefers-reduced-motion everything
 * becomes a simple fade, and without IntersectionObserver everything is shown at once.
 *
 *   EIA.ui.reveal.init()          adds html.has-motion when reveals can run (called by EIA.ui.boot)
 *   EIA.ui.reveal.observe(el)     watches every .reveal inside el that has not been revealed yet
 *   EIA.ui.reveal.show(el)        reveals el (and its .reveal descendants) at once */
(function (root) {
  'use strict';

  var EIA = root.EIA = root.EIA || {};
  var ui = EIA.ui = EIA.ui || {};
  var doc = root.document;

  var io = null;
  var supported = typeof root.IntersectionObserver === 'function';

  function reveal(el) {
    el.classList.add('is-in');
    if (io) io.unobserve(el);
  }

  function init() {
    if (!supported || io) return;
    doc.documentElement.classList.add('has-motion');
    io = new root.IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) reveal(en.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    // Printing shows everything, revealed or not.
    root.addEventListener('beforeprint', function () {
      Array.prototype.forEach.call(doc.querySelectorAll('.reveal:not(.is-in)'), reveal);
    });
  }

  function observe(el) {
    if (!el) return;
    var list = el.querySelectorAll('.reveal:not(.is-in)');
    if (!io) {
      Array.prototype.forEach.call(list, function (x) { x.classList.add('is-in'); });
      return;
    }
    Array.prototype.forEach.call(list, function (x) { io.observe(x); });
  }

  function show(el) {
    if (!el) return;
    if (el.classList && el.classList.contains('reveal')) reveal(el);
    Array.prototype.forEach.call(el.querySelectorAll('.reveal:not(.is-in)'), reveal);
  }

  ui.reveal = { init: init, observe: observe, show: show };
})(typeof window !== 'undefined' ? window : globalThis);
