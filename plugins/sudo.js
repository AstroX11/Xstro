import { bot } from '#lib';
import { getSudo, delSudo, addSudo, isSudo } from '#sql';
import { toJid } from '#utils';

bot(
  {
    pattern: 'sudo',
    public: false,
    desc: 'How to use Sudo commands',
    type: 'sudo',
  },
  async (message, _, { prefix }) => {
    return message.send(`sᴜᴅᴏ sᴇᴛᴜᴘ\n
_${prefix}setsudo number | @user_
_${prefix}getsudo_
_${prefix}delsudo number | @user_
`);
  }
);

bot(
  {
    pattern: 'setsudo',
    public: false,
    desc: 'SetSudo A Specific User',
    type: 'sudo',
  },
  async (message, match) => {
    const jid = await message.getUserJid(match);
    if (!jid) return;
    if (isSudo(jid)) return message.send('_Already A Sudo User_');
    addSudo(jid);
    return message.send('```@' + jid.split('@')[0] + ' is now a Sudo```', { mentions: [jid] });
  }
);

bot(
  {
    pattern: 'addsudo',
    public: false,
    desc: 'Adds Set of Users as Sudo Users',
    type: 'sudo',
  },
  async (message, match) => {
    if (!match && !message.mention)
      return message.send('_Usage: 12345567,22445,356 or @user1,@user2,@user3_');
    match = match.replace(/@/g, '').split(/,\s*|\s+/g);
    match = match.map((id) => toJid(id));
    if (!Array.isArray(match)) match = Array.from(match);
    addSudo(match);
    return message.send(`\`\`\`Added ${match.length} new Sudo Users\`\`\``);
  }
);

bot(
  {
    pattern: 'delsudo',
    public: false,
    desc: 'Remove a Sudo User',
    type: 'sudo',
  },
  async (message, match) => {
    const jid = await message.getUserJid(match);
    if (!jid) return;
    if (!isSudo(jid)) return message.send('_User was not a sudo user_');
    if (delSudo(jid)) {
      return message.send(`\`\`\`@${jid} removed from sudo users\`\`\``, { mentions: [jid] });
    } else {
      return message.send(`\`\`\`@${jid} is not a sudo user\`\`\``, { mentions: [jid] });
    }
  }
);

bot(
  {
    pattern: 'getsudo',
    public: false,
    desc: 'Get List of Sudo Users',
    type: 'sudo',
  },
  async (message) => {
    const users = getSudo();
    if (!users || users.length === 0) return message.send('ɴᴏ sᴜᴅᴏ ғᴏᴜɴᴅ');
    const list = users.map((jid) => `@${jid.split('@')[0]}`).join('\n');
    return message.send(`*sᴜᴅᴏ ᴜsᴇʀs:*\n\n${list}`, { mentions: users });
  }
);
