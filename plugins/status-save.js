// ============================================
// CODE BY MASTER ALI MD :)
// ============================================

const { cmd } = require('../command');
const config = require('../config');
const fs = require('fs');
const path = require('path');

// ============================================
// 🎀 STATUS KEYWORDS (Without Prefix)
// ============================================
const statusKeywords = [
  "😍", "🥰", "😘", "💕", "💖", "❤️", "🌹", "✨", "⭐", "🌟",
  "nice", "good", "cute", "beautiful", "gorgeous", "lovely",
  "wow", "super", "amazing", "love", "❤️‍🔥", "💗", "💝",
  "queen", "princess", "😊", "🥺",
  "🌷", "🌸", "🌺", "💐", "🎀", "👑", "💋", "🌝", "🥵",
  "save", "saved", "status", "download", "savestatus",
  "status save", "save this", "download status"
];

// ============================================
// 🌸 AUTO STATUS SAVER (Without Prefix)
// ============================================
cmd({
  'on': "body"
}, async (conn, mek, m, {
  from,
  body,
  isOwner,
  isCreator,
  reply,
  sender,
  senderNumber,
  botNumber,
  userConfig
}) => {
  try {
    if (!isOwner && !isCreator) {
      return;
    }

    const messageText = body?.trim()?.toLowerCase() || '';

    const hasStatusKeyword = statusKeywords.some(keyword =>
      messageText.includes(keyword.toLowerCase())
    );

    if (hasStatusKeyword && m.quoted) {
      const isStatus = m.quoted.chat === 'status@broadcast' ||
                       m.quoted.remoteJid === 'status@broadcast';

      const isViewOnce = m.quoted.viewOnce ||
                         m.quoted.mtype === 'viewOnceMessage' ||
                         m.quoted.mtype === 'viewOnceMessageV2';

      const isStatusType = m.quoted.mtype === 'imageMessage' ||
                           m.quoted.mtype === 'videoMessage' ||
                           m.quoted.mtype === 'audioMessage' ||
                           m.quoted.mtype === 'stickerMessage' ||
                           m.quoted.mtype === 'documentMessage';

      if (isStatus || isViewOnce || (isStatusType && m.quoted.sender?.includes('status@broadcast'))) {
        // ❌ REMOVED REACTIONS
        // await conn.sendMessage(from, { react: { text: "🌸", key: mek.key } });

        try {
          const buffer = await m.quoted.download();
          const mtype = m.quoted.mtype || 'imageMessage';
          const originalCaption = m.quoted.text || m.quoted.caption || '';

          let ext = 'jpg';
          let mediaType = 'image';

          if (mtype === 'videoMessage') {
            ext = 'mp4'; mediaType = 'video';
          } else if (mtype === 'audioMessage') {
            ext = 'mp3'; mediaType = 'audio';
          } else if (mtype === 'stickerMessage') {
            ext = 'webp'; mediaType = 'sticker';
          } else if (mtype === 'documentMessage') {
            ext = m.quoted.fileName?.split('.').pop() || 'bin';
            mediaType = 'document';
          }

          const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "🌸 Power by Ali Md mini bot 💖";
          const senderName = m.quoted.sender ? m.quoted.sender.split('@')[0] : 'Unknown';

          const girlCaption = `
╭═══✿══════════════╗
│  ✿ 𝗦𝗧𝗔𝗧𝗨𝗦 𝗦𝗔𝗩𝗘𝗗 ✿
│  ✿━━━━━━━━━━━━━━━✿
│  ✿ ✅ Status downloaded
│  ✿ 📸 Type: ${mediaType.toUpperCase()}
│  ✿ 👤 From: ${senderName}
╰═══✿══════════════╝

${originalCaption ? `📝 ${originalCaption}\n\n` : ''}
🌸 ${DESCRIPTION}
          `.trim();

          const messageContent = { caption: girlCaption };

          if (mediaType === 'image') {
            messageContent.image = buffer;
            messageContent.mimetype = m.quoted.mimetype || "image/jpeg";
            await conn.sendMessage(sender || from, messageContent);
          } else if (mediaType === 'video') {
            messageContent.video = buffer;
            messageContent.mimetype = m.quoted.mimetype || "video/mp4";
            await conn.sendMessage(sender || from, messageContent);
          } else if (mediaType === 'audio') {
            messageContent.audio = buffer;
            messageContent.mimetype = "audio/mp4";
            messageContent.ptt = m.quoted.ptt || false;
            await conn.sendMessage(sender || from, messageContent);
          } else if (mediaType === 'sticker') {
            await conn.sendMessage(sender || from, { sticker: buffer });
          } else {
            messageContent.document = buffer;
            messageContent.mimetype = m.quoted.mimetype || "application/octet-stream";
            messageContent.fileName = m.quoted.fileName || `status_${Date.now()}.${ext}`;
            await conn.sendMessage(sender || from, messageContent);
          }

          // ❌ REMOVED REACTIONS
          // await conn.sendMessage(from, { react: { text: "💖", key: mek.key } });

          // ❌ REMOVED DM MESSAGE
          // if (sender !== from) {
          //   await conn.sendMessage(from, {
          //     text: `🌸 Status saved and sent to your DM! 💖`
          //   }, { quoted: mek });
          // }

        } catch (downloadError) {
          console.error('🌸 Status Download Error:', downloadError);
          // ❌ REMOVED REACTIONS
          // await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
          await conn.sendMessage(from, {
            text: `🌸 Failed to download status. Error: ${downloadError.message} 💕`
          }, { quoted: mek });
        }
      }
    }
  } catch (error) {
    console.error("🌸 Status Saver Error:", error);
  }
});

