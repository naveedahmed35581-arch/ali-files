// === commands/gali.js ===
const axios = require("axios");
const { cmd } = require("../command");

cmd({
    pattern: "gali",
    alias: ["insult", "gaali"],
    desc: "Send random insults to someone",
    category: "fun",
    react: "🤬",
    filename: __filename
}, async (conn, m, store, { from, reply, q, sender, isGroup }) => {
    try {
        // Group only
        if (!isGroup) {
            return reply("❌ This command only works in groups!");
        }

        // Target user (mention / reply / text)
        let target = m.mentionedJid?.[0] || m.quoted?.sender || null;
        let name = q ? q.trim().toLowerCase() : '';

        if (!target && !name) {
            return reply(`📌 *Usage:*\n.gali @user\n.gali name\n\n💡 *Example:*\n.gali @john\n.gali stupid`);
        }

        // Blocked names — inke against gali nahi hogi
        let blocked = ['silver', 'talha', 'ashir', 'zaman', 'haji zaman'];

        if (blocked.includes(name)) {
            let blockedReplies = [
                `${name.toUpperCase()} *_Tari maa ka sath soya tha? Laudy_*`,
                `${name.toUpperCase()} *_Tari amma ka yaar ha...?_*`
            ];
            let randomBlocked = blockedReplies[Math.floor(Math.random() * blockedReplies.length)];
            return reply(randomBlocked);
        }

        // Gali list
        let galis = [
            `${q || '@' + target?.split('@')[0]} - *_teri mkc bc laudy gando bsdk bkl 💀 (3 baar)_*`,
            `${q || '@' + target?.split('@')[0]} - *_salay tata madarchod randwe gando mkc Tari 🤡 (2 baar)_*`,
            `${q || '@' + target?.split('@')[0]} - *_bkl habshi ki paidaawar barhwy mkc tari😈 (4 baar)_*`,
            `${q || '@' + target?.split('@')[0]} *_Teri MKC Randi K Bachy (7 baar)🤡🚮_*`,
            `${q || '@' + target?.split('@')[0]} *_Idher a Teri Mama K Oper Charh kr Dance krun🤡🥹_*`,
            `${q || '@' + target?.split('@')[0]} *_Hi YATEEM TATTY Idher A Lun pr Beth kr Jholly kha_*`,
            `${q || '@' + target?.split('@')[0]} *_Teri Ama Dy Akha Vch Akha Paa k Ondy Mou Vch Lul🤡🚮_*`,
            `${q || '@' + target?.split('@')[0]} *_Idher A O Pooli Bondd Aliya🥸🤡_*`
        ];

        let randomGali = galis[Math.floor(Math.random() * galis.length)];

        // Send with mention
        if (target) {
            await conn.sendMessage(from, {
                text: randomGali,
                mentions: [target]
            }, { quoted: m });
        } else {
            reply(randomGali);
        }

    } catch (error) {
        console.error("Gali command error:", error);
        reply("⚠️ Error: " + error.message);
    }
});
