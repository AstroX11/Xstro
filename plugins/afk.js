import { bot } from '#lib';
import { getAfkMessage, setAfkMessage, delAfkMessage, isSudo } from '#sql';

const afkTrack = {};

bot(
  {
    pattern: 'afk',
    public: false,
    desc: 'Manage the global AFK message',
    type: 'user',
  },
  async (message, match, { prefix }) => {
    if (!match)
      return message.send(
        `\`\`\`${prefix}afk on\n${prefix}afk set <your afk message>\n${prefix}afk off\`\`\``
      );
    let timestamp;
    if (match.toLowerCase() === 'on') {
      timestamp = Date.now();
      await setAfkMessage(`I'm currently away, please leave a message.`, timestamp);
      return message.send(
        '```The AFK message is now active.\n_You can customize it with ' +
          prefix +
          'afk set <message>._```'
      );
    }
    if (match.toLowerCase() === 'off')
      return await delAfkMessage(), message.send('```AFK has been deactivated.```');

    if (match.toLowerCase().startsWith('set')) {
      const afkMessage = message.text.split(' ').slice(2).join(' ');
      if (!afkMessage)
        return message.send('```Provide a message to set as the global AFK status.```');
      timestamp = Date.now();
      await setAfkMessage(afkMessage, timestamp);
      return message.send(`\`\`\`AFK message has been set to: "${afkMessage}"\`\`\``);
    }

    if (match.toLowerCase() === 'get') {
      const afkData = await getAfkMessage();
      if (!afkData)
        return message.send('There is no AFK message set. Use `.afk set <message>` to set one.');

      const { message: afkMessage, timestamp: storedTimestamp } = afkData;
      return message.send(
        `\`\`\`${afkMessage}\nLast Seen: ${formatDuration(Date.now() - storedTimestamp)} ago\`\`\``
      );
    }

    return message.send(
      `\`\`\`${prefix}afk on\n${prefix}afk set <your afk message>\n${prefix}afk off\`\`\``
    );
  }
);

bot(
  {
    on: 'text',
    dontAddCommandList: true,
  },
  async (message) => {
    const afkData = await getAfkMessage();
    const sudo = await isSudo(message.sender, message.user);
    if (!afkData || sudo) return;
    if (message.jid.endsWith('@g.us')) {
      if (message.mention && message.mention.includes(message.user)) {
        const lastSeen = afkData.timestamp ? formatDuration(Date.now() - afkData.timestamp) : 'N/A';
        return message.send(`\`\`\`${afkData.message}\n\nLast Seen: ${lastSeen}\`\`\``);
      }
    } else {
      if (message.sender.includes(message.user)) return;
      const now = Date.now();
      const lastMessageTime = afkTrack[message.sender] || 0;
      if (now - lastMessageTime < 30000) return;

      afkTrack[message.sender] = now;

      const lastSeen = afkData.timestamp ? formatDuration(now - afkData.timestamp) : 'N/A';
      return message.send(`\`\`\`${afkData.message}\n\nLast Seen: ${lastSeen}\`\`\``);
    }
  }
);

/**
 * Converts a duration in milliseconds to a human-readable time format.
 * @param {number} ms - Duration in milliseconds to be formatted.
 * @returns {string} Formatted duration string with hours, minutes, and seconds.
 * @example
 * formatDuration(3661000) // Returns "1hr 1mins 1sec"
 */
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / (1000 * 60)) % 60;
  const hours = Math.floor(ms / (1000 * 60 * 60));
  return `${hours}hr ${minutes}mins ${seconds}sec`;
}
