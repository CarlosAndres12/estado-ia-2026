#!/usr/bin/env python3
"""tools/lib/edge-bridge.py - one Edge TTS request for tools/lib/tts-edge.mjs (dev-only).

Reads one JSON request on stdin and prints one JSON reply on stdout (nothing else is printed there):

  {"op": "synthesize", "text": "...", "voice": "es-MX-JorgeNeural", "rate": "+0%", "pitch": "+0Hz",
   "volume": "+0%", "out": "/abs/path/clip.mp3", "timeout": 60}
  -> {"ok": true, "bytes": 52416, "edgeTts": "7.3.1",
      "boundaries": [{"text": "Hola", "offset": 1000000, "duration": 4125000}, ...]}
     offset and duration are in 100-ns ticks from the start of the clip. The MP3
     (audio-24khz-48kbitrate-mono-mp3) is written to "<out>.part" and renamed to "out" only when the
     whole clip arrived.

  {"op": "voices"}
  -> {"ok": true, "edgeTts": "7.3.1", "voices": [{"name": "es-MX-JorgeNeural", "gender": "Male", "locale": "es-MX"}, ...]}

  failure -> {"ok": false, "kind": "...", "retry": true|false, "error": "...", "status": 429?}
     kind: missing-package (exit 2) | invalid | network | service | no-audio | unknown (exit 1)

Needs the edge-tts package (https://github.com/rany2/edge-tts) for the interpreter that runs this file,
for example `uv tool install edge-tts` or `pipx install edge-tts`; tts-edge.mjs runs this bridge with
the interpreter named in the shebang of the `edge-tts` command, so no other setup is needed.
"""

import asyncio
import json
import os
import sys


def reply(obj, code=0):
    sys.stdout.write(json.dumps(obj))  # ASCII-only JSON: safe whatever the console encoding
    sys.stdout.flush()
    sys.exit(code)


def failure(kind, error, retry, status=None, code=1):
    out = {"ok": False, "kind": kind, "retry": retry, "error": error}
    if status is not None:
        out["status"] = status
    reply(out, code)


async def synthesize(edge_tts, req):
    out = req["out"]
    part = out + ".part"
    communicate = edge_tts.Communicate(
        req["text"],
        req["voice"],
        rate=req.get("rate", "+0%"),
        pitch=req.get("pitch", "+0Hz"),
        volume=req.get("volume", "+0%"),
        boundary="WordBoundary",
        receive_timeout=int(req.get("timeout", 60)),
    )
    boundaries = []
    size = 0
    try:
        with open(part, "wb") as f:
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    f.write(chunk["data"])
                    size += len(chunk["data"])
                elif chunk["type"] == "WordBoundary":
                    boundaries.append(
                        {"text": chunk["text"], "offset": chunk["offset"], "duration": chunk["duration"]}
                    )
        os.replace(part, out)
    finally:
        if os.path.exists(part):
            os.remove(part)
    return {"ok": True, "bytes": size, "boundaries": boundaries, "edgeTts": edge_tts.__version__}


async def voices(edge_tts):
    items = await edge_tts.list_voices()
    return {
        "ok": True,
        "edgeTts": edge_tts.__version__,
        "voices": [
            {"name": v.get("ShortName"), "gender": v.get("Gender"), "locale": v.get("Locale")} for v in items
        ],
    }


def classify(exc):
    """(kind, retry, status) for an exception raised by edge-tts or aiohttp."""
    name = type(exc).__name__
    status = getattr(exc, "status", None)
    if isinstance(status, int) and status > 0:
        return "service", status == 429 or status >= 500, status
    if name == "NoAudioReceived":
        return "no-audio", True, None
    if name in ("WebSocketError", "UnexpectedResponse", "UnknownResponse", "SkewAdjustmentError"):
        return "service", True, None
    if isinstance(exc, (KeyError, TypeError, ValueError)):
        return "invalid", False, None
    if isinstance(exc, (OSError, asyncio.TimeoutError)) or any(s in name for s in ("Client", "Timeout", "Connect")):
        return "network", True, None
    return "unknown", True, None


def main():
    try:
        req = json.loads(sys.stdin.buffer.read().decode("utf-8") or "{}")
    except ValueError as exc:
        failure("invalid", "the request is not JSON: %s" % exc, False)
    try:
        import edge_tts
    except ImportError:
        failure(
            "missing-package",
            "the edge-tts package is not installed for %s (uv tool install edge-tts, or pipx install edge-tts)"
            % sys.executable,
            False,
            code=2,
        )
    op = req.get("op", "synthesize")
    if op not in ("synthesize", "voices"):
        failure("invalid", "unknown op %r" % op, False)
    try:
        result = asyncio.run(voices(edge_tts) if op == "voices" else synthesize(edge_tts, req))
    except Exception as exc:  # noqa: BLE001 - every failure becomes one JSON reply
        kind, retry, status = classify(exc)
        failure(kind, "%s: %s" % (type(exc).__name__, exc), retry, status)
    reply(result)


if __name__ == "__main__":
    main()
