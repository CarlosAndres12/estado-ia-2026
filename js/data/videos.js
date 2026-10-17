/* js/data/videos.js — the 9 narrated videos as data (prompt §5.5 and §13, odd/spec/contracts.md §2).
 *
 * The scripts are final copy. Every line, rótulo, question, option and explanation below is the text
 * of prompt §13, verbatim: edit it only to apply a decision about that copy, and never round,
 * paraphrase or "fix" a figure. Scene modules (js/videos/vNN-<slug>.js) draw what is here by key;
 * they never type a string, a number or a source. The transcript, the subtitles, the voice-over
 * tools and "Fuentes de este video" are all generated from this file.
 *
 * EIA.data.videos = [video, ...] in course order (v01 ... v09).
 *
 * video = {
 *   id, slug,        'v01' ... 'v09'; the slug names the module file and exported media (<slug>.mp4)
 *   title, sesion,   Spanish title; course session 1-7
 *   laminas,         related láminas (EIA.data.deck ids), [] when the script names none
 *   rate,            narrator voice rate, e.g. '0%' (a line may override it with `rate`)
 *   target,          [minSeconds, maxSeconds]: intended length, a review warning, never a hard cut
 *   poster,          { scene, p }: poster frame = scene id + progress 0-1 inside that scene
 *   chapters,        [{ title, from }]: `from` is the id of the chapter's first scene
 *   scenes,          [scene, ...] in playing order
 *   checkpoints      [checkpoint, ...]
 * }
 *
 * scene = {
 *   id,              unique inside its video; also the key of the scene's draw function
 *   min,             minimum seconds; the voice sets the final length (prompt §6.2)
 *   seVe,            one-line Spanish description of what is on screen
 *   rotulos,         { key: { text, cifras?, ilustrativo? } }: every string the scene draws (the quoted
 *                    copy of its "Se ve"), in drawing order
 *   lines            [line, ...] in speaking order
 * }
 *   rotulos[key].cifras       ids of the figures whose numbers the rótulo shows, taken from the scene
 *                             line that says them. Dates that belong to a figure («hasta diciembre de
 *                             2024», the AI Act milestones) carry its ids; years that only name a
 *                             moment (a road sign «2030», a title) carry none (prompt §3.8). A figure
 *                             drawn without its number written on screen (a dot field, a count of
 *                             cards) takes its ids from the lines.
 *   rotulos[key].ilustrativo  the rótulo's numbers are an illustrative example, not data.
 *
 * line = { voice, text, say?, pause?, rate?, cifras?, ilustrativo?, advertencia? }
 *   voice        'narrador' | 'lectora' (tools/voice.config.json maps each role to a voice)
 *   text         display text and subtitles, verbatim
 *   say          explicit speakable text; replaces the normalizer's reading of `text` (prompt §8.4)
 *   pause        seconds of silence after the line
 *   cifras       figures whose numbers the line uses: KB §13 rows ('adop-1' ... 'alc-4') and context
 *                figures ('ctx-<slug>'), resolved with EIA.cifra(id)
 *   ilustrativo  the line's numbers are an illustrative example (shows the "Ejemplo ilustrativo" stamp)
 *   advertencia  course warning the line presses (prompt §4.2): 1-4, or an array for two ([1, 2])
 *
 * checkpoint = { after, question, options, answer, explain, hint, cifras?, ilustrativo? }
 *   after        id of the scene it follows (a silent 6 s segment of the timeline, prompt §6.5)
 *   answer       index of the correct option in `options`
 *   explain      shown with "¡Muy bien!" after a right answer
 *   hint         shown after "Casi. Pista: " on a wrong try: it points back to an idea of the video,
 *                never names the answer, adds no facts and contains no numbers
 *
 * Prompt §13 notation as stored here: ⟨adop-1⟩ -> cifras: ['adop-1']; ⟨ctx: slug⟩ -> 'ctx-slug';
 * ⟨ilustrativo⟩ -> ilustrativo: true; ⟨adv N⟩ -> advertencia: N; (pausa N s) -> pause: N;
 * (say: "...") -> say. Every number in a line, rótulo, question, correct option or explanation must be
 * backed by its cifras or marked ilustrativo; plain years are exempt (tools/check-content.mjs).
 * Structure and references are checked by tools/test/videos-data.test.mjs (node --test).
 */
