import * as Utils_1 from '../Utils/index.js'
import WaProto from '../../WAProto/index.js'
const WAProto = WaProto.proto
import axios from "axios"
import crypto from 'crypto'

class hydra {
    constructor(utils, waUploadToServer, relayMessageFn) {
        this.utils = utils;
        this.relayMessage = relayMessageFn
        this.waUploadToServer = waUploadToServer;
    }

    detectType(content) {
        if (content.requestPaymentMessage) return 'PAYMENT';
        if (content.productMessage) return 'PRODUCT';
        if (content.interactiveMessage) return 'INTERACTIVE';
        if (content.albumMessage) return 'ALBUM';
        if (content.eventMessage) return 'EVENT';
        if (content.pollResultMessage) return 'POLL_RESULT';
        if (content.statusMentionMessage) return 'STATUS_MENTION';
        if (content.orderMessage) return 'ORDER';
        if (content.groupStatus) return 'GROUP_STATUS';
        if (content.carouselMessage || content.carousel) return 'CAROUSEL'; 
        if (content.stickerPack) return "STICKER_PACK";
        return null;
}
    
    async handleCarousel(content, jid, quoted) {
    // 🔥 Support carouselMessage (native) & carousel (wrapper)
    const root = content.carouselMessage || content.carousel || {};
    const { caption = "", footer = "", cards = [] } = root;

    const carouselCards = await Promise.all(
        cards.map(async (card) => {
            if (card.productTitle) {
                // Mode Product
                return {
                    header: WAProto.Message.InteractiveMessage.Header.create({
                        title: card.headerTitle || "",
                        subtitle: card.headerSubtitle || "",
                        productMessage: {
                            product: {
                                productImage: (
                                    await this.utils.prepareWAMessageMedia(
                                        { image: { url: card.imageUrl } },
                                        { upload: this.waUploadToServer }
                                    )
                                ).imageMessage,
                                productId: card.productId || "123456",
                                title: card.productTitle,
                                description: card.productDescription || "",
                                currencyCode: card.currencyCode || "IDR",
                                priceAmount1000: card.priceAmount1000 || "100000",
                                retailerId: card.retailerId || "Retailer",
                                url: card.url || "",
                                productImageCount: 1
                            },
                            businessOwnerJid: card.businessOwnerJid || "0@s.whatsapp.net"
                        },
                        hasMediaAttachment: false
                    }),
                    body: WAProto.Message.InteractiveMessage.Body.create({
                        text: card.bodyText || ""
                    }),
                    footer: WAProto.Message.InteractiveMessage.Footer.create({
                        text: card.footerText || ""
                    }),
                    nativeFlowMessage: WAProto.Message.InteractiveMessage.NativeFlowMessage.create({
                        buttons: (card.buttons || []).map((btn) => ({
                            name: btn.name,
                            buttonParamsJson: JSON.stringify(btn.params || {})
                        }))
                    })
                };
            } else {
                // Mode Image biasa
                return {
                    header: WAProto.Message.InteractiveMessage.Header.create({
                        title: card.headerTitle || "",
                        subtitle: card.headerSubtitle || "",
                        hasMediaAttachment: !!card.imageUrl,
                        ...(card.imageUrl
                            ? await this.utils.prepareWAMessageMedia(
                                  { image: { url: card.imageUrl } },
                                  { upload: this.waUploadToServer }
                              )
                            : {}
                        )
                    }),
                    body: WAProto.Message.InteractiveMessage.Body.create({
                        text: card.bodyText || ""
                    }),
                    footer: WAProto.Message.InteractiveMessage.Footer.create({
                        text: card.footerText || ""
                    }),
                    nativeFlowMessage: WAProto.Message.InteractiveMessage.NativeFlowMessage.create({
                        buttons: (card.buttons || []).map((btn) => ({
                            name: btn.name,
                            buttonParamsJson: JSON.stringify(btn.params || {})
                        }))
                    })
                };
            }
        })
    );

    const msg = await this.utils.generateWAMessageFromContent(
        jid,
        {
            viewOnceMessage: {
                message: {
                    interactiveMessage: WAProto.Message.InteractiveMessage.create({
                        body: WAProto.Message.InteractiveMessage.Body.create({ text: caption }),
                        footer: WAProto.Message.InteractiveMessage.Footer.create({ text: footer }),
                        carouselMessage: WAProto.Message.InteractiveMessage.CarouselMessage.create({
                            cards: carouselCards,
                            messageVersion: 1
                        })
                    })
                }
            }
        },
        { quoted }
    );

    await this.relayMessage(jid, msg.message, { messageId: msg.key.id });
    return msg;
}

