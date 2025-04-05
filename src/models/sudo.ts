import database from '../core/database.ts';

const Sudo = database.define(
  'sudo',
  {
    jid: { type: 'STRING', allowNull: false, unique: true, primaryKey: true },
  },
  { freezeTableName: true },
);

export async function getSudo(): Promise<string[] | undefined> {
  const users = await Sudo.findAll();
  if (!users) return undefined;
  return JSON.parse(JSON.stringify(users)).map((users: { jid: string }) => users.jid);
}

export async function setSudo(jid: string): Promise<any> {
  const sudoUsers = await Sudo.findAll();
  const users = JSON.parse(JSON.stringify(sudoUsers));
  if (users.map((user: { jid: string }) => user.jid).includes(jid)) return undefined;
  return await Sudo.create({ jid: jid });
}

export async function removeSudo(jid: string): Promise<number> {
  return (await Sudo.destroy({
    where: {
      jid: jid,
    },
  })) as number;
}
