"use strict";

var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeMessagesSocket = void 0;
const boom_1 = require("@hapi/boom");
const node_cache_1 = __importDefault(require("@cacheable/node-cache"));
const crypto_1 = require("crypto");
const WAProto_1 = require("../../WAProto");
const Defaults_1 = require("../Defaults");
const Utils_1 = require("../Utils");
const link_preview_1 = require("../Utils/link-preview");
const WABinary_1 = require("../WABinary");
const WAUSync_1 = require("../WAUSync");
const newsletter_1 = require("./newsletter");
const buildButton = (b = {}) => {
  const type = String(b.type || b.name || 'reply').toLowerCase();
  switch (type) {
    case 'reply':
    case 'quick_reply':
      return {
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({
          display_text: b.text != null ? b.text : b.display_text || '',
          id: b.id != null ? b.id : b.text || ''
        })
      };
    case 'url':
    case 'link':
    case 'cta_url':
      return {
        name: 'cta_url',
        buttonParamsJson: JSON.stringify({
          display_text: b.text || '',
          url: b.url || '',
          merchant_url: b.merchant_url || b.url || ''
        })
      };
    case 'copy':
    case 'cta_copy':
      return {
        name: 'cta_copy',
        buttonParamsJson: JSON.stringify({
          display_text: b.text || 'Copy',
          id: b.id || b.text || 'copy',
          copy_code: b.copy || b.code || b.copy_code || ''
        })
      };
    case 'call':
    case 'cta_call':
      return {
        name: 'cta_call',
        buttonParamsJson: JSON.stringify({
          display_text: b.text || 'Call',
          phone_number: b.phone || b.number || b.phone_number || ''
        })
      };
    case 'list':
    case 'select':
    case 'single_select':
      return {
        name: 'single_select',
        buttonParamsJson: JSON.stringify({
          title: b.text || b.title || 'Menu',
          sections: b.sections || []
        })
      };
    case 'location':
    case 'send_location':
      return {
        name: 'send_location',
        buttonParamsJson: ''
      };
    case 'reminder':
    case 'cta_reminder':
      return {
        name: 'cta_reminder',
        buttonParamsJson: JSON.stringify({
          display_text: b.text || 'Reminder',
          id: b.id || b.text || 'reminder'
        })
      };
    case 'address':
    case 'address_message':
      return {
        name: 'address_message',
        buttonParamsJson: JSON.stringify({
          display_text: b.text || 'Address',
          id: b.id || b.text || 'address'
        })
      };
    default:
      return {
        name: b.name || type,
        buttonParamsJson: typeof b.params === 'string' ? b.params : JSON.stringify(b.params || {})
      };
  }
};
const AI_HL = {
  default: 0,
  keyword: 1,
  method: 2,
  string: 3,
  number: 4,
  comment: 5
};
const AI_PROVIDER = {
  unknown: 0,
  bing: 1,
  google: 2,
  support: 3,
  other: 4
};
const AI_ALIGN = {
  leading: 0,
  left: 0,
  trailing: 1,
  right: 1,
  center: 2,
  centered: 2
};
const AI_DYN = {
  unknown: 0,
  image: 1,
  gif: 2
};
const extractIE = (text, {
  extract = true,
  hyperlink = true,
  citation = true,
  latex = true
} = {}) => {
  if (!extract || typeof text !== 'string') return {
    text: text || '',
    inline_entities: []
  };
  const createIE = (type, ie) => {
    if (type === 'hyperlink') return {
      key: ie.key,
      metadata: {
        display_name: ie.text,
        is_trusted: ie.is_trusted,
        url: ie.url,
        __typename: 'GenAIInlineLinkItem'
      }
    };
    if (type === 'citation') return {
      key: ie.key,
      metadata: {
        reference_id: ie.reference_id,
        reference_url: ie.url,
        reference_title: ie.url,
        reference_display_name: ie.url,
        sources: [],
        __typename: 'GenAISearchCitationItem'
      }
    };
    if (type === 'latex') return {
      key: ie.key,
      metadata: {
        latex_expression: ie.text,
        latex_image: {
          url: ie.url,
          width: Number(ie.width) || 100,
          height: Number(ie.height) || 100
        },
        font_height: Number(ie.font_height) || 83.333333333333,
        padding: Number(ie.padding) || 15,
        __typename: 'GenAILatexItem'
      }
    };
  };
  let inline_entities = [],
    result = '',
    last = 0,
    citation_index = 1,
    hyperlink_index = 0,
    latex_index = 0,
    stack = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '[' && text[i - 1] !== '\\') {
      stack.push(i);
    } else if (text[i] === ']' && (text[i + 1] === '(' || text[i + 1] === '<')) {
      const start = stack.pop();
      if (start == null) continue;
      const open = text[i + 1],
        close = open === '(' ? ')' : '>',
        type = open === '(' ? 'link' : 'latex';
      let end = i + 2,
        depth = 1;
      while (end < text.length && depth) {
        if (text[end] === open && text[end - 1] !== '\\') depth++;else if (text[end] === close && text[end - 1] !== '\\') depth--;
        end++;
      }
      if (depth) continue;
      const raw = text.slice(start + 1, i).trim();
      let url = text.slice(i + 2, end - 1).trim();
      let key, tag, data;
      if (type === 'latex') {
        if (!latex) continue;
        const [txt = '', width = null, height = null, font_height = null, padding = null] = raw.split('|');
        key = `REXX_LATEX_${latex_index++}`;
        tag = `{{${key}}}${txt || 'image'}{{/${key}}}`;
        data = {
          type: 'latex',
          ie: {
            key,
            text: txt,
            url,
            width,
            height,
            font_height,
            padding
          }
        };
      } else if (raw) {
        if (!hyperlink) continue;
        const trusted = !url.startsWith('!');
        if (!trusted) url = url.slice(1);
        key = `REXX_HYPERLINK_${hyperlink_index++}`;
        tag = `{{${key}}}${url}{{/${key}}}`;
        data = {
          type: 'hyperlink',
          ie: {
            key,
            text: raw,
            url,
            is_trusted: trusted
          }
        };
      } else {
        if (!citation) continue;
        key = `REXX_CITATION_${citation_index - 1}`;
        tag = `{{${key}}}${url}{{/${key}}}`;
        data = {
          type: 'citation',
          ie: {
            reference_id: citation_index++,
            key,
            text: '',
            url
          }
        };
      }
      result += text.slice(last, start) + tag;
      last = end;
      const entity = createIE(data.type, data.ie);
      if (entity) inline_entities.push(entity);
      i = end - 1;
    }
  }
  result += text.slice(last);
  return {
    text: result,
    inline_entities
  };
};
const buildRichBlock = (b = {}) => {
  const type = String(b.type || 'text').toLowerCase();
  switch (type) {
    case 'text':
      return {
        messageType: 2,
        messageText: extractIE(b.text != null ? b.text : b.messageText || '').text
      };
    case 'code':
      {
        const blocks = b.code != null ? b.code : b.blocks;
        const codeBlocks = typeof blocks === 'string' ? [{
          codeContent: blocks,
          highlightType: 0
        }] : (blocks || []).map(x => ({
          codeContent: x.content != null ? x.content : x.codeContent || '',
          highlightType: x.type != null ? AI_HL[String(x.type).toLowerCase()] ?? 0 : x.highlightType || 0
        }));
        return {
          messageType: 5,
          codeMetadata: {
            codeLanguage: b.language || b.lang || '',
            codeBlocks
          }
        };
      }
    case 'table':
      {
        const rows = (b.rows || []).map((r, i) => Array.isArray(r) ? {
          items: r,
          isHeading: !!(b.header && i === 0)
        } : {
          items: r.items || [],
          isHeading: !!r.isHeading
        });
        return {
          messageType: 4,
          tableMetadata: {
            title: b.title || '',
            rows
          }
        };
      }
    case 'images':
    case 'grid':
      {
        const imageUrls = (b.urls || b.images || []).map(u => typeof u === 'string' ? {
          imagePreviewUrl: u,
          imageHighResUrl: u,
          sourceUrl: b.sourceUrl || ''
        } : u);
        return {
          messageType: 1,
          gridImageMetadata: {
            gridImageUrl: {
              imagePreviewUrl: imageUrls[0] && imageUrls[0].imagePreviewUrl
            },
            imageUrls
          }
        };
      }
    case 'image':
    case 'inline':
    case 'inlineimage':
      {
        const url = b.url || b.imageUrl && b.imageUrl.imagePreviewUrl || '';
        return {
          messageType: 3,
          imageMetadata: {
            imageUrl: {
              imagePreviewUrl: url,
              imageHighResUrl: b.highRes || url,
              sourceUrl: b.sourceUrl || ''
            },
            imageText: b.text || '',
            alignment: b.align != null ? AI_ALIGN[String(b.align).toLowerCase()] ?? 0 : 0,
            tapLinkUrl: b.link || b.tapLinkUrl || ''
          }
        };
      }
    case 'reels':
    case 'content':
    case 'carousel':
      {
        const itemsMetadata = (b.items || []).map(it => ({
          reelItem: {
            title: it.title || '',
            profileIconUrl: it.icon || it.profileIconUrl || '',
            thumbnailUrl: it.thumbnail || it.thumbnailUrl || '',
            videoUrl: it.video || it.videoUrl || ''
          }
        }));
        return {
          messageType: 9,
          contentItemsMetadata: {
            contentType: b.carousel === false ? 0 : 1,
            itemsMetadata
          }
        };
      }
    case 'latex':
      {
        const expressions = (b.expressions || []).map(e => ({
          latexExpression: e.latex || e.latexExpression || '',
          url: e.url || '',
          width: e.width,
          height: e.height,
          fontHeight: e.fontHeight
        }));
        return {
          messageType: 8,
          latexMetadata: {
            text: b.text || '',
            expressions
          }
        };
      }
    case 'map':
      {
        const annotations = (b.annotations || []).map((a, i) => ({
          annotationNumber: a.number != null ? a.number : i + 1,
          latitude: a.lat != null ? a.lat : a.latitude,
          longitude: a.lng != null ? a.lng : a.longitude,
          title: a.title || '',
          body: a.body || ''
        }));
        return {
          messageType: 7,
          mapMetadata: {
            centerLatitude: b.lat != null ? b.lat : b.centerLatitude,
            centerLongitude: b.lng != null ? b.lng : b.centerLongitude,
            latitudeDelta: b.latitudeDelta != null ? b.latitudeDelta : 0.05,
            longitudeDelta: b.longitudeDelta != null ? b.longitudeDelta : 0.05,
            annotations,
            showInfoList: !!b.showInfoList
          }
        };
      }
    case 'dynamic':
    case 'gif':
      {
        return {
          messageType: 6,
          dynamicMetadata: {
            type: b.kind != null ? AI_DYN[String(b.kind).toLowerCase()] ?? 0 : type === 'gif' ? 2 : 1,
            version: b.version || 1,
            url: b.url || '',
            loopCount: b.loopCount || 0
          }
        };
      }
    default:
      return Object.assign({
        messageType: b.messageType || 0
      }, b);
  }
};
const AI_UNI_HL_NAME = {
  default: 'DEFAULT',
  keyword: 'KEYWORD',
  method: 'METHOD',
  string: 'STR',
  number: 'NUMBER',
  comment: 'COMMENT'
};
const AI_UNI_HL_NUM = ['DEFAULT', 'KEYWORD', 'METHOD', 'STR', 'NUMBER', 'COMMENT'];
const _uniSingle = primitive => ({
  view_model: {
    primitive,
    __typename: 'GenAISingleLayoutViewModel'
  }
});
const buildUnifiedSection = (b = {}) => {
  const type = String(b.type || 'text').toLowerCase();
  switch (type) {
    case 'text':
      {
        const ie = extractIE(b.text != null ? b.text : b.messageText || '');
        return [_uniSingle({
          text: ie.text,
          ...(ie.inline_entities.length ? {
            inline_entities: ie.inline_entities
          } : {}),
          __typename: 'GenAIMarkdownTextUXPrimitive'
        })];
      }
    case 'code':
      {
        const blocks = b.code != null ? b.code : b.blocks;
        const code_blocks = typeof blocks === 'string' ? [{
          content: blocks,
          type: 'DEFAULT'
        }] : (blocks || []).map(x => ({
          content: x.content != null ? x.content : x.codeContent || '',
          type: x.type != null ? AI_UNI_HL_NAME[String(x.type).toLowerCase()] || 'DEFAULT' : AI_UNI_HL_NUM[x.highlightType || 0] || 'DEFAULT'
        }));
        return [_uniSingle({
          language: b.language || b.lang || '',
          code_blocks,
          __typename: 'GenAICodeUXPrimitive'
        })];
      }
    case 'table':
      {
        const rows = (b.rows || []).map((r, i) => Array.isArray(r) ? {
          is_header: !!(b.header && i === 0),
          cells: r
        } : {
          is_header: !!r.isHeading,
          cells: r.items || []
        });
        return [_uniSingle({
          rows,
          __typename: 'GenATableUXPrimitive'
        })];
      }
    case 'images':
    case 'grid':
      {
        return (b.urls || b.images || []).map(u => {
          const url = typeof u === 'string' ? u : u.imagePreviewUrl || u.url || '';
          return _uniSingle({
            media: {
              url,
              mime_type: b.mime || 'image/jpeg'
            },
            imagine_type: 3,
            status: {
              status: 'READY'
            },
            __typename: 'GenAIImaginePrimitive'
          });
        });
      }
    case 'image':
    case 'inline':
    case 'inlineimage':
      {
        const url = b.url || b.imageUrl && b.imageUrl.imagePreviewUrl || '';
        return [_uniSingle({
          media: {
            url,
            mime_type: b.mime || 'image/jpeg'
          },
          imagine_type: 3,
          status: {
            status: 'READY'
          },
          __typename: 'GenAIImaginePrimitive'
        })];
      }
    case 'reels':
    case 'content':
    case 'carousel':
      {
        const primitives = (b.items || []).map(it => ({
          reels_url: it.reelsUrl || it.video || it.videoUrl || '',
          thumbnail_url: it.thumbnail || it.thumbnailUrl || '',
          creator: it.creator || it.title || '',
          avatar_url: it.icon || it.avatarUrl || it.profileIconUrl || '',
          reels_title: it.reelsTitle || it.title || '',
          likes_count: it.likes != null ? it.likes : 0,
          shares_count: it.shares != null ? it.shares : 0,
          view_count: it.views != null ? it.views : 0,
          reel_source: it.source || 'IG',
          is_verified: !!it.verified,
          __typename: 'GenAIReelPrimitive'
        }));
        return [{
          view_model: {
            primitives,
            __typename: 'GenAIHScrollLayoutViewModel'
          }
        }];
      }
    case 'sources':
    case 'searchresult':
      {
        const sources = (b.items || b.sources || []).map(s => ({
          source_type: s.sourceType || 'THIRD_PARTY',
          source_display_name: s.name || s.title || '',
          source_subtitle: s.subtitle || 'AI',
          source_url: s.url || '',
          favicon: {
            url: s.favicon || s.url || '',
            mime_type: 'image/jpeg',
            width: 16,
            height: 16
          }
        }));
        return [_uniSingle({
          sources,
          __typename: 'GenAISearchResultPrimitive'
        })];
      }
    default:
      return [];
  }
};
const buildUnified = (blocks, opts = {}) => {
  const sections = [];
  for (const b of blocks || []) sections.push(...buildUnifiedSection(b));
  if (Array.isArray(opts.sources) && opts.sources.length) sections.push(...buildUnifiedSection({
    type: 'sources',
    items: opts.sources
  }));
  if (opts.footer) sections.push(_uniSingle({
    text: opts.footer,
    __typename: 'GenAIMetadataTextPrimitive'
  }));
  let rid = opts.responseId;
  if (!rid) {
    try {
      rid = require('crypto').randomUUID();
    } catch (_) {
      rid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : r & 0x3 | 0x8).toString(16);
      });
    }
  }
  return Buffer.from(JSON.stringify({
    response_id: rid,
    sections
  }), 'utf8').toString('base64');
};
const buildRichContent = (content = {}) => {
  const submessages = Array.isArray(content.blocks) ? content.blocks.map(buildRichBlock) : [];
  const richResponseMessage = {
    messageType: 1,
    submessages
  };
  if (content.unified || content.unifiedResponse) richResponseMessage.unifiedResponse = {
    data: content.unified || content.unifiedResponse
  };else if (content.autoUnified === true) richResponseMessage.unifiedResponse = {
    data: buildUnified(content.blocks, content)
  };
  richResponseMessage.contextInfo = {
    forwardingScore: 1,
    isForwarded: true,
    forwardOrigin: 4
  };
  const _botJid = content.botJid === undefined ? '0@bot' : content.botJid;
  if (_botJid) richResponseMessage.contextInfo.forwardedAiBotMessageInfo = {
    botJid: _botJid
  };
  if (content.contextInfo) Object.assign(richResponseMessage.contextInfo, content.contextInfo);
  const botMetadata = {
    messageDisclaimerText: content.disclaimer || 'Elaina Multidevice'
  };
  if (Array.isArray(content.sources) && content.sources.length) {
    botMetadata.richResponseSourcesMetadata = {
      sources: content.sources.map((s, i) => ({
        provider: typeof s.provider === 'number' ? s.provider : AI_PROVIDER[String(s.provider || 'other').toLowerCase()] ?? 4,
        thumbnailCdnUrl: s.thumbnail || s.thumbnailCdnUrl || '',
        sourceProviderUrl: s.url || s.sourceProviderUrl || '',
        sourceQuery: s.query || '',
        faviconCdnUrl: s.favicon || s.faviconCdnUrl || '',
        citationNumber: s.citation != null ? s.citation : i + 1,
        sourceTitle: s.title || s.sourceTitle || ''
      }))
    };
  }
  return {
    messageContextInfo: {
      deviceListMetadata: {},
      deviceListMetadataVersion: 2,
      botMetadata
    },
    botForwardedMessage: {
      message: {
        richResponseMessage
      }
    }
  };
};
const TUTOR_BUTTON = `╭───────────────────────────────╮
│  📘  sock.sendButton          │
╰───────────────────────────────╯

Kirim tombol interaktif (native-flow).

▸ FORMAT
  await sock.sendButton(jid, {
    text, footer, title,
    buttons: [ { type, ... } ]
  }, { quoted: m })

▸ TIPE TOMBOL
  • reply     { type:'reply',    text:'Klik',   id:'btn1' }
  • url       { type:'url',      text:'Buka',   url:'https://situs.com' }
  • copy      { type:'copy',     text:'Salin',  copy:'KODE123' }
  • call      { type:'call',     text:'Telp',   phone:'628xxxxxxxx' }
  • select    { type:'select',   text:'Menu',   sections:[{ title:'A',
                 rows:[{ title:'Ping', description:'cek', id:'.ping' }] }] }
  • location  { type:'location', text:'Lokasi' }
  • reminder  { type:'reminder', text:'Ingatkan', id:'r1' }
  • address   { type:'address',  text:'Alamat',   id:'a1' }
  • (tipe baru) { name:'nama_native_flow', params:{...} }

▸ CONTOH
  await sock.sendButton(m.chat, {
    text: 'Pilih salah satu:',
    footer: 'Elaina Bot',
    title: 'Menu',
    buttons: [
      { type:'reply', text:'Ping',    id:'.ping' },
      { type:'url',   text:'Website', url:'https://elaina.site' },
    ]
  }, { quoted: m })

▸ MEDIA + TOMBOL  (ganti "text" jadi image/video/document + caption)
  await sock.sendButton(jid, {
    image: { url:'https://x.jpg' }, caption:'Halo',
    buttons: [ { type:'url', text:'Web', url:'https://x/' } ]
  })

Pakai:  sock.tutorButton()         → kembalikan string
        sock.tutorButton(m.chat)   → kirim ke chat`;
