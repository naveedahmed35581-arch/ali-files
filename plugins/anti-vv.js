const { cmd } = require("../command");
const config = require('../config');

// Define the exact keywords to check for (only these three)
const positiveKeywords = ["nice", "good", "cute", "🌝", "🥵", "💋", "👍", "🌚", "wow", "😩", "super"];

// No prefix keyword handler for view once messages (owner only)
cmd({
  'on': "body"
}, async (client, message, store, {
  from,
  body,
  isCreator,
  reply,
  sender,
  userConfig
}) => {
  try {
    // Only allow the bot owner/creator
    if (!isCreator) {
      return;
    }

    const messageText = body.trim().toLowerCase();
    const hasExactKeywordOnly = positiveKeywords.includes(messageText);

    if (hasExactKeywordOnly && message.quoted?.viewOnce) {
      const buffer = await message.quoted.download();
      const mtype = message.quoted.mtype;
      const originalCaption = message.quoted.text || '';
      const options = { quoted: message };

      const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "";

      let messageContent = {};
      switch (mtype) {
        case "imageMessage":
          messageContent = {
            image: buffer,
            caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : (DESCRIPTION ? `> ${DESCRIPTION}` : ""),
            mimetype: message.quoted.mimetype || "image/jpeg"
          };
          break;
        case "videoMessage":
          messageContent = {
            video: buffer,
            caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : (DESCRIPTION ? `> ${DESCRIPTION}` : ""),
            mimetype: message.quoted.mimetype || "video/mp4"
          };
          break;
        case "audioMessage":
          messageContent = {
            audio: buffer,
            mimetype: "audio/mp4",
            ptt: message.quoted.ptt || false
          };
          break;
        default:
          return;
      }

      await client.sendMessage(message.sender, messageContent, options);
    }
  } catch (error) {
    console.error("View Once Keyword Error:", error);
  }
});

// Command handler for manual retrieval of view once messages (owner only)
// ✅ FIX: signature ab (client, message, m, ctx) hai — bot.js jo actually bhejta hai usse match karta hai
cmd({
  pattern: "vv3",
  react: '🐳',
  desc: "Retrieve view once messages (Owner Only)",
  category: "owner",
  filename: __filename
}, async (client, message, m, {
  from,
  isCreator,
  userConfig
}) => {
  try {
    // Only allow the bot owner/creator
    if (!isCreator) {
      return;
    }

    // ✅ FIX: match.quoted ki jagah m.quoted use kro (m already sms() se parsed hai, quoted data isme maujood hai)
    if (!m.quoted) {
      return await client.sendMessage(from, {
        text: "*🍁 Please reply to a view once message!*"
      }, { quoted: message });
    }

    if (!m.quoted.viewOnce) {
      return await client.sendMessage(from, {
        text: "*❌ Please reply to a view once message!*"
      }, { quoted: message });
    }

    const buffer = await m.quoted.download();
    const mtype = m.quoted.mtype;
    const originalCaption = m.quoted.text || '';
    const options = { quoted: message };

    const DESCRIPTION = userConfig?.DESCRIPTION || config.DESCRIPTION || "";

    let messageContent = {};
    switch (mtype) {
      case "imageMessage":
        messageContent = {
          image: buffer,
          caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : (DESCRIPTION ? `> ${DESCRIPTION}` : ""),
          mimetype: m.quoted.mimetype || "image/jpeg"
        };
        break;
      case "videoMessage":
        messageContent = {
          video: buffer,
          caption: originalCaption ? `${originalCaption}\n\n> ${DESCRIPTION}` : (DESCRIPTION ? `> ${DESCRIPTION}` : ""),
          mimetype: m.quoted.mimetype || "video/mp4"
        };
        break;
      case "audioMessage":
        messageContent = {
          audio: buffer,
          mimetype: "audio/mp4",
          ptt: m.quoted.ptt || false
        };
        break;
      default:
        return await client.sendMessage(from, {
          text: "❌ Only image, video, and audio view once messages are supported"
        }, { quoted: message });
    }

    await client.sendMessage(from, messageContent, options);
  } catch (error) {
    console.error("vv Error:", error);
    await client.sendMessage(from, {
      text: "❌ Error retrieving view once message:\n" + error.message
    }, { quoted: message });
  }
});
