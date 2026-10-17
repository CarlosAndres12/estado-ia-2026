#!/bin/sh
# Dev-only wrapper: runs headless Chromium under a CPU and memory cap so long review sessions
# (screenshots, snapshots, exports) cannot overload the machine. Usage: same arguments as chromium.
# Override the binary with CHROMIUM_BIN and the caps with CHROMIUM_CPU / CHROMIUM_MEM.
BIN="${CHROMIUM_BIN:-chromium}"
if command -v systemd-run >/dev/null 2>&1; then
  exec systemd-run --user --scope --quiet \
    -p CPUQuota="${CHROMIUM_CPU:-300%}" -p MemoryMax="${CHROMIUM_MEM:-6G}" \
    nice -n 15 "$BIN" "$@"
fi
exec nice -n 15 "$BIN" "$@"
