import { Module, numToJid } from '../index.mts';

Module({
  name: 'newgc',
  fromMe: true,
  isGroup: false,
  desc: 'Add a user to a Group',
  type: 'group',
  function: async (message, match) => {
    if (!match) {
      return message.send(`Usage: ${message.prefix}newgc MyGroup|1244556`);
    }
    const [groupName, numbers] = match.split('|');

    if (!groupName || !numbers) {
      return message.send('Usage: GroupName|Number1,Number2');
    }
    const participants = numbers.split(',').map((num) => numToJid(num.trim()));
    await message.groupCreate(
      groupName.trim(),
      message.mentions && message.mentions.length > 0 ? message.mentions : participants,
    );
  },
});

Module({
  name: 'kick',
  fromMe: false,
  isGroup: true,
  desc: 'Remove a participant from Group',
  type: 'group',
  function: async (message, match) => {
    if (!(await message.isAdmin())) {
      return message.send('You are not Admin.');
    }
    if (!(await message.isBotAdmin())) {
      return message.send('I am not an Admin.');
    }
    if (!match) {
      return message.send('Provide a participant to kick.');
    }
    const jid = message.user(match);
    if (!jid) return message.send('tag, reply or provide the user number');
    await message.groupParticipantsUpdate(message.jid, [jid], 'remove');
  },
});

Module({
  name: 'gname',
  fromMe: false,
  isGroup: true,
  desc: 'Update Group Name',
  type: 'group',
  function: async (message, match) => {
    if (!match) {
      return message.send('Provide A New Group Name');
    }
    if (!(await message.isAdmin())) {
      return message.send('You are not Admin');
    }
    if (!(await message.isBotAdmin())) {
      return message.send('I am not Admin');
    }
    await message.groupUpdateSubject(message.jid, match);
    return message.send('Group Name Update');
  },
});

Module({
  name: 'gdesc',
  fromMe: false,
  isGroup: true,
  desc: 'Update Group Description',
  type: 'group',
  function: async (message, match?: string) => {
    if (!(await message.isAdmin())) {
      return message.send('You are not Admin');
    }
    if (!(await message.isBotAdmin())) {
      return message.send('I am not Admin');
    }
    await message.groupUpdateDescription(message.jid, match);
    return message.send('Group Description Updated');
  },
});

Module({
  name: 'mute',
  fromMe: false,
  isGroup: true,
  desc: 'Allow only Admins to send messages.',
  type: 'group',
  function: async (message) => {
    if (!(await message.isAdmin())) {
      return message.send('You are not Admin');
    }
    if (!(await message.isBotAdmin())) {
      return message.send('I am not Admin');
    }
    const metadata = await message.groupMetadata(message.jid);
    if (metadata.announce)
      return message.send('Group settings already allowed only Admins to send messages.');
    await message.groupSettingUpdate(message.jid, 'announcement');
    return await message.send('Group muted, only admins can send messages.');
  },
});

Module({
  name: 'unmute',
  fromMe: false,
  isGroup: true,
  desc: 'Allow only Admins to send messages.',
  type: 'group',
  function: async (message) => {
    if (!(await message.isAdmin())) {
      return message.send('You are not Admin');
    }
    if (!(await message.isBotAdmin())) {
      return message.send('I am not Admin');
    }
    const metadata = await message.groupMetadata(message.jid);
    if (!metadata.announce)
      return message.send('Group settings already allowed all members to send messages.');
    await message.groupSettingUpdate(message.jid, 'not_announcement');
    return await message.send('Group muted, only admins can send messages.');
  },
});

Module({
  name: 'lock',
  fromMe: false,
  isGroup: true,
  desc: 'Lock groups setting to be managed by only admins',
  type: 'group',
  function: async (message) => {
    if (!(await message.isAdmin())) {
      return message.send('You are not Admin');
    }
    if (!(await message.isBotAdmin())) {
      return message.send('I am not Admin');
    }
    const metadata = await message.groupMetadata(message.jid);
    if (metadata.restrict)
      return message.send('Group has already been set to only allow admins manage settings');
    await message.groupSettingUpdate(message.jid, 'locked');
    return await message.send('Group settings updated to only Admins change Settings.');
  },
});

Module({
  name: 'unlock',
  fromMe: false,
  isGroup: true,
  desc: 'Unlock groups setting to allow all members to manage settings',
  type: 'group',
  function: async (message) => {
    if (!(await message.isAdmin())) {
      return message.send('You are not Admin');
    }
    if (!(await message.isBotAdmin())) {
      return message.send('I am not Admin');
    }
    const metadata = await message.groupMetadata(message.jid);
    if (!metadata.restrict)
      return message.send('Group is already set to allow all members manage settings');
    await message.groupSettingUpdate(message.jid, 'unlocked');
    return await message.send('Group settings updated to allow all members to change Settings.');
  },
});
