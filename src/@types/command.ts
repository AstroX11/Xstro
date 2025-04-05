import type { serialize } from '../hooks/api/functions/serialize.ts';
import type { WAMessage } from 'baileys';

export interface Commands {
  /** Name of function */
  name?: string | RegExp;
  /** Should the command always run when it recieves a message? */
  on?: string;
  /** Function of the command, must be async */
  function: (message: Serialize, match?: string) => Promise<unknown>;
  /** Should the command be for only sudo and bot owner */
  fromMe?: boolean;
  /** Should the command only be for Groups */
  isGroup?: boolean;
  /** Description of what the command does */
  desc?: string;
  /** Category of where the command should belong */
  type?:
    | 'ai'
    | 'misc'
    | 'system'
    | 'settings'
    | 'tools'
    | 'whatsapp'
    | 'group'
    | 'news'
    | 'chats'
    | 'download'
    | 'media'
    | 'utilities'
    | 'user'
    | 'privacy'
    | 'games';
  /** Should the command appear on the menu list? */
  dontAddCommandList?: boolean;
}

export type Serialize = ReturnType<typeof serialize> extends Promise<infer T> ? T : undefined;

export type MessageMisc = {
  /** Send to a specific number else it will auto get the jid */
  jid?: string;
  /** mime type */
  mimetype?: string;
  /** Select your content type if you want it for a specific type */
  type?: 'text' | 'audio' | 'image' | 'video' | 'sticker' | 'document';
  /** quoted message */
  quoted?: WAMessage;
};