const TUTOR_AIRICH = `╭───────────────────────────────╮
│  📗  sock.sendRichResponse     │
│      AI Rich Message           │
╰───────────────────────────────╯

Kirim kartu AI gaya Meta AI. unifiedResponse & botJid dibuat otomatis.

▸ FORMAT
  await sock.sendRichResponse(jid, {
    disclaimer, footer,
    sources: [ ... ],
    blocks:  [ { type, ... } ]
  }, { quoted: m })

▸ TIPE BLOCK
  • text    { type:'text', text:'# Markdown, **tebal**, dst' }
  • code    { type:'code', language:'javascript', code:'const a = 1' }
              warna: code:[{content:'const',type:'keyword'},{content:' a',type:'default'}]
              highlight: keyword | method | string | number | comment | default
  • table   { type:'table', header:true, rows:[['Nama','Role'],['Rexx','Dev']] }
  • images  { type:'images', urls:['https://a.jpg','https://b.jpg'] }
  • image   { type:'image', url:'https://c.jpg', text:'cap', align:'center', link:'https://x/' }
              align: leading | center | trailing
  • reels   { type:'reels', items:[{ title, thumbnail, video, icon }] }
  • latex   { type:'latex', text:'', expressions:[{ latex:'x^2', url, width, height }] }
  • map     { type:'map', lat:-6.2, lng:106.8, annotations:[{ lat, lng, title }] }
  • gif     { type:'gif', url:'https://g.gif', loopCount:3 }

▸ LINK & CITATION DI DALAM TEKS  (markdown otomatis)
  [Google](https://google.com)      → hyperlink
  [Google](!https://google.com)     → hyperlink untrusted (tanda !)
  [](https://openai.com)            → citation bernomor
  [x^2<https://img/x2.png|120|80>]  → latex inline

▸ SOURCES / CITATION  (opsional)
  sources:[{ title:'RexxHayanasi', url:'https://x/', provider:'OTHER' }]
  provider: UNKNOWN | BING | GOOGLE | SUPPORT | OTHER

▸ OPSI TAMBAHAN
  footer:'~ Elaina'    → baris kecil di bawah kartu
  botJid:'0@bot'       → default; botJid:false untuk hilangkan
  autoUnified:false    → matikan unifiedResponse (cukup submessages)
  unified:'<base64>'   → tempel unifiedResponse manual

▸ CONTOH
  await sock.sendRichResponse(m.chat, {
    disclaimer: 'Elaina Multidevice',
    footer: '~ Elaina',
    sources: [{ title:'RexxHayanasi', url:'https://RexxHayanasi.my.id/' }],
    blocks: [
      { type:'text',  text:'Halo, kunjungi [situs](https://rexx.my.id)' },
      { type:'code',  language:'javascript', code:"class Rexx { static hi(){ return 'Hi' } }" },
      { type:'table', header:true, rows:[['Nama','Role'],['Rexx','Dev']] },
    ]
  }, { quoted: m })

Pakai:  sock.tutorAiRich()         → kembalikan string
        sock.tutorAiRich(m.chat)   → kirim ke chat`;