    async handleStickerPack(stickerPack, jid, quoted) {
        const result = await this.utils.prepareStickerPackMessage(stickerPack, {
            logger: this.utils?.logger,
            upload: this.waUploadToServer,
            options: this.utils?.options || {},
            mediaUploadTimeoutMs: this.utils?.mediaUploadTimeoutMs
        });

        if (result.isBatched) {
            let lastMsg;
            for (let i = 0; i < result.stickerPackMessage.length; i++) {
                const msg = await this.utils.generateWAMessageFromContent(
                    jid,
                    { stickerPackMessage: result.stickerPackMessage[i] },
                    { quoted, upload: this.waUploadToServer }
                );

                await this.relayMessage(jid, msg.message, {
                    messageId: msg.key.id
                });

                lastMsg = msg;

                if (i < result.stickerPackMessage.length - 1) {
                    await new Promise(r => setTimeout(r, 2000));
                }
            }
            return lastMsg;
        }

        const msg = await this.utils.generateWAMessageFromContent(
            jid,
            { stickerPackMessage: result.stickerPackMessage },
            { quoted, upload: this.waUploadToServer }
        );

        await this.relayMessage(jid, msg.message, {
            messageId: msg.key.id
        });

        return msg;
    }

    async handlePayment(content, quoted) {
        const data = content.requestPaymentMessage;
        let notes = {};

        if (data.sticker?.stickerMessage) {
            notes = {
                stickerMessage: {
                    ...data.sticker.stickerMessage,
                    contextInfo: {
                        stanzaId: quoted?.key?.id,
                        participant: quoted?.key?.participant || content.sender,
                        quotedMessage: quoted?.message
                    }
                }
            };
        } else if (data.note) {
            notes = {
                extendedTextMessage: {
                    text: data.note,
                    contextInfo: {
                        stanzaId: quoted?.key?.id,
                        participant: quoted?.key?.participant || content.sender,
                        quotedMessage: quoted?.message
                    }
                }
            };
        }

        return {
            requestPaymentMessage: WAProto.Message.RequestPaymentMessage.fromObject({
                expiryTimestamp: data.expiry || 0,
                amount1000: data.amount || 0,
                currencyCodeIso4217: data.currency || "IDR",
                requestFrom: data.from || "0@s.whatsapp.net",
                noteMessage: notes,
                background: data.background ?? {
                    id: "DEFAULT",
                    placeholderArgb: 0xFFF0F0F0
                }
            })
        };
    }
        
