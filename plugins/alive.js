const { cmd, commands } = require('../command');
const os = require("os");
const { runtime } = require('../lib/functions');
const config = require('../config');

cmd({
  pattern: "alive",
  alias: ["status", "live"],
  desc: "Check bot status",
  category: "main",
  react: "🤖",
  filename: __filename
},
async (conn, mek, m, { from, sender, reply }) => {
  try {
    const totalCmds = Array.isArray(commands) ? commands.length : 0;

    const uptime = () => {
      let sec = process.uptime();
      let h = Math.floor(sec / 3600);
      let mm = Math.floor((sec % 3600) / 60);
      let ss = Math.floor(sec % 60);
      return `${h}h ${mm}m ${ss}s`;
    };

    const status = `‎*╭┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉━┈⍟*
‎*┋*🌹 *_ʜɪ ᴊᴀɴɪᴍᴀɴ ᴍᴇɪɴ ᴀʟɪᴠᴇ ʜᴏ_* 
‎*┋┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉━•⟢*
‎*┋*🌏 *ᴘʟᴀᴛғᴏʀᴍ:* ʜᴇʀᴏᴋᴜ
‎*┋*📦 *ᴍᴏᴅᴇ:* ${config.MODE || 'private'}
‎*┋*🧑‍💻 *ᴏᴡɴᴇʀ:* ${config.OWNER_NAME || '𝐀ᴅᴇᴇʟ-𝐱-𝐐ᴀᴅᴇᴇʀ'} 
‎*┋*📝 *ᴘʀᴇғɪx:* ${config.PREFIX || '.'}
‎*┋*📁 *ᴄᴏᴍᴍᴀɴᴅs:* ${totalCmds} 
‎*┋*⏱️ *ʀᴜɴᴛɪᴍᴇ:* ${uptime()}
‎*╰┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉━┈⍟*`;

    // Send only the status message
    await conn.sendMessage(from, { 
      text: status,
      contextInfo: {
        mentionedJid: [sender],
        forwardingScore: 999,
        isForwarded: true
      }
    }, { quoted: mek });

  } catch (e) {
    console.error("Error in alive command:", e);
    reply(`❌ Error: ${e.message}`);
  }
});
