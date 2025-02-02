import { writeFile } from 'fs/promises';
import { downloadMediaMessage, getContentType, WAProto } from 'baileys';
import { FileTypeFromBuffer } from 'xstro-utils';

/**
 * Checks if a message is a media message and returns a boolean
 * @param {WAProto.IMessage} message - Full Message Object
 * @returns {Boolean} - True if the message is a media message, false otherwise
 */
export function isMediaMessage(message) {
  const messageType = getContentType(message.message);
  console.log(messageType);
  const media = ['imageMessage', 'documentMessage', 'audioMessage', 'videoMessage'];
  if (media.includes(messageType)) {
    return true;
  } else {
    return false;
  }
}

/**
 * Takes An Message Object and Edits a Property
 * @param {WAProto.IWebMessageInfo} message - Full Message Object
 * @param {String} propertyPath - Property Path to Edit
 * @param {Boolean|String|JSON|undefined} value - New Value to Replace the Property
 * @returns {WAProto.IWebMessageInfo} - New Message Object
 */
export function editMessageProptery(message, propertyPath, value) {
  if (!message || typeof message !== 'object') {
    throw new Error('Message must be an object');
  }
  if (typeof propertyPath !== 'string') {
    throw new Error('Property path must be a string using dot notation');
  }
  const result = JSON.parse(JSON.stringify(message));

  const keys = propertyPath.split('.');
  let current = result;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (key === '__proto__' || key === 'constructor') {
      throw new Error('Prototype pollution attempt detected');
    }
    if (!(key in current)) {
      throw new Error(`"${propertyPath}" does not exist in message`);
    }
    current = current[key];
  }
  const finalKey = keys[keys.length - 1];
  current[finalKey] = value;

  return result;
}

/**
 * Takes A Media Message and Downloads it
 * @param {WAProto.IWebMessageInfo} message - Media Message Object
 * @param {Boolean} asSaveFile - If true, the message will be downloaded as a file
 * @returns {Buffer|Path} - Buffer of the Media Message or Path to the Media Message
 */
export async function downloadMessage(message, asSaveFile = false) {
  if (!message || !isMediaMessage(message)) {
    throw new Error('Message must be a media message');
  }
  const media = await downloadMediaMessage(
    { key: message.key, message: message.message },
    'buffer',
    {},
    { logger: console }
  );
  if (asSaveFile) {
    const ext = await FileTypeFromBuffer(media);
    return await writeFile(`${message.key.id}.${ext}`, media);
  } else {
    return media;
  }
}