        async handleProduct(content, jid, quoted) {
            const {
                title, 
                description, 
                thumbnail,
                productId, 
                retailerId, 
                url, 
                body = "", 
                footer = "", 
                buttons = [],
                priceAmount1000 = null,
                currencyCode = "IDR"
            } = content.productMessage;
    
            let productImage;
    
            if (Buffer.isBuffer(thumbnail)) {
                const { imageMessage } = await this.utils.generateWAMessageContent(
                    { image: thumbnail }, 
                    { upload: this.waUploadToServer }
                );
                productImage = imageMessage;
            } else if (typeof thumbnail === 'object' && thumbnail.url) {
                const { imageMessage } = await this.utils.generateWAMessageContent(
                    { image: { url: thumbnail.url }}, 
                    { upload: this.waUploadToServer }
                );
                productImage = imageMessage;
            }
    
            return {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: {
                            body: { text: body },
                            footer: { text: footer },
                            header: {
                                title,
                                hasMediaAttachment: true,
                                productMessage: {
                                    product: {
                                        productImage,
                                        productId,
                                        title,
                                        description,
                                        currencyCode,
                                        priceAmount1000,
                                        retailerId,
                                        url,
                                        productImageCount: 1
                                    },
                                    businessOwnerJid: "0@s.whatsapp.net"
                                }
                            },
                            nativeFlowMessage: { buttons }
                        }
                    }
                }
            };
        }
        
        async handleInteractive(content, jid, quoted) {
            const {
                title,
                footer,
                thumbnail,
                image,
                video,
                document,
                mimetype,
                fileName,
                jpegThumbnail,
                contextInfo,
                externalAdReply,
                buttons = [],
                nativeFlowMessage
            } = content.interactiveMessage;
            
            let media = null;
            let mediaType = null;
            
            if (thumbnail) {
                media = await this.utils.prepareWAMessageMedia(
                    { image: { url: thumbnail } },
                    { upload: this.waUploadToServer }
                );
                mediaType = 'image';
            } else if (image) {
                if (typeof image === 'object' && image.url) {
                    media = await this.utils.prepareWAMessageMedia(
                        { image: { url: image.url } },
                        { upload: this.waUploadToServer }
                    );
                } else {
                    media = await this.utils.prepareWAMessageMedia(
                        { image: image },
                        { upload: this.waUploadToServer }
                    );
                }
                mediaType = 'image';
            } else if (video) {
                if (typeof video === 'object' && video.url) {
                    media = await this.utils.prepareWAMessageMedia(
                        { video: { url: video.url } },
                        { upload: this.waUploadToServer }
                    );
                } else {
                    media = await this.utils.prepareWAMessageMedia(
                        { video: video },
                        { upload: this.waUploadToServer }
                    );
                }
                mediaType = 'video';
            } else if (document) {
                let documentPayload = { document: document };
                
                if (jpegThumbnail) {
                    if (typeof jpegThumbnail === 'object' && jpegThumbnail.url) {
                        documentPayload.jpegThumbnail = { url: jpegThumbnail.url };
                    } else {
                        documentPayload.jpegThumbnail = jpegThumbnail;
                    }
                }
        
                media = await this.utils.prepareWAMessageMedia(
                    documentPayload,
                    { upload: this.waUploadToServer }
                );
        
                if (fileName) {
                    media.documentMessage.fileName = fileName;
                }
                if (mimetype) {
                    media.documentMessage.mimetype = mimetype;
                }
                mediaType = 'document';
            }
            
            let interactiveMessage = {
                body: { text: title || "" },
                footer: { text: footer || "" }
            };
            
            if (buttons && buttons.length > 0) {
                interactiveMessage.nativeFlowMessage = {
                    buttons: buttons
                };
       
                if (nativeFlowMessage) {
                    interactiveMessage.nativeFlowMessage = {
                        ...interactiveMessage.nativeFlowMessage,
                        ...nativeFlowMessage
                    };
                }
            } else if (nativeFlowMessage) {
                interactiveMessage.nativeFlowMessage = nativeFlowMessage;
            }
            
            if (media) {
                interactiveMessage.header = {
                    title: "",
                    hasMediaAttachment: true,
                    ...media
                };
            } else {
                interactiveMessage.header = {
                    title: "",
                    hasMediaAttachment: false
                };
            }

            let finalContextInfo = {};
            
            if (contextInfo) {
                finalContextInfo = {
                    mentionedJid: contextInfo.mentionedJid || [],
                    forwardingScore: contextInfo.forwardingScore || 0,
                    isForwarded: contextInfo.isForwarded || false,
                    ...contextInfo
                };
            }

            if (externalAdReply) {
                finalContextInfo.externalAdReply = {
                    title: externalAdReply.title || "",
                    body: externalAdReply.body || "",
                    mediaType: externalAdReply.mediaType || 1,
                    thumbnailUrl: externalAdReply.thumbnailUrl || "",
                    mediaUrl: externalAdReply.mediaUrl || "",
                    sourceUrl: externalAdReply.sourceUrl || "",
                    showAdAttribution: externalAdReply.showAdAttribution || false,
                    renderLargerThumbnail: externalAdReply.renderLargerThumbnail || false,
                    ...externalAdReply
                };
            }
            
            if (Object.keys(finalContextInfo).length > 0) {
                interactiveMessage.contextInfo = finalContextInfo;
            }

            return {
                interactiveMessage: interactiveMessage
            };
        }
        
        async handleAlbum(content, jid, quoted) {
            const array = content.albumMessage;
            const album = await this.utils.generateWAMessageFromContent(jid, {
                messageContextInfo: {
                    messageSecret: crypto.randomBytes(32),
                },
                albumMessage: {
                    expectedImageCount: array.filter((a) => a.hasOwnProperty("image")).length,
                    expectedVideoCount: array.filter((a) => a.hasOwnProperty("video")).length,
                },
            }, {
                userJid: this.utils.generateMessageID().split('@')[0] + '@s.whatsapp.net',
                quoted,
                upload: this.waUploadToServer
            });
            
            await this.relayMessage(jid, album.message, {
                messageId: album.key.id,
            });
            
            for (let content of array) {
                const img = await this.utils.generateWAMessage(jid, content, {
                    upload: this.waUploadToServer,
                });
                
                img.message.messageContextInfo = {
                    messageSecret: crypto.randomBytes(32),
                    messageAssociation: {
                        associationType: 1,
                        parentMessageKey: album.key,
                    },    
                    participant: "0@s.whatsapp.net",
                    remoteJid: "status@broadcast",
                    forwardingScore: 99999,
                    isForwarded: true,
                    mentionedJid: [jid],
                    starred: true,
                    labels: ["Y", "Important"],
                    isHighlighted: true,
                    businessMessageForwardInfo: {
                        businessOwnerJid: jid,
                    },
                    dataSharingContext: {
                        showMmDisclosure: true,
                    },
                };

                img.message.forwardedNewsletterMessageInfo = {
                    newsletterJid: "0@newsletter",
                    serverMessageId: 1,
                    newsletterName: `WhatsApp`,
                    contentType: 1,
                    timestamp: new Date().toISOString(),
                    senderName: "7-Yuukey",
                    contentType: "UPDATE_CARD",
                    priority: "high",
                    status: "sent",
                };
                
                img.message.disappearingMode = {
                    initiator: 3,
                    trigger: 4,
                    initiatorDeviceJid: jid,
                    initiatedByExternalService: true,
                    initiatedByUserDevice: true,
                    initiatedBySystem: true,      
                    initiatedByServer: true,
                    initiatedByAdmin: true,
                    initiatedByUser: true,
                    initiatedByApp: true,
                    initiatedByBot: true,
                    initiatedByMe: true,
                };

                await this.relayMessage(jid, img.message, {
                    messageId: img.key.id,
                    quoted: {
                        key: {
                            remoteJid: album.key.remoteJid,
                            id: album.key.id,
                            fromMe: true,
                            participant: this.utils.generateMessageID().split('@')[0] + '@s.whatsapp.net',
                        },
                        message: album.message,
                    },
                });
            }
            return album;
        }   
 
        async handleEvent(content, jid, quoted) {
            const eventData = content.eventMessage;
            
            const msg = await this.utils.generateWAMessageFromContent(jid, {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: {
                            deviceListMetadata: {},
                            deviceListMetadataVersion: 2,
                            messageSecret: crypto.randomBytes(32),
                            supportPayload: JSON.stringify({
                                version: 2,
                                is_ai_message: true,
                                should_show_system_message: true,
                                ticket_id: crypto.randomBytes(16).toString('hex')
                            })
                        },
                        eventMessage: {
                            contextInfo: {
                                mentionedJid: [jid],
                                participant: jid,
                                remoteJid: "status@broadcast",
                                forwardedNewsletterMessageInfo: {
                                    newsletterName: "D | 7eppeli-Exloration",
                                    newsletterJid: "120363421563597486@newsletter",
                                    serverMessageId: 1
                                }
                            },
                            isCanceled: eventData.isCanceled || false,
                            name: eventData.name,
                            description: eventData.description,
                            location: eventData.location || {
                                degreesLatitude: 0,
                                degreesLongitude: 0,
                                name: "Location"
                            },
                            joinLink: eventData.joinLink || '',
                            startTime: typeof eventData.startTime === 'string' ? parseInt(eventData.startTime) : eventData.startTime || Date.now(),
                            endTime: typeof eventData.endTime === 'string' ? parseInt(eventData.endTime) : eventData.endTime || Date.now() + 3600000,
                            extraGuestsAllowed: eventData.extraGuestsAllowed !== false
                        }
                    }
                }
            }, { quoted });
            
            await this.relayMessage(jid, msg.message, {
                messageId: msg.key.id
            });
            return msg;
        }
        
        async handlePollResult(content, jid, quoted) {
            const pollData = content.pollResultMessage;
            const msg = await this.utils.generateWAMessageFromContent(jid, {
                pollResultSnapshotMessage: {
                    name: pollData.name,
                    pollVotes: pollData.pollVotes.map(vote => ({
                        optionName: vote.optionName,
                        optionVoteCount: typeof vote.optionVoteCount === 'number' 
                        ? vote.optionVoteCount.toString() 
                        : vote.optionVoteCount
                    })),
                    contextInfo: {
                        isForwarded: true,
                        forwardingScore: 1,
                        forwardedNewsletterMessageInfo: {
                            newsletterName: pollData.newsletter.newsletterName || "120363399602691477@newsletter",
                            newsletterJid: pollData.newsletter.newsletterJid || "Newsletter",
                            serverMessageId: 1000,
                            contentType: "UPDATE"
                        }
                    }
                }
            }, {
                userJid: this.utils.generateMessageID().split('@')[0] + '@s.whatsapp.net',
                quoted
            });
        
            await this.relayMessage(jid, msg.message, {
                messageId: msg.key.id
            });
       
            return msg;
        }

        async handleStMention(content, jid, quoted) {
            const data = content.statusMentionMessage;
            const mediaType = null;
            
            if (data.image) {
                if (typeof data.image === 'object' && data.image.url) {
                    media = await this.utils.prepareWAMessageMedia(
                        { image: { url: data.image.url } },
                        { upload: this.waUploadToServer }
                    );
                } else {
                    media = await this.utils.prepareWAMessageMedia(
                        { image: data.image },
                        { upload: this.waUploadToServer }
                    );
                }
                mediaType = 'image';
            } else if (data.video) {
                if (typeof data.video === 'object' && data.video.url) {
                    media = await this.utils.prepareWAMessageMedia(
                        { video: { url: data.video.url } },
                        { upload: this.waUploadToServer }
                    );
                } else {
                    media = await this.utils.prepareWAMessageMedia(
                        { video: data.video },
                        { upload: this.waUploadToServer }
                    );
                }
                mediaType = 'video';
            };
            let msg = await this.relayMessage("status@broadcast", {
                ...media }, {
                  statusJidList: [data.mentions, this.user.id], 
                  additionalNodes: [{
                      tag: "meta",
                      attrs: {},
                      content: [
                        {
                          tag: "mentioned_users",
                          attrs: {},
                          content: [
                            {
                              tag: "to",
                              attrs: { jid: target },
                              content: undefined,
                            }
                          ]
                       }
                    ],
                  }]
                });
            
            let xontols = await this.utils.generateWAMessageFromContent(jid, {
                statusMentionMessage: {
                    message: {
                        protocolMessage: {
                            messageId: msg.key,
                            type: "STATUS_MENTION_MESSAGE"
                        }
                    }
                }
            }, {
                addtionalNodes: [
                    {
                        tag: "meta",
                        attrs: { "is_status_mention": true },
                        content: undefined
                    }
                ]
            });

            await this.relayMessage(jid, xontols.message, {
                messageId: xontols.key.id
            })
            return xontols
        }
     
        async handleOrderMessage(content, jid, quoted) {
    const orderData = content.orderMessage;

    // === SUPPORT: BUFFER / URL ===
    let thumbnail = null;
    if (orderData.thumbnail) {
        if (Buffer.isBuffer(orderData.thumbnail)) {
            thumbnail = orderData.thumbnail;
        } else if (typeof orderData.thumbnail === "string") {
            try {
                const res = await axios.get(orderData.thumbnail, {
                    responseType: "arraybuffer"
                });
                thumbnail = Buffer.from(res.data);
            } catch (e) {
                console.error("Gagal download thumbnail:", e);
                thumbnail = null;
            }
        }
    }

    const Haha = await this.utils.generateWAMessageFromContent(jid, {
        orderMessage: {
            orderId: "7EPPELI25022008",
            thumbnail: thumbnail, // ← pakai hasil parsing dari atas
            itemCount: orderData.itemCount || 0,
            status: "ACCEPTED",
            surface: "CATALOG",
            message: orderData.message,
            orderTitle: orderData.orderTitle,
            sellerJid: "0@whatsapp.net",
            token: "7EPPELI_EXAMPLE_TOKEN",
            totalAmount1000: orderData.totalAmount1000 || 0,
            totalCurrencyCode: orderData.totalCurrencyCode || "IDR",
            messageVersion: 2
        }
    }, { quoted });

    await this.relayMessage(jid, Haha.message, {});
    return Haha;
}

        async handleGroupStory(content, jid, quoted) {
          const storyData = content.groupStatus;
            let messageContent;
        
            if (storyData.message) {
              messageContent = storyData;
            } else {
              if (typeof this.utils?.generateWAMessageContent === "function") {
                messageContent = await this.utils.generateWAMessageContent(storyData, {
                  upload: this.waUploadToServer
                });
              } else if (typeof this.utils?.generateWAMessageContent === "function") {
                messageContent = await this.utils.generateWAMessageContent(storyData, {
                  upload: this.waUploadToServer
                });
              } else if (typeof this.utils?.prepareMessageContent === "function") {
                messageContent = await this.utils.prepareMessageContent(storyData, {
                    upload: this.waUploadToServer
                });
              } else {
                messageContent = await Utils_1.generateWAMessageContent(storyData, {
                  upload: this.waUploadToServer
                });
              }
            }

            let msg = {
              message: {
                groupStatusMessageV2: {
                  message: messageContent.message || messageContent
                }
              }
            };

            return await this.relayMessage(jid, msg.message, {
              messageId: this.utils.generateMessageID()
            });
    }
    }

export default rexxhayanasi
