const { cmd } = require('../command');
const config = require('../config');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');
const { getAntideleteStatus, setAntideleteStatus, getAntiDelPath, setAntiDelPath } = require('../data/Antidelete');

// ==================== MESSAGE STORE (in-memory, last 24h) ====================
const messageStore = new Map();

async function storeMessageForAntiDelete(message) {
    try {
        if (!message || !message.key || !message.message) return;
        if (message.key.fromMe) return;
        if (message.key.remoteJid === 'status@broadcast') return;

        const messageKey = `${message.key.remoteJid}_${message.key.id}`;
        messageStore.set(messageKey, {
            message: message,
            sender: message.key.participant || message.key.remoteJid,
            chat: message.key.remoteJid,
            timestamp: Date.now()
        });

        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        for (const [key, value] of messageStore.entries()) {
            if (value.timestamp && value.timestamp < oneDayAgo) {
                messageStore.delete(key);
            }
        }
    } catch (err) {}
}

async function getStoredMessage(messageId, chatId) {
    const messageKey = `${chatId}_${messageId}`;
    return messageStore.get(messageKey) || null;
}

// ==================== HANDLE DELETED MESSAGE ====================
async function handleDeletedMessage(conn, updates) {
    for (const update of updates) {
        if (update.update && update.update.message === null) {
            const chatId = update.key.remoteJid;

            const isEnabled = await getAntideleteStatus(chatId);
            if (!isEnabled) continue;

            const stored = await getStoredMessage(update.key.id, chatId);
            if (!stored || !stored.message) continue;

            const mek = stored.message;
            const isGroup = chatId.endsWith('@g.us');
            const sender = stored.sender;
            const senderNum = sender.split('@')[0];
            const deleter = update.key.participant || chatId;
            const deleterNum = deleter.split('@')[0];

            let msgType = "📝 TEXT";
            let isMedia = false;
            let caption = '';

            if (mek.message?.imageMessage) {
                msgType = "🖼️ IMAGE"; isMedia = true;
                caption = mek.message.imageMessage.caption || '';
            } else if (mek.message?.videoMessage) {
                msgType = "🎥 VIDEO"; isMedia = true;
                caption = mek.message.videoMessage.caption || '';
            } else if (mek.message?.audioMessage) {
                msgType = "🔊 AUDIO"; isMedia = true;
            } else if (mek.message?.documentMessage) {
                msgType = "📄 DOCUMENT"; isMedia = true;
                caption = mek.message.documentMessage.fileName || '';
            } else if (mek.message?.stickerMessage) {
                msgType = "🏷️ STICKER"; isMedia = true;
            } else if (mek.message?.viewOnceMessage || mek.message?.viewOnceMessageV2) {
                msgType = "🔓 VIEW ONCE"; isMedia = true;
                const viewOnce = mek.message?.viewOnceMessageV2?.message || mek.message?.viewOnceMessage?.message;
                if (viewOnce) {
                    mek.message = viewOnce;
                    if (viewOnce.imageMessage) msgType = "🔓 IMAGE (View Once)";
                    else if (viewOnce.videoMessage) msgType = "🔓 VIDEO (View Once)";
                }
            }

            let deleteInfo = `╭────⬡ Ali Md mini bot ⬡────\n`;
            deleteInfo += `├📌 *TYPE:* ${msgType}\n`;
            deleteInfo += `├👤 *SENDER:* @${senderNum}\n`;

            if (isGroup) {
                try {
                    const group = await conn.groupMetadata(chatId);
                    deleteInfo += `├👥 *GROUP:* ${group.subject}\n`;
                } catch {}
            }

            deleteInfo += `├🗑️ *DELETED BY:* @${deleterNum}\n`;
            deleteInfo += `├⏰ *TIME:* ${new Date().toLocaleString()}\n`;

            if (caption) {
                deleteInfo += `├📝 *CAPTION:* ${caption}\n`;
            }

            deleteInfo += `╰💬 *MESSAGE:* Content Below 🔽`;

            // ✅ FIX: ab DB se persisted path lo (config.js mutation ki jagah)
            const savedPath = await getAntiDelPath();
            // ✅ FIX: conn.user.id ke saath ":device" suffix hota hai — normalize zaroori hai,
            // warna DM (inbox) pe message deliver hi nahi hota
            const dest = savedPath === 'inbox' ? jidNormalizedUser(conn.user.id) : chatId;

            try {
                await conn.sendMessage(dest, {
                    text: deleteInfo,
                    mentions: [sender, deleter]
                });
            } catch (sendErr) {
                console.log("Anti-delete notify error:", sendErr.message);
            }

            if (isMedia) {
                try {
                    const mediaMsg = JSON.parse(JSON.stringify(mek.message));
                    const msgTypeKey = Object.keys(mediaMsg)[0];
                    if (mediaMsg[msgTypeKey]) {
                        mediaMsg[msgTypeKey].contextInfo = {
                            stanzaId: mek.key.id,
                            participant: sender,
                            quotedMessage: mek.message
                        };
                        await conn.relayMessage(dest, mediaMsg, {});
                        console.log(`✅ Anti-delete: ${msgType} sent`);
                    }
                } catch (err) {
                    console.log("Error sending media:", err.message);
                }
            } else {
                const content = mek.message?.conversation || mek.message?.extendedTextMessage?.text || '';
                try {
                    await conn.sendMessage(dest, { text: `📝 *Content:*\n${content}` });
                } catch (err) {
                    console.log("Error sending text content:", err.message);
                }
            }

            console.log(`✅ Anti-delete: ${msgType} from ${senderNum} processed`);
        }
    }
}

