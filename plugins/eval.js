import { bot } from '#lib';

bot(
  {
    pattern: 'eval ?(.*)',
    public: false,
    desc: 'Evaluate code',
    type: 'system',
  },
  async (message, match) => {
    const code = match || message.reply_message?.text;
    if (!code) return message.send('_Provide code to evaluate_');
    try {
      const result = await eval(`(async () => { ${code} })()`);
      return await message.send(result);
    } catch (error) {
      const errorMessage = error.stack || error.message || String(error);
      await message.send(`*Error:*\n\n${errorMessage}`);
    }
  }
);
