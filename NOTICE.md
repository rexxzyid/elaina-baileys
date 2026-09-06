# Elaina Baileys Notices

Elaina Baileys is an independently maintained fork/distribution in the Baileys ecosystem.

The upstream copyright and permission notice are preserved in `LICENSE`. Portions of the codebase derive from or were influenced by upstream Baileys work and subsequent forks, including the ItsLia lineage used as a development base.

The integrated MessageBuilder retains its original author/watermark notice in `lib/MessageBuilder/index.js`.

The VoIP calling stack in `lib/Voip/` derives from work by ShellTear, whose `baileys-caller` project first showed the WhatsApp Web VoIP WASM engine could be driven from Node. It has been ported to ESM, reworked to run on the caller's existing socket, and maintained here since. The WhatsApp Web resources it drives are vendored unmodified under `lib/assets/wasm/`, with their provenance, checksums and capability surface described in the README there.

Elaina-specific maintenance, packaging, compatibility changes, integrations, and ongoing development are maintained under the `@rexxhayanasi/elaina-baileys` package identity.
