# Estado de la IA 2026 · sitio del curso

Sitio estático y sin conexión que acompaña el curso «Estado de la IA 2026»: siete sesiones, 17 láminas,
9 videos narrados, juegos, cuaderno del equipo y banco de cifras. Todo se dibuja en `<canvas>` y cada
cifra remite a la base de conocimiento (`contenido/base-estado-ia-2026.md`, versión 1.1).

Este README es para quienes facilitan y mantienen el curso.

> **Antes de cada clase:** revisen cada cifra y cada ejemplo. La base refleja lo publicado hasta
> octubre de 2026; las fuentes cambian, se corrigen o se actualizan después.

## Ruta rápida

| Quiero… | Hagan esto |
|---|---|
| Ver el sitio | Doble clic en `index.html` |
| Grabar un video con voz | Servir la carpeta (`python3 -m http.server`) y usar «Descargar video» |
| Cambiar una cifra | Editar `js/data/cifras.js` **y** la base, luego `node tools/check-content.mjs` |
| Regenerar la narración | `node tools/generate-voiceover.mjs` (Edge TTS) |
| Revisar cómo se ve | `node tools/snapshots.mjs` y `node tools/check-routes.mjs` |

Las herramientas de `tools/` son solo para desarrollo: el sitio no las necesita para funcionar.

---

## 1. Abrir el sitio

### Sin servidor (lo normal)

1. Abran `index.html` con doble clic (Chrome, Edge o Firefox recientes).
2. Funciona sin conexión: no carga nada de internet. Los enlaces a las fuentes sí abren la web.

### Con un servidor local

Hace falta para **grabar la voz** en «Descargar video»: abierto como archivo (`file://`), el navegador
no deja capturar el audio de la narración y el video se graba solo con subtítulos.

```sh
cd <carpeta-del-sitio>
python3 -m http.server 8000
```

Luego abran <http://localhost:8000/>. Cualquier servidor de archivos estáticos sirve.

### Rutas útiles

- `#inicio`, `#mapa`, `#s1` … `#s7`, `#proyecto`, `#cifras`, `#glosario`, `#preguntas`, `#referencias`,
  `#asistente`, `#clase` (Modo clase).
- Enlaces profundos: `#cifras/adop-1`, `#s3/actividad`, `#clase/3`, `#glosario/agente`.
- Una lámina sola, a 1280×720: `index.html?lamina=d07`.

---

## 2. Dónde vive cada texto

Todo texto visible o hablado está en `js/data/`, copiado literal de la base. El código de dibujo y de
interfaz no escribe textos propios.

| Archivo | Contenido |
|---|---|
| `cifras.js` | Registro de cifras: cada fila del §13 de la base (`adop-1` … `alc-4`) y cifras de contexto (`ctx-*`) |
| `fuentes.js` | Fuentes (clave, etiqueta, URL, título) y Referencias (§16) |
| `sesiones/s1.js` … `s7.js` | Cada sesión: tesis, agenda, contenido, errores, discusión, lecturas, quiz, notas del facilitador |
| `course.js` | Portada, ficha, mapa, marco, evaluación, pie y textos de la interfaz (`ui.*`) |
| `deck.js` | Las 17 láminas (titular, cifras grandes, diagrama, idea central, notas) |
| `videos.js` | Los 9 guiones: escenas, líneas de voz, rótulos y preguntas de control |
| `actividades.js` | Juegos, herramientas, hojas del cuaderno, rúbrica y Modo clase |
| `correcciones.js` | Correcciones y actualizaciones (§14) |
| `glosario.js` · `faq.js` · `asistente.js` | Glosario (§12), preguntas frecuentes (§15), asistente (§0) |

Detalle de cada forma de datos: `odd/spec/data-model.md` y `odd/spec/contracts.md`.

---

## 3. Actualizar una cifra

Una cifra nunca se escribe a mano en otra parte: todo el sitio la lee con `EIA.cifra(id)`.

1. Corrijan la fila en la base: `contenido/base-estado-ia-2026.md`, §13.
2. Corrijan la misma cifra en `js/data/cifras.js` (campos `cifra`, `alcance`, `tipo`, `estado`, `fuentes`).
3. Si la cifra aparece en textos de sesión, láminas o guiones, actualicen también esos textos en la base
   y en `js/data/`.
