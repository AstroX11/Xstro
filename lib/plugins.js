import { isSudo, isBanned, isCmdDisabled } from '#sql';
import { getConfigValues } from './events.js';
import { isJidGroup } from 'baileys';

const commands = [];

/**
 * Registers a command with specified configuration and behavior.
 * @param {Object} cmd - The command configuration object.
 * @param {Function} func - The function to be executed when the command is triggered.
 * @param {string} cmd.pattern - The regex pattern to match the command.
 * @param {boolean} [cmd.public=false] - Indicates if the command is publicly accessible.
 * @param {boolean} [cmd.isGroup=false] - Indicates if the command can be used in group chats.
 * @param {boolean} [cmd.dontAddCommandList=false] - Prevents the command from being added to the command list.
 * @returns {Object} The registered command configuration object.
 */
async function bot(cmd, func) {
  cmd.function = func;
  cmd.pattern = new RegExp(`^(${cmd.pattern})(?:\\s+([\\s\\S]+))?$`, 'i');
  cmd.public = cmd.public || false;
  cmd.isGroup = cmd.isGroup || false;
  cmd.dontAddCommandList = cmd.dontAddCommandList || false;
  commands.push(cmd);
  return cmd;
}

const Plugins = async (msg, client, Message) => {
  if (!msg.body) return;
  const db = await getConfigValues();
  const prefixes = Array.from(db.PREFIX);

  for (const cmd of commands) {
    const prefix = prefixes.find((p) => msg.body.startsWith(p));
    if (prefix) {
      const match = msg.body.slice(prefix.length).match(cmd.pattern);
      if (match) {
        const Msg = {
          ...msg,
          prefix: prefix,
          command: `${prefix}${match[2]}`,
        };
        if (isJidGroup(msg.from) && db.disablegc && `${prefix}${match[2]}` !== `${prefix}enablegc`)
          return;
        if (!isJidGroup(msg.from) && db.disabledm && msg.from !== msg.user) return;
        if (await isCmdDisabled(Msg.command.replace(/[^a-zA-Z0-9]/g, '')))
          return await msg.send('```This command is disabled```');

        const sudo = await isSudo(msg.sender, msg.user);
        const banned = await isBanned(msg.sender);
        const args = match[2] ?? '';

        if (!prefixes.includes(prefix)) continue;
        if (db.mode && !sudo) return;
        if (banned) return await msg.send('```You are banned from using commands!```');
        if (cmd.isGroup && !isJidGroup(msg.from))
          return msg.send('```This Command is for Groups```');
        if (!db.mode && !cmd.public && !sudo) return await msg.send('```For My Owners Only!```');
        if (db.cmdReact) await Message.react('⏳');
        if (db.cmdRead) await client.readMessages([msg.key]);

        try {
          await cmd.function(Message, args, { ...Message });
          return await Message.react('');
        } catch (err) {
          await Message.react('❌');
          return msg.error(cmd, err);
        }
      }
    } else if (cmd.on) {
      await cmd.function(Message, msg.body, msg, client);
    }
  }
};

export { commands, bot, Plugins };
