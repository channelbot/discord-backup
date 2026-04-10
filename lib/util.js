"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearGuild = exports.loadChannel = exports.loadCategory = exports.fetchTextChannelData = exports.fetchChannelMessages = exports.fetchVoiceChannelData = exports.fetchChannelPermissions = void 0;
const discord_js_1 = require("discord.js");
const discord_js_2 = require("discord.js");
const node_fetch_1 = require("node-fetch");
const MaxBitratePerTier = {
    0: 64000,
    1: 128000,
    2: 256000,
    3: 384000
};
/**
 * Gets the permissions for a channel
 */
function fetchChannelPermissions(channel) {
    const permissions = [];
    channel.permissionOverwrites.cache
        .filter((p) => p.type === discord_js_2.OverwriteType.Role)
        .forEach((perm) => {
        // For each overwrites permission
        const role = channel.guild.roles.cache.get(perm.id);
        if (role) {
            permissions.push({
                roleName: role.name,
                allow: perm.allow.bitfield.toString(),
                deny: perm.deny.bitfield.toString()
            });
        }
    });
    return permissions;
}
exports.fetchChannelPermissions = fetchChannelPermissions;
/**
 * Fetches the voice channel data that is necessary for the backup
 */
async function fetchVoiceChannelData(channel) {
    return new Promise(async (resolve) => {
        const channelData = {
            type: discord_js_2.ChannelType.GuildVoice,
            name: channel.name,
            bitrate: channel.bitrate,
            userLimit: channel.userLimit,
            parent: channel.parent ? channel.parent.name : null,
            permissions: fetchChannelPermissions(channel)
        };
        /* Return channel data */
        resolve(channelData);
    });
}
exports.fetchVoiceChannelData = fetchVoiceChannelData;
async function fetchChannelMessages(channel, options) {
    let messages = [];
    const messageCount = isNaN(options.maxMessagesPerChannel) ? 10 : options.maxMessagesPerChannel;
    const fetchOptions = { limit: messageCount > 100 ? 100 : messageCount };
    let lastMessageId;
    let fetchComplete = false;
    while (!fetchComplete) {
        if (lastMessageId) {
            fetchOptions.before = lastMessageId;
        }
        const fetched = await channel.messages.fetch(fetchOptions);
        if (fetched.size === 0) {
            break;
        }
        lastMessageId = fetched.last().id;
        await Promise.all(fetched.map(async (msg) => {
            if (!msg.author || messages.length >= messageCount) {
                fetchComplete = true;
                return;
            }
            const files = await Promise.all(msg.attachments.map(async (a) => {
                let attach = a.url;
                if (a.url && ['png', 'jpg', 'jpeg', 'jpe', 'jif', 'jfif', 'jfi'].includes(a.url)) {
                    if (options.saveImages && options.saveImages === 'base64') {
                        attach = (await (0, node_fetch_1.default)(a.url).then((res) => res.buffer())).toString('base64');
                    }
                }
                return {
                    name: a.name,
                    attachment: attach
                };
            }));
            messages.push({
                username: msg.author.username,
                avatar: msg.author.displayAvatarURL(),
                content: msg.cleanContent,
                embeds: msg.embeds,
                files,
                pinned: msg.pinned
            });
        }));
    }
    return messages;
}
exports.fetchChannelMessages = fetchChannelMessages;
/**
 * Fetches the text channel data that is necessary for the backup
 */
async function fetchTextChannelData(channel, options) {
    return new Promise(async (resolve) => {
        const channelData = {
            type: channel.type,
            name: channel.name,
            nsfw: channel.nsfw,
            rateLimitPerUser: channel.type === discord_js_2.ChannelType.GuildText ? channel.rateLimitPerUser : undefined,
            parent: channel.parent ? channel.parent.name : null,
            topic: channel.topic,
            permissions: fetchChannelPermissions(channel),
            messages: [],
            isNews: channel.type === discord_js_2.ChannelType.GuildAnnouncement,
            threads: []
        };
        /* Fetch channel threads */
        if (channel.threads.cache.size > 0) {
            await Promise.all(channel.threads.cache.map(async (thread) => {
                const threadData = {
                    type: thread.type,
                    name: thread.name,
                    archived: thread.archived,
                    autoArchiveDuration: thread.autoArchiveDuration,
                    locked: thread.locked,
                    rateLimitPerUser: thread.rateLimitPerUser,
                    messages: []
                };
                try {
                    threadData.messages = await fetchChannelMessages(thread, options);
                    /* Return thread data */
                    channelData.threads.push(threadData);
                }
                catch {
                    channelData.threads.push(threadData);
                }
            }));
        }
        /* Fetch channel messages */
        try {
            channelData.messages = await fetchChannelMessages(channel, options);
            /* Return channel data */
            resolve(channelData);
        }
        catch {
            resolve(channelData);
        }
    });
}
exports.fetchTextChannelData = fetchTextChannelData;
/**
 * Creates a category for the guild
 */