4. Verifiquen:

   ```sh
   node tools/check-content.mjs            # debe terminar con 0 errores
   node tools/check-content.mjs --verbose  # además, cada número con la cifra que lo respalda
   ```

5. Si cambió una línea de voz, regeneren la narración de ese video (sección 6).

El verificador compara el sitio con la base, resuelve cada referencia, comprueba que cada número dicho
o dibujado tenga una cifra detrás y marca como error las versiones que el §14 corrige.

---

## 4. Cargar una nueva versión de la base

1. Reemplacen `contenido/base-estado-ia-2026.md` por la nueva versión (mismo nombre de archivo).
2. Vean qué cambió:

   ```sh
   git diff --stat -- contenido/
   git diff --word-diff -- contenido/base-estado-ia-2026.md
   ```

3. Ejecuten el verificador: cada diferencia entre la base y `js/data/` aparece como error, con su lugar.

   ```sh
   node tools/check-content.mjs
   ```

4. Actualicen los archivos de `js/data/` hasta llegar a 0 errores, incluida la versión y la fecha en
   `course.js` (`kb.version`, `kb.fecha`, `kb.versionTexto`).
5. Pasen las pruebas: `node --test --test-concurrency=1 tools/test/`.
6. Regeneren la voz de los videos cuyos guiones cambiaron.

---

## 5. Reajustar escenas de los videos

Los tiempos salen de la voz, no de números fijos. En `js/data/videos.js`:

| Campo | Qué controla |
|---|---|
| `scene.min` | Duración mínima de la escena en segundos; el tiempo sobrante va al final de la escena |
| `line.pause` | Silencio después de una línea |
| `line.rate` | Velocidad de una línea concreta |

Duración de una escena = máximo entre `min` y (0,6 s de entrada + sus líneas + 0,5 s entre líneas +
pausas + 1,2 s de cierre).

Dentro del dibujo de cada escena (`js/videos/vNN.js`):

- `s.at(i)` es el avance (0 a 1) de la línea `i`.
- `s.cue(i, 'palabras', 'chunk' | 'word')` da el punto de `s.at(i)` en que esas palabras aparecen en
  los subtítulos. Usen `s.cue` para que una cifra aparezca justo cuando se dice: sigue a la voz aunque
  se regenere.

Revisen el resultado con `node tools/snapshots.mjs --only v04` (sección 8).

---

## 6. Regenerar la narración con Edge TTS

**Decisión del curso:** la narración usa las voces gratuitas de Edge TTS (lectura en voz alta de
Microsoft Edge) en lugar de Azure. Azure queda como opción (sección 6.3).

### 6.1 Preparar (una vez)

Necesitan Node 20 o superior, `ffmpeg` y `ffprobe` en el PATH, y el paquete `edge-tts` de Python:

```sh
uv tool install edge-tts      # o bien: pipx install edge-tts
uv tool upgrade edge-tts      # si Microsoft cambia el protocolo
```

El generador encuentra solo el Python que tiene `edge-tts`. Para forzar otro intérprete, usen
`edge.python` en `tools/voice.config.json` o la variable `EDGE_TTS_PYTHON`.

### 6.2 Generar

```sh
node tools/generate-voiceover.mjs --dry-run       # sin red ni ffmpeg: estima duraciones y reporta
node tools/generate-voiceover.mjs                 # sintetiza lo que falta, mezcla y escribe
node tools/generate-voiceover.mjs --only v04      # un video (o varios: v02,v04)
node tools/generate-voiceover.mjs --force         # vuelve a sintetizar ignorando la caché
node tools/generate-voiceover.mjs --out <carpeta> # escribe assets/ en otra carpeta
```

Escribe `assets/audio/<id>.mp3`, `assets/audio/manifest.js` (tiempos de escenas, líneas y subtítulos)
y `assets/captions/<id>.vtt`. El reporte indica, por video, duración contra la meta, escenas más
largas, subtítulos demasiado rápidos y avisos del normalizador.

