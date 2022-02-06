import type { BackupData, LoadOptions } from './types';
import type { Emoji, Guild, Role } from 'discord.js';
/**
 * Restores the guild configuration
 */
export declare const loadConfig: (guild: any, backupData: BackupData) => Promise<Guild[]>;
/**
 * Restore the guild roles
 */
export declare const loadRoles: (guild: any, backupData: BackupData) => Promise<Role[]>;
/**
 * Restore the guild channels
 */
export declare const loadChannels: (guild: any, backupData: BackupData, options: LoadOptions) => Promise<unknown[]>;
/**
 * Restore the afk configuration
 */
export declare const loadAFK: (guild: any, backupData: BackupData) => Promise<Guild[]>;
/**
 * Restore guild emojis
 */
export declare const loadEmojis: (guild: any, backupData: BackupData) => Promise<Emoji[]>;
/**
 * Restore guild bans
 */
export declare const loadBans: (guild: any, backupData: BackupData) => Promise<string[]>;
/**
 * Restore embedChannel configuration
 */
export declare const loadEmbedChannel: (guild: any, backupData: BackupData) => Promise<Guild[]>;
