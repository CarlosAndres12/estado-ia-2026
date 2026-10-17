// Stand-in for tools/lib/edge-bridge.py in tests (run with node instead of Python): reads one JSON
// request on stdin and answers according to its `mode`. No network, no audio.
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => { input += d; });
process.stdin.on('end', () => {
  const req = JSON.parse(input);
  if (req.mode === 'ok') {
    process.stdout.write(JSON.stringify({
      ok: true, bytes: 10, boundaries: [{ text: 'hola', offset: 1000000, duration: 5000000 }], echo: req
    }));
  } else if (req.mode === 'fail') {
    process.stdout.write(JSON.stringify({ ok: false, kind: 'service', retry: true, status: 429, error: 'throttled' }));
    process.exitCode = 1;
  } else if (req.mode === 'garbage') {
    process.stdout.write('not json');
  } else if (req.mode === 'hang') {
    setTimeout(() => {}, 60000);
  }
});
