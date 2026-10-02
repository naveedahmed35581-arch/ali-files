const { cmd } = require('../command')
const axios = require('axios')
const yts = require('yt-search')

cmd({
    pattern: "video",
    alias: ["yt", "ytmp4"],
    desc: "Download YouTube video (MP4)",
    category: "download",
    react: "🎥",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        if (!q) return reply(
`❌ *Please provide a video name or YouTube link*
Example:
.video alan walker faded
.video https://youtu.be/xxx`)

        await reply("⏳ *ꜱᴇᴀʀᴄʜɪɴɢ, ᴘʟᴇᴀꜱᴇ ᴡᴀɪᴛ...*")

        // Search or direct link
        let videoUrl, thumbnail, ytTitle, duration, views, ago, channel

        if (q.includes('youtu')) {
            videoUrl = q.trim()
            const vidId = videoUrl.split('v=')[1]?.split('&')[0] ||
                          videoUrl.split('youtu.be/')[1]?.split('?')[0] ||
                          videoUrl.split('shorts/')[1]?.split('?')[0]
            const search = await yts({ videoId: vidId || '' })
            if (search?.videos?.length) {
                const v = search.videos[0]
                thumbnail = v.thumbnail
                ytTitle = v.title
                duration = v.timestamp
                views = v.views
                ago = v.ago
                channel = v.author.name
            }
        } else {
            const search = await yts(q)
            if (!search.videos?.length) return reply("❌ *No results found*")
            const v = search.videos[0]
            videoUrl = v.url
            thumbnail = v.thumbnail
            ytTitle = v.title
            duration = v.timestamp
            views = v.views
            ago = v.ago
            channel = v.author.name
        }

        await reply("⬇️ *ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ, ᴘʟᴇᴀꜱᴇ ᴡᴀɪᴛ...*")

        // API call
        const api = `https://arslan-apis-v2.vercel.app/download/ytmp4?url=${encodeURIComponent(videoUrl)}`
        const res = await axios.get(api, { timeout: 120000 })

        if (!res.data?.status || !res.data?.result?.download?.url) {
            return reply("❌ *Failed to fetch video*")
        }

        const { title, quality } = res.data.result.metadata
        const { url: downloadUrl } = res.data.result.download

        const infoCaption =
`*╭┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉━┈᛭*
*┇•* 🎥 *Ali - xᴅ ᴠɪᴅᴇᴏ ᴅʟ*
*┇•* ℹ️ *ᴛɪᴛʟᴇ: ${title || ytTitle}*
*┇•* ⌛ *ᴅᴜʀᴀᴛɪᴏɴ: ${duration || 'N/A'}*
*┇•* 👁️ *ᴠɪᴇᴡs: ${views?.toLocaleString() || 'N/A'}*
*┇•* 📆 *ᴜᴘʟᴏᴀᴅᴇᴅ: ${ago || 'N/A'}*
*┇•* 📡 *ᴄʜᴀɴɴᴇʟ: ${channel || 'N/A'}*
*┇•* 🎞️ *ǫᴜᴀʟɪᴛʏ: ${quality || '720p'}*
*╰┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉┉━┈᛭*`

        // Thumbnail + info pehle
        await conn.sendMessage(from, {
            image: { url: thumbnail },
            caption: infoCaption
        }, { quoted: mek })

        // Video send
        await conn.sendMessage(from, {
            video: { url: downloadUrl },
            mimetype: 'video/mp4',
            caption:
`
*╭┉┉┉┉┉┉┉┉┉┉┉┉┉┉━┈᛭*
*┇•* *_ᴘᴏᴡᴇʀᴇᴅ ʙʏ Ali xᴅ_*
*╰┉┉┉┉┉┉┉┉┉┉┉┉┉┉━┈᛭*`
        }, { quoted: mek })

    } catch (err) {
        console.error(err)
        reply("❌ *An error occurred while downloading video*")
    }
})
