/* js/data/course.js — pending (see odd/tasks/estado-ia-2026-site.md). */

/* [player] Copy of the video player chrome (js/engine/player.js, recorder.js and the linear cards of
 * captions.js). Owner: T05. Words in {braces} are filled in by the player. */
EIA.data.course = EIA.data.course || {}; EIA.data.course.ui = EIA.data.course.ui || {}; EIA.data.course.ui.player = {
  region: 'Video: {titulo}',
  lienzo: 'Video «{titulo}». En pantalla: {escena}',
  atajos: 'Atajos de teclado: Espacio o K reproduce o pausa; las flechas izquierda y derecha retroceden o avanzan 5 segundos; con Mayús, cambian de capítulo; C muestra u oculta los subtítulos; F activa la pantalla completa.',
  cargando: 'Preparando el video…',
  error: 'No se pudo preparar este video.',
  escenaPendiente: 'Escena en preparación',

  reproducir: 'Reproducir',
  pausar: 'Pausar',
  reproducirVideo: 'Reproducir el video «{titulo}»',
  verDeNuevo: 'Ver de nuevo',
  continuarDonde: 'Continuar donde ibas ({tiempo})',
  desdeInicio: 'Desde el inicio',

  barra: 'Posición en el video',
  barraValor: '{actual} de {total}',
  barraValorCapitulo: '{actual} de {total}, capítulo {n}: {capitulo}',
  tiempo: '{actual} / {total}',
  duracion: 'Duración: {tiempo}',
  vistaPrevia: '{tiempo} · {capitulo}',

  capitulos: 'Capítulos',
  capituloBoton: '{n} · {titulo}',
  capituloAria: 'Ir al capítulo {n}: {titulo}',
  continuarCon: 'Continuar con: {titulo}',
  finCapitulo: 'Terminó el capítulo «{titulo}».',
  finVideo: 'Terminó el video.',

  opciones: 'Opciones del video',
  subtitulos: 'Subtítulos',
  voz: 'Voz',
  velocidad: 'Velocidad',
  velocidadLenta: '0,75×',
  velocidadNormal: '1×',
  velocidadAria: 'Velocidad {valor}',
  preguntasInteractivas: 'Preguntas interactivas',
  pausarCapitulo: 'Pausar al final de cada capítulo',
  pantallaCompleta: 'Pantalla completa',
  salirPantallaCompleta: 'Salir de pantalla completa',

  vozNavegador: 'Voz del navegador',
  sinVoz: 'Este navegador no tiene una voz en español: sigue el video con los subtítulos.',

  narrador: 'Narrador',
  lectora: 'Lectora',

  transcripcion: 'Transcripción',
  escena: 'Escena {n}',
  irA: 'Ir a {tiempo}',
  fuenteLinea: 'Fuente:',
  ilustrativo: 'Ejemplo ilustrativo · no es un dato',
  pregunta: 'Pregunta',
  respuesta: 'Respuesta: {opcion}',

  fuentes: 'Fuentes de este video',
  fuentesVacio: 'Este video no usa cifras del banco.',
  tipoEvidencia: 'Tipo de evidencia:',
  estado: 'Estado:',
  enlaceFuente: 'Abrir la fuente: {fuente}',
  copiarCita: 'Copiar cita',
  copiado: '¡Copiado!',
  noCopiado: 'No se pudo copiar. Selecciona el texto de la cita y cópialo a mano.',

  laminas: 'Láminas relacionadas',
  lamina: 'D{n} · {titulo}',
  abrirLamina: 'Abrir la lámina D{n}: {titulo}',

  advertencia: 'Advertencia {n}',

  checkpoint: {
    titulo: 'Pausa: piensa y responde',
    opciones: 'Elige una respuesta',
    muyBien: '¡Muy bien!',
    casi: 'Casi. Pista: {pista}',
    casiSinPista: 'Casi. Vuelve a intentarlo.',
    continuar: 'Continuar',
    lineal: 'Pausa el video y respondan en grupo',
    respuesta: 'Respuesta'
  },

  descarga: {
    titulo: 'Descargar video',
    mp4: 'Descargar MP4',
    mp4Detalle: 'Video ya exportado · {tamano} · {tiempo}',
    megabytes: '{n} MB',
    grabar: 'Grabar y descargar el video',
    grabarDetalle: 'Se graba aquí, en tiempo real: {tiempo}.',
    capitulo: 'Descargar este capítulo',
    capituloDetalle: 'Capítulo {n}: {titulo} · {tiempo}',
    aviso: 'La grabación se hace en tiempo real: tarda lo mismo que lo que vas a grabar, {tiempo}. Mantén esta pestaña visible hasta que termine.',
    sinVozArchivo: 'Abriste el sitio como archivo (file://) y así el navegador no deja grabar la voz: el video se grabará sin voz, con subtítulos. Para grabarla, abre el sitio desde un servidor local (el README explica cómo).',
    sinVozNavegador: 'La voz del navegador no se puede grabar: el video se grabará sin voz, con subtítulos.',
    sinVozNinguna: 'Este video todavía no tiene narración grabada: se grabará sin voz, con subtítulos.',
    sinVozApagada: 'La voz está apagada: el video se grabará sin voz.',
    empezar: 'Empezar a grabar',
    cancelar: 'Cancelar',
    grabando: 'Grabando: {actual} de {total}',
    progreso: 'Progreso de la grabación',
    detener: 'Detener y descartar',
    enPausa: 'Grabación en pausa: vuelve a esta pestaña para continuar.',
    listo: 'Listo: se descargó «{archivo}».',
    descartada: 'Grabación descartada.',
    noSoportado: 'Este navegador no permite grabar el video. Prueba con una versión reciente de Chrome, Edge o Firefox.',
    error: 'La grabación se detuvo por un error: {detalle}',
    archivoCapitulo: 'capitulo-{n}'
  }
};
