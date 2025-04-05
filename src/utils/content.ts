import { fileTypeFromBuffer } from 'file-type';
import { isPath, isText } from './constants.ts';
import logger from './logger.ts';
import type { ContentTypeResult } from '../@types/content.ts';
import { type WAMessage } from 'baileys';

export const getContentType = async (content: unknown): Promise<ContentTypeResult> => {
  try {
    if (typeof content === 'string' && isPath(content)) {
      return { isPath: true, path: content };
    }
    if (typeof content === 'string' && isText(content)) {
      return content;
    }
    let buffer: Buffer;
    if (Buffer.isBuffer(content)) {
      buffer = content;
    } else if (typeof content === 'string') {
      buffer = Buffer.from(content);
    } else {
      return undefined;
    }
    const fileType = await fileTypeFromBuffer(buffer);
    return fileType ?? undefined;
  } catch (error) {
    logger.error('Error detecting content type:', error as string);
    return undefined;
  }
};

export const getDataType = async (
  content: Buffer | string,
): Promise<{
  contentType: 'text' | 'audio' | 'image' | 'video' | 'sticker' | 'document';
  mimeType: string;
}> => {
  if (typeof content === 'string') content = Buffer.from(content);
  const data = await fileTypeFromBuffer(content);
  if (!data) {
    try {
      content.toString('utf8');
      return { contentType: 'text', mimeType: 'text/plain' };
    } catch {
      return { contentType: 'document', mimeType: 'application/octet-stream' };
    }
  }
  const mimeType = data.mime;
  if (mimeType.startsWith('text/')) {
    return { contentType: 'text', mimeType };
  } else if (mimeType.startsWith('image/')) {
    return { contentType: 'image', mimeType };
  } else if (mimeType.startsWith('video/')) {
    return { contentType: 'video', mimeType };
  } else if (mimeType.startsWith('audio/')) {
    return { contentType: 'audio', mimeType };
  } else {
    return { contentType: 'document', mimeType };
  }
};

export const isMediaMessage = (message: WAMessage): boolean => {
  const mediaMessageTypes = [
    'imageMessage',
    'videoMessage',
    'audioMessage',
    'documentMessage',
  ] as const;
  const content = getContentType(message?.message!);
  return (
    typeof content === 'string' &&
    mediaMessageTypes.includes(content as (typeof mediaMessageTypes)[number])
  );
};
