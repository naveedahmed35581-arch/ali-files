const { cmd } = require('../command');
const axios = require('axios');

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    'okhttp/4.9.3'
];

async function fetchWithRetry(url, maxRetries = 3, timeout = 15000) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const userAgent = USER_AGENTS[(attempt - 1) % USER_AGENTS.length];
            const response = await axios.get(url, {
                timeout,
                headers: { 'User-Agent': userAgent }
            });
            return response;
        } catch (err) {
            lastError = err;
            if (attempt === maxRetries) break;
            const delay = Math.pow(2, attempt - 1) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
}

cmd({
    pattern: "img",
    alias: ["googleimage", "image", "imagesearch"],
    desc: "🖼️ Search for images using Google (up to 10 results)",
    category: "media",
    react: "🔍",
    use: ".img <search term>",
    filename: __filename
}, async (conn, mek, m, { from, args, q, reply }) => {
    try {
        const query = q || args.join(' ');
        if (!query) {
            return reply(
                '❌ Please provide a search term.\n\n' +
                'Example: `.img cute cat`'
            );
        }

        const statusMsg = await conn.sendMessage(from, { text: `⏳ Searching Google Images for *${query}*...` }, { quoted: mek });
        const msgKey = statusMsg.key;

        const apiUrl = `https://api.princetechn.com/api/search/googleimage?apikey=prince&query=${encodeURIComponent(query)}`;

        let response;
        try {
            response = await fetchWithRetry(apiUrl, 3, 15000);
        } catch (err) {
            await conn.sendMessage(from, {
                text: `❌ Failed after multiple attempts. API may be down.`,
                edit: msgKey
            });
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return;
        }

        const data = response.data;

        if (!data || !data.success || !Array.isArray(data.results) || data.results.length === 0) {
            await conn.sendMessage(from, {
                text: `❌ No images found for *${query}*.`,
                edit: msgKey
            });
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return;
        }

        const imageUrls = data.results;
        const total = imageUrls.length;
        const maxResults = 10;
        const displayUrls = imageUrls.slice(0, maxResults);

        await conn.sendMessage(from, {
            text: `🖼️ Found *${total}* images. Sending first ${displayUrls.length}.`,
            edit: msgKey
        });

        let sentCount = 0;
        for (let i = 0; i < displayUrls.length; i++) {
            const url = displayUrls[i];
            try {
                const imgResp = await axios.get(url, {
                    responseType: 'arraybuffer',
                    timeout: 15000,
                    headers: { 'User-Agent': USER_AGENTS[0] }
                });
                const imgBuffer = Buffer.from(imgResp.data);

                await conn.sendMessage(from, {
                    image: imgBuffer,
                    caption: `🖼️ *Image ${i + 1}/${displayUrls.length}* for: ${query}`
                }, { quoted: mek });
                sentCount++;
            } catch (err) {
                console.log(`Failed to download ${url}:`, err.message);
            }
            await new Promise(resolve => setTimeout(resolve, 800));
        }

        if (sentCount === 0) {
            await conn.sendMessage(from, {
                text: `❌ Failed to download any images.`,
                edit: msgKey
            });
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        } else {
            await conn.sendMessage(from, {
                text: `✅ Sent ${sentCount} image${sentCount > 1 ? 's' : ''}.`,
                edit: msgKey
            });
            await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
        }
    } catch (error) {
        console.error('Image search error:', error);
        reply(`❌ Unexpected error: ${error.message}`);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
    }
});