**La caché** (`tools/.cache/tts/`, fuera del repositorio) guarda cada clip según motor, voz, velocidad,
tono y texto. Solo se vuelven a pedir las líneas que cambiaron; si todo está en caché, no se usa la red.
`--force` la ignora.

### 6.3 Alternativa opcional: Azure AI Speech

1. Creen un recurso **Speech** en el portal de Azure y copien su clave y su región.
2. Pongan las credenciales en el entorno o en `tools/.env` (ignorado por git; modelo en
   `tools/.env.example`):

   ```sh
   AZURE_SPEECH_KEY=...
   AZURE_SPEECH_REGION=...
   ```

3. Instalen el SDK: `cd tools && npm install`.
4. En `tools/voice.config.json` cambien `"engine": "edge"` por `"engine": "azure"`.
5. Ejecuten `node tools/generate-voiceover.mjs` como arriba.

> **Nunca suban claves al repositorio.** La clave no se escribe en el sitio, el manifiesto, los
> subtítulos ni los registros.

---

## 7. Voces y pronunciación

### Cambiar las voces

En `tools/voice.config.json`, cada papel tiene su voz por motor:

| Papel | Voz actual (Edge) |
|---|---|
| `narrador` | `es-MX-JorgeNeural` |
| `lectora` | `es-MX-DaliaNeural` |

Cambien `edge.voices.<papel>.name` (y `pitch` si hace falta) o `edge.rate.default`. Lista de voces:
`edge-tts --list-voices`. Para Azure, la sección `azure.voices`. Luego regeneren (la caché distingue
voces, así que se sintetiza todo de nuevo).

### Corregir una pronunciación

Elijan el nivel más pequeño que resuelva el problema:

| Caso | Dónde |
|---|---|
| Una sigla o nombre que se lee mal en todo el curso | `"lexicon"` de `tools/voice.config.json`: `{ "OSWorld": "ou es uórld" }` (`null` borra una entrada) |
| Una regla general (números, fechas, abreviaturas) | `tools/lib/normalize-es.mjs` (léxico base `LEXICON` y reglas) |
| Una sola línea | Campo `say` de la línea en `js/data/videos.js`: texto hablado en lugar de `text` |

`text` sigue siendo lo que muestran los subtítulos; `say` solo cambia lo que se oye.

### Hoja de escucha

La revisión final siempre es de oído. Esta herramienta **no reproduce audio**: imprime una hoja con
cada línea, su hora en el video, lo que se muestra, lo que se dice y qué escuchar (cifras, siglas,
abreviaturas, `say`, avisos).

```sh
node tools/check-voiceover.mjs                  # todos los videos
node tools/check-voiceover.mjs --only v04       # algunos videos
node tools/check-voiceover.mjs --flagged        # solo líneas con algo que escuchar
node tools/check-voiceover.mjs > escucha.txt    # para imprimir
```

Quien escucha marca cada `[ ]`, corrige y regenera.

---

## 8. Grabar o exportar los videos

### Desde el sitio: «Descargar video»

En el reproductor, el botón **Descargar video**:

- Ofrece **Descargar MP4** si ese video ya se exportó (sección siguiente).
- Si no, **graba en tiempo real** el video completo o el capítulo actual: tarda lo mismo que dura.
  Mantengan la pestaña visible; si se oculta, la grabación se pausa.
- Para que el archivo tenga voz: sitio servido por `http://` (sección 1) y narración ya generada.

### Exportar MP4 con `tools/render-videos.mjs` (opcional)

Necesita Chromium y `ffmpeg`/`ffprobe`. Renderiza a 24 fps fotograma a fotograma, sin reproducir audio,
y mezcla la narración si existe.

```sh
node tools/render-videos.mjs --only v02                  # un video -> assets/video/<slug>.mp4
node tools/render-videos.mjs --only v04 --by-chapter     # por capítulos: reanuda tras un corte
node tools/render-videos.mjs --only v02 --from 20 --to 30 --scale 0.5   # prueba rápida
node tools/render-videos.mjs                             # los 9 videos
```

- **Tiempo aproximado:** unos 3,6 fotogramas por segundo, es decir ~7 s de cómputo por segundo de video.
  Un video de 4 min tarda ~25–30 min; los 9 (~39 min de narración) unas 4–5 horas.
