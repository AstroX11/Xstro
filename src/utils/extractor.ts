import type { WAMessageContent } from 'baileys';

export function extractStringfromMessage(message: WAMessageContent) {
  if (message?.conversation) return message.conversation;
  if (message?.documentMessage?.caption) return message.documentMessage.caption;
  if (message?.videoMessage?.caption) return message.videoMessage.caption;
  if (message?.extendedTextMessage) return message.extendedTextMessage.text;
  if (message?.eventMessage) {
    return `${message?.eventMessage?.name ?? ''}\n${message?.eventMessage?.description ?? ''}`;
  }
  if (message?.pollCreationMessageV3) {
    return `${message?.pollCreationMessageV3?.name}\n${message?.pollCreationMessageV3?.options?.map((opt) => opt.optionName).toString()}`;
  }
  if (message?.pollCreationMessage) {
    return `${message?.pollCreationMessage?.name}\n${message?.pollCreationMessage?.options?.map((opt) => opt.optionName).toString()}`;
  }
  if (message?.pollCreationMessageV2) {
    return `${message?.pollCreationMessageV2?.name}\n${message?.pollCreationMessageV2?.options?.map((opt) => opt.optionName).toString()}`;
  }
  if (message?.protocolMessage) {
    if (message?.protocolMessage?.editedMessage?.extendedTextMessage) {
      return message?.protocolMessage?.editedMessage?.extendedTextMessage?.text;
    }
    if (message?.protocolMessage?.editedMessage?.videoMessage) {
      return message?.protocolMessage?.editedMessage?.videoMessage?.caption;
    }
    if (message?.protocolMessage?.editedMessage?.imageMessage) {
      return message?.protocolMessage?.editedMessage?.imageMessage?.caption;
    }
    if (message?.protocolMessage?.editedMessage?.conversation) {
      return message?.protocolMessage?.editedMessage?.conversation;
    }
    if (message?.protocolMessage?.editedMessage?.documentMessage) {
      return message?.protocolMessage?.editedMessage?.documentMessage?.caption;
    }
  }
}
