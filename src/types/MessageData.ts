import { Embed, AttachmentPayload } from 'discord.js';

export interface MessageData {
    username: string;
    avatar?: string;
    content?: string;
    embeds?: Embed[];
    files?: AttachmentPayload[];
    pinned?: boolean;
}