- Es reanudable: salta lo terminado y reutiliza partes en `tools/.cache/render/`. `--fresh` empieza de cero.
- Actualiza `assets/video/index.js`, que activa «Descargar MP4» en el sitio. Los `.mp4` no se suben a git.
- Usa un solo Chromium con límites de CPU y memoria (`tools/dev/chromium-safe.sh`) y `ffmpeg` con baja
  prioridad. No ejecuten varias exportaciones a la vez.

---

## 9. Revisión visual

Todas usan un solo Chromium sin ventana, con límites de CPU y memoria. Ejecuten una a la vez.

```sh
node tools/snapshots.mjs --only v02         # fotogramas y hoja de contactos -> review/v02/
node tools/snapshots.mjs --laminas          # las 17 láminas -> review/laminas/
node tools/snapshots.mjs --determinism      # el mismo instante dos veces debe dar los mismos píxeles
node tools/check-routes.mjs                 # cada ruta y enlace profundo, sin errores de consola
node tools/check-routes.mjs --shots         # además, una captura por ruta -> review/routes/
node tools/check-routes.mjs --width 360 --shots   # vista de teléfono
node tools/check-routes.mjs --interact      # juegos, quiz, cuaderno, rúbrica, Modo clase e impresión
```

`review/` está ignorada por git.

**Galería del motor de dibujo:** abran `tools/dev/gallery.html` en el navegador.
`?section=charts` (o `signs`, `people`, `places`, `machine`, `props`, `tags`, `lettering`, `lamina`,
`backgrounds`) muestra una sección; `?test=1` ejecuta la autoprueba del motor.

**Pruebas de las herramientas:** `node --test --test-concurrency=1 tools/test/`.

---

## 10. Cuaderno del equipo

- Cada equipo tiene su cuaderno en **Proyecto** (`#proyecto`), guardado **solo en este navegador**
  (almacenamiento local). Otro navegador u otro computador no lo ve.
- **Exportar** descarga `cuaderno-<equipo>.json`. **Importar** lo carga en otro navegador; si ya había
  una versión más reciente, se importa como copia.
- Para compartir dentro del equipo o entregar al facilitador: exporten y envíen el archivo.
- También: **Copiar como texto** e **Imprimir cuaderno**.
- En ventanas privadas o con el almacenamiento bloqueado puede que no se guarde: el sitio lo avisa;
  exporten seguido.

---

## 11. Diferencias entre el encargo y la base

Las decisiones y conflictos se registran en `odd/tasks/estado-ia-2026-site.md`. Los principales:

| Tema | Decisión |
|---|---|
| Motor de voz | El encargo pedía Azure AI Speech; por decisión del responsable (17-10-2026) se usa **Edge TTS** (gratuito). Azure sigue disponible como opción |
| Velocidad estimada | `--dry-run` estima a 2,9 palabras/s con Edge (`edge.dryRunWps`); el encargo daba 2,3 por defecto |
| Etiquetas de cifras sin rótulo | Cuando el guion de una lámina no da texto para una cifra grande, la etiqueta toma el texto literal de la sesión (p. ej. D15 «14% vs 11%» usa la tesis) |
| Versiones corregidas | D8 «27,0% vs 8,5%» y D15 «479.273 millones», «106 acciones» siguen el §14, no el guion original; el verificador las admite explícitamente |
| Pistas del quiz | Escritas para el sitio (la base no las trae): revísenlas antes de clase |
| Cifra `eco-5` | Está en el banco pero ningún texto de sesión la usa |

---

## 12. Créditos

- Fuentes tipográficas **Noto Sans** y **Noto Serif Display** (The Noto Project Authors), licencia
  SIL Open Font License 1.1. Archivos y licencia en `assets/fonts/` (`OFL.txt`).
- Contenido: base de conocimiento del curso, versión 1.1 (17 de octubre de 2026), y las fuentes citadas
  en **Referencias**.

## Recordatorio final

El facilitador debe revisar **cada cifra y cada ejemplo** antes de clase. La base refleja lo publicado
hasta octubre de 2026: comprueben las fuentes, marquen lo desactualizado y actualicen siguiendo las
secciones 3 y 4.
