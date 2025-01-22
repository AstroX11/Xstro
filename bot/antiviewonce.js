import { isViewOnceEnabled } from '#sql';

export async function AntiViewOnce(msg) {
  if (!msg.viewonce || !isViewOnceEnabled()) return;

  const modifiedMessage = JSON.parse(JSON.stringify(msg.message));
  const messageType = Object.keys(modifiedMessage)[0];

  if (modifiedMessage[messageType]) {
    delete modifiedMessage[messageType].viewOnce;
    modifiedMessage[messageType].contextInfo = {
      stanzaId: msg.key.id,
      participant: msg.sender,
      quotedMessage: msg.message,
    };
  }

  await msg.client.relayMessage(msg.from, modifiedMessage, {});
}
