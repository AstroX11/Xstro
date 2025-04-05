import type { WAContextInfo, WAMessage, WAMessageContent } from 'baileys';

type BaseOptions = {
  content: unknown;
  sendOptions?: {
    relayMessage?: {
      message: WAMessageContent;
    };
    forward?: boolean;
    forwardFullMessage?: {
      forwardTag?: boolean;
      Message: WAMessage | WAMessageContent;
    };
    contextInfo?: WAContextInfo;
  };
};

export type MediaType = {
  text?: string;
  audio?: string | Buffer;
  image?: string | Buffer;
  video?: string | Buffer;
  sticker?: string | Buffer;
  document?: string | Buffer;
};

export type sendMessageOptions = BaseOptions & {
  [K in keyof MediaType]: MediaType[K];
} & {
    [K in keyof MediaType as Exclude<keyof MediaType, K>]?: unknown;
  }[keyof MediaType];
