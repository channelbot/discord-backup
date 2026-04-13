"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadEmbedChannel = exports.loadBans = exports.loadEmojis = exports.loadAFK = exports.loadChannels = exports.loadRoles = exports.loadConfig = void 0;
const discord_js_1 = require("discord.js");
const util_1 = require("./util");
/**
 * Restores the guild configuration.
 *
 * Sequential awaits — issuing all of these guild.set* PATCHes in parallel
 * (the previous behaviour) hits the per-guild bucket immediately and the
 * remaining ones 429.
 */
const loadConfig = async (guild, backupData) => {
    if (backupData.name) {
        await guild.setName(backupData.name).catch(() => { });
    }
    if (backupData.iconBase64) {
        await guild.setIcon(Buffer.from(backupData.iconBase64, 'base64')).catch(() => { });
    }
    else if (backupData.iconURL) {
        await guild.setIcon(backupData.iconURL).catch(() => { });
    }
    if (backupData.splashBase64) {
        await guild.setSplash(Buffer.from(backupData.splashBase64, 'base64')).catch(() => { });
    }
    else if (backupData.splashURL) {
        await guild.setSplash(backupData.splashURL).catch(() => { });
    }
    if (backupData.bannerBase64) {
        await guild.setBanner(Buffer.from(backupData.bannerBase64, 'base64')).catch(() => { });
    }
    else if (backupData.bannerURL) {
        await guild.setBanner(backupData.bannerURL).catch(() => { });
    }
    if (backupData.verificationLevel) {
        await guild.setVerificationLevel(backupData.verificationLevel).catch(() => { });
    }
    if (backupData.defaultMessageNotifications) {
        await guild.setDefaultMessageNotifications(backupData.defaultMessageNotifications).catch(() => { });
    }
    const changeableExplicitLevel = guild.features.includes('COMMUNITY');
    if (backupData.explicitContentFilter && changeableExplicitLevel) {
        await guild.setExplicitContentFilter(backupData.explicitContentFilter).catch(() => { });
    }
};
exports.loadConfig = loadConfig;
/**
 * Restore the guild roles.
 *
 * Discord's per-guild role-create bucket is small. Creating N roles in
 * parallel just instantly trips the limit and the remaining N-bucket
 * creations 429. Sequential is correct here.
 */
const loadRoles = async (guild, backupData) => {
    for (const roleData of backupData.roles) {
        if (roleData.isEveryone) {
            await guild.roles.cache
                .get(guild.id)
                ?.edit({
                name: roleData.name,
                color: roleData.color,
                permissions: BigInt(roleData.permissions),
                mentionable: roleData.mentionable
            })
                .catch(() => { });
        }
        else {
            await guild.roles
                .create({
                name: roleData.name,
                color: roleData.color,
                hoist: roleData.hoist,
                permissions: BigInt(roleData.permissions),
                mentionable: roleData.mentionable
            })
                .catch(() => { });
        }
    }
};
exports.loadRoles = loadRoles;
/**
 * Restore the guild channels.
 *
 * Sequential by category, sequential by child within each category. The
 * old version Promise.all'd ALL categories simultaneously and the original
 * `categoryData.children.forEach((c) => { loadChannel(c); resolve(true); })`
 * loop both ignored the channel-create promise (so children were never
 * awaited) and resolved the outer promise on the first child instead of
 * the last, so on a guild with N categories of M children each it would
 * fire roughly N*M create requests in one tick AND lie to the caller
 * about being done.
 */
const loadChannels = async (guild, backupData, options) => {
    for (const categoryData of backupData.channels.categories) {
        const createdCategory = await (0, util_1.loadCategory)(categoryData, guild).catch(() => null);
        if (!createdCategory)
            continue;
        for (const channelData of categoryData.children) {
            await (0, util_1.loadChannel)(channelData, guild, createdCategory, options).catch(() => { });
        }
    }
    for (const channelData of backupData.channels.others) {
        await (0, util_1.loadChannel)(channelData, guild, null, options).catch(() => { });
    }
};
exports.loadChannels = loadChannels;
/**
 * Restore the afk configuration
 */
const loadAFK = async (guild, backupData) => {
    if (backupData.afk) {
        await guild
            .setAFKChannel(guild.channels.cache.find((ch) => ch.name === backupData.afk.name && ch.type === discord_js_1.ChannelType.GuildVoice))
            .catch(() => { });
        await guild.setAFKTimeout(backupData.afk.timeout).catch(() => { });
    }
};
exports.loadAFK = loadAFK;
/**
 * Restore guild emojis. Sequential — emoji creates have their own bucket
 * and parallelizing just trips it.
 */
const loadEmojis = async (guild, backupData) => {
    for (const emoji of backupData.emojis) {
        if (emoji.url) {
            await guild.emojis.create({ attachment: emoji.url, name: emoji.name }).catch(() => { });
        }
        else if (emoji.base64) {
            await guild.emojis
                .create({ attachment: Buffer.from(emoji.base64, 'base64'), name: emoji.name })
                .catch(() => { });
        }
    }
};
exports.loadEmojis = loadEmojis;
/**
 * Restore guild bans. Bulk-banning can't be done via REST in v10/v14, so
 * we ban each user individually — but sequentially, not all at once.
 */
const loadBans = async (guild, backupData) => {
    for (const ban of backupData.bans) {
        await guild.members
            .ban(ban.id, {
            reason: ban.reason
        })
            .catch(() => { });
    }
};
exports.loadBans = loadBans;
/**
 * Restore embedChannel configuration
 */
const loadEmbedChannel = async (guild, backupData) => {
    if (backupData.widget.channel) {
        await guild
            .setWidgetSettings({
            enabled: backupData.widget.enabled,
            channel: guild.channels.cache.find((ch) => ch.name === backupData.widget.channel)
        })
            .catch(() => { });
    }
};
exports.loadEmbedChannel = loadEmbedChannel;
