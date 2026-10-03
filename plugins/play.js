const { cmd } = require('../command')
const axios = require('axios')
const yts = require('yt-search')

cmd({
    pattern: "play",
    alias: ["song", "mp3"],
    desc: "Download YouTube Audio (MP3)",
    category: "download",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        if (!q) return reply(
`❌ *Please provide a song name or YouTube link*

Example:
.play alan walker faded
.play https://youtu.be/xxxxx`
        )

        await reply("⏳ *ꜱᴇᴀʀᴄʜɪɴɢ, ᴘʟᴇᴀꜱᴇ ᴡᴀɪᴛ...*")

        let videoUrl, thumbnail, ytTitle, duration, views, ago, channel

        // Check if YouTube link
        if (q.includes("youtu")) {
            videoUrl = q.trim()

            let search
            try {
                const id =
                    videoUrl.split("v=")[1]?.split("&")[0] ||
                    videoUrl.split("youtu.be/")[1]?.split("?")[0] ||
                    videoUrl.split("shorts/")[1]?.split("?")[0]

                search = await yts({ videoId: id || "" })
            } catch {}

            if (search?.videos?.length) {
                const v = search.videos[0]
                thumbnail = v.thumbnail
                ytTitle = v.title
                duration = v.timestamp
                views = v.views
                ago = v.ago
                channel = v.author.name
            } else {
                thumbnail = `https://img.youtube.com/vi/${videoUrl.split("v=")[1] || ""}/hqdefault.jpg`
                ytTitle = "Unknown Title"
                duration = "N/A"
                views = 0
                ago = "N/A"
                channel = "Unknown"
            }
        } else {
            const search = await yts(q)

            if (!search.videos.length)
                return reply("❌ *No song found!*")

            const v = search.videos[0]

            videoUrl = v.url
            thumbnail = v.thumbnail
            ytTitle = v.title
            duration = v.timestamp
            views = v.views
            ago = v.ago
            channel = v.author.name
        }

        await reply("⬇️ *ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ ᴀᴜᴅɪᴏ, ᴘʟᴇᴀꜱᴇ ᴡᴀɪᴛ...*")

        // MP3 API
        const api = `https://adeel-xtech-apis.vercel.app/api/ytmp3?url=${encodeURIComponent(videoUrl)}`
        const { data } = await axios.get(api, {
            timeout: 120000
        })

        if (!data.status || !data.result?.audio_download) {
            return reply("❌ *Failed to fetch audio!*")
        }

        const audioUrl = data.result.audio_download

        const caption = `*╭┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉━┈᛭*
*┇•* 🎵 *Ali Md mini bot ᴍᴘ𝟹 ᴅʟ*
*┇•* ℹ️ *ᴛɪᴛʟᴇ:* ${ytTitle}
*┇•* ⏳ *ᴅᴜʀᴀᴛɪᴏɴ:* ${duration}
*┇•* 👁️ *ᴠɪᴇᴡs:* ${(views || 0).toLocaleString()}
*┇•* 📆 *ᴜᴘʟᴏᴀᴅᴇᴅ:* ${ago}
*┇•* 📡 *ᴄʜᴀɴɴᴇʟ:* ${channel}
*╰┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉━┈᛭*`

        // Thumbnail + Info
        await conn.sendMessage(from, {
            image: { url: thumbnail },
            caption: caption
        }, { quoted: mek })

        // Audio Send
        await conn.sendMessage(from, {
            audio: { url: audioUrl },
            mimetype: "audio/mpeg",
            fileName: `${ytTitle}.mp3`,
            ptt: false
        }, { quoted: mek })

    } catch (err) {
        console.error("PLAY CMD ERROR:", err)
        reply("❌ *An error occurred while downloading audio!*")
    }
})
