#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -x ../node_modules/.bin/pbjs ]; then
  echo "❌ pbjs tidak ditemukan di ../node_modules/.bin/pbjs"
  echo "Jalankan dari root repo:"
  echo "cd ~/baileys/bilis && npm install --save-dev --legacy-peer-deps protobufjs-cli"
  exit 1
fi

../node_modules/.bin/pbjs \
  -t static-module \
  --no-beautify \
  -w commonjs \
  --no-bundle \
  --no-delimited \
  --no-verify \
  --no-comments \
  -o ./index.js \
  ./WAProto.proto

node ./imports-elaina.js
node --check ./index.js

echo "✅ WAProto/index.js generated for Elaina CommonJS"
