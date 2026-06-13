#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROTO_DIR="$ROOT_DIR/WAProto"

PBJS="$ROOT_DIR/node_modules/protobufjs/cli/bin/pbjs"
PBTS="$ROOT_DIR/node_modules/protobufjs/cli/bin/pbts"

if [ ! -f "$PBJS" ]; then
  echo "pbjs tidak ditemukan: $PBJS"
  echo "Jalankan dari root project:"
  echo "npm i protobufjs@6.11.6 --save"
  exit 1
fi

if [ ! -f "$PBTS" ]; then
  echo "pbts tidak ditemukan: $PBTS"
  echo "Jalankan dari root project:"
  echo "npm i protobufjs@6.11.6 --save"
  exit 1
fi

echo "[1/4] Backup WAProto/index.js lama..."
cp "$PROTO_DIR/index.js" "$PROTO_DIR/index.js.bak-$(date +%s)" 2>/dev/null || true
cp "$PROTO_DIR/index.d.ts" "$PROTO_DIR/index.d.ts.bak-$(date +%s)" 2>/dev/null || true

echo "[2/4] Generate WAProto/index.js pakai protobufjs v6..."
node "$PBJS" \
  -t static-module \
  -w commonjs \
  -o "$PROTO_DIR/index.js" \
  "$PROTO_DIR/WAProto.proto"

echo "[3/4] Generate WAProto/index.d.ts..."
node "$PBTS" \
  -o "$PROTO_DIR/index.d.ts" \
  "$PROTO_DIR/index.js"

echo "[4/4] Validasi hasil generate..."
cd "$ROOT_DIR"

node - <<'NODE'
const fs = require('fs')
const pb = require('protobufjs/minimal')
const wa = fs.readFileSync('./WAProto/index.js', 'utf8')

const hasTag = /\.tag\(\)/.test(wa)
const hasBadSkipType = /skipType\([^)]*,[^)]*\)/.test(wa)
const hasUint32 = /uint32\(\)/.test(wa)

console.log('protobufjs version:', require('protobufjs/package.json').version)
console.log('Reader.prototype.tag:', typeof pb.Reader.prototype.tag)
console.log('WAProto contains ".tag()":', hasTag)
console.log('WAProto contains "skipType(.*,":', hasBadSkipType)
console.log('WAProto contains "reader.uint32":', hasUint32)

if (hasTag || hasBadSkipType || !hasUint32) {
  console.error('WAProto generate gagal: output masih tidak cocok dengan protobufjs v6')
  process.exit(1)
}

const { proto } = require('./WAProto')

const msg = proto.HandshakeMessage.fromObject({
  clientHello: {
    ephemeral: Buffer.alloc(32)
  }
})

const encoded = proto.HandshakeMessage.encode(msg).finish()
const decoded = proto.HandshakeMessage.decode(encoded)

if (!decoded.clientHello?.ephemeral?.length) {
  console.error('HandshakeMessage decode gagal')
  process.exit(1)
}

console.log('OK HandshakeMessage encode/decode')
console.log('encoded:', encoded.length)
console.log('decoded ephemeral:', decoded.clientHello.ephemeral.length)
NODE

echo "Selesai. WAProto/index.js sudah aman untuk protobufjs v6."