const makeMessagesSocket = config => {
  const {
    logger,
    linkPreviewImageThumbnailWidth,
    generateHighQualityLinkPreview,
    options: axiosOptions,
    patchMessageBeforeSending,
    cachedGroupMetadata,
    albumMessageItemDelayMs = 0
  } = config;
  const sock = (0, newsletter_1.makeNewsletterSocket)(config);
  const {
    ev,
    authState,
    processingMutex,
    signalRepository,
    upsertMessage,
    query,
    fetchPrivacySettings,
    sendNode,
    groupMetadata,
    groupToggleEphemeral
  } = sock;
  const userDevicesCache = config.userDevicesCache || new node_cache_1.default({
    stdTTL: Defaults_1.DEFAULT_CACHE_TTLS.USER_DEVICES,
    useClones: false
  });
  let mediaConn;
  const refreshMediaConn = async (forceGet = false) => {
    const media = await mediaConn;
    if (!media || forceGet || new Date().getTime() - media.fetchDate.getTime() > media.ttl * 1000) {
      mediaConn = (async () => {
        const result = await query({
          tag: 'iq',
          attrs: {
            type: 'set',
            xmlns: 'w:m',
            to: WABinary_1.S_WHATSAPP_NET
          },
          content: [{
            tag: 'media_conn',
            attrs: {}
          }]
        });
        const mediaConnNode = (0, WABinary_1.getBinaryNodeChild)(result, 'media_conn');
        const node = {
          hosts: (0, WABinary_1.getBinaryNodeChildren)(mediaConnNode, 'host').map(({
            attrs
          }) => ({
            hostname: attrs.hostname,
            maxContentLengthBytes: +attrs.maxContentLengthBytes
          })),
          auth: mediaConnNode.attrs.auth,
          ttl: +mediaConnNode.attrs.ttl,
          fetchDate: new Date()
        };
        logger.debug('fetched media conn');
        return node;
      })();
    }
    return mediaConn;
  };
  const sendReceipt = async (jid, participant, messageIds, type) => {
    const node = {
      tag: 'receipt',
      attrs: {
        id: messageIds[0]
      }
    };
    const isReadReceipt = type === 'read' || type === 'read-self';
    if (isReadReceipt) {
      node.attrs.t = (0, Utils_1.unixTimestampSeconds)().toString();
    }
    if (type === 'sender' && (0, WABinary_1.isJidUser)(jid)) {
      node.attrs.recipient = jid;
      node.attrs.to = participant;
    } else {
      node.attrs.to = jid;
      if (participant) {
        node.attrs.participant = participant;
      }
    }
    if (type) {
      node.attrs.type = (0, WABinary_1.isJidNewsletter)(jid) ? 'read-self' : type;
    }
    const remainingMessageIds = messageIds.slice(1);
    if (remainingMessageIds.length) {
      node.content = [{
        tag: 'list',
        attrs: {},
        content: remainingMessageIds.map(id => ({
          tag: 'item',
          attrs: {
            id
          }
        }))
      }];
    }
    logger.debug({
      attrs: node.attrs,
      messageIds
    }, 'sending receipt for messages');
    await sendNode(node);
  };
  const sendReceipts = async (keys, type) => {
    const recps = (0, Utils_1.aggregateMessageKeysNotFromMe)(keys);
    for (const {
      jid,
      participant,
      messageIds
    } of recps) {
      await sendReceipt(jid, participant, messageIds, type);
    }
  };
  const readMessages = async keys => {
    const privacySettings = await fetchPrivacySettings();
    const readType = privacySettings.readreceipts === 'all' ? 'read' : 'read-self';
    await sendReceipts(keys, readType);
  };
  const getUSyncDevices = async (jids, useCache, ignoreZeroDevices) => {
    var _a;
    const deviceResults = [];
    if (!useCache) {
      logger.debug('not using cache for devices');
    }
    const toFetch = [];
    jids = Array.from(new Set(jids));
    for (let jid of jids) {
      const user = (_a = (0, WABinary_1.jidDecode)(jid)) === null || _a === void 0 ? void 0 : _a.user;
      jid = (0, WABinary_1.jidNormalizedUser)(jid);
      if (useCache) {
        const devices = userDevicesCache.get(user);
        if (devices) {
          deviceResults.push(...devices);
          logger.trace({
            user
          }, 'using cache for devices');
        } else {
          toFetch.push(jid);
        }
      } else {
        toFetch.push(jid);
      }
    }
    if (!toFetch.length) {
      return deviceResults;
    }
    const query = new WAUSync_1.USyncQuery().withContext('message').withDeviceProtocol();
    for (const jid of toFetch) {
      query.withUser(new WAUSync_1.USyncUser().withId(jid));
    }
    const result = await sock.executeUSyncQuery(query);
    if (result) {
      const extracted = (0, Utils_1.extractDeviceJids)(result === null || result === void 0 ? void 0 : result.list, authState.creds.me.id, ignoreZeroDevices);
      const deviceMap = {};
      for (const item of extracted) {
        deviceMap[item.user] = deviceMap[item.user] || [];
        deviceMap[item.user].push(item);
        deviceResults.push(item);
      }
      for (const key in deviceMap) {
        userDevicesCache.set(key, deviceMap[key]);
      }
    }
    return deviceResults;
  };
  const assertSessions = async (jids, force) => {
    let didFetchNewSession = false;
    let jidsRequiringFetch = [];
    if (force) {
      jidsRequiringFetch = jids;
    } else {
      const addrs = jids.map(jid => signalRepository.jidToSignalProtocolAddress(jid));
      const sessions = await authState.keys.get('session', addrs);
      for (const jid of jids) {
        const signalId = signalRepository.jidToSignalProtocolAddress(jid);
        if (!sessions[signalId]) {
          jidsRequiringFetch.push(jid);
        }
      }
    }
    if (jidsRequiringFetch.length) {
      logger.debug({
        jidsRequiringFetch
      }, 'fetching sessions');
      const result = await query({
        tag: 'iq',
        attrs: {
          xmlns: 'encrypt',
          type: 'get',
          to: WABinary_1.S_WHATSAPP_NET
        },
        content: [{
          tag: 'key',
          attrs: {},
          content: jidsRequiringFetch.map(jid => ({
            tag: 'user',
            attrs: {
              jid
            }
          }))
        }]
      });
      await (0, Utils_1.parseAndInjectE2ESessions)(result, signalRepository);
      didFetchNewSession = true;
    }
    return didFetchNewSession;
  };
  const sendPeerDataOperationMessage = async pdoMessage => {
    var _a;
    if (!((_a = authState.creds.me) === null || _a === void 0 ? void 0 : _a.id)) {
      throw new boom_1.Boom('Not authenticated');
    }
    const protocolMessage = {
      protocolMessage: {
        peerDataOperationRequestMessage: pdoMessage,
        type: WAProto_1.proto.Message.ProtocolMessage.Type.PEER_DATA_OPERATION_REQUEST_MESSAGE
      }
    };
    const meJid = (0, WABinary_1.jidNormalizedUser)(authState.creds.me.id);
    const msgId = await relayMessage(meJid, protocolMessage, {
      additionalAttributes: {
        category: 'peer',
        push_priority: 'high_force'
      }
    });
    return msgId;
  };
  const createParticipantNodes = async (jids, message, extraAttrs) => {
    let patched = await patchMessageBeforeSending(message, jids);
    if (!Array.isArray(patched)) {
      patched = jids ? jids.map(jid => ({
        recipientJid: jid,
        ...patched
      })) : [patched];
    }
    let shouldIncludeDeviceIdentity = false;
    const nodes = await Promise.all(patched.map(async patchedMessageWithJid => {
      const {
        recipientJid: jid,
        ...patchedMessage
      } = patchedMessageWithJid;
      if (!jid) {
        return {};
      }
      const bytes = (0, Utils_1.encodeWAMessage)(patchedMessage);
      const {
        type,
        ciphertext
      } = await signalRepository.encryptMessage({
        jid,
        data: bytes
      });
      if (type === 'pkmsg') {
        shouldIncludeDeviceIdentity = true;
      }
      const node = {
        tag: 'to',
        attrs: {
          jid
        },
        content: [{
          tag: 'enc',
          attrs: {
            v: '2',
            type,
            ...(extraAttrs || {})
          },
          content: ciphertext
        }]
      };
      return node;
    }));
    return {
      nodes,
      shouldIncludeDeviceIdentity
    };
  };
  const relayMessage = async (jid, message, {
    messageId: msgId,
    participant,
    additionalAttributes,
    additionalNodes,
    useUserDevicesCache,
    useCachedGroupMetadata,
    statusJidList
  }) => {
    var _a;
    const meId = authState.creds.me.id;
    const meLid = authState.creds.me && authState.creds.me.lid ? authState.creds.me.lid : undefined;
    let shouldIncludeDeviceIdentity = false;
    const {
      user,
      server
    } = (0, WABinary_1.jidDecode)(jid);
    const statusJid = 'status@broadcast';
    const isGroup = server === 'g.us';
    const isNewsletter = server === 'newsletter';
    const isStatus = jid === statusJid;
    const isLid = server === 'lid';
    msgId = msgId || (0, Utils_1.generateMessageIDV2)((_a = sock.user) === null || _a === void 0 ? void 0 : _a.id);
    useUserDevicesCache = useUserDevicesCache !== false;
    useCachedGroupMetadata = useCachedGroupMetadata !== false && !isStatus;
    const participants = [];
    const destinationJid = !isStatus ? (0, WABinary_1.jidEncode)(user, isLid ? 'lid' : isGroup ? 'g.us' : isNewsletter ? 'newsletter' : 's.whatsapp.net') : statusJid;
    const binaryNodeContent = [];
    const devices = [];
    const meMsg = {
      deviceSentMessage: {
        destinationJid,
        message
      },
      messageContextInfo: message.messageContextInfo
    };
    const extraAttrs = {};
    if (participant) {
      if (!isGroup && !isStatus) {
        additionalAttributes = {
          ...additionalAttributes,
          'device_fanout': 'false'
        };
      }
      const {
        user,
        device
      } = (0, WABinary_1.jidDecode)(participant.jid);
      devices.push({
        user,
        device
      });
    }
    await authState.keys.transaction(async () => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
      const mediaType = getMediaType(message);
      if (mediaType) {
        extraAttrs['mediatype'] = mediaType;
      }
      if ((_a = (0, Utils_1.normalizeMessageContent)(message)) === null || _a === void 0 ? void 0 : _a.pinInChatMessage) {
        extraAttrs['decrypt-fail'] = 'hide';
      }
      if (isGroup || isStatus) {
        const [groupData, senderKeyMap] = await Promise.all([(async () => {
          let groupData = useCachedGroupMetadata && cachedGroupMetadata ? await cachedGroupMetadata(jid) : undefined;
          if (groupData && Array.isArray(groupData === null || groupData === void 0 ? void 0 : groupData.participants)) {
            logger.trace({
              jid,
              participants: groupData.participants.length
            }, 'using cached group metadata');
          } else if (!isStatus) {
            groupData = await groupMetadata(jid);
          }
          return groupData;
        })(), (async () => {
          if (!participant && !isStatus) {
            const result = await authState.keys.get('sender-key-memory', [jid]);
            return result[jid] || {};
          }
          return {};
        })()]);
        if (!participant) {
          const participantsList = groupData && !isStatus ? groupData.participants.map(p => p.id) : [];
          if (isStatus && statusJidList) {
            participantsList.push(...statusJidList);
          }
          if (!isStatus) {
            additionalAttributes = {
              ...additionalAttributes,
              addressing_mode: (groupData === null || groupData === void 0 ? void 0 : groupData.addressingMode) || 'pn'
            };
          }
          const additionalDevices = await getUSyncDevices(participantsList, !!useUserDevicesCache, false);
          devices.push(...additionalDevices);
        }
        const isLidGroup = (groupData === null || groupData === void 0 ? void 0 : groupData.addressingMode) === 'lid';
        const lidByPhoneUser = {};
        if (isLidGroup && groupData && Array.isArray(groupData.participants)) {
          for (const p of groupData.participants) {
            const pu = (0, WABinary_1.jidDecode)(p.jid || p.id)?.user;
            const lu = (0, WABinary_1.jidDecode)(p.lid)?.user;
            if (pu && lu) lidByPhoneUser[pu] = lu;
          }
          const mePhoneUser = (0, WABinary_1.jidDecode)(meId)?.user;
          const meLidUser = meLid ? (0, WABinary_1.jidDecode)(meLid)?.user : undefined;
          if (mePhoneUser && meLidUser) lidByPhoneUser[mePhoneUser] = meLidUser;
        }
        const patched = await patchMessageBeforeSending(message);
        if (Array.isArray(patched)) {
          throw new boom_1.Boom('Per-jid patching is not supported in groups');
        }
        const bytes = (0, Utils_1.encodeWAMessage)(patched);
        const {
          ciphertext,
          senderKeyDistributionMessage
        } = await signalRepository.encryptGroupMessage({
          group: destinationJid,
          data: bytes,
          meId: isLidGroup && meLid ? meLid : meId
        });
        const senderKeyJids = [];
        for (const {
          user,
          device
        } of devices) {
          const encUser = isLidGroup ? lidByPhoneUser[user] || user : user;
          const jid = (0, WABinary_1.jidEncode)(encUser, isLidGroup ? 'lid' : 's.whatsapp.net', device);
          if (!senderKeyMap[jid] || !!participant) {
            senderKeyJids.push(jid);
            senderKeyMap[jid] = true;
          }
        }
        if (senderKeyJids.length) {
          logger.debug({
            senderKeyJids
          }, 'sending new sender key');
          const senderKeyMsg = {
            senderKeyDistributionMessage: {
              axolotlSenderKeyDistributionMessage: senderKeyDistributionMessage,
              groupId: destinationJid
            }
          };
          await assertSessions(senderKeyJids, false);
          const result = await createParticipantNodes(senderKeyJids, senderKeyMsg, extraAttrs);
          shouldIncludeDeviceIdentity = shouldIncludeDeviceIdentity || result.shouldIncludeDeviceIdentity;
          participants.push(...result.nodes);
        }
        binaryNodeContent.push({
          tag: 'enc',
          attrs: {
            v: '2',
            type: 'skmsg'
          },
          content: ciphertext
        });
        await authState.keys.set({
          'sender-key-memory': {
            [jid]: senderKeyMap
          }
        });
      } else if (isNewsletter) {
        if ((_b = message.protocolMessage) === null || _b === void 0 ? void 0 : _b.editedMessage) {
          msgId = (_c = message.protocolMessage.key) === null || _c === void 0 ? void 0 : _c.id;
          message = message.protocolMessage.editedMessage;
        }
        if (((_d = message.protocolMessage) === null || _d === void 0 ? void 0 : _d.type) === WAProto_1.proto.Message.ProtocolMessage.Type.REVOKE) {
          msgId = (_e = message.protocolMessage.key) === null || _e === void 0 ? void 0 : _e.id;
          message = {};
        }
        const patched = await patchMessageBeforeSending(message, []);
        if (Array.isArray(patched)) {
          throw new boom_1.Boom('Per-jid patching is not supported in channel');
        }
        const bytes = (0, Utils_1.encodeNewsletterMessage)(patched);
        binaryNodeContent.push({
          tag: 'plaintext',
          attrs: mediaType ? {
            mediatype: mediaType
          } : {},
          content: bytes
        });
      } else {
        const {
          user: meUser
        } = (0, WABinary_1.jidDecode)(meId);
        if (!participant) {
          devices.push({
            user
          });
          if (user !== meUser) {
            devices.push({
              user: meUser
            });
          }
          if ((additionalAttributes === null || additionalAttributes === void 0 ? void 0 : additionalAttributes['category']) !== 'peer') {
            const additionalDevices = await getUSyncDevices([meId, jid], !!useUserDevicesCache, true);
            devices.push(...additionalDevices);
          }
        }
        const allJids = [];
        const meJids = [];
        const otherJids = [];
        for (const {
          user,
          device
        } of devices) {
          const isMe = user === meUser;
          const jid = (0, WABinary_1.jidEncode)(isMe && isLid ? ((_g = (_f = authState.creds) === null || _f === void 0 ? void 0 : _f.me) === null || _g === void 0 ? void 0 : _g.lid.split(':')[0]) || user : user, isLid ? 'lid' : 's.whatsapp.net', device);
          if (isMe) {
            meJids.push(jid);
          } else {
            otherJids.push(jid);
          }
          allJids.push(jid);
        }
        await assertSessions(allJids, false);
        const [{
          nodes: meNodes,
          shouldIncludeDeviceIdentity: s1
        }, {
          nodes: otherNodes,
          shouldIncludeDeviceIdentity: s2
        }] = await Promise.all([createParticipantNodes(meJids, meMsg, extraAttrs), createParticipantNodes(otherJids, message, extraAttrs)]);
        participants.push(...meNodes);
        participants.push(...otherNodes);
        shouldIncludeDeviceIdentity = shouldIncludeDeviceIdentity || s1 || s2;
      }
      if (participants.length) {
        if ((additionalAttributes === null || additionalAttributes === void 0 ? void 0 : additionalAttributes['category']) === 'peer') {
          const peerNode = (_j = (_h = participants[0]) === null || _h === void 0 ? void 0 : _h.content) === null || _j === void 0 ? void 0 : _j[0];
          if (peerNode) {
            binaryNodeContent.push(peerNode);
          }
        } else {
          binaryNodeContent.push({
            tag: 'participants',
            attrs: {},
            content: participants
          });
        }
      }
      const stanza = {
        tag: 'message',
        attrs: {
          id: msgId,
          type: isNewsletter ? getTypeMessage(message) : 'text',
          ...(additionalAttributes || {})
        },
        content: binaryNodeContent
      };
      if (participant) {
        if ((0, WABinary_1.isJidGroup)(destinationJid)) {
          stanza.attrs.to = destinationJid;
          stanza.attrs.participant = participant.jid;
        } else if ((0, WABinary_1.areJidsSameUser)(participant.jid, meId)) {
          stanza.attrs.to = participant.jid;
          stanza.attrs.recipient = destinationJid;
        } else {
          stanza.attrs.to = participant.jid;
        }
      } else {
        stanza.attrs.to = destinationJid;
      }
      if (shouldIncludeDeviceIdentity) {
        stanza.content.push({
          tag: 'device-identity',
          attrs: {},
          content: (0, Utils_1.encodeSignedDeviceIdentity)(authState.creds.account, true)
        });
        logger.debug({
          jid
        }, 'adding device identity');
      }
      if (additionalNodes && additionalNodes.length > 0) {
        stanza.content.push(...additionalNodes);
      }
      const content = (0, Utils_1.normalizeMessageContent)(message);
      const contentType = (0, Utils_1.getContentType)(content);
      if (((0, WABinary_1.isJidGroup)(jid) || (0, WABinary_1.isJidUser)(jid)) && (contentType === 'interactiveMessage' || contentType === 'buttonsMessage' || contentType === 'listMessage')) {
        const bizNode = {
          tag: 'biz',
          attrs: {}
        };
        if (((_l = (_k = message === null || message === void 0 ? void 0 : message.viewOnceMessage) === null || _k === void 0 ? void 0 : _k.message) === null || _l === void 0 ? void 0 : _l.interactiveMessage) || ((_o = (_m = message === null || message === void 0 ? void 0 : message.viewOnceMessageV2) === null || _m === void 0 ? void 0 : _m.message) === null || _o === void 0 ? void 0 : _o.interactiveMessage) || ((_q = (_p = message === null || message === void 0 ? void 0 : message.viewOnceMessageV2Extension) === null || _p === void 0 ? void 0 : _p.message) === null || _q === void 0 ? void 0 : _q.interactiveMessage) || (message === null || message === void 0 ? void 0 : message.interactiveMessage) || ((_s = (_r = message === null || message === void 0 ? void 0 : message.viewOnceMessage) === null || _r === void 0 ? void 0 : _r.message) === null || _s === void 0 ? void 0 : _s.buttonsMessage) || ((_u = (_t = message === null || message === void 0 ? void 0 : message.viewOnceMessageV2) === null || _t === void 0 ? void 0 : _t.message) === null || _u === void 0 ? void 0 : _u.buttonsMessage) || ((_w = (_v = message === null || message === void 0 ? void 0 : message.viewOnceMessageV2Extension) === null || _v === void 0 ? void 0 : _v.message) === null || _w === void 0 ? void 0 : _w.buttonsMessage) || (message === null || message === void 0 ? void 0 : message.buttonsMessage)) {
          bizNode.content = [{
            tag: 'interactive',
            attrs: {
              type: 'native_flow',
              v: '1'
            },
            content: [{
              tag: 'native_flow',
              attrs: {
                v: '9',
                name: 'mixed'
              }
            }]
          }];
        } else if (message === null || message === void 0 ? void 0 : message.listMessage) {
          bizNode.content = [{
            tag: 'list',
            attrs: {
              type: 'product_list',
              v: '2'
            }
          }];
        }
        stanza.content.push(bizNode);
      }
      logger.debug({
        msgId
      }, `sending message to ${participants.length} devices`);
      await sendNode(stanza);
    });
    return msgId;
  };
  const getTypeMessage = msg => {
    if (msg.viewOnceMessage) {
      return getTypeMessage(msg.viewOnceMessage.message);
    } else if (msg.viewOnceMessageV2) {
      return getTypeMessage(msg.viewOnceMessageV2.message);
    } else if (msg.viewOnceMessageV2Extension) {
      return getTypeMessage(msg.viewOnceMessageV2Extension.message);
    } else if (msg.ephemeralMessage) {
      return getTypeMessage(msg.ephemeralMessage.message);
    } else if (msg.documentWithCaptionMessage) {
      return getTypeMessage(msg.documentWithCaptionMessage.message);
    } else if (msg.reactionMessage) {
      return 'reaction';
    } else if (msg.pollCreationMessage || msg.pollCreationMessageV2 || msg.pollCreationMessageV3 || msg.pollUpdateMessage) {
      return 'poll';
    } else if (getMediaType(msg)) {
      return 'media';
    } else {
      return 'text';
    }
  };
  const getMediaType = message => {
    if (message.imageMessage) {
      return 'image';
    } else if (message.videoMessage) {
      return message.videoMessage.gifPlayback ? 'gif' : 'video';
    } else if (message.ptvMessage) {
      return 'ptv';
    } else if (message.audioMessage) {
      return message.audioMessage.ptt ? 'ptt' : 'audio';
    } else if (message.contactMessage) {
      return 'vcard';
    } else if (message.documentMessage) {
      return 'document';
    } else if (message.contactsArrayMessage) {
      return 'contact_array';
    } else if (message.liveLocationMessage) {
      return 'livelocation';
    } else if (message.stickerMessage) {
      return 'sticker';
    } else if (message.listMessage) {
      return 'list';
    } else if (message.listResponseMessage) {
      return 'list_response';
    } else if (message.buttonsResponseMessage) {
      return 'buttons_response';
    } else if (message.orderMessage) {
      return 'order';
    } else if (message.productMessage) {
      return 'product';
    } else if (message.interactiveResponseMessage) {
      return 'native_flow_response';
    } else if (message.groupInviteMessage) {
      return 'url';
    }
  };
  const getPrivacyTokens = async jids => {
    const t = (0, Utils_1.unixTimestampSeconds)().toString();
    const result = await query({
      tag: 'iq',
      attrs: {
        to: WABinary_1.S_WHATSAPP_NET,
        type: 'set',
        xmlns: 'privacy'
      },
      content: [{
        tag: 'tokens',
        attrs: {},
        content: jids.map(jid => ({
          tag: 'token',
          attrs: {
            jid: (0, WABinary_1.jidNormalizedUser)(jid),
            t,
            type: 'trusted_contact'
          }
        }))
      }]
    });
    return result;
  };
  const waUploadToServer = (0, Utils_1.getWAUploadToServer)(config, refreshMediaConn);
  const waitForMsgMediaUpdate = (0, Utils_1.bindWaitForEvent)(ev, 'messages.media-update');
  const __socket = {
    ...sock,
    getPrivacyTokens,
    assertSessions,
    relayMessage,
    sendReceipt,
    sendReceipts,
    readMessages,
    refreshMediaConn,
    waUploadToServer,
    fetchPrivacySettings,
    getUSyncDevices,
    createParticipantNodes,
    sendPeerDataOperationMessage,
    updateMediaMessage: async message => {
      const content = (0, Utils_1.assertMediaContent)(message.message);
      const mediaKey = content.mediaKey;
      const meId = authState.creds.me.id;
      const node = await (0, Utils_1.encryptMediaRetryRequest)(message.key, mediaKey, meId);
      let error = undefined;
      await Promise.all([sendNode(node), waitForMsgMediaUpdate(async update => {
        const result = update.find(c => c.key.id === message.key.id);
        if (result) {
          if (result.error) {
            error = result.error;
          } else {
            try {
              const media = await (0, Utils_1.decryptMediaRetryData)(result.media, mediaKey, result.key.id);
              if (media.result !== WAProto_1.proto.MediaRetryNotification.ResultType.SUCCESS) {
                const resultStr = WAProto_1.proto.MediaRetryNotification.ResultType[media.result];
                throw new boom_1.Boom(`Media re-upload failed by device (${resultStr})`, {
                  data: media,
                  statusCode: (0, Utils_1.getStatusCodeForMediaRetry)(media.result) || 404
                });
              }
              content.directPath = media.directPath;
              content.url = (0, Utils_1.getUrlFromDirectPath)(content.directPath);
              logger.debug({
                directPath: media.directPath,
                key: result.key
              }, 'media update successful');
            } catch (err) {
              error = err;
            }
          }
          return true;
        }
      })]);
      if (error) {
        throw error;
      }
      ev.emit('messages.update', [{
        key: message.key,
        update: {
          message: message.message
        }
      }]);
      return message;
    },
    sendMessage: async (jid, content, options = {}) => {
      var _a, _b, _c;
      const userJid = authState.creds.me.id;
      if (!options.ephemeralExpiration) {
        if ((0, WABinary_1.isJidGroup)(jid)) {
          const groups = await sock.groupQuery(jid, 'get', [{
            tag: 'query',
            attrs: {
              request: 'interactive'
            }
          }]);
          const metadata = (0, WABinary_1.getBinaryNodeChild)(groups, 'group');
          const expiration = ((_b = (_a = (0, WABinary_1.getBinaryNodeChild)(metadata, 'ephemeral')) === null || _a === void 0 ? void 0 : _a.attrs) === null || _b === void 0 ? void 0 : _b.expiration) || 0;
          options.ephemeralExpiration = expiration;
        }
      }
      if (typeof content === 'object' && 'disappearingMessagesInChat' in content && typeof content['disappearingMessagesInChat'] !== 'undefined' && (0, WABinary_1.isJidGroup)(jid)) {
        const {
          disappearingMessagesInChat
        } = content;
        const value = typeof disappearingMessagesInChat === 'boolean' ? disappearingMessagesInChat ? Defaults_1.WA_DEFAULT_EPHEMERAL : 0 : disappearingMessagesInChat;
        await groupToggleEphemeral(jid, value);
      }
      if (typeof content === 'object' && 'album' in content && content.album) {
        const {
          album,
          caption
        } = content;
        if (caption && !album[0].caption) {
          album[0].caption = caption;
        }
        let mediaHandle;
        let mediaMsg;
        const albumMsg = (0, Utils_1.generateWAMessageFromContent)(jid, {
          albumMessage: {
            expectedImageCount: album.filter(item => 'image' in item).length,
            expectedVideoCount: album.filter(item => 'video' in item).length
          }
        }, {
          userJid,
          ...options
        });
        await relayMessage(jid, albumMsg.message, {
          messageId: albumMsg.key.id
        });
        for (const i in album) {
          const media = album[i];
          if ('image' in media) {
            mediaMsg = await (0, Utils_1.generateWAMessage)(jid, {
              image: media.image,
              ...(media.caption ? {
                caption: media.caption
              } : {}),
              ...options
            }, {
              userJid,
              upload: async (readStream, opts) => {
                const up = await waUploadToServer(readStream, {
                  ...opts,
                  newsletter: (0, WABinary_1.isJidNewsletter)(jid)
                });
                mediaHandle = up.handle;
                return up;
              },
              ...options
            });
          } else if ('video' in media) {
            mediaMsg = await (0, Utils_1.generateWAMessage)(jid, {
              video: media.video,
              ...(media.caption ? {
                caption: media.caption
              } : {}),
              ...(media.gifPlayback !== undefined ? {
                gifPlayback: media.gifPlayback
              } : {}),
              ...options
            }, {
              userJid,
              upload: async (readStream, opts) => {
                const up = await waUploadToServer(readStream, {
                  ...opts,
                  newsletter: (0, WABinary_1.isJidNewsletter)(jid)
                });
                mediaHandle = up.handle;
                return up;
              },
              ...options
            });
          }
          if (mediaMsg) {
            mediaMsg.message.messageContextInfo = {
              messageSecret: (0, crypto_1.randomBytes)(32),
              messageAssociation: {
                associationType: 1,
                parentMessageKey: albumMsg.key
              }
            };
          }
          await relayMessage(jid, mediaMsg.message, {
            messageId: mediaMsg.key.id
          });
          if (albumMessageItemDelayMs > 0) {
            await new Promise(resolve => setTimeout(resolve, albumMessageItemDelayMs));
          }
        }
        return albumMsg;
      } else {
        let mediaHandle;
        const fullMsg = await (0, Utils_1.generateWAMessage)(jid, content, {
          logger,
          userJid,
          getUrlInfo: text => (0, link_preview_1.getUrlInfo)(text, {
            thumbnailWidth: linkPreviewImageThumbnailWidth,
            fetchOpts: {
              timeout: 3000,
              ...(axiosOptions || {})
            },
            logger,
            uploadImage: generateHighQualityLinkPreview ? waUploadToServer : undefined
          }),
          getProfilePicUrl: sock.profilePictureUrl,
          upload: async (readStream, opts) => {
            const up = await waUploadToServer(readStream, {
              ...opts,
              newsletter: (0, WABinary_1.isJidNewsletter)(jid)
            });
            mediaHandle = up.handle;
            return up;
          },
          mediaCache: config.mediaCache,
          options: config.options,
          messageId: (0, Utils_1.generateMessageIDV2)((_c = sock.user) === null || _c === void 0 ? void 0 : _c.id),
          ...options
        });
        const isDeleteMsg = 'delete' in content && !!content.delete;
        const isEditMsg = 'edit' in content && !!content.edit;
        const isPinMsg = 'pin' in content && !!content.pin;
        const isKeepMsg = 'keep' in content && content.keep;
        const isPollMessage = 'poll' in content && !!content.poll;
        const isAiMsg = 'ai' in content && !!content.ai;
        const additionalAttributes = {};
        const additionalNodes = [];
        if (isDeleteMsg) {
          if ((0, WABinary_1.isJidGroup)(content.delete.remoteJid) && !content.delete.fromMe || (0, WABinary_1.isJidNewsletter)(jid)) {
            additionalAttributes.edit = '8';
          } else {
            additionalAttributes.edit = '7';
          }
        } else if (isEditMsg) {
          additionalAttributes.edit = (0, WABinary_1.isJidNewsletter)(jid) ? '3' : '1';
        } else if (isPinMsg) {
          additionalAttributes.edit = '2';
        } else if (isKeepMsg) {
          additionalAttributes.edit = '6';
        } else if (isPollMessage) {
          additionalNodes.push({
            tag: 'meta',
            attrs: {
              polltype: 'creation'
            }
          });
        } else if (isAiMsg) {
          additionalNodes.push({
            attrs: {
              biz_bot: '1'
            },
            tag: "bot"
          });
        }
        if (mediaHandle) {
          additionalAttributes['media_id'] = mediaHandle;
        }
        if ('cachedGroupMetadata' in options) {
          console.warn('cachedGroupMetadata in sendMessage are deprecated, now cachedGroupMetadata is part of the socket config.');
        }
        await relayMessage(jid, fullMsg.message, {
          messageId: fullMsg.key.id,
          useCachedGroupMetadata: options.useCachedGroupMetadata,
          additionalAttributes,
          additionalNodes: isAiMsg ? additionalNodes : options.additionalNodes,
          statusJidList: options.statusJidList
        });
        if (config.emitOwnEvents) {
          process.nextTick(() => {
            processingMutex.mutex(() => upsertMessage(fullMsg, 'append'));
          });
        }
        return fullMsg;
      }
    }
  };
  __socket.sendButton = (jid, content = {}, options = {}) => {
    const buttons = Array.isArray(content.buttons) ? content.buttons.map(buildButton) : [];
    const msg = {
      interactiveButtons: buttons
    };
    if (content.image) {
      msg.image = content.image;
      msg.caption = content.caption != null ? content.caption : content.text || '';
      msg.media = true;
    } else if (content.video) {
      msg.video = content.video;
      msg.caption = content.caption != null ? content.caption : content.text || '';
      msg.media = true;
    } else if (content.document) {
      msg.document = content.document;
      msg.mimetype = content.mimetype || 'application/pdf';
      msg.fileName = content.fileName || content.filename || 'file';
      msg.caption = content.caption != null ? content.caption : content.text || '';
      msg.media = true;
    } else {
      msg.text = content.text != null ? content.text : content.caption || '';
    }
    if (content.footer) msg.footer = content.footer;
    if (content.title) msg.title = content.title;
    if (content.subtitle) msg.subtitle = content.subtitle;
    if (content.mentions) msg.mentions = content.mentions;
    if (content.contextInfo) msg.contextInfo = content.contextInfo;
    return __socket.sendMessage(jid, msg, options);
  };
  __socket.sendRichResponse = (jid, content = {}, options = {}) => {
    return __socket.relayMessage(jid, buildRichContent(content), options);
  };
  const NEWSLETTER_STATUS_ATTRS = {
    newsletter_jid: jid => ({
      newsletter_jid: jid
    }),
    channel_jid: jid => ({
      channel_jid: jid
    }),
    source_jid: jid => ({
      source_jid: jid
    }),
    newsletter_jid_typed: jid => ({
      newsletter_jid: jid,
      status_type: 'newsletter'
    })
  };
  __socket.sendNewsletterStatus = async (newsletterJid, content = {}, options = {}) => {
    if (!newsletterJid || !newsletterJid.endsWith('@newsletter')) throw new Error('sendNewsletterStatus: newsletterJid harus diakhiri @newsletter');
    const msg = await (0, Utils_1.generateWAMessageContent)(content, {
      upload: __socket.waUploadToServer,
      logger: config.logger,
      ...options
    });
    const variant = options.variant || 'newsletter_jid';
    const relayOpts = {
      messageId: options.messageId,
      statusJidList: options.statusJidList || []
    };
    if (options.additionalNodes) {
      relayOpts.additionalNodes = options.additionalNodes;
    } else {
      const build = NEWSLETTER_STATUS_ATTRS[variant] || NEWSLETTER_STATUS_ATTRS.newsletter_jid;
      relayOpts.additionalAttributes = {
        ...(options.additionalAttributes || {}),
        ...build(newsletterJid)
      };
    }
    return __socket.relayMessage('status@broadcast', msg, relayOpts);
  };
  __socket.tutorbutton = (jid, options = {}) => {
    if (jid) return __socket.sendMessage(jid, {
      text: TUTOR_BUTTON
    }, options);
    return TUTOR_BUTTON;
  };
  __socket.tutorairich = (jid, options = {}) => {
    if (jid) return __socket.sendMessage(jid, {
      text: TUTOR_AIRICH
    }, options);
    return TUTOR_AIRICH;
  };
  __socket.tutorButton = __socket.tutorbutton;
  __socket.tutorAiRich = __socket.tutorairich;
  __socket.tutorAirich = __socket.tutorairich;
  __socket.tutorRich = __socket.tutorairich;
  return __socket;
};
exports.makeMessagesSocket = makeMessagesSocket;