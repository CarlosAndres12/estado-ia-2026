/* Boot. Deferred scripts run in document order once the HTML is parsed, so everything is loaded here.
 *
 *   index.html?render=<videoId>   bare canvas for the tools: window.renderFrame(t), videoDuration,
 *                                 videoChapters (EIA.engine.player.mountRender, js/engine/player.js)
 *   index.html?lamina=<laminaId>  same for one lámina (EIA.engine.lamina.mountRender, js/engine/lamina.js)
 *   index.html                    the course site (EIA.ui.boot, js/ui/views.js)
 */
(function (EIA) {
  'use strict';

  var q = EIA.util.query();

  if (q.render) {
    EIA.engine.player.mountRender(q.render, q);
  } else if (q.lamina) {
    EIA.engine.lamina.mountRender(q.lamina, q);
  } else if (EIA.ui.boot) {
    EIA.ui.boot();
  } else {
    document.getElementById('main').textContent = 'El sitio todavía se está construyendo.';
  }
})(window.EIA);
