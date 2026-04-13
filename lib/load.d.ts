import type { BackupData, LoadOptions } from './types';
import { type Guild } from 'discord.js';
/**
 * Restores the guild configuration.
 *
 * Sequential awaits — issuing all of these guild.set* PATCHes in parallel
 * (the previous behaviour) hits the per-guild bucket immediately and the
 * remaining ones 429.
 */
export declare const loadConfig: (guild: Guild, backupData: BackupData) => Promise<void>;
/**
 * Restore the guild roles.
 *
 * Discord's per-guild role-create bucket is small. Creating N roles in
 * parallel just instantly trips the limit and the remaining N-bucket
 * creations 429. Sequential is correct here.
 */
export declare const loadRoles: (guild: Guild, backupData: BackupData) => Promise<void>;
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
export declare const loadChannels: (guild: Guild, backupData: BackupData, options: LoadOptions) => Promise<void>;
/**
 * Restore the afk configuration
 */
export declare const loadAFK: (guild: Guild, backupData: BackupData) => Promise<void>;
/**
 * Restore guild emojis. Sequential — emoji creates have their own bucket
 * and parallelizing just trips it.
 */
export declare const loadEmojis: (guild: Guild, backupData: BackupData) => Promise<void>;
/**
 * Restore guild bans. Bulk-banning can't be done via REST in v10/v14, so
 * we ban each user individually — but sequentially, not all at once.
 */
export declare const loadBans: (guild: Guild, backupData: BackupData) => Promise<void>;
/**
 * Restore embedChannel configuration
 */
export declare const loadEmbedChannel: (guild: Guild, backupData: BackupData) => Promise<void>;