async function loadCategory(categoryData, guild) {
    return new Promise((resolve) => {
        guild.channels
            .create({ name: categoryData.name, type: discord_js_2.ChannelType.GuildCategory })
            .then(async (category) => {
            // When the category is created
            const finalPermissions = [];
            categoryData.permissions.forEach((perm) => {
                const role = guild.roles.cache.find((r) => r.name === perm.roleName);
                if (role) {
                    finalPermissions.push({
                        id: role.id,
                        allow: BigInt(perm.allow),
                        deny: BigInt(perm.deny)
                    });
                }
            });
            await category.permissionOverwrites.set(finalPermissions).catch(() => { });
            resolve(category); // Return the category
        })
            // If the create itself fails (rate limit, missing permission)
            // we have to resolve to null instead of leaving the outer
            // Promise hanging — see the matching comment in loadChannel.
            .catch(() => resolve(null));
    });
}
exports.loadCategory = loadCategory;
/**
 * Create a channel and returns it
 */
async function loadChannel(channelData, guild, category, options) {
    return new Promise(async (resolve) => {
        const loadMessages = (channel, messages, previousWebhook) => {
            return new Promise(async (resolve) => {
                const webhook = previousWebhook ||
                    (await channel
                        .createWebhook({ name: 'MessagesBackup', avatar: channel.client.user.displayAvatarURL() })
                        .catch(() => { }));
                if (!webhook)
                    return resolve();
                messages = messages
                    .filter((m) => m.content.length > 0 || m.embeds.length > 0 || m.files.length > 0)
                    .reverse();
                messages = messages.slice(messages.length - options.maxMessagesPerChannel);
                for (const msg of messages) {
                    const sentMsg = await webhook
                        .send({
                        content: msg.content.length ? msg.content : undefined,
                        username: msg.username,
                        avatarURL: msg.avatar,
                        embeds: msg.embeds,
                        files: msg.files,
                        allowedMentions: options.allowedMentions,
                        threadId: channel.isThread() ? channel.id : undefined
                    })
                        .catch((err) => {
                        console.log(err.message);
                    });
                    if (msg.pinned && sentMsg)
                        await sentMsg.pin();
                }
                resolve(webhook);
            });
        };
        const createOptions = {
            name: channelData.name,
            type: null,
            parent: category
        };
        if (channelData.type === discord_js_2.ChannelType.GuildText || channelData.type === discord_js_2.ChannelType.GuildAnnouncement) {
            createOptions.topic = channelData.topic;
            createOptions.nsfw = channelData.nsfw;
            createOptions.rateLimitPerUser = channelData.rateLimitPerUser;
            createOptions.type =
                channelData.isNews && guild.features.includes('NEWS')
                    ? discord_js_2.ChannelType.GuildAnnouncement
                    : discord_js_2.ChannelType.GuildText;
        }
        else if (channelData.type === discord_js_2.ChannelType.GuildVoice) {
            // Downgrade bitrate
            let bitrate = channelData.bitrate;
            const bitrates = MaxBitratePerTier;
            while (bitrate > MaxBitratePerTier[guild.premiumTier]) {
                bitrate = bitrates[guild.premiumTier];
            }
            createOptions.bitrate = bitrate;
            createOptions.userLimit =
                channelData.userLimit > 99 ? null : channelData.userLimit;
            createOptions.type = discord_js_2.ChannelType.GuildVoice;
        }
        guild.channels
            .create(createOptions)
            .then(async (channel) => {
            /* Update channel permissions */
            const finalPermissions = [];
            channelData.permissions.forEach((perm) => {
                const role = guild.roles.cache.find((r) => r.name === perm.roleName);
                if (role) {
                    finalPermissions.push({
                        id: role.id,
                        allow: BigInt(perm.allow),
                        deny: BigInt(perm.deny)
                    });
                }
            });
            await channel.permissionOverwrites.set(finalPermissions).catch(() => { });
            if (channelData.type === discord_js_2.ChannelType.GuildText) {
                /* Load messages */
                let webhook;
                if (channelData.messages.length > 0) {
                    webhook = await loadMessages(channel, channelData.messages).catch(() => { });
                }
                /* Load threads */
                if (channelData.threads.length > 0) {
                    //&& guild.features.includes('THREADS_ENABLED')) {
                    for (const threadData of channelData.threads) {
                        const thread = await channel.threads
                            .create({ name: threadData.name })
                            .catch(() => null);
                        if (!thread || !webhook)
                            continue;
                        await loadMessages(thread, threadData.messages, webhook).catch(() => { });
                    }
                }
                // FIX: the previous version returned `channel` from this
                // .then callback (which is meaningless to the outer
                // Promise wrapper) and never called resolve(). The
                // outer Promise hung forever, which the legacy fire-
                // and-forget caller in load.ts/loadChannels masked by
                // never awaiting the result. Once you `await
                // loadChannel(...)` for real, the omission shows up as
                // a permanent hang on the first text channel.
                resolve(channel);
            }
            else {
                resolve(channel); // Return the channel
            }
        })
            .catch(() => resolve(undefined));
    });
}
exports.loadChannel = loadChannel;
/**
 * Delete all roles, all channels, all emojis, etc... of a guild.
 *
 * NOTE: every operation here is awaited sequentially. The previous version
 * fired N+M+W+B parallel REST DELETE requests in one tick (where N = roles,
 * M = channels, W = webhooks, B = bans) and then immediately followed up
 * with ~10 unawaited guild.set* PATCHes. On a 100-channel/30-role guild
 * this generated 150+ simultaneous REST calls, instantly tripping
 * Discord's per-resource rate limits and burning through the consumer's
 * Cloudflare invalid-request quota. Sequential is slower but stays under
 * the per-route buckets, and lets the bot's normal traffic continue
 * through the same global rate limit.
 */
