import { Command } from '../core/command.ts';
import { formatRuntime } from '../utils/constants.ts';
import pm2 from 'pm2';
import os from 'node:os';

Command({
  name: 'ping',
  fromMe: false,
  desc: 'Get Performance',
  type: 'system',
  function: async (message) => {
    const start = Date.now();
    const msg = await message.send('Pong!');
    const end = Date.now();
    return await msg.edit(`\`\`\`${end - start} ms\`\`\``);
  },
});

Command({
  name: 'runtime',
  fromMe: false,
  desc: 'Get System uptime',
  type: 'system',
  function: async (message) => {
    return await message.send(`\`\`\`${formatRuntime(process.uptime())}\`\`\``);
  },
});

Command({
  name: 'restart',
  fromMe: true,
  desc: 'Restart the bot',
  type: 'system',
  function: async (message) => {
    await message.send('Restarting...');
    pm2.restart('xstro', async (err: Error) => {
      if (err) {
        await message.send('Failed to restart process');
      }
    });
  },
});

Command({
  name: 'shutdown',
  fromMe: true,
  desc: 'Shutdown Pm2 process',
  type: 'system',
  function: async (message) => {
    await message.send('Goodbye....');
    return pm2.stop('xstro', async (err: Error) => {
      pm2.disconnect();
      if (err) {
        await message.send('Failed to shutdown');
        process.exit(1);
      }
    });
  },
});

Command({
  name: 'cpu',
  fromMe: false,
  desc: 'Get CPU usage',
  type: 'system',
  function: async (message) => {
    const cpuUsage = os.loadavg()[0]; // 1-minute average
    return await message.send(`\`\`\`CPU Load: ${cpuUsage?.toFixed(2)}\`\`\``);
  },
});

Command({
  name: 'memory',
  fromMe: false,
  desc: 'Get memory usage',
  type: 'system',
  function: async (message) => {
    const freeMem = os.freemem() / 1024 / 1024; // MB
    const totalMem = os.totalmem() / 1024 / 1024; // MB
    const usedMem = totalMem - freeMem;
    return await message.send(
      `\`\`\`Memory: ${usedMem.toFixed(2)} / ${totalMem.toFixed(2)} MB\`\`\``,
    );
  },
});

Command({
  name: 'processes',
  fromMe: true,
  desc: 'List PM2 processes',
  type: 'system',
  function: async (message) => {
    pm2.list((err: Error, list: any[]) => {
      if (err) return message.send('Error fetching processes');
      const output = list.map((p) => `${p.name}: ${p.pm2_env.status}`).join('\n');
      return message.send(`\`\`\`${output || 'No processes found'}\`\`\``);
    });
  },
});

Command({
  name: 'stats',
  fromMe: false,
  desc: 'Get system stats',
  type: 'system',
  function: async (message) => {
    const uptime = formatRuntime(os.uptime());
    const cpuCores = os.cpus().length;
    return await message.send(`\`\`\`Uptime: ${uptime}\nCPU Cores: ${cpuCores}\`\`\``);
  },
});
