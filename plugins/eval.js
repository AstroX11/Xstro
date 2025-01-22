import { bot } from '#lib';

bot(
  {
    pattern: 'eval ?(.*)',
    public: false,
    desc: 'Evaluate code',
    type: 'system',
  },
  async (message, match, { prefix, relayMessage, sendMessage }) => {
    const code = match || message.reply_message?.text;
    if (!code) return message.send('_Provide code to evaluate_');
    try {
      const result = await eval(`(async () => { ${code} })()`);

      return await message.client.sendMessage(message.jid, {
        text: typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result),
      });
    } catch (error) {
      const errorMessage = error.stack || error.message || String(error);
      await message.send(`*Error:*\n\n${errorMessage}`);
    }
  }
);
