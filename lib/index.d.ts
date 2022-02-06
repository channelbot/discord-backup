import type { BackupData, CreateOptions, LoadOptions } from './types/';
/**
 * Fetches a backyp and returns the information about it
 */
export declare const fetch: (backupID: string) => any;
/**
 * Creates a new backup and saves it to the storage
 */
export declare const create: (guild: any, options?: CreateOptions) => Promise<any>;
/**
 * Loads a backup for a guild
 */
export declare const load: (backup: string | BackupData, guild: any, options?: LoadOptions) => Promise<any>;
/**
 * Removes a backup
 */
export declare const remove: (backupID: string) => Promise<any>;
/**
 * Returns the list of all backup
 */
export declare const list: () => Promise<any>;
/**
 * Change the storage path
 */
export declare const setStorageFolder: (path: string) => void;
declare const _default: {
    create: (guild: any, options?: CreateOptions) => Promise<any>;
    fetch: (backupID: string) => any;
    list: () => Promise<any>;
    load: (backup: string | BackupData, guild: any, options?: LoadOptions) => Promise<any>;
    remove: (backupID: string) => Promise<any>;
};
export default _default;
