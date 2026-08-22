# Elaina Baileys MCP

Eksperimen MCP untuk menghubungkan Elaina Baileys ke client yang mendukung Model Context Protocol.

Implementasi ini memakai MCP TypeScript SDK v2 melalui transport stdio. Satu proses MCP memegang satu sesi WhatsApp, auth multi-file, dan store pesan persisten.

## Jalankan dari repo

```bash
npm install
npm run mcp:start
```

Data sesi dan store default disimpan di:

```text
.mcp-data/auth/
.mcp-data/store.json
```

Folder `.mcp-data/` diabaikan Git dan harus diperlakukan seperti kredensial.

## Environment

| Variable | Default | Kegunaan |
|---|---|---|
| `ELAINA_MCP_DATA_DIR` | `.mcp-data` | Lokasi auth dan store MCP |
| `ELAINA_MCP_READ_ONLY` | kosong | `1` menolak semua tool yang mengubah WhatsApp |
| `ELAINA_MCP_ALLOW_DESTRUCTIVE` | kosong | `1` mengaktifkan delete, leave, revoke, remove, dan aksi destruktif lain |

Tool destruktif tetap terdaftar ketika flag belum aktif, tetapi pemanggilannya ditolak sampai `ELAINA_MCP_ALLOW_DESTRUCTIVE=1` diberikan.

## Pairing

Server dapat hidup sebelum sesi terdaftar. Dari MCP client panggil tool:

```text
whatsapp_pairing_code
```

Input contoh:

```json
{
  "phoneNumber": "6281234567890"
}
```

Atau pairing code kustom 8 karakter:

```json
{
  "phoneNumber": "6281234567890",
  "customCode": "ELAINA01"
}
```

Setelah kode diterima WhatsApp, auth tersimpan otomatis dan koneksi dapat dipakai oleh tool lain.

## Konfigurasi client stdio

Contoh konfigurasi client MCP yang dapat menjalankan proses lokal:

```json
{
  "mcpServers": {
    "elaina-whatsapp": {
      "command": "node",
      "args": ["/absolute/path/elaina-baileys/mcp/src/index.js"],
      "env": {
        "ELAINA_MCP_DATA_DIR": "/absolute/path/elaina-baileys/.mcp-data"
      }
    }
  }
}
```

Jangan arahkan log aplikasi ke stdout. Transport stdio MCP menggunakan stdout sebagai kanal JSON-RPC. Runtime Elaina MCP memakai logger Baileys silent dan menulis status proses ke stderr.

## Resources

- `whatsapp://connection`
- `whatsapp://chats`
- `whatsapp://contacts`
- `whatsapp://groups`
- `whatsapp://newsletters`

## Tool utama

### Sesi dan lookup

- `whatsapp_connection_status`
- `whatsapp_pairing_code`
- `whatsapp_check_number`
- `whatsapp_list_chats`
- `whatsapp_list_contacts`
- `whatsapp_get_messages`
- `whatsapp_get_message`
- `whatsapp_profile_picture`
- `whatsapp_fetch_status`
- `whatsapp_business_profile`
- `whatsapp_blocklist`

### Pesan

- `whatsapp_send_text`
- `whatsapp_send_media`
- `whatsapp_send_location`
- `whatsapp_send_poll`
- `whatsapp_react_message`
- `whatsapp_edit_message`
- `whatsapp_delete_message`
- `whatsapp_mark_read`
- `whatsapp_presence`

`whatsapp_edit_message` memakai surface `sendMessage({ text, edit: key })` yang memang sudah ada di fork. Penerimaan edit terenkripsi tetap ditangani oleh pipeline `SecretEncryptedMessage.MESSAGE_EDIT` di core.

### Profil

- `whatsapp_update_profile_name`
- `whatsapp_update_profile_status`
- `whatsapp_update_profile_picture`
- `whatsapp_remove_profile_picture`
- `whatsapp_block_status`

### Group

- `whatsapp_list_groups`
- `whatsapp_group_metadata`
- `whatsapp_group_create`
- `whatsapp_group_participants_update`
- `whatsapp_group_update_subject`
- `whatsapp_group_update_description`
- `whatsapp_group_invite_code`
- `whatsapp_group_revoke_invite`
- `whatsapp_group_accept_invite`
- `whatsapp_group_leave`

### Community

- `whatsapp_list_communities`
- `whatsapp_community_metadata`
- `whatsapp_community_create`
- `whatsapp_community_create_group`
- `whatsapp_community_participants_update`
- `whatsapp_community_link_group`
- `whatsapp_community_unlink_group`
- `whatsapp_community_leave`

### Newsletter

- `whatsapp_newsletter_list`
- `whatsapp_newsletter_metadata`
- `whatsapp_newsletter_create`
- `whatsapp_newsletter_follow`
- `whatsapp_newsletter_unfollow`
- `whatsapp_newsletter_mute`
- `whatsapp_newsletter_unmute`
- `whatsapp_newsletter_update_name`
- `whatsapp_newsletter_update_description`
- `whatsapp_newsletter_update_picture`
- `whatsapp_newsletter_remove_picture`
- `whatsapp_newsletter_react`
- `whatsapp_newsletter_messages`
- `whatsapp_newsletter_admin_capabilities`
- `whatsapp_newsletter_admin_info`
- `whatsapp_newsletter_followers`
- `whatsapp_newsletter_insights`
- `whatsapp_newsletter_recommended`
- `whatsapp_newsletter_search`
- `whatsapp_newsletter_poll_vote`
- `whatsapp_newsletter_delete`

## Store dan edit E2EE

MCP tidak memakai default `getMessage: async () => undefined`. Runtime memasang `getMessage` ke store persisten dan mencoba `remoteJid`, `remoteJidAlt`, serta bentuk JID ternormalisasi.

Ini penting untuk fitur yang membutuhkan pesan lama, termasuk reply, reaction, resolusi message key, dan penerimaan `SecretEncryptedMessage.MESSAGE_EDIT` yang mengambil `messageSecret` dari pesan target.

## Batas eksperimen

Branch MCP tidak mengubah format protokol WhatsApp di core. Tool hanya membungkus method yang memang tersedia di socket Elaina Baileys. Method newsletter yang di dokumentasi fork masih berstatus derived tetap memiliki status eksperimen yang sama ketika dipanggil lewat MCP.
