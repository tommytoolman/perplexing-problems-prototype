#!/bin/sh
set -eu

cd "$(dirname "$0")"
python3 -m http.server 4173 --bind 127.0.0.1
