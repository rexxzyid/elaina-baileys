import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import makeWASocket, { Browsers, DisconnectReason, useMultiFileAuthState } from '../lib/index.js'

const nomor = (process.argv[2] || '').replace(/\D/g, '')

if (!nomor) {
    console.error('Pakai: node script/testpairing.js <nomor>')
    console.error('Contoh: node script/testpairing.js 6281234567890')
    process.exit(2)
}

/**
 * A throwaway session directory so a live bot's credentials are never touched.
 * Pairing writes creds as it goes, and reusing the bot's folder would replace
 * the identity it is already connected with.
 */
const sesi = join(tmpdir(), 'elaina-uji-pairing-' + Date.now())

const log = (...bagian) => console.log(new Date().toISOString().slice(11, 19), ...bagian)

const bersihkan = async () => rm(sesi, { recursive: true, force: true }).catch(() => {})
process.on('uncaughtException', async error => { console.error(error); await bersihkan(); process.exit(1) })
process.on('unhandledRejection', async error => { console.error(error); await bersihkan(); process.exit(1) })

const senyap = { level: 'silent', trace() {}, debug() {}, info() {}, warn() {}, error() {}, fatal() {} }
senyap.child = () => senyap

const { state, saveCreds } = await useMultiFileAuthState(sesi)

const sock = makeWASocket({
    auth: state,
    browser: Browsers.macOS('Chrome'),
    printQRInTerminal: false,
    logger: senyap
})

sock.ev.on('creds.update', saveCreds)

let selesai = false
const tutup = async (kode) => {
    if (selesai) return
    selesai = true
    try { sock.end(undefined) } catch {}
    await bersihkan()
    process.exit(kode)
}

sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update
    if (qr) log('server mengirim QR (normal, abaikan)')

    if (connection === 'open') {
        log('PAIRING BERHASIL — perangkat tertaut')
        await tutup(0)
    }

    if (connection === 'close') {
        const alasan = lastDisconnect?.error?.output?.statusCode
        if (alasan === DisconnectReason.restartRequired) {
            log('server minta restart (ini normal setelah pairing berhasil)')
            await tutup(0)
            return
        }
        log('koneksi tertutup, alasan:', alasan ?? lastDisconnect?.error?.message ?? '-')
        await tutup(1)
    }
})

const tunggu = ms => new Promise(r => setTimeout(r, ms))
await tunggu(3000)

log('meminta kode pairing untuk', nomor)

try {
    const kode = await sock.requestPairingCode(nomor)
    console.log('')
    console.log('  KODE PAIRING : ' + kode.match(/.{1,4}/g).join('-'))
    console.log('')
    log('registrasi DITERIMA server — ref tercatat')
    log('Cek HP sekarang: notifikasi "Perangkat baru mencoba terhubung" seharusnya muncul.')
    log('Kalau tidak ada notifikasi, buka WhatsApp > Perangkat Tertaut > Tautkan dengan nomor telepon,')
    log('lalu ketik kode di atas. Kalau kode diterima, berarti registrasi memang berhasil')
    log('dan yang tidak berjalan hanya push notification-nya.')
    console.log('')
    log('menunggu sampai 3 menit...')
}
catch (error) {
    console.log('')
    log('REGISTRASI DITOLAK')
    log('pesan :', error.message)
    log('kode  :', error.output?.statusCode ?? error.data ?? '-')
    console.log('')
    if (String(error.message).includes('rate-overlimit')) {
        log('Artinya: terlalu sering mencoba. Tunggu beberapa jam sebelum coba lagi.')
    }
    else if (/not-allowed|not-acceptable|feature/i.test(String(error.message))) {
        log('Artinya: fitur tautkan-dengan-nomor belum aktif untuk akun ini.')
    }
    else if (String(error.message).includes('international format')) {
        log('Artinya: format nomor salah. Pakai kode negara tanpa 0 di depan, contoh 6281234567890.')
    }
    else {
        log('Ini balasan mentah dari server — sebelum perbaikan, error ini tidak pernah terlihat.')
    }
    await tutup(1)
}

await tunggu(180000)
if (!selesai) {
    log('waktu habis, kode tidak dipakai')
    await tutup(1)
}
