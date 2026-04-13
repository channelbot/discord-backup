import type { CategoryData, ChannelPermissionsData, CreateOptions, LoadOptions, MessageData, TextChannelData, VoiceChannelData } from './types';
import { CategoryChannel, Guild, TextChannel, VoiceChannel, NewsChannel, ThreadChannel } from 'discord.js';
/**
 * Gets the permissions for a channel
 */
export declare function fetchChannelPermissions(channel: TextChannel | VoiceChannel | CategoryChannel | NewsChannel): ChannelPermissionsData[];
/**
 * Fetches the voice channel data that is necessary for the backup
 */
export declare function fetchVoiceChannelData(channel: VoiceChannel): Promise<VoiceChannelData>;
export declare function fetchChannelMessages(channel: TextChannel | NewsChannel | ThreadChannel, options: CreateOptions): Promise<MessageData[]>;
/**
 * Fetches the text channel data that is necessary for the backup
 */
export declare function fetchTextChannelData(channel: TextChannel | NewsChannel, options: CreateOptions): Promise<TextChannelData>;
/**
 * Creates a category for the guild
 */
export declare function loadCategory(categoryData: CategoryData, guild: Guild): Promise<CategoryChannel>;
/**
 * Create a channel and returns it
 */
export declare function loadChannel(channelData: TextChannelData | VoiceChannelData, guild: Guild, category?: CategoryChannel, options?: LoadOptions): Promise<unknown>;
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
export declare function clearGuild(guild: Guild): Promise<void>;
