const { cmd } = require('../command')
const config = require('../config')
const moment = require('moment-timezone')

cmd({
    pattern: "ping",
    alias: ["latency", "speed", "pong"],
    desc: "Check bot latency and response time",
    category: "general",
    react: "🚀",
    filename: __filename
}, async (conn, mek, m, { from, reply, sender }) => {
    try {
        const startPing = Date.now()

        await conn.sendMessage(from, {
            react: {
                text: "⏳",
                key: mek.key
            }
        })

        const latency = Date.now() - startPing

        const currentTime = moment().tz("Asia/Karachi").format("HH:mm:ss")
        const currentDate = moment().tz("Asia/Karachi").format("dddd, MMMM Do YYYY")

        const memoryUsage = process.memoryUsage()
        const memUsed = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2)
        const memTotal = (memoryUsage.heapTotal / 1024 / 1024).toFixed(2)

        const caption = 
`*╭┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉━┈᛭*
*┇•* 🏓 *Ali - xᴅ ᴘɪɴɢ*
*┇•* 👤 *ᴜꜱᴇʀ: @${sender.split('@')[0]}*
*┇•* ⏱️ *ʟᴀᴛᴇɴᴄʏ: ${latency}ᴍꜱ*
*┇•* 📡 *ꜱᴛᴀᴛᴜꜱ: ${
    latency < 100 ? '🟢 ᴇxᴄᴇʟʟᴇɴᴛ' :
    latency < 300 ? '🟡 ɢᴏᴏᴅ' :
    '🔴 ꜱʟᴏᴡ'
}*
*┇•* 🕒 *ᴛɪᴍᴇ: ${currentTime}*
*┇•* 📅 *ᴅᴀᴛᴇ: ${currentDate}*
*┇•* 💾 *ᴍᴇᴍᴏʀʏ: ${memUsed}ᴍʙ / ${memTotal}ᴍʙ*
*┇•* ✅ *ʙᴏᴛ: ᴀᴄᴛɪᴠᴇ & ʀᴜɴɴɪɴɢ*
*╰┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉━┈᛭*

> _ᴘᴏᴡᴇʀᴇᴅ ʙʏ Qᴀᴅᴇᴇʀ - xᴅ_`

        await conn.sendMessage(from, {
            text: caption,
            mentions: [sender]
        }, { quoted: mek })

        await conn.sendMessage(from, {
            react: {
                text: latency < 100 ? "🟢" : latency < 300 ? "🟡" : "🔴",
                key: mek.key
            }
        })

    } catch (err) {
        console.error(err)
        reply("❌ *An error occurred while checking ping*")
    }
})
