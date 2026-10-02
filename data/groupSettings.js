const mongoose = require('mongoose');
const config = require('../config');

const groupSettingsSchema = new mongoose.Schema({
    groupId: { type: String, required: true, unique: true },
    welcome: { type: Boolean, default: config.WELCOME_ENABLE === 'true' },
    goodbye: { type: Boolean, default: config.GOODBYE_ENABLE === 'true' }
});

const GroupSettings = mongoose.models.GroupSettings || mongoose.model('GroupSettings', groupSettingsSchema);

const getGroupSettings = async (groupId) => {
    try {
        let data = await GroupSettings.findOne({ groupId });
        if (data) return data;

        try {
            data = await GroupSettings.create({ groupId });
            return data;
        } catch (createErr) {
            // ✅ FIX: agar dusra call (jaise group-join event) same waqt pe
            // ye document already bana chuka ho, to duplicate-key error (11000)
            // aayega — us case mein bas dobara fetch karo, crash mat karo
            if (createErr.code === 11000) {
                data = await GroupSettings.findOne({ groupId });
                if (data) return data;
            }
            throw createErr;
        }
    } catch (e) {
        console.error('getGroupSettings error:', e.message);
        return { groupId, welcome: config.WELCOME_ENABLE === 'true', goodbye: config.GOODBYE_ENABLE === 'true' };
    }
};

const setWelcome = async (groupId, value) => {
    try {
        await GroupSettings.findOneAndUpdate(
            { groupId },
            { $set: { welcome: value } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        return true;
    } catch (e) {
        console.error('setWelcome error:', e.message);
        return false;
    }
};

const setGoodbye = async (groupId, value) => {
    try {
        await GroupSettings.findOneAndUpdate(
            { groupId },
            { $set: { goodbye: value } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        return true;
    } catch (e) {
        console.error('setGoodbye error:', e.message);
        return false;
    }
};

module.exports = { GroupSettings, getGroupSettings, setWelcome, setGoodbye };
