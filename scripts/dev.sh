#!/usr/bin/env sh
# Thin wrapper: all logic lives in the platform-neutral Node script.
set -e
exec node "$(dirname "$0")/dev.mjs" "$@"