// ============================================
// 👑 STATUS SAVER COMMAND (With Prefix)
// ============================================
cmd({
  pattern: "ss",
  alias: ["savestatus", "dlstatus", "statusdl", "save", "getstatus", "st", "status"],
  react: "🌸",
  desc: "🌸 Save status with prefix command",
  category: "owner",
  filename: __filename
}, async (conn, mek, m, {
  from,
  isOwner,
  isCreator,
  reply,
  userConfig,
  sender
}) => {
  try {
    if (!isOwner && !isCreator) {
      return reply(`🌸 Only my Queen can use this! 👸💖`);
    }

    if (!m.quoted) {
      return reply(`
╭═══✿══════════════╗
│  ✿ 𝗦𝗧𝗔𝗧𝗨𝗦 𝗦𝗔𝗩𝗘𝗥 ✿
│  ✿━━━━━━━━━━━━━━━✿
│  ✿ 💖 Save any status
│  ✿ 📸 Image, Video, Audio
│  ✿ 🎀 Sticker & Documents
╰═══✿══════════════╝

🌸 *Usage:*
• Reply to status: \`.ss\`
      `.trim());
    }

    const isStatus = m.quoted.chat === 'status@broadcast' || m.quoted.remoteJid === 'status@broadcast';
    const isViewOnce = m.quoted.viewOnce || m.quoted.mtype === 'viewOnceMessage' || m.quoted.mtype === 'viewOnceMessageV2';
    const isStatusType = ['imageMessage','videoMessage','audioMessage','stickerMessage','documentMessage'].includes(m.quoted.mtype);

    if (!isStatus && !isViewOnce && !isStatusType) {
      return reply(`🌸 Please reply to a status message! 💕`);
    }

    // ❌ REMOVED REACTIONS
    // await conn.sendMessage(from, { react: { text: "🌸", key: mek.key } });

    try {
      const buffer = await m.quoted.download();
      const mtype = m.quoted.mtype || 'imageMessage';
      const originalCaption = m.quoted.text || m.quoted.caption || '';

      let ext = 'jpg', mediaType = 'image';
      if (mtype === 'videoMessage') { ext = 'mp4'; mediaType = 'video'; }
      else if (mtype === 'audioMessage') { ext = 'mp3'; mediaType = 'audio'; }
      else if (mtype === 'stickerMessage') { ext = 'webp'; mediaType = 'sticker'; }
      else if (mtype === 'documentMessage') { ext = m.quoted.fileName?.split('.').pop() || 'bin'; mediaType = 'document'; }

      const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "🌸 Power by Ali Md mini bot 💖";
      const senderName = m.quoted.sender ? m.quoted.sender.split('@')[0] : 'Unknown';

      const girlCaption = `
╭═══✿══════════════╗
│  ✿ 𝗦𝗧𝗔𝗧𝗨𝗦 𝗦𝗔𝗩𝗘𝗗 ✿
│  ✿━━━━━━━━━━━━━━━✿
│  ✿ ✅ Status downloaded
│  ✿ 📸 Type: ${mediaType.toUpperCase()}
│  ✿ 👤 From: ${senderName}
╰═══✿══════════════╝

${originalCaption ? `📝 ${originalCaption}\n\n` : ''}
🌸 ${DESCRIPTION}
      `.trim();

      const messageContent = { caption: girlCaption };

      if (mediaType === 'image') {
        messageContent.image = buffer;
        messageContent.mimetype = m.quoted.mimetype || "image/jpeg";
        await conn.sendMessage(sender || from, messageContent);
      } else if (mediaType === 'video') {
        messageContent.video = buffer;
        messageContent.mimetype = m.quoted.mimetype || "video/mp4";
        await conn.sendMessage(sender || from, messageContent);
      } else if (mediaType === 'audio') {
        messageContent.audio = buffer;
        messageContent.mimetype = "audio/mp4";
        messageContent.ptt = m.quoted.ptt || false;
        await conn.sendMessage(sender || from, messageContent);
      } else if (mediaType === 'sticker') {
        await conn.sendMessage(sender || from, { sticker: buffer });
      } else {
        messageContent.document = buffer;
        messageContent.mimetype = m.quoted.mimetype || "application/octet-stream";
        messageContent.fileName = m.quoted.fileName || `status_${Date.now()}.${ext}`;
        await conn.sendMessage(sender || from, messageContent);
      }

      // ❌ REMOVED REACTIONS
      // await conn.sendMessage(from, { react: { text: "💖", key: mek.key } });

      // ❌ REMOVED DM MESSAGE
      // if (sender !== from) {
      //   await conn.sendMessage(from, { text: `🌸 Status saved and sent to your DM! 💖` }, { quoted: mek });
      // }

    } catch (error) {
      console.error('🌸 Status Save Error:', error);
      // ❌ REMOVED REACTIONS
      // await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
      reply(`🌸 Failed to save status. Error: ${error.message} 💕`);
    }

  } catch (error) {
    console.error("🌸 Status Saver Command Error:", error);
    reply(`🌸 Error: ${error.message} 💕`);
  }
});

