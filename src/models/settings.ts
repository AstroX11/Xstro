import database from './_db.ts';
import type { SettingsMap } from '../types/index.ts';

export const configDB = database.define('config', {
 prefix: { type: 'STRING', allowNull: false, defaultValue: '.' },
 mode: { type: 'INTEGER', allowNull: false, defaultValue: 1 },
});

async function init() {
 return await configDB.create({
  prefix: '.',
  mode: 1,
 });
}
init();

export async function getSettings(): Promise<SettingsMap> {
 const msg = (await configDB.findAll()) as SettingsMap[];
 const config = JSON.parse(JSON.stringify(msg));
 const mappedSettings = config.map((setting: SettingsMap) => ({
  prefix: Array.isArray(setting.prefix)
   ? setting.prefix
   : Array.from(setting.prefix),
  mode: Boolean(setting.mode),
 }));
 return mappedSettings[0] as SettingsMap;
}
