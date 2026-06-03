"use strict"

Object.defineProperty(exports, "__esModule", { value: true })

const { DEFAULT_CONNECTION_CONFIG } = require("../Defaults")
const { makeBusinessSocket } = require("./business")

let __ACTIVE_SOCKET__ = null

const makeWASocket = (config) => {
  try {
    if (__ACTIVE_SOCKET__) {
      try {
        __ACTIVE_SOCKET__.ev?.removeAllListeners?.()
        __ACTIVE_SOCKET__.ws?.removeAllListeners?.()
        __ACTIVE_SOCKET__.ws?.terminate?.()
        __ACTIVE_SOCKET__.ws?.close?.()
      } catch {}

      try {
        __ACTIVE_SOCKET__ = null
      } catch {}
    }
  } catch {}

  const sock = makeBusinessSocket({
    ...DEFAULT_CONNECTION_CONFIG,
    ...config
  })

  __ACTIVE_SOCKET__ = sock

  return sock
}

exports.default = makeWASocket
