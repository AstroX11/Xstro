import { bot } from '#lib';
import { delay } from 'baileys';

bot(
  {
    pattern: 'advertise',
    public: false,
    isGroup: true,
    desc: 'Create and Share Advertisement Messages to all Your Groups',
    type: 'group',
  },
  async (message, match, { reply_message, groupFetchAllParticipating }) => {
    const adMsg = match || reply_message.text;
    if (!adMsg) {
      return message.send('_I need a Message to Advertise_');
    }
    const groups = await groupFetchAllParticipating();
    const groupIds = Object.values(groups).map((group) => group.id);

    await message.send(`\`\`\`Advertising to ${groupIds.length} groups.\`\`\``);

    const broadcastMessage = `\`\`\`ADVERTSIMENT\n\nINFO:\n\n${adMsg}\`\`\``;

    for (const groupId of groupIds) {
      await delay(1500);
      await message.send(broadcastMessage, {
        jid: groupId,
        contextInfo: { forwardingScore: 9999999, isForwarded: true },
      });
    }

    return await message.send('```Shared to ' + groupIds.length + ' Groups.```');
  }
);