// ==================== MAIN ANTI-DELETE COMMAND ====================
cmd({
    pattern: "antidel",
    alias: ["antidelete", "ad"],
    desc: "Enable/Disable Anti-Delete feature (per chat)",
    category: "owner",
    react: "🛡️",
    filename: __filename
},
async (conn, mek, m, { from, args, reply, isCreator }) => {
    try {
        if (!isCreator) return reply("❌ This command is only for owner!");

        if (!args[0]) {
            const isEnabled = await getAntideleteStatus(from);
            const savedPath = await getAntiDelPath();
            const status = isEnabled ? '✅ ON' : '❌ OFF';
            const destPath = savedPath === 'inbox' ? '📥 Bot Inbox' : '💬 Same Chat';

            return reply(`╭────⬡ Ali Md mini bot ⬡────
├🛡️ *ANTI-DELETE STATUS (this chat)*
├──────────────────
├📌 *Status:* ${status}
├📌 *Destination:* ${destPath}
├──────────────────
├📝 *Usage:*
├• .antidel on   - Enable for this chat
├• .antidel off  - Disable for this chat
├• .antidel path - Change destination (global)
╰────────────────────

> Power by Ali Md mini bot`);
        }

        const option = args[0].toLowerCase();

        if (option === 'on') {
            await setAntideleteStatus(from, true);
            const savedPath = await getAntiDelPath();
            return reply(`✅ *Anti-Delete ENABLED for this chat*\n\nDeleted messages will be sent to ${savedPath === 'inbox' ? 'your inbox' : 'this same chat'}.`);
        }
        else if (option === 'off') {
            await setAntideleteStatus(from, false);
            return reply(`❌ *Anti-Delete DISABLED for this chat*`);
        }
        else if (option === 'path' || option === 'destination') {
            if (!args[1]) {
                const savedPath = await getAntiDelPath();
                return reply(`╭────⬡ Ali Md mini bot ⬡────
├📌 *Current Destination:* ${savedPath}
├──────────────────
├📝 *Change destination:*
├• .antidel path inbox - Send to your DM
├• .antidel path same  - Send to same chat
╰────────────────────`);
            }

            const destArg = args[1].toLowerCase();
            if (destArg === 'inbox') {
                await setAntiDelPath('inbox'); // ✅ ab DB mein save hota hai, restart-proof
                return reply(`✅ *Destination changed to INBOX*\n\nDeleted messages will be sent to your DM.`);
            }
            else if (destArg === 'same') {
                await setAntiDelPath('same');
                return reply(`✅ *Destination changed to SAME CHAT*\n\nDeleted messages will be resent in the same chat.`);
            }
            else {
                return reply(`❌ Invalid destination! Use "inbox" or "same".`);
            }
        }
        else {
            return reply(`❌ Invalid option! Use .antidel on/off/path`);
        }
    } catch (e) {
        console.error(e);
        reply(`❌ Error: ${e.message}`);
    }
});

module.exports = {
    handleDeletedMessage,
    getStoredMessage,
    storeMessageForAntiDelete,
    messageStore
};
