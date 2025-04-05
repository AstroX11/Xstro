import { type Serialize } from '../../../@types/command.ts';
import { commands } from '../../../core/command.ts';
import logger from '../../../utils/logger.ts';

export async function runCommands(message: Serialize) {
  if (!message.text) return;

  for (const cmd of commands) {
    const handler = message.prefix.find((p) => message.text?.startsWith(p));
    const match = message.text.slice(handler?.length || 0).match(cmd.name as string);
    if (!handler || !match) continue;

    try {
      await cmd.function(message, match[2] ?? '');
    } catch (err) {
      logger.error(err);
    }
  }
}
