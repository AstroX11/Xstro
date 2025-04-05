import database from '../core/database.ts';

const bannedUsers = database.define(
  'banned',
  {
    jid: { type: 'STRING', allowNull: false, unique: true, primaryKey: true },
  },
  { freezeTableName: true },
);

export async function setBanned(jid: string): Promise<boolean | undefined> {
  const banned = await bannedUsers.findOne({ where: { jid } });
  if (!banned) {
    await bannedUsers.create({ jid: jid });
    return true;
  }
  const users = JSON.stringify(JSON.parse(JSON.stringify(banned)));
  if (users.includes(jid)) {
    return false;
  }
}

export async function getBanned(jid: string): Promise<boolean | undefined> {
  if (!jid) return undefined;
  const banned = await bannedUsers.findOne({ where: { jid } });
  return banned !== null;
}

export async function removeBan(jid: string): Promise<boolean> {
  const result = (await bannedUsers.destroy({ where: { jid } })) as number;
  return result > 0;
}