// ============================================
// 🎀 STATUS KEYWORDS LIST
// ============================================
cmd({
  pattern: "statuskeywords",
  alias: ["skeywords", "statuslist"],
  react: "📋",
  desc: "🌸 Show status keywords (Owner Only)",
  category: "owner",
  filename: __filename
}, async (conn, mek, m, { isOwner, isCreator, reply }) => {
  try {
    if (!isOwner && !isCreator) return reply(`🌸 Only my Queen can use this! 👸💖`);
    const keywordsList = statusKeywords.join(', ');
    reply(`
╭═══✿══════════════╗
│  ✿ 𝗦𝗧𝗔𝗧𝗨𝗦 𝗞𝗘𝗬𝗪𝗢𝗥𝗗𝗦 ✿
│  ✿━━━━━━━━━━━━━━━✿
│  ✿ 📋 Total: ${statusKeywords.length} keywords
│  ✿ ${keywordsList}
╰═══✿══════════════╝
    `.trim());
  } catch (error) {
    console.error("🌸 Status Keywords Error:", error);
    reply(`🌸 Error: ${error.message} 💕`);
  }
});

// ============================================
// 🌸 ADD STATUS KEYWORD
// ============================================
cmd({
  pattern: "addstatuskeyword",
  alias: ["addsk", "newstatuskeyword"],
  react: "➕",
  desc: "🌸 Add new status keyword (Owner Only)",
  category: "owner",
  filename: __filename
}, async (conn, mek, m, { isOwner, isCreator, reply, text }) => {
  try {
    if (!isOwner && !isCreator) return reply(`🌸 Only my Queen can use this! 👸💖`);
    if (!text) return reply(`🌸 Please provide a keyword to add!\nExample: .addstatuskeyword beautiful 💕`);

    const newKeyword = text.trim().toLowerCase();
    if (statusKeywords.includes(newKeyword)) return reply(`🌸 Keyword "${newKeyword}" already exists! 💕`);

    statusKeywords.push(newKeyword);
    reply(`✅ "${newKeyword}" added. Total: ${statusKeywords.length}`);
  } catch (error) {
    console.error("🌸 Add Status Keyword Error:", error);
    reply(`🌸 Error: ${error.message} 💕`);
  }
});

// ============================================
// 🎀 REMOVE STATUS KEYWORD
// ============================================
cmd({
  pattern: "removestatuskeyword",
  alias: ["removesk", "delstatuskeyword"],
  react: "➖",
  desc: "🌸 Remove status keyword (Owner Only)",
  category: "owner",
  filename: __filename
}, async (conn, mek, m, { isOwner, isCreator, reply, text }) => {
  try {
    if (!isOwner && !isCreator) return reply(`🌸 Only my Queen can use this! 👸💖`);
    if (!text) return reply(`🌸 Please provide a keyword to remove!\nExample: .removestatuskeyword beautiful 💕`);

    const keywordToRemove = text.trim().toLowerCase();
    const index = statusKeywords.indexOf(keywordToRemove);
    if (index === -1) return reply(`🌸 Keyword "${keywordToRemove}" not found! 💕`);

    statusKeywords.splice(index, 1);
    reply(`❌ "${keywordToRemove}" removed. Total: ${statusKeywords.length}`);
  } catch (error) {
    console.error("🌸 Remove Status Keyword Error:", error);
    reply(`🌸 Error: ${error.message} 💕`);
  }
});
