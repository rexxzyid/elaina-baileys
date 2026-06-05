const { VoipClient } = require('baileys')

async function callWithMainSocket(conn, targetNumber, audioSource = 'silence') {
  if (!conn) throw new Error('conn/socket utama wajib dikirim')

  const rtc = new VoipClient({ sock: conn })
  await rtc.connect()

  const call = await rtc.call(targetNumber, {
    audioSource,
    durationMs: Number(process.env.CALL_DURATION_MS || 30000)
  })

  call.on('ringing', () => console.log('[RTC] ringing'))
  call.on('connected', () => console.log('[RTC] connected'))
  call.on('ended', reason => console.log('[RTC] ended:', reason))
  call.on('error', err => console.error('[RTC] error:', err))

  return { rtc, call }
}

module.exports = { callWithMainSocket }
