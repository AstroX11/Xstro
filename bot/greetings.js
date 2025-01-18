import { getGoodbye, getWelcome } from '#sql';
import { XSTRO } from '#utils';
import { getBuffer } from 'xstro-utils';

/**
 * Handles welcome and goodbye messages for group members in a chat application.
 * @async
 * @param {Object} [update={}] - Object containing group update information.
 * @param {string} update.Group - The group identifier.
 * @param {string} update.action - The type of group action ('add' or 'remove').
 * @param {string[]} update.participants - List of participants involved in the action.
 * @param {Object} client - The chat client for sending messages and retrieving group metadata.
 * @returns {Promise<void>}
 * @description Sends personalized welcome or goodbye messages when members join or leave a group.
 * Supports custom message templates with dynamic placeholders and optional profile picture attachments.
 */
export async function Greetings(update = {}, client) {
  const welcomesettings = await getWelcome(update.Group);
  const goodbyesettings = await getGoodbye(update.Group);

  if (update.action === 'add' && welcomesettings.action) {
    const groupInfo = await client.groupMetadata(update.Group);
    const dateOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    };

    for (const newMember of update.participants) {
      const pp = await client.profilePictureUrl(newMember, 'image').catch(() => null);
      let message;

      if (!welcomesettings.message) {
        message = `@${newMember.split('@')[0]} welcome to ${groupInfo.subject}, Nice to meet you, we have ${groupInfo.size} group members now, @${groupInfo.subjectOwner.split('@')[0]} created this group on ${new Date(groupInfo.creation).toLocaleString('en-US', dateOptions)}, ${groupInfo.desc ? 'Read Group Description:\n\n' + groupInfo.desc : ''}`;
      } else {
        const facts = await XSTRO.facts();
        const quotes = await XSTRO.quotes();
        const advice = await XSTRO.advice();

        message = welcomesettings.message
          .replace('@owner', `@${groupInfo.subjectOwner.split('@')[0]}`)
          .replace('@gname', groupInfo.subject)
          .replace('@created', new Date(groupInfo.creation * 1000).toLocaleString())
          .replace('@user', `@${newMember.split('@')[0]}`)
          .replace('@gdesc', groupInfo.desc || 'No description')
          .replace('@members', groupInfo.size)
          .replace('@facts', facts)
          .replace('@quotes', quotes)
          .replace('@advice', advice)
          .replace('@pp', '');
      }

      const messageContent = pp
        ? {
            image: await getBuffer(pp),
            caption: message,
            mentions: [newMember, groupInfo.subjectOwner],
          }
        : {
            text: message,
            mentions: [newMember, groupInfo.subjectOwner],
          };

      await client.sendMessage(update.Group, messageContent);
    }
  }

  if (update.action === 'remove' && goodbyesettings.action) {
    const groupInfo = await client.groupMetadata(update.Group);

    for (const leftMember of update.participants) {
      const pp = await client.profilePictureUrl(leftMember, 'image').catch(() => null);
      let message;

      if (!goodbyesettings.message) {
        message = `@${leftMember.split('@')[0]} has left ${groupInfo.subject}. We won't miss you, Take care!`;
      } else {
        const facts = await XSTRO.facts();
        const quotes = await XSTRO.quotes();
        const advice = await XSTRO.advice();

        message = goodbyesettings.message
          .replace('@owner', `@${groupInfo.subjectOwner.split('@')[0]}`)
          .replace('@gname', groupInfo.subject)
          .replace('@created', new Date(groupInfo.creation * 1000).toLocaleString())
          .replace('@user', `@${leftMember.split('@')[0]}`)
          .replace('@gdesc', groupInfo.desc || 'No description')
          .replace('@members', groupInfo.size)
          .replace('@facts', facts)
          .replace('@quotes', quotes)
          .replace('@advice', advice)
          .replace('@pp', '');
      }

      const messageContent = pp
        ? {
            image: await getBuffer(pp),
            caption: message,
            mentions: [leftMember, groupInfo.subjectOwner],
          }
        : {
            text: message,
            mentions: [leftMember, groupInfo.subjectOwner],
          };

      await client.sendMessage(update.Group, messageContent);
    }
  }
}