EIA.data.videos = [
  {
    id: 'v01',
    slug: 'iceberg',
    title: 'Adopción masiva, valor por demostrar',
    sesion: 1,
    laminas: ['d01', 'd02'],
    rate: '0%',
    target: [150, 210],
    poster: { scene: 'bajo-el-agua', p: 0.8 },
    chapters: [
      { title: 'La punta del iceberg', from: 'noche' },
      { title: 'Debajo del agua', from: 'bajo-el-agua' },
      { title: 'La ruta del curso', from: 'ruta' }
    ],
    scenes: [
      {
        id: 'noche',
        min: 12,
        seVe: 'Mar nocturno azul ultramar con olas caligráficas, luna creciente y estrellas irregulares; a lo lejos, una pequeña forma luminosa en el horizonte; el título se escribe a pincel: «Estado de la IA 2026».',
        rotulos: {
          titulo: { text: 'Estado de la IA 2026' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'En 2026, la inteligencia artificial pasó de ser una tecnología experimental a una infraestructura de propósito general: está en las organizaciones, en la educación, en la ciencia y en la medicina.'
          },
          { voice: 'narrador', text: 'Pero ¿cuánto valor produce de verdad? Empecemos por lo que se ve.' }
        ]
      },
      {
        id: 'punta',
        min: 14,
        seVe: 'La punta luminosa de un iceberg asoma sobre una línea de agua caligráfica, iluminada por una diminuta lámpara de IA en la cima; se escribe «88%» con el texto «de organizaciones usa IA en al menos una función» y su etiqueta de fuente; la lectora aparece en una esquina con su libreta.',
        rotulos: {
          cifra: { text: '88%', cifras: ['adop-1'] },
          etiqueta: { text: 'de organizaciones usa IA en al menos una función' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Según la encuesta de McKinsey de 2025, el 88% de las organizaciones usa IA de forma regular en al menos una función.',
            cifras: ['adop-1']
          },
          { voice: 'lectora', text: 'Un momento: ¿qué mide exactamente esa cifra?' },
          {
            voice: 'narrador',
            text: 'Mide uso declarado: lo que las organizaciones dicen hacer. Es la punta del iceberg.'
          }
        ]
      },
      {
        id: 'bajo-el-agua',
        min: 16,
        seVe: 'La línea de agua baja despacio y aparece la enorme masa sumergida en aguadas profundas; sobre ella se escriben en caligrafía blanco tiza «Escala», «Valor» y «Gobernanza»; luego emergen dos cifras: «Cerca de dos tercios no escalan la IA a toda la organización», en una cuadrícula de unidades con un tercio iluminado y remate «≈», y una barra «39%» con la nota «casi siempre menor de 5%».',
        rotulos: {
          escala: { text: 'Escala' },
          valor: { text: 'Valor' },
          gobernanza: { text: 'Gobernanza' },
          dosTercios: { text: 'Cerca de dos tercios no escalan la IA a toda la organización', cifras: ['adop-4'] },
          remateAprox: { text: '≈' },
          cifraEbit: { text: '39%', cifras: ['adop-5'] },
          notaEbit: { text: 'casi siempre menor de 5%', cifras: ['adop-5'] }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Debajo del agua está lo que decide el valor: la escala, el valor y la gobernanza.'
          },
          {
            voice: 'narrador',
            text: 'Cerca de dos tercios de las organizaciones no han escalado la IA a toda la organización. Y solo el 39% reporta algún impacto en su EBIT, la utilidad antes de intereses e impuestos; casi siempre, menor de 5%.',
            cifras: ['adop-4', 'adop-5']
          }
        ]
      },
      {
        id: 'advertencia',
        min: 12,
        seVe: 'Sobre un escritorio, una pequeña lámpara de IA brilla junto a un calendario lleno de días marcados, mientras una sola moneda sigue pequeña; el sello «Uso no es valor» se estampa en la página.',
        rotulos: {
          sello: { text: 'Uso no es valor' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Primera advertencia del curso: uso no es valor. Una organización puede usar IA todos los días sin obtener resultados.',
            advertencia: 1
          },
          {
            voice: 'narrador',
            text: 'El valor exige rediseñar flujos de trabajo, integrar datos, formar personas y medir contra una línea base.'
          }
        ]
      },
      {
        id: 'ruta',
        min: 16,
        seVe: 'Se despliega un mapa de ruta caligráfico; seis estaciones se dibujan en orden con sus signos: «Capacidad técnica», «Economía y adopción», «Trabajo y educación», «Ciencia y salud», «Riesgo y gobernanza» y «Agenda 2026–2028»; una estrella irregular hace de rosa de los vientos.',
        rotulos: {
          capacidad: { text: 'Capacidad técnica' },
          economia: { text: 'Economía y adopción' },
          trabajo: { text: 'Trabajo y educación' },
          ciencia: { text: 'Ciencia y salud' },
          riesgo: { text: 'Riesgo y gobernanza' },
          agenda: { text: 'Agenda 2026–2028' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Vamos a recorrer el estado de la IA en seis paradas: capacidad técnica; economía y adopción; trabajo y educación; ciencia y salud; riesgo y gobernanza; y, al final, la agenda 2026–2028.'
          },
          {
            voice: 'narrador',
            text: 'En cada parada vamos a distinguir lo que la IA logra en condiciones controladas de lo que produce en el mundo real.'
          }
        ]
      },
      {
        id: 'caso',
        min: 14,
        seVe: 'Un equipo de cuatro profesionales diversos, alrededor de una mesa, abre una tarjeta en blanco titulada «Nuestro caso de uso»; la tarjeta recorre el camino y recibe un pequeño sello en cada estación.',
        rotulos: {
          tarjeta: { text: 'Nuestro caso de uso' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Y no lo haremos en abstracto: cada equipo elegirá un caso de uso real de su contexto y lo desarrollará, sesión tras sesión, hasta el proyecto final.'
          },
          {
            voice: 'narrador',
            text: 'Por ejemplo: una tutoría, la atención a ciudadanos, una revisión de literatura, la clasificación de solicitudes o el apoyo a la redacción clínica.'
          }
        ]
      },
      {
        id: 'pregunta',
        min: 12,
        seVe: 'Una página de libreta con una gran pregunta escrita a mano y renglones vacíos; un lápiz espera; las estrellas flotan.',
        rotulos: {},
        lines: [
          {
            voice: 'narrador',
            text: 'Esta es la pregunta que guiará todo el curso: ¿cuánto valor verificable produce la IA, para quién y con qué controles?',
            pause: 3
          },
          { voice: 'lectora', text: 'Y antes de creerle a cualquier cifra, otra pregunta: ¿qué mide realmente?' }
        ]
      },
      {
        id: 'cierre',
        min: 10,
        seVe: 'De vuelta al mar: la línea de agua se asienta a media altura y deja ver juntas la punta y la masa; título final «No importa cuánta IA se usa, sino cuánto valor verificable produce.»; fundido lento a azul marino.',
        rotulos: {
          titulo: { text: 'No importa cuánta IA se usa, sino cuánto valor verificable produce.' }
        },
        lines: [
          { voice: 'narrador', text: 'Porque no importa cuánta IA se usa, sino cuánto valor verificable produce.' }
        ]
      }
    ],
    checkpoints: []
  },
  {
    id: 'v02',
    slug: 'que-mide',
    title: '¿Qué mide esta cifra?',
    sesion: 1,
    laminas: [],
    rate: '0%',
    target: [180, 270],
    poster: { scene: 'cinco-tipos', p: 0.8 },
    chapters: [
      { title: 'Cinco tipos de evidencia', from: 'titulares' },
      { title: 'Leer la fuente', from: 'fuentes' },
      { title: 'Cuatro advertencias', from: 'advertencias' }
    ],
    scenes: [
      {
        id: 'titulares',
        min: 12,
        seVe: 'Un remolino de titulares de prensa dibujados a mano, con líneas garabateadas y grandes signos «%» pero sin cifras legibles, cruza la página como hojas al viento; la lectora atrapa uno en su libreta.',
        rotulos: {
          signoPorcentaje: { text: '%' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Cada semana aparece una cifra nueva sobre inteligencia artificial. Pero no todas responden a la misma pregunta.'
          },
          { voice: 'lectora', text: 'Antes de repetir una cifra, pregúntate: ¿qué tipo de evidencia es?' }
        ]
      },
      {
        id: 'capacidad',
        min: 14,
        seVe: 'Un panel azul marino reglado de prueba; una pequeña lámpara de IA recorre una hoja de examen; una barra reglada crece desde su marca «~12%» hasta «66,3%»; el distintivo «Capacidad técnica» (un matraz) se escribe con su etiqueta de fuente.',
        rotulos: {
          inicio: { text: '~12%', cifras: ['cap-1'] },
          final: { text: '66,3%', cifras: ['cap-1'] },
          chip: { text: 'Capacidad técnica' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Primero, la capacidad técnica: el desempeño en evaluaciones controladas, los llamados benchmarks.'
          },
          {
            voice: 'narrador',
            text: 'Por ejemplo, en la prueba OSWorld, los agentes de IA pasaron de cerca de 12% a 66,3% de éxito.',
            cifras: ['cap-1']
          }
        ]
      },
      {
        id: 'uso',
        min: 12,
        seVe: 'Una oficina cálida; las personas hablan en bocadillos que suben y se funden en un gran bocadillo «88%»; aparece el distintivo «Uso declarado» (un bocadillo).',
        rotulos: {
          cifra: { text: '88%', cifras: ['adop-1'] },
          chip: { text: 'Uso declarado' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Segundo, el uso declarado: lo que personas u organizaciones dicen hacer. El 88% de las organizaciones dice usar IA en al menos una función.',
            cifras: ['adop-1']
          }
        ]
      },
      {
        id: 'resultado',
        min: 14,
        seVe: 'Una lupa sobre dos cronómetros junto al escritorio de un desarrollador; uno corre más tiempo: «+19% de tiempo»; aparecen el distintivo «Resultado observado» (una lupa) y una nota prendida: «METR lo marca hoy como desactualizado».',
        rotulos: {
          cifra: { text: '+19% de tiempo', cifras: ['prod-3'] },
          chip: { text: 'Resultado observado' },
          nota: { text: 'METR lo marca hoy como desactualizado' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Tercero, el resultado observado: un cambio medido en tiempo, costo, calidad o empleo.'
          },
          {
            voice: 'narrador',
            text: 'En un ensayo aleatorio de 2025, desarrolladores experimentados tardaron 19% más con IA. METR, que hizo el estudio, hoy lo marca como desactualizado.',
            cifras: ['prod-3']
          }
        ]
      },
      {
        id: 'expectativa',
        min: 12,
        seVe: 'Una directiva mira con un catalejo hacia un horizonte donde se alinean pequeñas lámparas de IA; un calendario marcado «12–18 meses»; el distintivo «Expectativa» (un catalejo).',
        rotulos: {
          plazo: { text: '12–18 meses', cifras: ['adop-8'] },
          chip: { text: 'Expectativa' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Cuarto, la expectativa: una intención declarada. El 81% de los líderes espera integrar agentes en 12 a 18 meses.',
            cifras: ['adop-8']
          }
        ]
      },
      {
        id: 'proyeccion',
        min: 12,
        seVe: 'Un cometa con cola de puntos cruza el cielo hacia una pequeña señal de camino «2030»; el distintivo «Proyección» (un cometa).',
        rotulos: {
          senal: { text: '2030' },
          chip: { text: 'Proyección' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Y quinto, la proyección: una estimación a futuro. Según el Foro Económico Mundial, el 39% de las competencias centrales cambiará hacia 2030.',
            cifras: ['trab-5']
          }
        ]
      },
      {
        id: 'cinco-tipos',
        min: 14,
        seVe: 'Los cinco distintivos se acomodan en fila como una leyenda, cada uno con su color, su signo y su nombre; la barra, el bocadillo, el cronómetro, el catalejo y el cometa vuelan cada uno hacia su distintivo.',
        rotulos: {},
        lines: [
          {
            voice: 'narrador',
            text: 'Capacidad técnica, uso declarado, resultado observado, expectativa y proyección. Cada tipo responde a una pregunta distinta.'
          },
          { voice: 'lectora', text: 'Y los titulares suelen mezclarlos como si fueran lo mismo.' }
        ]
      },
      {
        id: 'fuentes',
        min: 18,
        seVe: 'Cinco tarjetas de papel se abren en abanico, cada una con su familia de fuentes, «Stanford AI Index», «OIT y CEPAL», «McKinsey y Microsoft», «PwC» y «Benchmarks», y debajo su límite, que se va escribiendo.',
        rotulos: {
          stanford: { text: 'Stanford AI Index' },
          oitCepal: { text: 'OIT y CEPAL' },
          mckinseyMicrosoft: { text: 'McKinsey y Microsoft' },
          pwc: { text: 'PwC' },
          benchmarks: { text: 'Benchmarks' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Tampoco todas las fuentes miden lo mismo. El AI Index de Stanford integra muchas bases y evaluaciones, pero muchas de sus cifras son de laboratorio o de un solo país.'
          },
          {
            voice: 'narrador',
            text: 'La OIT y la CEPAL ofrecen indicadores comparables entre países, pero miden exposición o un índice compuesto, no impacto. McKinsey y Microsoft recogen percepciones, con autoinforme, sesgo de selección e interés comercial.'
          },
          {
            voice: 'narrador',
            text: 'PwC analiza vacantes y estados financieros, y muestra asociaciones, no causalidad. Y los benchmarks miden desempeño en condiciones controladas: se saturan y pueden quedar lejos del trabajo real.'
          }
        ]
      },
      {
        id: 'muestra',
        min: 14,
        seVe: 'Una gran red dibujada a mano en un mar de puntos que son organizaciones; solo algunos puntos quedan dentro de la red; el rótulo «Cobertura no es representatividad».',
        rotulos: {
          idea: { text: 'Cobertura no es representatividad' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Y recuerda: una encuesta grande sigue siendo una muestra de informantes, no un censo de empresas. Una cobertura amplia mejora la descripción, pero no elimina los sesgos.'
          }
        ]
      },
      {
        id: 'advertencias',
        min: 18,
        seVe: 'Cuatro sellos se estampan uno a uno en la página, cada uno con dos signos separados por un signo igual tachado.',
        rotulos: {},
        lines: [
          {
            voice: 'narrador',
            text: 'Por eso el curso tiene cuatro advertencias. Uso no es valor. Benchmark no es desempeño real.',
            advertencia: [1, 2]
          },
          { voice: 'narrador', text: 'Exposición no es desempleo. Y asociación no es causalidad.', advertencia: [3, 4] },
          { voice: 'lectora', text: 'Las vamos a usar en cada sesión.' }
        ]
      },
      {
        id: 'cierre',
        min: 10,
        seVe: 'La lectora ata una etiqueta de fuente a un gran número en la página de la libreta; la etiqueta dice «Fuente · Alcance · Tipo de evidencia»; título final «Toda cifra va con su fuente.»',
        rotulos: {
          etiqueta: { text: 'Fuente · Alcance · Tipo de evidencia' },
          titulo: { text: 'Toda cifra va con su fuente.' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Toda cifra va con su fuente, su alcance y su tipo de evidencia. Así empieza el criterio.'
          }
        ]
      }
    ],
    checkpoints: [
      {
        after: 'cinco-tipos',
        question: '«El 86% de los estudiantes usa IA» (Digital Education Council, 2024). ¿Qué tipo de evidencia es?',
        options: ['Capacidad técnica', 'Uso declarado', 'Resultado observado', 'Proyección'],
        answer: 1,
        explain: 'Es uso declarado: lo que los estudiantes dicen en una encuesta.',
        hint: 'Piensa en cómo se obtuvo la cifra: ¿en una prueba controlada, midiendo un cambio o preguntando a las personas?',
        cifras: ['edu-1']
      },
      {
        after: 'muestra',
        question: '«Los incidentes documentados pasaron de 233 a 362». ¿Qué le falta a esa cifra para saber si el riesgo creció?',
        options: ['Una fuente más conocida', 'Un denominador, como una tasa por unidad de adopción', 'Más decimales'],
        answer: 1,
        explain: 'Es un conteo bruto: puede reflejar más daños, pero también más uso y más reporte.',
        hint: 'Un conteo que sube puede deberse a varias cosas: ¿contra qué lo compararías para saber si el riesgo creció?',
        cifras: ['ries-1']
      },
      {
        after: 'advertencias',
        question: '«En las industrias más expuestas a la IA, el ingreso por empleado creció más». ¿Qué advertencia aplica?',
        options: ['Uso no es valor', 'Benchmark no es desempeño real', 'Exposición no es desempleo', 'Asociación no es causalidad'],
        answer: 3,
        explain: 'Esas industrias también tienen más capital, datos y capacidad gerencial: es una asociación, no un efecto causal.',
        hint: 'Piensa en las industrias de la pregunta: ¿se diferencian solo en la IA o también en otras cosas?'
      }
    ]
  },
  {
    id: 'v03',
    slug: 'frontera',
    title: 'La frontera irregular',
    sesion: 2,
    laminas: ['d03', 'd04', 'd05'],
    rate: '0%',
    target: [300, 420],
    poster: { scene: 'cordillera', p: 0.6 },
    chapters: [
      { title: 'Picos y valles', from: 'pregunta' },
      { title: 'De chatbot a agente', from: 'chatbot' },
      { title: 'Errores que se acumulan', from: 'pasos' },
      { title: 'Convergencia y concentración', from: 'peloton' }
    ],
    scenes: [
      {
        id: 'pregunta',
        min: 10,
        seVe: 'Un camino reglado de veinte pequeños pasos sobre una cuadrícula azul marino; una pequeña lámpara de IA espera en la salida; una mano cálida se detiene sobre un sello «Confiar».',
        rotulos: {
          sello: { text: 'Confiar' }
        },
        lines: [
          { voice: 'narrador', text: '¿Le confiarías a un agente de IA una tarea de 20 pasos?', ilustrativo: true },
          { voice: 'lectora', text: 'Depende: ¿qué tan bien hace cada paso y qué pasa si se equivoca?' }
        ]
      },
      {
        id: 'cordillera',
        min: 16,
        seVe: 'Una cordillera de montañas planas y biomórficas; dos picos se encienden en amarillo: «Preguntas científicas de nivel doctoral (GPQA)», con «Referencia de expertos: 81,2%», y «Matemáticas de competición»; un pequeño escalador cálido con una cuerda recorre la cresta.',
        rotulos: {
          picoGpqa: { text: 'Preguntas científicas de nivel doctoral (GPQA)' },
          referencia: { text: 'Referencia de expertos: 81,2%', cifras: ['cap-3'] },
          picoMatematicas: { text: 'Matemáticas de competición' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'La capacidad de la IA es una frontera irregular: picos muy altos junto a valles profundos.'
          },
          {
            voice: 'narrador',
            text: 'En los picos, los mejores modelos superan la referencia de expertos en preguntas científicas de nivel doctoral, la prueba GPQA, y alcanzan o superan a los mejores concursantes en matemáticas de competición.',
            cifras: ['cap-3']
          }
        ]
      },
      {
        id: 'casi-pico',
        min: 12,
        seVe: 'Una tercera cumbre casi alcanza una línea punteada, «mejor experto humano»; un pequeño corchete marca la distancia, «0,4 puntos»; el rótulo «MMMU: 88,2%».',
        rotulos: {
          lineaExperto: { text: 'mejor experto humano' },
          brecha: { text: '0,4 puntos', cifras: ['cap-3'] },
          mmmu: { text: 'MMMU: 88,2%', cifras: ['cap-3'] }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Otros picos casi llegan: en razonamiento multimodal, la prueba MMMU, alcanzan 88,2%, apenas 0,4 puntos por debajo del mejor experto humano.',
            cifras: ['cap-3']
          }
        ]
      },
      {
        id: 'valles',
        min: 16,
        seVe: 'La cámara desciende a valles oscuros lavados de azul profundo; dos rótulos se escriben con barras proporcionales en una misma escala: «Replicar investigaciones de astrofísica: menos de 20%» y «PaperArena: mejor agente 38,8% · expertos 83,5%».',
        rotulos: {
          astrofisica: { text: 'Replicar investigaciones de astrofísica: menos de 20%', cifras: ['cap-5'] },
          paperArena: { text: 'PaperArena: mejor agente 38,8% · expertos 83,5%', cifras: ['cap-6'] }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Y en los valles: al replicar investigaciones de astrofísica, logran menos de 20%. En PaperArena, el mejor agente llega a 38,8%, frente a 83,5% de expertos con doctorado.',
            cifras: ['cap-5', 'cap-6']
          },
          {
            voice: 'narrador',
            text: 'El promedio oculta las colas de error. En decisiones críticas importan la frecuencia y la gravedad del peor resultado.'
          }
        ]
      },
      {
        id: 'saturacion',
        min: 14,
        seVe: 'Tres medidores reglados, de MMMU, GPQA y SWE-bench; en cada uno, una flecha crece exactamente lo que subió, en una misma escala: «+18,8», «+48,9», «+67,3 puntos»; luego, un medidor aparte con todas las marcas llenas se desdibuja («ya no distingue») y a su lado se dibujan instrumentos nuevos: «evaluaciones dinámicas», «tareas no contaminadas», «varios intentos», «fuera de distribución» y «daños».',
        rotulos: {
          subidaMmmu: { text: '+18,8', cifras: ['cap-4'] },
          subidaGpqa: { text: '+48,9', cifras: ['cap-4'] },
          subidaSwe: { text: '+67,3 puntos', cifras: ['cap-4'] },
          saturado: { text: 'ya no distingue' },
          dinamicas: { text: 'evaluaciones dinámicas' },
          noContaminadas: { text: 'tareas no contaminadas' },
          variosIntentos: { text: 'varios intentos' },
          fueraDistribucion: { text: 'fuera de distribución' },
          danos: { text: 'daños' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Además, los benchmarks se saturan. Entre 2023 y 2024, el desempeño subió 18,8 puntos en MMMU, 48,9 en GPQA y 67,3 en SWE-bench.',
            cifras: ['cap-4']
          },
          {
            voice: 'narrador',
            text: 'Una prueba saturada deja de distinguir entre sistemas. Por eso la medición migra hacia evaluaciones dinámicas, tareas no contaminadas, confiabilidad en varios intentos, desempeño fuera de distribución y medición de daños.',
            advertencia: 2
          }
        ]
      },
      {
        id: 'chatbot',
        min: 14,
        seVe: 'Arriba, un bocadillo entra en la lámpara de IA y sale una sola respuesta; abajo, la misma lámpara dentro de un bucle reglado de cinco estaciones, «Objetivo → Planificar → Usar herramientas → Ejecutar → Verificar», con una flecha de regreso a «Planificar».',
        rotulos: {
          bucle: { text: 'Objetivo → Planificar → Usar herramientas → Ejecutar → Verificar' },
          regreso: { text: 'Planificar' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Ahora, de chatbot a agente. Un chatbot responde una pregunta. Un agente persigue un objetivo en bucle: planifica, usa herramientas, ejecuta, verifica y vuelve a planificar.'
          }
        ]
      },
      {
        id: 'escalera',
        min: 16,
        seVe: 'Una escalera reglada de máquina; la lámpara sube del peldaño «~12%» al «66,3%»; una línea punteada marca la referencia humana, «72,35%»; el peldaño de arriba muestra una grieta fina, «≈ 1 de cada 3 intentos falla»; luego, una segunda escalera, aparte, para Terminal-Bench 2.0: «20% (febrero de 2025) → 77,3% (inicios de 2026)».',
        rotulos: {
          inicio: { text: '~12%', cifras: ['cap-1'] },
          final: { text: '66,3%', cifras: ['cap-1'] },
          referenciaHumana: { text: '72,35%', cifras: ['cap-1'] },
          grieta: { text: '≈ 1 de cada 3 intentos falla', cifras: ['cap-1'] },
          terminalBench: { text: '20% (febrero de 2025) → 77,3% (inicios de 2026)', cifras: ['cap-2'] }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Los agentes mejoran rápido. En OSWorld, una prueba de tareas en el computador, pasaron de cerca de 12% a 66,3% de éxito, frente a una referencia humana de 72,35%. Aún fallan cerca de uno de cada tres intentos.',
            cifras: ['cap-1']
          },
          {
            voice: 'narrador',
            text: 'En Terminal-Bench 2.0, el éxito pasó de 20% en febrero de 2025 a 77,3% a inicios de 2026.',
            cifras: ['cap-2']
          }
        ]
      },
      {
        id: 'empresas',
        min: 12,
        seVe: 'De vuelta en el mundo cálido: una cuadrícula de cien pequeñas ventanas de oficina, con exactamente veintitrés iluminadas por lámparas, y el rótulo «23% escala agentes en alguna función»; al lado, una tarjeta con la frase «En ninguna función el escalamiento supera 10%», sin barras inventadas.',
        rotulos: {
          escalan: { text: '23% escala agentes en alguna función', cifras: ['adop-2'] },
          ningunaFuncion: { text: 'En ninguna función el escalamiento supera 10%', cifras: ['adop-3'] }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'En las empresas, el 23% escala agentes en alguna función, y en ninguna función el escalamiento supera 10%.',
            cifras: ['adop-2', 'adop-3']
          }
        ]
      },
      {
        id: 'pasos',
        min: 18,
        seVe: 'Aparece el sello «Ejemplo ilustrativo»; en una fila de veinte pasos reglados, el brillo de la lámpara se apaga un poco en cada paso; un contador caligráfico termina en «0,95 elevado a 20 ≈ 0,36»; una segunda fila, con 99% por paso, termina en «≈ 0,82».',
        rotulos: {
          sello: { text: 'Ejemplo ilustrativo' },
          calculo95: { text: '0,95 elevado a 20 ≈ 0,36', ilustrativo: true },
          calculo99: { text: '≈ 0,82', ilustrativo: true }
        },
        lines: [
          {
            voice: 'narrador',
            text: '¿Por qué fallan las tareas largas? Un ejemplo ilustrativo, que no viene de las fuentes: si cada paso sale bien el 95% de las veces y los pasos son independientes, una tarea de 20 pasos se completa solo el 36% de las veces.',
            ilustrativo: true
          },
          {
            voice: 'narrador',
            text: 'Con 99% de éxito por paso, la misma tarea se completa el 82% de las veces. Los errores se acumulan.',
            ilustrativo: true
          }
        ]
      },
      {
        id: 'limites',
        min: 14,
        seVe: 'Tres tarjetas pequeñas: «Errores que se acumulan» (una cadena con un eslabón agrietado), «Poca observabilidad» (una caja reglada con la tapa cerrada) y «Riesgos de seguridad» (una lámpara con las llaves de un sobre, una carpeta y una puerta).',
        rotulos: {
          errores: { text: 'Errores que se acumulan' },
          observabilidad: { text: 'Poca observabilidad' },
          seguridad: { text: 'Riesgos de seguridad' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'La autonomía tiene tres límites. Los errores se acumulan en las tareas largas. Hay poca observabilidad: no siempre se sabe por qué el sistema eligió una acción.'
          },
          {
            voice: 'narrador',
            text: 'Y hay riesgos de seguridad: un agente con acceso a correo, archivos o sistemas amplía el daño de instrucciones maliciosas, permisos excesivos o errores.'
          }
        ]
      },
      {
        id: 'tendencia',
        min: 16,
        seVe: 'En un panel azul marino, una línea reglada ascendente de duraciones de tareas termina en el presente; más allá solo hay niebla, con las palabras escritas a mano «Tendencia, no pronóstico» y sin prolongación punteada; rótulos «se duplicó cada ~7 meses (2019–2025)» y «~89 días desde 2024 (Time Horizon 1.1)».',
        rotulos: {
          niebla: { text: 'Tendencia, no pronóstico' },
          duplicacion: { text: 'se duplicó cada ~7 meses (2019–2025)', cifras: ['cap-8'] },
          duplicacionReciente: { text: '~89 días desde 2024 (Time Horizon 1.1)', cifras: ['cap-8'] }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'METR mide el horizonte de tareas: la duración de las tareas de software que un agente completa con 50% de éxito. Entre 2019 y 2025, se duplicó cada siete meses, aproximadamente.',
            cifras: ['cap-8']
          },
          {
            voice: 'narrador',
            text: 'Con su metodología actualizada de enero de 2026, el tiempo de duplicación desde 2024 es de unos 89 días. Pero los resultados varían mucho entre tipos de tareas: es una tendencia, no un pronóstico.',
            cifras: ['cap-8']
          }
        ]
      },
      {
        id: 'peloton',
        min: 16,
        seVe: 'Seis lámparas idénticas suben una colina sobre ruedas regladas y delgadas, muy juntas cerca de la cima; cada una arrastra un pequeño banderín liso con un patrón distinto (puntos, rayas, estrellas, cuadros, ondas, espirales); no hay nombres, banderas ni logotipos.',
        rotulos: {},
        lines: [
          {
            voice: 'narrador',
            text: 'Mientras tanto, los modelos convergen. En marzo de 2026, modelos de Anthropic, xAI, Google, OpenAI, Alibaba y DeepSeek aparecían dentro de un margen estrecho en clasificaciones de preferencia. Y Stanford considera que la brecha entre Estados Unidos y China prácticamente se cerró.',
            cifras: ['ctx-modelos-convergen']
          },
          {
            voice: 'narrador',
            text: 'Si el desempeño converge, la competencia se traslada al costo, la latencia, la confiabilidad, la privacidad, la integración y la apertura.'
          }
        ]
      },
      {
        id: 'concentracion',
        min: 16,
        seVe: 'Una corriente de pequeñas lámparas pasa en su mayoría por una sola compuerta, rotulada «industria», con un contador «91,2%»; luego, tres barras proporcionales: «EE. UU. 59», «China 35» y «Corea del Sur 8»; al final, una caja reglada cierra su tapa sobre «parámetros», «datos» y «duración del entrenamiento».',
        rotulos: {
          compuerta: { text: 'industria' },
          industria: { text: '91,2%', cifras: ['cap-9'] },
          eeuu: { text: 'EE. UU. 59', cifras: ['cap-10'] },
          china: { text: 'China 35', cifras: ['cap-10'] },
          corea: { text: 'Corea del Sur 8', cifras: ['cap-10'] },
          parametros: { text: 'parámetros' },
          datos: { text: 'datos' },
          duracion: { text: 'duración del entrenamiento' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Y la producción se concentra: más de 90% de los modelos notables de 2025 vino de la industria. Estados Unidos produjo 59; China, 35, y Corea del Sur, 8.',
            cifras: ['cap-9', 'cap-10']
          },
          {
            voice: 'narrador',
            text: 'Además, cae la transparencia: varias organizaciones ya no revelan los parámetros, los datos ni la duración del entrenamiento.'
          }
        ]
      },
      {
        id: 'abiertos',
        min: 16,
        seVe: 'Una pequeña lámpara reglada, con el rótulo «111 millones de parámetros», ilumina una tarjeta de tarea específica que una lámpara mucho más grande deja a oscuras; luego, 102 tarjetas pequeñas, 47 marcadas «API»; al final, una caja reglada con tapa transparente que solo deja ver una cuadrícula ordenada de pesos, mientras «código», «datos» y «proceso» siguen en cajones cerrados.',
        rotulos: {
          modeloPequeno: { text: '111 millones de parámetros', cifras: ['cap-12'] },
          api: { text: 'API' },
          codigo: { text: 'código' },
          datos: { text: 'datos' },
          proceso: { text: 'proceso' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'No siempre gana el más grande: un modelo de proteínas de 111 millones de parámetros y uno genómico de 200 millones superaron a sistemas mucho mayores en evaluaciones específicas.',
            cifras: ['cap-12']
          },
          {
            voice: 'narrador',
            text: 'En 2025, el acceso por API fue el formato más común entre los modelos notables: 47 de 102. Y ojo: pesos abiertos no significa código, datos y proceso abiertos.',
            cifras: ['cap-11']
          }
        ]
      },
      {
        id: 'cierre',
        min: 12,
        seVe: 'De vuelta en la cordillera, al atardecer; el escalador clava una pequeña bandera en un pico modesto y bien cartografiado; título final «Medir confiabilidad, no solo precisión.»',
        rotulos: {
          titulo: { text: 'Medir confiabilidad, no solo precisión.' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Antes de confiar, mira el mapa completo: dónde están los picos, dónde los valles y cuánto cuesta un error.'
          },
          { voice: 'narrador', text: 'Mide la confiabilidad, no solo la precisión.' }
        ]
      }
    ],
    checkpoints: [
      {
        after: 'valles',
        question: 'Un sistema tiene un promedio muy alto en una prueba. ¿Qué más conviene mirar antes de usarlo en una decisión crítica?',
        options: ['Solo el promedio', 'La frecuencia y la gravedad del peor resultado', 'El nombre de la prueba'],
        answer: 1,
        explain: 'El promedio oculta las colas de error.',
        hint: 'Recuerda lo que esconde el promedio: ¿qué pasa en los valles, cuando el sistema falla?'
      },
      {
        after: 'pasos',
        question: 'Con 95% de acierto por paso, ¿qué probabilidad tiene un agente de completar 20 pasos?',
        options: ['95%', 'Cerca de 36%', 'Cerca de 80%'],
        answer: 1,
        explain: 'Es 0,95 multiplicado por sí mismo 20 veces: cerca de 0,36. Es un ejemplo ilustrativo.',
        hint: 'Los errores se acumulan: piensa qué pasa al multiplicar la probabilidad de acierto paso tras paso.',
        ilustrativo: true
      },
      {
        after: 'concentracion',
        question: '¿Qué proporción de los modelos notables de 2025 vino de la industria?',
        options: ['Cerca de la mitad', 'Más de 90%', '23%'],
        answer: 1,
        explain: 'Fue 91,2%: la producción de modelos notables está concentrada en la industria.',
        hint: 'Recuerda la corriente de lámparas: ¿qué parte pasaba por la compuerta de la industria?',
        cifras: ['cap-9']
      },
      {
        after: 'abiertos',
        question: '«Pesos abiertos» significa:',
        options: ['Código, datos y proceso abiertos', 'Acceso a los parámetros, no necesariamente a los datos ni al código', 'Acceso solo por API'],
        answer: 1,
        explain: 'Publicar los pesos no implica publicar los datos, el código ni el proceso de entrenamiento.',
        hint: 'Recuerda la caja de tapa transparente: ¿qué se veía y qué seguía en cajones cerrados?'
      }
    ]
  },
  {
    id: 'v04',
    slug: 'del-uso-al-valor',
    title: 'Del uso al valor',
    sesion: 3,
    laminas: ['d06', 'd07', 'd08'],
    rate: '0%',
    target: [390, 480],
    poster: { scene: 'embudo', p: 0.7 },
    chapters: [
      { title: 'Capital e infraestructura', from: 'capital' },
      { title: 'El embudo', from: 'embudo' },
      { title: 'Productividad', from: 'productividad' },
      { title: 'Asociación no es causalidad', from: 'pwc' }
    ],
    scenes: [
      {
        id: 'capital',
        min: 16,
        seVe: 'Un río de monedas doradas y planas, con contorno negro, cruza un valle hacia un embalse con una sola compuerta; un contador escribe «344.700 millones de dólares · +127,5%»; luego, una corriente más ancha: «inversión corporativa: 581.700 millones de dólares».',
        rotulos: {
          inversionPrivada: { text: '344.700 millones de dólares · +127,5%', cifras: ['eco-1'] },
          inversionCorporativa: { text: 'inversión corporativa: 581.700 millones de dólares', cifras: ['eco-2'] }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'El capital llega rápido. En 2025, la inversión privada en IA llegó a 344.700 millones de dólares, 127,5% más que el año anterior.',
            cifras: ['eco-1']
          },
          {
            voice: 'narrador',
            text: 'La IA generativa creció más de 200% y captó casi la mitad de esa inversión. Y la inversión corporativa más que se duplicó, hasta 581.700 millones de dólares.',
            cifras: ['eco-1', 'eco-2']
          }
        ]
      },
      {
        id: 'paises',
        min: 14,
        seVe: 'Dos pilas de monedas en las dos orillas del río, exactamente en proporción, con los rótulos «Estados Unidos» y «China»; en la más pequeña, una nota prendida: «posiblemente subestimada: fondos estatales de orientación»; luego, cuatro signos pequeños de lo que lidera China: publicaciones, citaciones, patentes concedidas y robots industriales.',
        rotulos: {
          eeuu: { text: 'Estados Unidos' },
          china: { text: 'China' },
          nota: { text: 'posiblemente subestimada: fondos estatales de orientación' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Estados Unidos invirtió 23 veces más capital privado que China, aunque Stanford advierte que China puede estar subestimada por sus fondos estatales de orientación.',
            cifras: ['eco-3']
          },
          {
            voice: 'narrador',
            text: 'China, a su vez, lidera en publicaciones, citaciones, patentes concedidas e instalación de robots industriales.'
          }
        ]
      },
      {
        id: 'cadena',
        min: 12,
        seVe: 'Cuatro estaciones enlazadas se dibujan a lo largo del río, «Capital → Cómputo → Modelos → Productos»; la única compuerta del embalse estrecha el caudal.',
        rotulos: {
          cadena: { text: 'Capital → Cómputo → Modelos → Productos' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Ese dinero recorre una cadena concentrada: capital, cómputo, modelos y productos.'
          }
        ]
      },
      {
        id: 'costo-oculto',
        min: 16,
        seVe: 'Un bloque reglado de celdas de cómputo idénticas; para cada uno de tres desarrolladores solo se ilumina una franja, «corrida final de entrenamiento», exactamente proporcional: «OpenAI (2024) 9,6%», «MiniMax 22,6%» y «Z.ai 12,3%»; el resto de cada bloque lleva el rótulo «experimentos, datos, evaluaciones e iteraciones».',
        rotulos: {
          corridaFinal: { text: 'corrida final de entrenamiento' },
          openai: { text: 'OpenAI (2024) 9,6%', cifras: ['eco-6'] },
          minimax: { text: 'MiniMax 22,6%', cifras: ['eco-6'] },
          zai: { text: 'Z.ai 12,3%', cifras: ['eco-6'] },
          resto: { text: 'experimentos, datos, evaluaciones e iteraciones' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Hay, además, un costo que no se ve. La corrida final de entrenamiento fue solo una parte del gasto de cómputo de investigación y desarrollo: 9,6% en OpenAI en 2024, 22,6% en MiniMax y 12,3% en Z.ai.',
            cifras: ['eco-6']
          },
          {
            voice: 'narrador',
            text: 'El resto se va en experimentos, datos, evaluaciones e iteraciones. Mirar solo el entrenamiento final subestima las barreras de entrada.'
          }
        ]
      },
      {
        id: 'energia',
        min: 18,
        seVe: 'Una torre reglada de servidores con un medidor de energía dibujado a mano, cuya aguja se detiene en «29,6 GW»; luego, cuatro islas biomórficas flotantes con grupos exactos de puntos, los clústeres de supercomputación con respaldo estatal en 2025: «Europa y Asia Central: 44 (eran 3 en 2018)», «China: 85», «Norteamérica: 41» y «América Latina y el Caribe: 8».',
        rotulos: {
          medidor: { text: '29,6 GW', cifras: ['eco-4'] },
          europa: { text: 'Europa y Asia Central: 44 (eran 3 en 2018)', cifras: ['eco-7'] },
          china: { text: 'China: 85', cifras: ['eco-7'] },
          norteamerica: { text: 'Norteamérica: 41', cifras: ['eco-7'] },
          americaLatina: { text: 'América Latina y el Caribe: 8', cifras: ['eco-7'] }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'La infraestructura también crece: la capacidad eléctrica de los centros de datos de IA llegó a cerca de 29,6 gigavatios al cierre de 2025. Si la demanda crece más rápido que la eficiencia, el consumo total sube: es el efecto rebote.',
            cifras: ['eco-4']
          },
          {
            voice: 'narrador',
            text: 'Y el cómputo público se reparte de forma desigual. Entre 2018 y 2025, Europa y Asia Central pasaron de 3 a 44 clústeres de supercomputación con respaldo estatal. China tiene 85; Norteamérica, 41, y América Latina y el Caribe, 8.',
            cifras: ['eco-7']
          }
        ]
      },
      {
        id: 'embudo',
        min: 18,
        seVe: 'Las cuatro barras horizontales de la lámina D7 se dibujan exactamente proporcionales, en una misma escala que parte de cero: «88% usa IA en al menos una función», «62% experimenta o escala agentes», «~1/3 escala la IA en toda la organización» (la más estrecha, marcada «cuello de botella», con remate «≈») y «39% reporta algún impacto en EBIT (normalmente <5%)»; la lectora las mira, intrigada.',
        rotulos: {
          uso: { text: '88% usa IA en al menos una función', cifras: ['adop-1'] },
          agentes: { text: '62% experimenta o escala agentes', cifras: ['adop-2'] },
          escala: { text: '~1/3 escala la IA en toda la organización', cifras: ['adop-4'] },
          cuelloDeBotella: { text: 'cuello de botella' },
          remateAprox: { text: '≈' },
          impacto: { text: '39% reporta algún impacto en EBIT (normalmente <5%)', cifras: ['adop-5'] }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Ahora, del uso al valor. Según McKinsey, en 2025 el 88% de las organizaciones usaba IA de forma regular en al menos una función, frente a 78% un año antes. Y el 62% experimentaba con agentes o los escalaba.',
            cifras: ['adop-1', 'adop-2']
          },
          {
            voice: 'narrador',
            text: 'Pero solo cerca de un tercio escalaba la IA a toda la organización, y el 39% reportaba algún impacto en el EBIT, casi siempre menor de 5%.',
            cifras: ['adop-4', 'adop-5']
          },
          { voice: 'lectora', text: 'Un detalle: ¿son las mismas organizaciones pasando de una barra a la siguiente?' },
          {
            voice: 'narrador',
            text: 'No. Cada barra sale de una pregunta distinta de la misma encuesta. El embudo muestra un patrón, no una cohorte.'
          }
        ]
      },
      {
        id: 'puente',
        min: 14,
        seVe: 'Un puente sobre un abismo, de la orilla «Uso» a la orilla «Valor»; su último tramo todavía es andamio; figuras cálidas cargan tablones con los rótulos «procesos», «liderazgo», «métricas» y «transformación».',
        rotulos: {
          orillaUso: { text: 'Uso' },
          orillaValor: { text: 'Valor' },
          procesos: { text: 'procesos' },
          liderazgo: { text: 'liderazgo' },
          metricas: { text: 'métricas' },
          transformacion: { text: 'transformación' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'El cuello de botella es organizacional, no el acceso al modelo. Las organizaciones de alto desempeño no se distinguen tanto por la tecnología como por rediseñar sus flujos de trabajo, tener liderazgo, definir métricas y apuntar a la transformación.',
            advertencia: 1
          }
        ]
      },
      {
        id: 'etapas',
        min: 14,
        seVe: 'Seis piedras cruzan el río, «Acceso → Experimentación → Integración → Rediseño → Escala → Transformación»; la mayoría de las figuras pequeñas se agolpa en la segunda y la tercera piedra.',
        rotulos: {
          etapas: { text: 'Acceso → Experimentación → Integración → Rediseño → Escala → Transformación' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Piensa en seis etapas de madurez: acceso, experimentación, integración, rediseño, escala y transformación. La mayoría de las organizaciones está entre la experimentación y la integración.'
          }
        ]
      },
      {
        id: 'actualizacion',
        min: 14,
        seVe: 'Una segunda página de libreta, aparte, se desliza junto a la primera con el rótulo «Encuesta 2026 · otra muestra» y la cinta «Actualización»; sus cifras se escriben: «~9 de 10 usan IA», «44% escala a toda la empresa (38% un año antes, según esa edición)» y «37% algún impacto en EBIT»; ninguna flecha ni línea une las dos páginas; la nota dice «No se compara directamente».',
        rotulos: {
          pagina: { text: 'Encuesta 2026 · otra muestra' },
          cinta: { text: 'Actualización' },
          uso: { text: '~9 de 10 usan IA', cifras: ['adop-7'] },
          escala: { text: '44% escala a toda la empresa (38% un año antes, según esa edición)', cifras: ['adop-7'] },
          impacto: { text: '37% algún impacto en EBIT', cifras: ['adop-7'] },
          nota: { text: 'No se compara directamente' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Ya existe una edición 2026 de esa encuesta, con 1.719 participantes de 97 países: cerca de nueve de cada diez organizaciones usan IA, el 44% la escala a toda la empresa y el 37% reporta algún impacto en el EBIT.',
            cifras: ['adop-7']
          },
          {
            voice: 'narrador',
            text: 'El curso usa la edición 2025 del informe base. Y no mezclamos ediciones como si fueran una serie: son muestras distintas.'
          }
        ]
      },
      {
        id: 'productividad',
        min: 16,
        seVe: 'Una balanza; en su platillo izquierdo se escriben tres pesas pequeñas: «Soporte al cliente +14–15%», «Software +26%» y «Marketing +50%»; aparte, una tarjeta pequeña: «Experimento de campo: 4.867 desarrolladores, +26,08% de tareas completadas».',
        rotulos: {
          soporte: { text: 'Soporte al cliente +14–15%', cifras: ['prod-1'] },
          software: { text: 'Software +26%', cifras: ['prod-1'] },
          marketing: { text: 'Marketing +50%', cifras: ['prod-1'] },
          experimento: { text: 'Experimento de campo: 4.867 desarrolladores, +26,08% de tareas completadas', cifras: ['prod-2'] }
        },
        lines: [
          {
            voice: 'narrador',
            text: '¿Y la productividad? Es real, pero heterogénea. En estudios reunidos por Stanford, hubo aumentos de 14 a 15% en soporte al cliente, de 26% en desarrollo de software y de 50% en producción de marketing.',
            cifras: ['prod-1']
          },
          {
            voice: 'narrador',
            text: 'Un experimento de campo con 4.867 desarrolladores estimó 26,08% más tareas completadas, con más beneficio para los menos experimentados.',
            cifras: ['prod-2']
          }
        ]
      },
      {
        id: 'metr',
        min: 18,
        seVe: 'En el platillo derecho, un reloj de arena: «Desarrolladores experimentados: +19% de tiempo», con la nota prendida «METR lo marca hoy como desactualizado»; debajo, una tarjeta aparte para el seguimiento de febrero de 2026: una línea de intervalo de −38% a +9%, con su punto en −18% y la línea de cero que la cruza, rotulada «No concluyente».',
        rotulos: {
          ensayo: { text: 'Desarrolladores experimentados: +19% de tiempo', cifras: ['prod-3'] },
          nota: { text: 'METR lo marca hoy como desactualizado' },
          seguimiento: { text: 'No concluyente' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'En el otro platillo: en un ensayo aleatorio con 16 desarrolladores experimentados y 246 tareas en sus propios repositorios, las herramientas de comienzos de 2025 aumentaron 19% el tiempo.',
            cifras: ['prod-3']
          },
          {
            voice: 'narrador',
            text: 'METR marca hoy ese estudio como desactualizado. Su seguimiento de febrero de 2026 no fue concluyente: 18% menos de tiempo, con un intervalo de confianza del 95% que va de 38% menos a 9% más.',
            cifras: ['prod-4']
          },
          { voice: 'lectora', text: 'Entonces depende: de la tarea, de quién la usa y de cuánto cuesta verificar.' }
        ]
      },
      {
        id: 'pwc',
        min: 16,
        seVe: 'Dos torres de industrias crecen lado a lado, exactamente proporcionales: «Industrias más expuestas a la IA: +27,0%» y «Menos expuestas: +8,5%», en ingreso por empleado entre 2018 y 2024; una moneda con «Prima salarial media por habilidades de IA: 56% (2024)»; luego, una tarjeta pequeña aparte, con la cinta «Actualización» y sin unirse a la primera moneda: «Barómetro 2026: prima de 62%».',
        rotulos: {
          masExpuestas: { text: 'Industrias más expuestas a la IA: +27,0%', cifras: ['prod-5'] },
          menosExpuestas: { text: 'Menos expuestas: +8,5%', cifras: ['prod-5'] },
          prima: { text: 'Prima salarial media por habilidades de IA: 56% (2024)', cifras: ['prod-6'] },
          cinta: { text: 'Actualización' },
          barometro: { text: 'Barómetro 2026: prima de 62%', cifras: ['prod-7'] }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Otra cifra famosa: entre 2018 y 2024, el ingreso por empleado creció 27,0% en las industrias más expuestas a la IA, frente a 8,5% en las menos expuestas. Y las habilidades de IA tuvieron una prima salarial media de 56% en 2024.',
            cifras: ['prod-5', 'prod-6']
          },
          {
            voice: 'narrador',
            text: 'El barómetro de PwC de 2026 reporta una prima de 62%; el curso usa la edición del informe base.',
            cifras: ['prod-7']
          },
          { voice: 'lectora', text: '¿Y eso prueba que la IA causó el crecimiento del ingreso?' }
        ]
      },
      {
        id: 'causalidad',
        min: 18,
        seVe: 'El diagrama de la lámina D8 se dibuja en estilo cálido: una gran nube biomórfica, «Capital, datos, gestión», lanza dos flechas caligráficas sólidas, una hacia «Exposición a IA» y otra hacia «Ingreso por empleado»; entre esas dos solo hay una línea punteada, rotulada «asociación»; cae el sello «Asociación no es causalidad».',
        rotulos: {
          nube: { text: 'Capital, datos, gestión' },
          exposicion: { text: 'Exposición a IA' },
          ingreso: { text: 'Ingreso por empleado' },
          asociacion: { text: 'asociación' },
          sello: { text: 'Asociación no es causalidad' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'No necesariamente. Esas industrias también tienen más capital, datos, capacidad gerencial y trabajo remoto. Asociación no es causalidad.',
            advertencia: 4
          },
          {
            voice: 'narrador',
            text: 'Para atribuir causalidad hacen falta adopciones escalonadas, experimentos de campo, discontinuidades o instrumentos plausibles.'
          }
        ]
      },
      {
        id: 'intencion',
        min: 14,
        seVe: 'Una directiva con un catalejo, junto a un calendario marcado «12–18 meses»; tres bocadillos pequeños: «81% espera integrar agentes», «32% contratará especialistas en agentes» y «28% contratará gestores de fuerza laboral de IA»; el distintivo «Expectativa».',
        rotulos: {
          plazo: { text: '12–18 meses', cifras: ['adop-8'] },
          integrar: { text: '81% espera integrar agentes', cifras: ['adop-8'] },
          especialistas: { text: '32% contratará especialistas en agentes', cifras: ['adop-8'] },
          gestores: { text: '28% contratará gestores de fuerza laboral de IA', cifras: ['adop-8'] },
          chip: { text: 'Expectativa' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Y no confundas intención con adopción: el 81% de los líderes espera integrar agentes de forma moderada o extensa en 12 a 18 meses; el 32% prevé contratar especialistas en agentes, y el 28%, gestores de fuerza laboral de IA. Son expectativas, no impacto realizado.',
            cifras: ['adop-8']
          }
        ]
      },
      {
        id: 'linea-base',
        min: 14,
        seVe: 'Se dibuja una tabla de libreta con cuatro filas («Tiempo por tarea», «Calidad o tasa de error», «Costo total por tarea», «Riesgo o incidentes») y cuatro columnas («Línea base», «Meta», «Cómo se mide», «Quién verifica»), todas vacías; un lápiz espera.',
        rotulos: {
          filaTiempo: { text: 'Tiempo por tarea' },
          filaCalidad: { text: 'Calidad o tasa de error' },
          filaCosto: { text: 'Costo total por tarea' },
          filaRiesgo: { text: 'Riesgo o incidentes' },
          colLineaBase: { text: 'Línea base' },
          colMeta: { text: 'Meta' },
          colComoSeMide: { text: 'Cómo se mide' },
          colQuienVerifica: { text: 'Quién verifica' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Para tu caso, la pregunta es concreta: ¿cuál es la línea base antes de usar IA, cuál es el costo total y quién verifica el resultado?'
          },
          {
            voice: 'narrador',
            text: 'Licencias, integración, cómputo, revisión humana, errores, seguridad y formación: todo cuenta en el costo total.'
          }
        ]
      },
      {
        id: 'cierre',
        min: 10,
        seVe: 'De vuelta en el puente, las personas colocan la tabla vacía como último tablón y cruzan hacia «Valor»; título final «El capital llega rápido y el valor tarda.»',
        rotulos: {
          orillaValor: { text: 'Valor' },
          titulo: { text: 'El capital llega rápido y el valor tarda.' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'El capital llega rápido y el valor tarda. Se construye con procesos, datos, personas y medición.'
          }
        ]
      }
    ],
    checkpoints: [
      {
        after: 'etapas',
        question: 'Una organización compró licencias para todo su personal y tiene varios pilotos activos. ¿Eso demuestra madurez?',
        options: ['Sí: ya está en la etapa de escala', 'No necesariamente: licencias, usuarios y pilotos no son madurez'],
        answer: 1,
        explain: 'Contar licencias, usuarios o pilotos como si fueran madurez es un error de lectura frecuente.',
        hint: 'Recuerda las piedras del río: ¿tener acceso y hacer pruebas es lo mismo que rediseñar y escalar?'
      },
      {
        after: 'causalidad',
        question: '¿Por qué la cifra de PwC no prueba que la IA cause más ingreso por empleado?',
        options: ['Porque la muestra es pequeña', 'Porque esas industrias también tienen más capital, datos y capacidad gerencial', 'Porque es de 2024'],
        answer: 1,
        explain: 'Hay factores que influyen a la vez en la exposición a la IA y en el ingreso: es una asociación.',
        hint: 'Recuerda el diagrama: ¿de dónde salían las dos flechas sólidas?'
      }
    ]
  },
  {
    id: 'v05',
    slug: 'tareas',
    title: 'Tareas, no puestos',
    sesion: 4,
    laminas: ['d09'],
    rate: '0%',
    target: [180, 270],
    poster: { scene: 'entrada', p: 0.6 },
    chapters: [
      { title: 'Tres conceptos', from: 'oficina' },
      { title: 'Quién siente la presión', from: 'desigual' },
      { title: 'Competencias que cambian', from: 'competencias' }
    ],
    scenes: [
      {
        id: 'oficina',
        min: 12,
        seVe: 'Una oficina cálida vista desde arriba; el trabajo de una persona se despliega como un abanico de tarjetas de tareas: escribir, llamar, archivar, decidir y enseñar a alguien que acaba de llegar.',
        rotulos: {},
        lines: [
          {
            voice: 'narrador',
            text: 'Cuando se habla de IA y empleo, la pregunta suele ser qué puestos van a desaparecer. Pero la IA transforma tareas antes que puestos.'
          }
        ]
      },
      {
        id: 'exposicion',
        min: 16,
        seVe: 'Un campo redondo de mil puntos, el empleo del mundo; doscientos cincuenta reciben un halo amarillo suave («alguna exposición») y treinta y tres se oscurecen («exposición más alta»); luego, dos campos más pequeños, lado a lado: «países de ingresos altos: 34%» y «países de ingresos bajos: 11%».',
        rotulos: {
          alguna: { text: 'alguna exposición' },
          masAlta: { text: 'exposición más alta' },
          ingresosAltos: { text: 'países de ingresos altos: 34%', cifras: ['trab-1'] },
          ingresosBajos: { text: 'países de ingresos bajos: 11%', cifras: ['trab-1'] }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'La OIT estima que el 25% del empleo mundial está en ocupaciones con alguna exposición a la IA generativa: 34% en los países de ingresos altos y 11% en los de ingresos bajos.',
            cifras: ['trab-1']
          },
          {
            voice: 'narrador',
            text: 'Pero solo el 3,3% está en la categoría de exposición más alta. Y la OIT considera más probable la transformación de tareas que la desaparición de puestos.',
            cifras: ['trab-2']
          }
        ]
      },
      {
        id: 'tres-conceptos',
        min: 18,
        seVe: 'Tres puertas caligráficas en fila, separadas por signos igual tachados: «Exposición» (la luz del sol cae sobre un escritorio: tareas que la IA podría apoyar), «Automatización» (una lámpara reglada que de verdad hace una tarea, conectada al flujo de la oficina) y «Desplazamiento» (una silla vacía); el rótulo «No son lo mismo».',
        rotulos: {
          exposicion: { text: 'Exposición' },
          automatizacion: { text: 'Automatización' },
          desplazamiento: { text: 'Desplazamiento' },
          noSonLoMismo: { text: 'No son lo mismo' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Son tres conceptos distintos. Una ocupación expuesta tiene tareas que la IA puede apoyar o realizar. La automatización efectiva exige, además, integración organizacional.'
          },
          {
            voice: 'narrador',
            text: 'Y el desplazamiento depende también de la demanda, los costos, la regulación, la reorganización y las nuevas tareas. Por eso, exposición no es desempleo.',
            advertencia: 3
          }
        ]
      },
      {
        id: 'desigual',
        min: 16,
        seVe: 'Los escritorios administrativos brillan más y se les suman pequeños signos de medios, software y finanzas; luego, dos campos de mil puntos, «mujeres» y «hombres», con exactamente cuarenta y siete puntos oscuros en el primero y veinticuatro en el segundo; después, lo mismo para los países de ingresos altos, con noventa y seis y treinta y cinco puntos oscuros.',
        rotulos: {
          mujeres: { text: 'mujeres' },
          hombres: { text: 'hombres' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'La exposición no se reparte igual. Las ocupaciones administrativas son las más expuestas, y la multimodalidad amplía el alcance a medios, software y finanzas.'
          },
          {
            voice: 'narrador',
            text: 'La exposición más alta afecta al 4,7% del empleo femenino mundial y al 2,4% del masculino. En los países de ingresos altos, la diferencia es de 9,6% frente a 3,5%.',
            cifras: ['trab-3']
          }
        ]
      },
      {
        id: 'entrada',
        min: 16,
        seVe: 'La metáfora de la lámina D9: una escalera profesional, caligráfica y cálida, cuyo primer peldaño se deshace en puntos; una persona joven mira hacia arriba desde abajo; el rótulo «Desarrolladores de software de 22 a 25 años · EE. UU. · casi −20% de empleo desde 2024».',
        rotulos: {
          caida: { text: 'Desarrolladores de software de 22 a 25 años · EE. UU. · casi −20% de empleo desde 2024', cifras: ['trab-4'] }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Hay señales de presión en los puestos de entrada: en Estados Unidos, el empleo de desarrolladores de software de 22 a 25 años cayó casi 20% desde 2024, aunque las pérdidas agregadas de empleo aún no muestran un patrón general.',
            cifras: ['trab-4']
          },
          {
            voice: 'narrador',
            text: 'Una hipótesis plausible, pero no demostrada: se están automatizando las tareas que antes servían de escalón de entrada.'
          },
          {
            voice: 'lectora',
            text: 'Y si la IA hace las tareas con las que aprendían los nuevos, ¿cómo se van a formar?',
            pause: 3
          }
        ]
      },
      {
        id: 'competencias',
        min: 16,
        seVe: 'Un cometa con cola de puntos cruza hacia una señal de camino «2030», con el distintivo «Proyección»; suben flotando signos de competencias, «IA y datos», «redes y ciberseguridad» y «alfabetización tecnológica»; a su lado, signos humanos cálidos: «pensamiento creativo», «resiliencia», «flexibilidad» y «colaboración».',
        rotulos: {
          senal: { text: '2030' },
          chip: { text: 'Proyección' },
          iaDatos: { text: 'IA y datos' },
          redes: { text: 'redes y ciberseguridad' },
          alfabetizacion: { text: 'alfabetización tecnológica' },
          pensamientoCreativo: { text: 'pensamiento creativo' },
          resiliencia: { text: 'resiliencia' },
          flexibilidad: { text: 'flexibilidad' },
          colaboracion: { text: 'colaboración' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Las competencias también cambian: según el Foro Económico Mundial, el 39% de las competencias centrales cambiará hacia 2030. Las que más rápido crecen son IA y datos, redes y ciberseguridad, y alfabetización tecnológica.',
            cifras: ['trab-5']
          },
          {
            voice: 'narrador',
            text: 'Y el pensamiento creativo, la resiliencia, la flexibilidad y la colaboración siguen siendo críticos.'
          }
        ]
      },
      {
        id: 'siete',
        min: 18,
        seVe: 'Siete tarjetas pequeñas se abren como una mano de cartas, cada una con un signo y un rótulo breve: «Comprender», «Formular», «Verificar», «Proteger», «Diseñar y supervisar», «Documentar» y «Evaluar».',
        rotulos: {
          comprender: { text: 'Comprender' },
          formular: { text: 'Formular' },
          verificar: { text: 'Verificar' },
          proteger: { text: 'Proteger' },
          disenarSupervisar: { text: 'Diseñar y supervisar' },
          documentar: { text: 'Documentar' },
          evaluar: { text: 'Evaluar' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'El informe base propone siete capacidades de alfabetización avanzada: comprender capacidades y límites de la IA; formular problemas y elegir herramientas; verificar fuentes, sesgos e incertidumbre;'
          },
          {
            voice: 'narrador',
            text: 'proteger datos y propiedad intelectual; diseñar y supervisar flujos humano–IA; documentar decisiones y asumir responsabilidad; y evaluar efectos en calidad, productividad, aprendizaje y equidad.',
            say: 'proteger datos y propiedad intelectual; diseñar y supervisar flujos entre personas e i a; documentar decisiones y asumir responsabilidad; y evaluar efectos en calidad, productividad, aprendizaje y equidad.'
          }
        ]
      },
      {
        id: 'tareas-caso',
        min: 14,
        seVe: 'La tarjeta del caso del equipo se divide en seis a ocho tarjetas de tareas, y cada una recibe uno de tres sellos: «La IA apoya», «La IA podría realizarla» o «La persona es indispensable»; una tarjeta lleva un pequeño signo de escalera: «escalón de entrada».',
        rotulos: {
          apoya: { text: 'La IA apoya' },
          podriaRealizarla: { text: 'La IA podría realizarla' },
          indispensable: { text: 'La persona es indispensable' },
          escalonEntrada: { text: 'escalón de entrada' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'En su caso, desagreguen la ocupación en tareas y marquen cada una: ¿la IA apoya, podría realizarla o la persona es indispensable?'
          },
          {
            voice: 'narrador',
            text: 'Y señalen qué tareas sirven de escalón de entrada a las personas nuevas: ese aprendizaje también hay que preservarlo.'
          }
        ]
      },
      {
        id: 'cierre',
        min: 10,
        seVe: 'De vuelta en la escalera, varias manos construyen un nuevo primer peldaño con otra forma; título final «En el trabajo cambian tareas, no solo puestos.»',
        rotulos: {
          titulo: { text: 'En el trabajo cambian tareas, no solo puestos.' }
        },
        lines: [
          { voice: 'narrador', text: 'En el trabajo cambian tareas, no solo puestos.' }
        ]
      }
    ],
    checkpoints: [
      {
        after: 'tres-conceptos',
        question: '«El 25% del empleo mundial tiene alguna exposición a la IA generativa». ¿Qué se puede concluir?',
        options: ['Que una de cada cuatro personas perderá su empleo', 'Que esas ocupaciones tienen tareas que la IA puede apoyar o realizar', 'Que esos puestos ya se automatizaron'],
        answer: 1,
        explain: 'Exposición no es desempleo: describe tareas, no despidos.',
        hint: 'Recuerda las puertas de la escena: exposición, automatización y desplazamiento no son lo mismo.',
        cifras: ['trab-1']
      }
    ]
  },
  {
    id: 'v06',
    slug: 'aprendizaje',
    title: 'Evaluar el aprendizaje, no el texto',
    sesion: 4,
    laminas: ['d10'],
    rate: '0%',
    target: [180, 270],
    poster: { scene: 'lancha', p: 0.6 },
    chapters: [
      { title: 'Uso masivo', from: 'campus' },
      { title: 'Uso no es preparación', from: 'preparacion' },
      { title: 'Rediseñar la evaluación', from: 'evaluar' }
    ],
    scenes: [
      {
        id: 'campus',
        min: 16,
        seVe: 'Un patio universitario cálido, con estudiantes que llevan cuadernos y teléfonos; junto a muchos de ellos brillan pequeñas lámparas frías; luego, una tarjeta con tres barras proporcionales: «86% usa IA», «54% al menos cada semana» y «24% a diario (cobertura de prensa)».',
        rotulos: {
          uso: { text: '86% usa IA', cifras: ['edu-1'] },
          semanal: { text: '54% al menos cada semana', cifras: ['edu-1'] },
          diario: { text: '24% a diario (cobertura de prensa)', cifras: ['edu-2'] }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'En la universidad, la IA se usa más de lo que se gobierna. En Estados Unidos, cuatro de cada cinco estudiantes de secundaria y universidad usan IA generativa.',
            cifras: ['edu-4']
          },
          {
            voice: 'narrador',
            text: 'En la encuesta mundial del Digital Education Council, con 3.839 estudiantes de 16 países, el 86% dijo usarla y el 54%, al menos cada semana. Según la cobertura de prensa de esa encuesta, el 24% la usa a diario.',
            cifras: ['edu-1', 'edu-2']
          }
        ]
      },
      {
        id: 'lancha',
        min: 12,
        seVe: 'La metáfora de la lámina D10: una lancha cálida y rápida, llena de estudiantes, empujada por un motor reglado pequeño y potente (la lámpara), sin brújula ni mapa; a lo lejos, un faro.',
        rotulos: {},
        lines: [
          { voice: 'narrador', text: 'Es como una lancha con un motor potente, pero sin brújula ni mapa.' },
          { voice: 'lectora', text: '¿Y hacia dónde va?' }
        ]
      },
      {
        id: 'preparacion',
        min: 16,
        seVe: 'Tres barras caligráficas se dibujan exactamente proporcionales: «58% dice no tener conocimientos ni habilidades suficientes en IA», «48% no se siente preparado para un mercado laboral con IA» y «80%: la integración de la IA en su universidad no cumple sus expectativas».',
        rotulos: {
          conocimientos: { text: '58% dice no tener conocimientos ni habilidades suficientes en IA', cifras: ['edu-3'] },
          mercadoLaboral: { text: '48% no se siente preparado para un mercado laboral con IA', cifras: ['edu-3'] },
          expectativas: { text: '80%: la integración de la IA en su universidad no cumple sus expectativas', cifras: ['edu-3'] }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Uso no es preparación. En la misma encuesta, el 58% dijo no tener conocimientos ni habilidades suficientes en IA, y el 48% no se siente preparado para un mercado laboral con IA.',
            cifras: ['edu-3']
          },
          {
            voice: 'narrador',
            text: 'Además, el 80% considera que la integración de la IA en su universidad no cumple sus expectativas.',
            cifras: ['edu-3']
          }
        ]
      },
      {
        id: 'profesorado',
        min: 16,
        seVe: 'Diez académicos alrededor de una mesa larga, nueve de ellos con una pequeña lámpara; una tarjeta: «más de la mitad: insegura o dubitativa para usarla en docencia o investigación», sin conteo persona por persona; una pila de documentos de lineamientos, dos tercios con sello; su etiqueta de fuente lleva el alcance de la encuesta.',
        rotulos: {
          inseguridad: { text: 'más de la mitad: insegura o dubitativa para usarla en docencia o investigación', cifras: ['edu-5'] }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Y el profesorado no tiene respaldo suficiente. En una encuesta de la UNESCO a sus cátedras y redes universitarias, nueve de cada diez usan IA en su trabajo profesional, pero más de la mitad se siente insegura o dubitativa para usarla en docencia o investigación.',
            cifras: ['edu-5']
          },
          {
            voice: 'narrador',
            text: 'Dos tercios de las instituciones tienen lineamientos de uso o los están preparando. La brecha es de formación, tiempo, soporte, seguridad jurídica y claridad institucional, no de mera resistencia.',
            cifras: ['edu-5']
          }
        ]
      },
      {
        id: 'evaluar',
        min: 16,
        seVe: 'Un colador reglado intenta atrapar las letras generadas de una página y deja pasar la mayoría; se hace a un lado; cuatro piezas se dibujan a lo largo de un camino: «Producto auténtico → Bitácora de proceso → Defensa oral → Uso declarado de IA».',
        rotulos: {
          camino: { text: 'Producto auténtico → Bitácora de proceso → Defensa oral → Uso declarado de IA' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Perseguir la detección perfecta de texto generado no es sostenible. Las prácticas emergentes son el producto auténtico, la bitácora de proceso, la defensa oral, las versiones sucesivas, la reflexión metacognitiva y el uso declarado de IA.'
          },
          {
            voice: 'narrador',
            text: 'La pregunta cambia: ya no es «¿usó IA?», sino «¿qué aprendió, qué decidió y puede justificarlo?».'
          }
        ]
      },
      {
        id: 'piezas',
        min: 16,
        seVe: 'Las cuatro piezas se vuelven cuatro tarjetas sobre un escritorio, cada una con lo que recoge: un producto real, una bitácora con fechas, una conversación y una declaración breve.',
        rotulos: {},
        lines: [
          {
            voice: 'narrador',
            text: 'Cada pieza aporta una evidencia distinta de aprendizaje. Y conviene decirlo con claridad: qué usos de IA están permitidos, cómo se declaran y qué parte se hace sin IA.'
          }
        ]
      },
      {
        id: 'riesgos',
        min: 16,
        seVe: 'La lancha pasa entre dos corrientes: una cálida, con signos que ayudan (tutoría, retroalimentación, accesibilidad), y un remolino oscuro de formas idénticas repetidas (dependencia, respuestas homogéneas, aprendizaje superficial).',
        rotulos: {},
        lines: [
          {
            voice: 'narrador',
            text: 'La IA puede mejorar la tutoría, la retroalimentación y la accesibilidad. También puede generar dependencia cognitiva, respuestas homogéneas y aprendizaje superficial.'
          },
          {
            voice: 'narrador',
            text: 'El informe internacional sobre seguridad de la IA de 2026 advierte efectos sobre las habilidades cognitivas, la formación de creencias y la autonomía. Conviene preservar actividades sin IA cuando forman habilidades fundamentales.'
          },
          {
            voice: 'lectora',
            text: '¿Qué actividades de tu curso o de tu equipo deberían quedar libres de IA, y por qué?',
            pause: 3
          }
        ]
      },
      {
        id: 'cinco-frentes',
        min: 18,
        seVe: 'El faro se enciende y cinco haces de luz recorren el campus, cada uno con su rótulo: «Gobernanza», «Currículo», «Evaluación», «Infraestructura» e «Investigación».',
        rotulos: {
          gobernanza: { text: 'Gobernanza' },
          curriculo: { text: 'Currículo' },
          evaluacion: { text: 'Evaluación' },
          infraestructura: { text: 'Infraestructura' },
          investigacion: { text: 'Investigación' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'La agenda universitaria tiene cinco frentes. Gobernanza: política, responsables y gestión de incidentes. Currículo: alfabetización transversal y por disciplina. Evaluación: diseños auténticos y usos permitidos explícitos.'
          },
          {
            voice: 'narrador',
            text: 'Infraestructura: herramientas aprobadas y protección de datos. E investigación: protocolos de uso en revisión, análisis, escritura y autoría.'
          }
        ]
      },
      {
        id: 'cierre',
        min: 10,
        seVe: 'La lancha ya lleva una brújula y gira hacia el faro; título final «Evaluar el aprendizaje, no el texto.»',
        rotulos: {
          titulo: { text: 'Evaluar el aprendizaje, no el texto.' }
        },
        lines: [
          { voice: 'narrador', text: 'En educación, se evalúa el aprendizaje, no el texto.' }
        ]
      }
    ],
    checkpoints: [
      {
        after: 'piezas',
        question: '¿Qué evaluación mide mejor el aprendizaje cuando hay IA disponible?',
        options: ['Un ensayo entregado sin más', 'Un producto auténtico con bitácora, defensa oral y uso declarado de IA', 'Un detector de texto generado'],
        answer: 1,
        explain: 'Se evalúa el aprendizaje, no el texto: el proceso y la defensa muestran qué aprendió y qué decidió.',
        hint: 'Recuerda cómo cambia la pregunta: ya no es si usó IA, sino qué aprendió, qué decidió y si puede justificarlo.'
      }
    ]
  },
  {
    id: 'v07',
    slug: 'del-benchmark-al-ensayo',
    title: 'Del benchmark al ensayo',
    sesion: 5,
    laminas: ['d11', 'd12'],
    rate: '0%',
    target: [270, 360],
    poster: { scene: 'semaforo', p: 0.6 },
    chapters: [
      { title: 'Más ciencia con IA', from: 'publicaciones' },
      { title: 'Piezas, no el ciclo', from: 'ciclo' },
      { title: 'El semáforo clínico', from: 'semaforo' },
      { title: 'La escalera de evidencia', from: 'escalera' }
    ],
    scenes: [
      {
        id: 'publicaciones',
        min: 16,
        seVe: 'Un telescopio sobre un trípode y un microscopio en una mesa de laboratorio cálida; hojas de papel se elevan como pájaros y se posan en dos pilas proporcionales, «63.547 (2024)» y «~80.150 (2025)»; luego, una banda pequeña, «5,8–8,8% de la producción científica, según el campo», junto a «<1% en 2010».',
        rotulos: {
          pila2024: { text: '63.547 (2024)', cifras: ['cien-1'] },
          pila2025: { text: '~80.150 (2025)', cifras: ['cien-1'] },
          participacion: { text: '5,8–8,8% de la producción científica, según el campo', cifras: ['cien-2'] },
          antes: { text: '<1% en 2010', cifras: ['cien-2'] }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'La IA ya está en el laboratorio. Las publicaciones de ciencias naturales relacionadas con IA llegaron a cerca de 80.150 en 2025, frente a 63.547 en 2024: un aumento de 26%.',
            cifras: ['cien-1']
          },
          {
            voice: 'narrador',
            text: 'Según el informe base, la IA ya representa entre 5,8% y 8,8% de la producción científica, según el campo, frente a menos de 1% en 2010.',
            cifras: ['cien-2']
          }
        ]
      },
      {
        id: 'modelos',
        min: 12,
        seVe: 'Alrededor de la mesa del laboratorio, pequeñas lámparas regladas junto a un mapa estelar, un mapa del tiempo, una molécula, un matraz y un corte de la Tierra.',
        rotulos: {},
        lines: [
          {
            voice: 'narrador',
            text: 'Hay modelos fundacionales en astronomía, meteorología, biología molecular, química y ciencias de la Tierra.'
          }
        ]
      },
      {
        id: 'frontera-lab',
        min: 16,
        seVe: 'Una pequeña cordillera hecha de vidrio de laboratorio, dentro de un panel azul marino reglado: un pico alto, «ChemBench: superan en promedio a químicos humanos», y dos valles profundos, «Replicar investigaciones de astrofísica: menos de 20%» y «PaperArena: 38,8% frente a 83,5%», con barras proporcionales.',
        rotulos: {
          chembench: { text: 'ChemBench: superan en promedio a químicos humanos' },
          astrofisica: { text: 'Replicar investigaciones de astrofísica: menos de 20%', cifras: ['cap-5'] },
          paperArena: { text: 'PaperArena: 38,8% frente a 83,5%', cifras: ['cap-6'] }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'También aquí la frontera es irregular. En la prueba ChemBench, los modelos superan en promedio a químicos humanos.',
            cifras: ['cap-7']
          },
          {
            voice: 'narrador',
            text: 'Pero logran menos de 20% al replicar investigaciones de astrofísica. Y en PaperArena, el mejor agente, Gemini 2.5 Pro en configuración multiagente, logra 38,8%, frente a 83,5% de expertos con doctorado.',
            cifras: ['cap-5', 'cap-6']
          }
        ]
      },
      {
        id: 'ciclo',
        min: 16,
        seVe: 'Se dibuja la barra de proceso de la lámina D11, «Hipótesis › Diseño › Ejecución › Validación › Interpretación»; el haz del telescopio ilumina por completo los dos primeros pasos y el tercero a medias; los dos últimos quedan en sombra, donde unas manos humanas cálidas sostienen una pluma y una lente.',
        rotulos: {
          proceso: { text: 'Hipótesis › Diseño › Ejecución › Validación › Interpretación' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'La IA acelera piezas del trabajo científico, no el ciclo completo. Ilumina en parte los primeros pasos; validar e interpretar sigue dependiendo del juicio experto.'
          }
        ]
      },
      {
        id: 'manuscrito',
        min: 14,
        seVe: 'Un manuscrito dibujado por completo con líneas regladas recibe, en un taller, un pequeño sello «Aceptado»; a su lado, un cajón rotulado «descubrimientos experimentales confirmados» guarda solo unas pocas tarjetas.',
        rotulos: {
          sello: { text: 'Aceptado' },
          cajon: { text: 'descubrimientos experimentales confirmados' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'En 2025, un taller con revisión por pares aceptó un artículo generado íntegramente por IA. Pero los descubrimientos experimentales confirmados siguen siendo pocos.',
            cifras: ['cien-3']
          },
          { voice: 'narrador', text: 'Producir manuscritos no es producir conocimiento válido.' }
        ]
      },
      {
        id: 'proposito',
        min: 12,
        seVe: 'Una llave reglada, pequeña y precisa, con el rótulo «111 millones de parámetros», abre un candado que un enorme llavero no pudo abrir.',
        rotulos: {
          llave: { text: '111 millones de parámetros', cifras: ['cap-12'] }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Y lo adecuado al propósito pesa: un modelo de proteínas de 111 millones de parámetros y uno genómico de 200 millones superaron a sistemas mucho mayores en evaluaciones específicas.',
            cifras: ['cap-12']
          }
        ]
      },
      {
        id: 'semaforo',
        min: 12,
        seVe: 'Se dibuja el alto semáforo caligráfico de la lámina D12: tres discos en posiciones fijas, cada uno con su signo y su rótulo, arriba «Rojo: evidencia insuficiente», en el medio «Ámbar: resultado de laboratorio» y abajo «Verde: apoyo al flujo de trabajo»; desde aquí y hasta el final del capítulo, los distintivos de evidencia van solo en tinta.',
        rotulos: {
          rojo: { text: 'Rojo: evidencia insuficiente' },
          ambar: { text: 'Ámbar: resultado de laboratorio' },
          verde: { text: 'Verde: apoyo al flujo de trabajo' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'En medicina, la IA tiene potencia, pero la evidencia es desigual. Leámosla con un semáforo.'
          }
        ]
      },
      {
        id: 'verde',
        min: 14,
        seVe: 'Se enciende la luz de abajo; una médica escribe notas clínicas con una pequeña lámpara junto a la libreta; una barra de tiempo de escritura se encoge hasta su marca «hasta −83%», con la palabra «hasta» al lado.',
        rotulos: {
          marca: { text: 'hasta −83%', cifras: ['med-1'] },
          hasta: { text: 'hasta' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Verde, apoyo al flujo de trabajo: médicos de Sharp HealthCare reportan hasta 83% menos tiempo escribiendo notas clínicas.',
            cifras: ['med-1']
          }
        ]
      },
      {
        id: 'ambar',
        min: 16,
        seVe: 'Se enciende la luz del medio; dentro de un panel azul marino reglado, dos barras proporcionales, «Sistema multiagente: 85,5%» y «21 médicos sin sus herramientas habituales: ~20%», con el rótulo «Casos difíciles publicados en NEJM»; una nota prendida: «No es práctica clínica».',
        rotulos: {
          sistema: { text: 'Sistema multiagente: 85,5%', cifras: ['med-2'] },
          medicos: { text: '21 médicos sin sus herramientas habituales: ~20%', cifras: ['med-2'] },
          casos: { text: 'Casos difíciles publicados en NEJM' },
          nota: { text: 'No es práctica clínica' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Ámbar, resultado de laboratorio: un sistema multiagente logró 85,5% en casos difíciles publicados en una revista médica. Un grupo de 21 médicos con 5 a 20 años de experiencia, que trabajó sin sus herramientas habituales, logró cerca de 20%.',
            cifras: ['med-2', 'ctx-medicos-experiencia']
          },
          { voice: 'narrador', text: 'Es un resultado de laboratorio, no práctica clínica.', advertencia: 2 }
        ]
      },
      {
        id: 'rojo',
        min: 20,
        seVe: 'Se enciende la luz de arriba; una pila de más de 500 tarjetas de estudios: cerca de la mitad son hojas de preguntas tipo examen y una franja delgada, de 5%, son datos clínicos reales; una tarjeta aparte muestra en banda «11,8–14,6 recomendaciones gravemente dañinas por cada 100 casos»; un conteo reglado: «FDA: 258 dispositivos con IA en 2025 · ~1.400 en total»; luego, un panel aparte, fechado «hasta diciembre de 2024», con «1.016 autorizaciones» y, entre los dispositivos con estudios clínicos, una franja de 2,4% «con ensayos aleatorizados».',
        rotulos: {
          recomendaciones: { text: '11,8–14,6 recomendaciones gravemente dañinas por cada 100 casos', cifras: ['med-4'] },
          fda: { text: 'FDA: 258 dispositivos con IA en 2025 · ~1.400 en total', cifras: ['med-5'] },
          fecha: { text: 'hasta diciembre de 2024', cifras: ['med-6'] },
          autorizaciones: { text: '1.016 autorizaciones', cifras: ['med-6'] },
          ensayos: { text: 'con ensayos aleatorizados' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Rojo, evidencia insuficiente: de más de 500 estudios revisados, casi la mitad usó preguntas tipo examen y solo 5% usó datos clínicos reales. Y en una evaluación abierta, modelos generales dieron entre 11,8 y 14,6 recomendaciones gravemente dañinas por cada 100 casos.',
            cifras: ['med-3', 'med-4']
          },
          {
            voice: 'narrador',
            text: 'La FDA de Estados Unidos autorizó 258 dispositivos con IA en 2025, cerca de 1.400 en total, la mayoría por vías que no exigen nuevos ensayos. Y de 1.016 autorizaciones hasta diciembre de 2024, solo el 2,4% de los dispositivos con estudios clínicos tuvo evidencia de ensayos aleatorizados.',
            cifras: ['med-5', 'med-6']
          }
        ]
      },
      {
        id: 'escalera',
        min: 18,
        seVe: 'Una escalera caligráfica cálida, con seis peldaños numerados y rotulados desde abajo: «Puntaje en un benchmark o examen», «Casos publicados o simulados», «Datos retrospectivos reales del contexto», «Validación externa en otra institución o población», «Ensayo aleatorizado o diseño cuasiexperimental sólido» y «Seguimiento posdespliegue con monitoreo de daños».',
        rotulos: {
          escalon1: { text: 'Puntaje en un benchmark o examen' },
          escalon2: { text: 'Casos publicados o simulados' },
          escalon3: { text: 'Datos retrospectivos reales del contexto' },
          escalon4: { text: 'Validación externa en otra institución o población' },
          escalon5: { text: 'Ensayo aleatorizado o diseño cuasiexperimental sólido' },
          escalon6: { text: 'Seguimiento posdespliegue con monitoreo de daños' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Para ordenar la evidencia, el curso usa una escalera de seis escalones: puntaje en un benchmark o examen; casos publicados o simulados; datos retrospectivos reales del contexto;'
          },
          {
            voice: 'narrador',
            text: 'validación externa en otra institución o población; ensayo aleatorizado o diseño cuasiexperimental sólido; y seguimiento posdespliegue con monitoreo de daños.'
          }
        ]
      },
      {
        id: 'ubicar',
        min: 16,
        seVe: 'Tres tarjetas pequeñas suben por la escalera y se detienen: «Notas clínicas» en el tercer peldaño (verde), «Sistema multiagente» en el segundo (ámbar) y «Revisión de estudios y dispositivos» casi toda en el primero, con un camino punteado que rara vez llega al quinto (rojo).',
        rotulos: {
          notasClinicas: { text: 'Notas clínicas' },
          multiagente: { text: 'Sistema multiagente' },
          revision: { text: 'Revisión de estudios y dispositivos' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Ubiquemos los ejemplos. Las notas clínicas están en el tercer escalón: datos reales de uso. El sistema multiagente, en el segundo: casos publicados.'
          },
          {
            voice: 'narrador',
            text: 'Y en la revisión de estudios y dispositivos, la mayoría de la evidencia está en el primer escalón y casi nunca llega al quinto.'
          }
        ]
      },
      {
        id: 'antes-de-escalar',
        min: 16,
        seVe: 'El camino de la lámina D12, «Validación externa → Seguimiento posdespliegue → Responsabilidad clínica», se dibuja alrededor de un hospital de formas cálidas, y se le suman dos rótulos más: «Representatividad poblacional» e «Interacción humano–IA».',
        rotulos: {
          camino: { text: 'Validación externa → Seguimiento posdespliegue → Responsabilidad clínica' },
          representatividad: { text: 'Representatividad poblacional' },
          interaccion: { text: 'Interacción humano–IA' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Antes de escalar, las prioridades son validación externa, seguimiento posdespliegue, representatividad poblacional, interacción humano–IA y responsabilidad clínica.',
            say: 'Antes de escalar, las prioridades son validación externa, seguimiento posdespliegue, representatividad poblacional, interacción entre personas e i a, y responsabilidad clínica.'
          },
          {
            voice: 'lectora',
            text: '¿Qué tendría que pasar para que confiaras en un sistema de diagnóstico con IA en tu sistema de salud?',
            pause: 3
          }
        ]
      },
      {
        id: 'cierre',
        min: 10,
        seVe: 'El peldaño más alto de la escalera brilla débilmente; título final «Un resultado de laboratorio no es efectividad clínica.»',
        rotulos: {
          titulo: { text: 'Un resultado de laboratorio no es efectividad clínica.' }
        },
        lines: [
          { voice: 'narrador', text: 'Un resultado de laboratorio no es efectividad clínica.' }
        ]
      }
    ],
    checkpoints: [
      {
        after: 'rojo',
        question: 'El 2,4% con ensayos aleatorizados se refiere a:',
        options: ['Los 258 dispositivos autorizados en 2025', 'Los dispositivos con estudios clínicos, entre 1.016 autorizaciones hasta diciembre de 2024', 'Todos los estudios con modelos de lenguaje'],
        answer: 1,
        explain: 'Atribuirlo a los 258 dispositivos de 2025 es un error de lectura frecuente.',
        hint: 'Esa proporción no sale de los dispositivos de un solo año: fíjate en el panel aparte, con su propia fecha.',
        cifras: ['med-5', 'med-6']
      },
      {
        after: 'ubicar',
        question: 'Un sistema obtiene un puntaje alto en un examen médico. ¿En qué escalón está esa evidencia?',
        options: ['Primer escalón', 'Cuarto escalón', 'Sexto escalón'],
        answer: 0,
        explain: 'Un puntaje en un examen es el primer escalón: falta mucho para hablar de efectividad clínica.',
        hint: 'Recuerda el orden de la escalera: ¿un examen mide el uso real o el desempeño en una prueba?'
      }
    ]
  },
  {
    id: 'v08',
    slug: 'gobernanza',
    title: 'Gobernar sistemas, no solo modelos',
    sesion: 6,
    laminas: ['d13', 'd14'],
    rate: '0%',
    target: [300, 390],
    poster: { scene: 'volante', p: 0.6 },
    chapters: [
      { title: 'Tres familias de riesgo', from: 'familias' },
      { title: 'Leer bien los incidentes', from: 'incidentes' },
      { title: 'La Ley de IA de la UE', from: 'ley' },
      { title: 'El ciclo de gobernanza', from: 'volante' }
    ],
    scenes: [
      {
        id: 'familias',
        min: 18,
        seVe: 'Tres columnas caligráficas altas se dibujan con sus signos: «Uso malicioso» (un anzuelo), «Fallos» (una grieta) y «Riesgos sistémicos» (una red suelta de hilos sobre un pueblo), con la etiqueta de fuente del informe.',
        rotulos: {
          usoMalicioso: { text: 'Uso malicioso' },
          fallos: { text: 'Fallos' },
          sistemicos: { text: 'Riesgos sistémicos' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Los riesgos crecen junto con las capacidades. El informe internacional sobre seguridad de la IA de 2026, publicado el 3 de febrero con más de 100 expertos y el respaldo de más de 30 países y organizaciones, los agrupa en tres familias:',
            cifras: ['ries-2']
          },
          {
            voice: 'narrador',
            text: 'uso malicioso, fallos y riesgos sistémicos. Incluyen apoyo a ciberataques y desinformación, comportamientos imprevistos, concentración de poder, impactos laborales y erosión de la autonomía.'
          }
        ]
      },
      {
        id: 'respuesta',
        min: 12,
        seVe: 'Cuatro herramientas cuelgan en la pared de un taller: un panel de prueba reglado («Evaluaciones»), un mapa con flechas de amenaza («Modelado de amenazas»), un buzón («Reporte de incidentes») y un puente con juntas flexibles («Resiliencia institucional»).',
        rotulos: {
          evaluaciones: { text: 'Evaluaciones' },
          amenazas: { text: 'Modelado de amenazas' },
          reporte: { text: 'Reporte de incidentes' },
          resiliencia: { text: 'Resiliencia institucional' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Y recomienda combinar evaluaciones, modelado de amenazas, reporte de incidentes y resiliencia institucional.'
          }
        ]
      },
      {
        id: 'incidentes',
        min: 16,
        seVe: 'El dial de control dibujado a mano de la lámina D13; su aguja pasa de «233 (2024)» a «362 (2025)» con ángulos exactos; el rótulo «+55%»; su etiqueta de fuente, con el alcance «AI Incident Database».',
        rotulos: {
          antes: { text: '233 (2024)', cifras: ['ries-1'] },
          despues: { text: '362 (2025)', cifras: ['ries-1'] },
          aumento: { text: '+55%', cifras: ['ries-1'] },
          alcance: { text: 'AI Incident Database' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Los incidentes documentados en la AI Incident Database pasaron de 233 en 2024 a 362 en 2025: un aumento de 55%.',
            cifras: ['ries-1']
          },
          { voice: 'lectora', text: '¿Eso significa que la IA es más peligrosa?' }
        ]
      },
      {
        id: 'denominador',
        min: 18,
        seVe: 'Junto al dial, el pueblo crece: más lámparas en más escritorios (más uso) y más buzones (más reporte); se dibuja una fracción con «incidentes» arriba y, abajo, una caja punteada vacía con el rótulo «¿por unidad de adopción?».',
        rotulos: {
          numerador: { text: 'incidentes' },
          denominador: { text: '¿por unidad de adopción?' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'No necesariamente. El aumento puede reflejar más daños, pero también más uso y más reporte. Además, los conteos se revisan con el tiempo.'
          },
          {
            voice: 'narrador',
            text: 'Sin un denominador comparable, como una tasa por unidad de adopción, el conteo bruto no basta. Y, al mismo tiempo, cae la transparencia técnica de los modelos de frontera.'
          }
        ]
      },
      {
        id: 'trampa',
        min: 16,
        seVe: 'Dentro de una sala de examen reglada, una lámpara pasa junto a un letrero «evaluación en curso» y su brillo cambia; encuentra un hueco en la cerca reglada de la prueba y desliza una ficha por él; una nota al margen define «reward hacking».',
        rotulos: {
          letrero: { text: 'evaluación en curso' },
          termino: { text: 'reward hacking' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Además, algunas evaluaciones se pueden engañar. Ciertos modelos detectan que están siendo evaluados y explotan deficiencias de la prueba: es el reward hacking.'
          },
          {
            voice: 'narrador',
            text: 'Por eso hacen falta baterías adaptativas, evaluación externa, monitoreo continuo y controles operacionales.'
          }
        ]
      },
      {
        id: 'ley',
        min: 18,
        seVe: 'Se despliega una larga línea de tiempo de papel con hitos fechados: «1 de agosto de 2024: entra en vigor», «2 de febrero de 2025: prohibiciones y alfabetización en IA» y «2 de agosto de 2025: obligaciones para modelos de propósito general»; bajo el último, tres tarjetas pequeñas: «documentación técnica», «política de derechos de autor» y «resumen público del contenido de entrenamiento».',
        rotulos: {
          vigor: { text: '1 de agosto de 2024: entra en vigor', cifras: ['ctx-ley-vigor'] },
          prohibiciones: { text: '2 de febrero de 2025: prohibiciones y alfabetización en IA', cifras: ['ctx-ley-prohibiciones'] },
          gpai: { text: '2 de agosto de 2025: obligaciones para modelos de propósito general', cifras: ['ries-3'] },
          documentacion: { text: 'documentación técnica' },
          derechosAutor: { text: 'política de derechos de autor' },
          resumen: { text: 'resumen público del contenido de entrenamiento' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'En regulación, la gran referencia es la Ley de IA de la Unión Europea. Entró en vigor el 1 de agosto de 2024, y desde el 2 de febrero de 2025 se aplican las prohibiciones y la obligación de alfabetización en IA.',
            cifras: ['ctx-ley-vigor', 'ctx-ley-prohibiciones']
          },
          {
            voice: 'narrador',
            text: 'Desde el 2 de agosto de 2025 rigen las obligaciones para los modelos de propósito general: documentación técnica, política de derechos de autor y resumen público del contenido de entrenamiento. Los modelos con riesgo sistémico deben, además, evaluar y mitigar riesgos, reportar incidentes graves y proteger su ciberseguridad.',
            cifras: ['ries-3']
          }
        ]
      },
      {
        id: 'plazos',
        min: 14,
        seVe: 'La línea de tiempo continúa: «2 de agosto de 2026: se aplica la mayoría de las reglas; la Comisión puede hacer cumplir las obligaciones de los modelos de propósito general» y «2 de agosto de 2027: plazo para los modelos comercializados antes del 2 de agosto de 2025».',
        rotulos: {
          mayoria: { text: '2 de agosto de 2026: se aplica la mayoría de las reglas; la Comisión puede hacer cumplir las obligaciones de los modelos de propósito general', cifras: ['ries-3'] },
          previos: { text: '2 de agosto de 2027: plazo para los modelos comercializados antes del 2 de agosto de 2025', cifras: ['ries-3'] }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Desde el 2 de agosto de 2026 se aplica la mayoría de las reglas, y la Comisión puede hacer cumplir esas obligaciones, incluso con multas. Los modelos que ya estaban en el mercado antes del 2 de agosto de 2025 tienen plazo hasta el 2 de agosto de 2027.',
            cifras: ['ries-3']
          }
        ]
      },
      {
        id: 'omnibus',
        min: 20,
        seVe: 'Una hoja nueva, «Ómnibus Digital · Reglamento (UE) 2026/1744», se engrapa a la línea de tiempo; los hitos de los modelos de propósito general siguen fijos, cada uno marcado «sin cambios»; más a la derecha aparecen dos alfileres nuevos de alto riesgo, cada uno con el sello «aplazado»: «Anexo III → 2 de diciembre de 2027» y «Anexo I, productos regulados → 2 de agosto de 2028»; luego, dos tarjetas solo de texto: «2 de diciembre de 2026: nuevas prohibiciones» y «2 de agosto de 2027: al menos un sandbox regulatorio por país».',
        rotulos: {
          hoja: { text: 'Ómnibus Digital · Reglamento (UE) 2026/1744', cifras: ['ries-4'] },
          sinCambios: { text: 'sin cambios' },
          aplazado: { text: 'aplazado' },
          anexoIII: { text: 'Anexo III → 2 de diciembre de 2027', cifras: ['ries-4'] },
          anexoI: { text: 'Anexo I, productos regulados → 2 de agosto de 2028', cifras: ['ries-4'] },
          prohibiciones: { text: '2 de diciembre de 2026: nuevas prohibiciones', cifras: ['ries-4'] },
          sandbox: { text: '2 de agosto de 2027: al menos un sandbox regulatorio por país', cifras: ['ries-4'] }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'En julio de 2026, el Ómnibus Digital modificó la ley. No cambió las fechas para los modelos de propósito general, pero aplazó las reglas para sistemas de alto riesgo: las del anexo III, al 2 de diciembre de 2027, y las del anexo I, de productos regulados, al 2 de agosto de 2028.',
            cifras: ['ries-4']
          },
          {
            voice: 'narrador',
            text: 'Desde el 2 de diciembre de 2026 prohíbe, además, los sistemas que generan deepfakes sexuales no consentidos y material de abuso sexual infantil. Y pide que cada país tenga al menos un sandbox regulatorio operativo al 2 de agosto de 2027.',
            cifras: ['ries-4']
          },
          { voice: 'lectora', text: 'Entonces, decir que la ley se aplica completa desde agosto de 2026 es un error.' }
        ]
      },
      {
        id: 'por-que-importa',
        min: 14,
        seVe: 'Un mar caligráfico entre dos orillas; unos hilos unen una universidad y una empresa latinoamericanas con socios y proveedores europeos; una nota pequeña: «Información, no asesoría jurídica».',
        rotulos: {
          nota: { text: 'Información, no asesoría jurídica' }
        },
        lines: [
          {
            voice: 'narrador',
            text: '¿Por qué importa en América Latina? Porque la norma alcanza a universidades y empresas que ofrecen servicios en la Unión Europea, investigan con socios europeos o usan proveedores sujetos a ella.'
          },
          {
            voice: 'narrador',
            text: 'Y su enfoque basado en el riesgo se está volviendo referencia internacional. Esto es información, no asesoría jurídica.'
          }
        ]
      },
      {
        id: 'volante',
        min: 20,
        seVe: 'La metáfora de la lámina D14: un gran volante cálido con un disco de freno; alrededor de su borde se dibujan en orden seis estaciones numeradas, «Inventario → Clasificar riesgo → Evaluar → Supervisar → Monitorear incidentes → Corregir»; el volante gira despacio y el ciclo se repite.',
        rotulos: {
          ciclo: { text: 'Inventario → Clasificar riesgo → Evaluar → Supervisar → Monitorear incidentes → Corregir' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Dentro de cada organización, la gobernanza es un ciclo que se repite. Inventario: modelos, proveedores, datos y casos de uso. Clasificar el riesgo, según su impacto y su reversibilidad.'
          },
          {
            voice: 'narrador',
            text: 'Evaluar privacidad, seguridad, sesgo y derechos, con datos representativos. Supervisar, con personas que tienen autoridad real para intervenir y un registro de decisiones, versiones, instrucciones y fuentes.'
          },
          {
            voice: 'narrador',
            text: 'Monitorear la deriva, los incidentes y los efectos distributivos. Y corregir: suspender, corregir y reparar, con auditoría independiente en los usos de alto impacto.'
          }
        ]
      },
      {
        id: 'freno',
        min: 14,
        seVe: 'Una mano cálida descansa sobre la palanca del freno, con la nota «¿Quién puede detenerlo?»; junto a la lámpara, un revisor sin palanca aparece tachado: «revisión sin autoridad».',
        rotulos: {
          pregunta: { text: '¿Quién puede detenerlo?' },
          sinAutoridad: { text: 'revisión sin autoridad' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Una revisión humana sin autoridad para detener el sistema no es supervisión. Definan el criterio de suspensión: qué evento detiene el sistema y quién decide.'
          }
        ]
      },
      {
        id: 'sociotecnico',
        min: 14,
        seVe: 'Una lámpara de aspecto seguro, en un taller, junto a un balde de datos con fugas, un gráfico de incentivos torcido, un llavero con demasiadas llaves y una persona sin tiempo para revisar; entre ellos saltan pequeñas chispas.',
        rotulos: {},
        lines: [
          {
            voice: 'narrador',
            text: 'La gobernanza es de sistemas sociotécnicos, no solo de modelos. Un modelo razonablemente seguro puede causar daño si se combina con datos deficientes, incentivos incorrectos, permisos excesivos o usuarios sin capacidad de revisión.'
          }
        ]
      },
      {
        id: 'cierre',
        min: 10,
        seVe: 'El volante sigue girando bajo manos cálidas; título final «Gobernar sistemas sociotécnicos, no solo modelos.»',
        rotulos: {
          titulo: { text: 'Gobernar sistemas sociotécnicos, no solo modelos.' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'La gobernanza es proporcional al riesgo. Y se gobiernan sistemas sociotécnicos, no solo modelos.'
          }
        ]
      }
    ],
    checkpoints: [
      {
        after: 'respuesta',
        question: 'Las tres familias de riesgo del informe de 2026 son:',
        options: ['Técnica, legal y ética', 'Uso malicioso, fallos y riesgos sistémicos', 'Privacidad, sesgo y costo'],
        answer: 1,
        explain: 'Uso malicioso, fallos y riesgos sistémicos.',
        hint: 'Recuerda las columnas y sus signos: un anzuelo, una grieta y una red de hilos sobre un pueblo.'
      },
      {
        after: 'omnibus',
        question: 'Tras el Ómnibus, ¿cuándo aplican las reglas de alto riesgo del anexo III?',
        options: ['2 de agosto de 2026', '2 de diciembre de 2027', '2 de agosto de 2028'],
        answer: 1,
        explain: 'Las del anexo I aplican el 2 de agosto de 2028.',
        hint: 'El Ómnibus aplazó esas reglas, y el anexo III no es el de productos regulados.',
        cifras: ['ries-4']
      }
    ]
  },
  {
    id: 'v09',
    slug: 'de-consumir-a-construir',
    title: 'De consumir a construir',
    sesion: 7,
    laminas: ['d15', 'd16', 'd17'],
    rate: '0%',
    target: [300, 390],
    poster: { scene: 'falta', p: 0.6 },
    chapters: [
      { title: 'Una región que adopta rápido', from: 'region' },
      { title: 'Colombia', from: 'colombia' },
      { title: 'Agenda 2026–2028', from: 'agenda' },
      { title: 'Cinco mensajes', from: 'mensajes' }
    ],
    scenes: [
      {
        id: 'region',
        min: 16,
        seVe: 'América Latina y el Caribe como una sola masa de tierra biomórfica y cálida, sin fronteras; dos barras proporcionales, «11% de los usuarios de Internet» y «14% de las visitas mundiales a soluciones de IA»; revolotean pequeños signos de teléfono: «tercera región en descargas de aplicaciones generativas».',
        rotulos: {
          usuarios: { text: '11% de los usuarios de Internet', cifras: ['alc-1'] },
          visitas: { text: '14% de las visitas mundiales a soluciones de IA', cifras: ['alc-1'] },
          descargas: { text: 'tercera región en descargas de aplicaciones generativas', cifras: ['alc-1'] }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'América Latina y el Caribe adopta rápido. Según la CEPAL, la región concentra el 14% de las visitas mundiales a soluciones de IA, con el 11% de los usuarios de Internet.',
            cifras: ['alc-1']
          },
          {
            voice: 'narrador',
            text: 'Y es la tercera región del mundo en descargas de aplicaciones generativas.',
            cifras: ['alc-1']
          }
        ]
      },
      {
        id: 'ilia',
        min: 14,
        seVe: 'Una cuadrícula de diecinueve tarjetas lisas, sin nombres ni banderas; tres cintas las atan: «Factores habilitantes», «Investigación, desarrollo y adopción» y «Gobernanza».',
        rotulos: {
          habilitantes: { text: 'Factores habilitantes' },
          investigacion: { text: 'Investigación, desarrollo y adopción' },
          gobernanza: { text: 'Gobernanza' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'El Índice Latinoamericano de Inteligencia Artificial, el ILIA 2025 de la CEPAL y el CENIA, mide más de 100 subindicadores en 19 países, agrupados en tres dimensiones: factores habilitantes; investigación, desarrollo y adopción; y gobernanza.',
            cifras: ['ctx-ilia-indicadores']
          }
        ]
      },
      {
        id: 'consumo',
        min: 16,
        seVe: 'En la orilla cercana, un mercado concurrido de lámparas listas en cajas, que compran muchas figuras pequeñas y pequeños negocios; una corriente delgada de datos cruza el mar hacia una orilla lejana, y unas pocas monedas se van flotando con ella.',
        rotulos: {},
        lines: [
          {
            voice: 'narrador',
            text: 'Pero el uso se concentra en herramientas listas para el consumidor y de bajo requerimiento técnico, también en las mipymes. Eso da productividad a corto plazo,'
          },
          {
            voice: 'narrador',
            text: 'pero también dependencia tecnológica, salida de datos y captura externa del valor.'
          }
        ]
      },
      {
        id: 'pioneros',
        min: 14,
        seVe: 'Tres barras proporcionales en una misma escala desde cero, «Chile 70,56», «Brasil 67,39» y «Uruguay 62,32», bajo el rótulo «Pioneros»; luego, un rótulo de grupo: «Adoptantes: Colombia, Ecuador, Costa Rica, República Dominicana».',
        rotulos: {
          chile: { text: 'Chile 70,56', cifras: ['alc-2'] },
          brasil: { text: 'Brasil 67,39', cifras: ['alc-2'] },
          uruguay: { text: 'Uruguay 62,32', cifras: ['alc-2'] },
          pioneros: { text: 'Pioneros' },
          adoptantes: { text: 'Adoptantes: Colombia, Ecuador, Costa Rica, República Dominicana' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'En el ILIA 2025, los pioneros son Chile, con 70,56 puntos; Brasil, con 67,39, y Uruguay, con 62,32. Colombia, Ecuador, Costa Rica y República Dominicana están entre los adoptantes.',
            cifras: ['alc-2']
          }
        ]
      },
      {
        id: 'computo',
        min: 12,
        seVe: 'Dos grupos exactos de puntos, con datos de 2025: «América Latina y el Caribe: 8 clústeres de supercomputación con respaldo estatal» y «Europa y Asia Central: 44».',
        rotulos: {
          americaLatina: { text: 'América Latina y el Caribe: 8 clústeres de supercomputación con respaldo estatal', cifras: ['eco-7'] },
          europa: { text: 'Europa y Asia Central: 44', cifras: ['eco-7'] }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Y la capacidad propia todavía es escasa: en 2025, la región tenía 8 clústeres de supercomputación con respaldo estatal, frente a 44 en Europa y Asia Central.',
            cifras: ['eco-7']
          }
        ]
      },
      {
        id: 'colombia',
        min: 18,
        seVe: 'Un paisaje andino cálido; un medidor caligráfico marca «55,84», con una cinta «4.º de 19»; dos medidores más pequeños, «Adopción 67,29» y «Gobernanza 76,01»; los rótulos «Grupo: adoptante» y «gobernanza avanzada».',
        rotulos: {
          puntaje: { text: '55,84', cifras: ['alc-3'] },
          puesto: { text: '4.º de 19', cifras: ['alc-3'] },
          adopcion: { text: 'Adopción 67,29', cifras: ['alc-3'] },
          gobernanza: { text: 'Gobernanza 76,01', cifras: ['alc-3'] },
          grupo: { text: 'Grupo: adoptante' },
          gobernanzaAvanzada: { text: 'gobernanza avanzada' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Colombia obtuvo 55,84 puntos en el ILIA 2025 y subió del quinto al cuarto lugar entre 19 países, con 3,2 puntos más que en la edición anterior. Está 12,86 puntos por encima del promedio regional.',
            cifras: ['alc-3', 'ctx-colombia-quinto']
          },
          {
            voice: 'narrador',
            text: 'Tiene 67,29 puntos en adopción y 76,01 en gobernanza, lo que la ubica en el grupo de gobernanza avanzada. Pero en la clasificación general, Colombia es adoptante, no pionera.',
            cifras: ['alc-3']
          }
        ]
      },
      {
        id: 'conpes',
        min: 18,
        seVe: 'Un documento, «CONPES 4144», se abre como un mapa plegable en seis secciones con signos: «Ética y gobernanza», «Datos e infraestructura», «Investigación, desarrollo e innovación», «Capacidades y talento», «Mitigación de riesgos» y «Adopción pública, empresarial y territorial»; un contador: «106 acciones · 479.273 millones de pesos · hasta 2030».',
        rotulos: {
          documento: { text: 'CONPES 4144', cifras: ['alc-4'] },
          etica: { text: 'Ética y gobernanza' },
          datos: { text: 'Datos e infraestructura' },
          investigacion: { text: 'Investigación, desarrollo e innovación' },
          talento: { text: 'Capacidades y talento' },
          riesgos: { text: 'Mitigación de riesgos' },
          adopcion: { text: 'Adopción pública, empresarial y territorial' },
          contador: { text: '106 acciones · 479.273 millones de pesos · hasta 2030', cifras: ['alc-4'] }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'El CONPES 4144, aprobado el 14 de febrero de 2025, fija la Política Nacional de IA hasta 2030, con 106 acciones y una inversión indicativa de 479.273 millones de pesos.',
            cifras: ['alc-4']
          },
          {
            voice: 'narrador',
            text: 'Sus ejes son ética y gobernanza; datos e infraestructura; investigación, desarrollo e innovación; capacidades y talento; mitigación de riesgos; y adopción pública, empresarial y territorial. En 2026, la Estrategia de Datos Abiertos para IA empezó a poner en práctica el componente de datos.'
          }
        ]
      },
      {
        id: 'falta',
        min: 16,
        seVe: 'La metáfora de la lámina D15: un puente colgante, todavía en construcción, desde la orilla iluminada «Uso» hasta la orilla «Capacidad propia»; los trabajadores cargan tablones con los rótulos «cómputo», «datos» y «talento».',
        rotulos: {
          orillaUso: { text: 'Uso' },
          orillaCapacidad: { text: 'Capacidad propia' },
          computo: { text: 'cómputo' },
          datos: { text: 'datos' },
          talento: { text: 'talento' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'La UNESCO reconoce avances en gobernanza, pero señala que los instrumentos regulatorios colombianos son sobre todo orientativos. Pide más coordinación institucional, gobernanza de datos, supervisión basada en riesgos, formación interdisciplinaria y capacidad pública.'
          },
          {
            voice: 'narrador',
            text: 'El reto es pasar de una política declarativa a un portafolio verificable, con indicadores periódicos: convertir el consumo en capacidad productiva y científica.'
          }
        ]
      },
      {
        id: 'agenda',
        min: 22,
        seVe: 'El camino de la lámina D16, con tres carriles, «Gobiernos», «Universidades» y «Organizaciones», e hitos en 2026, 2027 y 2028; a su lado corre un cuarto sendero, más delgado, «Investigación»; la nota «El orden por año es una secuencia propuesta»; una brújula hecha de una estrella irregular.',
        rotulos: {
          gobiernos: { text: 'Gobiernos' },
          universidades: { text: 'Universidades' },
          organizaciones: { text: 'Organizaciones' },
          investigacion: { text: 'Investigación' },
          nota: { text: 'El orden por año es una secuencia propuesta' }
        },
        lines: [
          {
            voice: 'narrador',
            text: '¿Qué hacer entre 2026 y 2028? Los gobiernos: medir separando acceso, adopción, escala e impacto; compartir cómputo y datos; y regular de forma proporcional al riesgo.'
          },
          {
            voice: 'narrador',
            text: 'Las universidades: una política común adaptable por disciplina, alfabetización transversal y evaluación auténtica. Las organizaciones: pocos flujos de alto valor, con línea base previa, y agentes con permisos mínimos.'
          },
          {
            voice: 'narrador',
            text: 'La investigación: diseños causales, reportes con la versión del modelo, las instrucciones, las herramientas y la fecha, resultados nulos publicados y evaluaciones en español y en contextos latinoamericanos.'
          },
          {
            voice: 'narrador',
            text: 'Y un indicador común para todos: valor verificable, costo total y riesgo controlado.'
          }
        ]
      },
      {
        id: 'escenarios',
        min: 22,
        seVe: 'Cuatro ventanas pequeñas se abren en el horizonte, cada una con un relleno de patrón y una escena: «Difusión con bajo impacto» (muchas lámparas, poco cambio), «Transformación agéntica controlada» (lámparas con correas cortas y regladas, y una persona que revisa), «Automatización desigual» (una escalera sin su primer peldaño) y «Reacción regulatoria» (un gran sello «Obligaciones»).',
        rotulos: {
          difusion: { text: 'Difusión con bajo impacto' },
          transformacion: { text: 'Transformación agéntica controlada' },
          automatizacion: { text: 'Automatización desigual' },
          reaccion: { text: 'Reacción regulatoria' },
          sello: { text: 'Obligaciones' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'El informe base plantea cuatro escenarios plausibles. Difusión con bajo impacto: más licencias sin rediseño de procesos y un efecto financiero modesto. Transformación agéntica controlada: agentes con permisos limitados, evaluación continua y supervisión humana.'
          },
          {
            voice: 'narrador',
            text: 'Automatización desigual: se reducen puestos de entrada y tareas administrativas antes de que existan rutas de transición. Y reacción regulatoria: incidentes o impactos distributivos aceleran las obligaciones de evaluación, transparencia y responsabilidad.'
          },
          {
            voice: 'lectora',
            text: '¿Cuál ves más probable para tu organización en 2028, y qué señal temprana lo confirmaría?',
            pause: 3
          }
        ]
      },
      {
        id: 'indicadores',
        min: 16,
        seVe: 'Se dibuja una escalera de libreta de nueve peldaños, «Insumos», «Uso», «Integración», «Resultado», «Aprendizaje», «Distribución», «Seguridad», «Sostenibilidad» y «Gobernanza», cada uno con un signo y su pregunta en letra pequeña, escrita a mano.',
        rotulos: {
          insumos: { text: 'Insumos' },
          uso: { text: 'Uso' },
          integracion: { text: 'Integración' },
          resultado: { text: 'Resultado' },
          aprendizaje: { text: 'Aprendizaje' },
          distribucion: { text: 'Distribución' },
          seguridad: { text: 'Seguridad' },
          sostenibilidad: { text: 'Sostenibilidad' },
          gobernanza: { text: 'Gobernanza' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Para medir, el curso propone nueve niveles de indicadores: insumos, uso, integración, resultado, aprendizaje, distribución, seguridad, sostenibilidad y gobernanza.'
          },
          {
            voice: 'narrador',
            text: 'Por ejemplo, en aprendizaje la pregunta es: ¿la mejora se sostiene cuando se retira la ayuda? Y en distribución: ¿quién recibe los beneficios y quién soporta los riesgos?'
          }
        ]
      },
      {
        id: 'mensajes',
        min: 20,
        seVe: 'Las cinco tarjetas de la lámina D17 se dibujan una a una, cada una con su signo: «La capacidad es irregular» (cordillera), «Adopción no es valor» (iceberg, con «88% vs 39%» y sus etiquetas de fuente), «Cambian tareas, no solo puestos» (escalera sin primer peldaño), «Se evalúa el aprendizaje, no el texto» (lancha con brújula) y «Gobernanza proporcional al riesgo» (volante).',
        rotulos: {
          capacidad: { text: 'La capacidad es irregular' },
          adopcion: { text: 'Adopción no es valor' },
          usoVsImpacto: { text: '88% vs 39%', cifras: ['adop-1', 'adop-5'] },
          tareas: { text: 'Cambian tareas, no solo puestos' },
          aprendizaje: { text: 'Se evalúa el aprendizaje, no el texto' },
          gobernanza: { text: 'Gobernanza proporcional al riesgo' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'Cinco mensajes para decidir. Uno: la capacidad es irregular. Dos: adopción no es valor; el 88% usa IA, pero solo el 39% reporta algún impacto en el EBIT.',
            cifras: ['adop-1', 'adop-5']
          },
          {
            voice: 'narrador',
            text: 'Tres: en el trabajo cambian tareas, no solo puestos. Cuatro: en educación se evalúa el aprendizaje, no el texto. Y cinco: la gobernanza es proporcional al riesgo.'
          }
        ]
      },
      {
        id: 'cierre',
        min: 12,
        seVe: 'La metáfora de la lámina D17: una brújula hecha de una estrella irregular flota en el mar nocturno y gira hacia un faro; a lo lejos descansa el iceberg del primer video; título final «No importa cuánta IA se usa, sino cuánto valor verificable produce.»; fundido lento a azul marino.',
        rotulos: {
          titulo: { text: 'No importa cuánta IA se usa, sino cuánto valor verificable produce.' }
        },
        lines: [
          {
            voice: 'narrador',
            text: 'No importa cuánta IA se usa, sino cuánto valor verificable produce. Gracias por leer cada cifra con criterio.'
          }
        ]
      }
    ],
    checkpoints: [
      {
        after: 'escenarios',
        question: '«Más licencias sin rediseño de procesos y un efecto financiero modesto» describe el escenario de:',
        options: ['Transformación agéntica controlada', 'Difusión con bajo impacto', 'Reacción regulatoria'],
        answer: 1,
        explain: 'Es coherente con 88% de uso frente a 39% de impacto en EBIT.',
        hint: 'Recuerda las ventanas del horizonte: ¿en cuál había muchas lámparas y poco cambio?',
        cifras: ['adop-1', 'adop-5']
      }
    ]
  }
];