async function clearGuild(guild) {
    for (const role of guild.roles.cache
        .filter((r) => !r.managed && r.editable && r.id !== guild.id)
        .values()) {
        await role.delete().catch(() => { });
    }
    for (const channel of guild.channels.cache.values()) {
        await channel.delete().catch(() => { });
    }
    // Don't clear emojis!!
    /*for (const emoji of guild.emojis.cache.values()) {
        await emoji.delete().catch(() => {});
    }*/
    const webhooks = await guild.fetchWebhooks().catch(() => null);
    if (webhooks) {
        for (const webhook of webhooks.values()) {
            await webhook.delete().catch(() => { });
        }
    }
    const bans = await guild.bans.fetch().catch(() => null);
    if (bans) {
        for (const ban of bans.values()) {
            await guild.members.unban(ban.user).catch(() => { });
        }
    }
    // Awaited so that any failure surfaces and so that we don't pile these
    // PATCHes on top of the deletes above.
    await guild.setAFKChannel(null).catch(() => { });
    await guild.setAFKTimeout(60 * 5).catch(() => { });
    await guild.setIcon(null).catch(() => { });
    await guild.setBanner(null).catch(() => { });
    await guild.setSplash(null).catch(() => { });
    await guild.setDefaultMessageNotifications(discord_js_2.GuildDefaultMessageNotifications.OnlyMentions).catch(() => { });
    await guild
        .setWidgetSettings({
        enabled: false,
        channel: null
    })
        .catch(() => { });
    if (!guild.features.includes('COMMUNITY')) {
        await guild.setExplicitContentFilter(discord_js_2.GuildExplicitContentFilter.Disabled).catch(() => { });
        await guild.setVerificationLevel(discord_js_1.GuildVerificationLevel.None).catch(() => { });
    }
    await guild.setSystemChannel(null).catch(() => { });
    await guild
        .setSystemChannelFlags([
        'SuppressGuildReminderNotifications',
        'SuppressJoinNotifications',
        'SuppressPremiumSubscriptions'
    ])
        .catch(() => { });
    return;
}
exports.clearGuild = clearGuild;
