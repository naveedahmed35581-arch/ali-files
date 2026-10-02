// Credits ALIXTECH

const config = require('../config');
const { getGroupSettings } = require('../data/groupSettings');

const ppUrls = [
    'https://i.ibb.co/PvCxgJjh/491f2cf33ce1.jpg',
];

function isGroupJid(jid) {
    return typeof jid === 'string' && jid.endsWith('@g.us');
}

const GroupEvents = async (conn, update) => {
    try {
        if (!update || !update.id) return;
        if (!isGroupJid(update.id)) return;

        // ✅ FIX: ab settings.welcome/goodbye hamesha proper boolean hote hain
        // (never undefined) — koi tri-state ambiguity nahi
        const settings = await getGroupSettings(update.id);
        const welcomeOn = !!settings.welcome;
        const goodbyeOn = !!settings.goodbye;
        const adminActionOn = config.ADMIN_ACTION === 'true';

        if (!welcomeOn && !goodbyeOn && !adminActionOn) return;

        const metadata = await conn.groupMetadata(update.id);
        const participants = Array.isArray(update.participants) ? update.participants : [];
        const desc = metadata.desc || "No Description";
        const groupMembersCount = metadata.participants?.length || 0;

        let ppUrl;
        try {
            ppUrl = await conn.profilePictureUrl(update.id, 'image');
        } catch {
            ppUrl = ppUrls[Math.floor(Math.random() * ppUrls.length)];
        }

        for (let num of participants) {
            const userJid = String(num);
            const userName = userJid.split("@")[0];
            const timestamp = new Date().toLocaleString();

            if (update.action === "add" && welcomeOn) {
                const caption = config.WELCOME_MSG
                    ? config.WELCOME_MSG
                        .replace(/{user}/g, `@${userName}`)
                        .replace(/{group}/g, metadata.subject)
                        .replace(/{desc}/g, desc)
                        .replace(/{count}/g, groupMembersCount)
                    : `*╭ׂ┄─ׅ─ׂ┄─ׂ┄─ׅ─ׂ┄─ׂ┄─ׅ─ׂ┄──*\n` +
`*│  ̇─̣─̇─̣〘 ωєℓ¢σмє 〙̣─̇─̣─̇*\n` +
`*├┅┅┅┅┈┈┈┈┈┈┈┈┈┅┅┅◆*\n` +
`*│❀ нєу* @${userName}\n` +
`*│❀ gʀσᴜᴘ* ${metadata.subject}\n` +
`*├┅┅┅┅┈┈┈┈┈┈┈┈┈┅┅┅◆*\n` +
`*│● ѕтαу ѕαfє αɴ∂ fσℓℓσω*\n` +
`*│● тнє gʀσυᴘѕ ʀᴜℓєѕ!*\n` +
`*│● ᴊσιɴє∂ ${groupMembersCount}*\n` +
`*│● ᴘᴏᴡᴇʀ ʙʏ ᴀʟɪ x ᴍᴅ*\n` +
`*╰┉┉┉┉┈┈┈┈┈┈┈┈┉┉┉᛫᛭*\n` +
`${desc}`;

                try {
                    await conn.sendMessage(update.id, {
                        image: { url: config.WELCOME_IMAGE || ppUrl },
                        caption,
                        mentions: [userJid]
                    });
                } catch (e) {
                    console.error('Welcome send error:', e.message);
                }

            } else if (update.action === "remove" && goodbyeOn) {
                const caption = config.GOODBYE_MSG
                    ? config.GOODBYE_MSG
                        .replace(/{user}/g, `@${userName}`)
                        .replace(/{group}/g, metadata.subject)
                        .replace(/{count}/g, groupMembersCount)
                    : `╭*╭ׂ┄─ׅ─ׂ┄─ׂ┄─ׅ─ׂ┄─ׂ┄─ׅ─ׂ┄──*\n` +
`*│  ̇─̣─̇─̣〘 gσσ∂вує 〙̣─̇─̣─̇*\n` +
`*├┅┅┅┅┈┈┈┈┈┈┈┈┈┅┅┅◆*\n` +
`*│❀ ᴜѕєʀ* @${userName}\n` +
`*│● мємвєʀ ʟєfт тнє gʀσᴜᴘ*\n` +
`*│● мємвєʀs ${groupMembersCount}*\n` +
`*│● ©ᴘᴏᴡᴇʀ ʙʏ ᴀʟɪ x ᴍᴅ*\n` +
`*╰┉┉┉┉┈┈┈┈┈┈┈┈┉┉┉᛫᛭*`;

                try {
                    await conn.sendMessage(update.id, {
                        image: { url: config.GOODBYE_IMAGE || ppUrl },
                        caption,
                        mentions: [userJid]
                    });
                } catch (e) {
                    console.error('Goodbye send error:', e.message);
                }

            } else if (update.action === "demote" && adminActionOn) {
                const demoter = update.author ? String(update.author).split("@")[0] : "Unknown";
                try {
                    await conn.sendMessage(update.id, {
                        text: `*╭────⬡ αᴄтισɴ-ѕтαтᴜs ⬡────*\n` +
`*├▢ @${demoter} нαѕ ∂ємσтє∂*\n` +
`*├▢ @${userName} fʀσм α∂мιɴ*\n` +
`*├▢ тιмє : ${timestamp}*\n` +
`*├▢ gʀσᴜᴘ : ${metadata.subject}*\n` +
`*╰────────────────────*`,
                        mentions: [update.author, userJid].filter(Boolean)
                    });
                } catch (e) {}

            } else if (update.action === "promote" && adminActionOn) {
                const promoter = update.author ? String(update.author).split("@")[0] : "Unknown";
                try {
                    await conn.sendMessage(update.id, {
                        text: `*╭────⬡ αᴄтισɴ-ѕтαтᴜs ⬡────*\n` +
`*├▢ @${promoter} нαѕ ᴘʀσмσтє∂*\n` +
`*├▢ @${userName} тσ α∂мιɴ*\n` +
`*├▢ тιмє : ${timestamp}*\n` +
`*├▢ gʀσᴜᴘ : ${metadata.subject}*\n` +
`*╰────────────────────*`,
                        mentions: [update.author, userJid].filter(Boolean)
                    });
                } catch (e) {}
            }
        }

    } catch (err) {
        console.error('Group event error:', err);
    }
};

module.exports = GroupEvents;
