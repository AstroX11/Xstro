import { bot } from '#lib';
import { setViewOnce, isViewOnceEnabled } from '#sql';

bot(
  {
    pattern: 'antivv',
    public: false,
    desc: 'Toggle Anti ViewOnce',
    type: 'settings',
  },
  async (message, match, { prefix }) => {
    const cmd = match.trim().toLowerCase();
    if (!['on', 'off'].includes(cmd)) return await message.send(`_Use ${prefix}antivv on | off_`);

    const currentStatus = isViewOnceEnabled();
    const newStatus = cmd === 'on';
    if (currentStatus === newStatus)
      return await message.send(`_AntiViewOnce is already ${cmd.toLowerCase()}_`);

    setViewOnce(newStatus);
    return await message.send(`_AntiViewOnce turned ${cmd.toLowerCase()}_`);
  }
);
