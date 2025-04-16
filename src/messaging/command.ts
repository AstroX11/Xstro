import Message from './Messages/Message.ts';
import { commands } from './plugins.ts';
import { log } from '../utils/index.ts';

export async function execCmd(message: Message) {
 if (!message.data.text) return;

 for (const cmd of commands) {
  const handler = message.data.prefix.find((p: string) =>
   message.data.text?.startsWith(p),
  );
  const match = message.data.text
   .slice(handler?.length || 0)
   .match(cmd.name as string);
  if (!handler || !match) continue;

  if (message.mode && !message.sudo) continue;
  if (cmd.fromMe && !message.sudo) continue;
  if (cmd.isGroup && !message.isGroup) continue;

  try {
   await message.react('⏳');
   await cmd.function(message, match[2] ?? '');
  } catch (err) {
   log.error(err);
  }
 }
}
