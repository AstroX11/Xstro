import type { Settings, SettingsMap } from '../@types/settings.ts';
import database from '../core/database.ts';

export const configDB = database.define('config', {
  prefix: { type: 'STRING', allowNull: false, defaultValue: '.' },
  mode: { type: 'INTEGER', allowNull: false, defaultValue: 1 },
});

export async function getSettings(): Promise<SettingsMap> {
  const settings = (await configDB.findAll()) as SettingsMap[];
  const plainSettings = JSON.parse(JSON.stringify(settings)) as SettingsMap[];
  const mappedSettings = plainSettings.map(
    (setting): SettingsMap => ({
      prefix: Array.isArray(setting.prefix) ? setting.prefix : Array.from(setting.prefix),
      mode: Boolean(setting.mode),
    }),
  );
  return mappedSettings[0] as SettingsMap;
}
