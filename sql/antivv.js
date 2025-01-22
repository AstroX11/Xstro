import fs from 'fs';

const store = 'store/antiviewonce.json';

if (!fs.existsSync(store)) fs.writeFileSync(store, JSON.stringify({ isEnabled: false }));

const readDB = () => JSON.parse(fs.readFileSync(store, 'utf8'));
const writeDB = (data) => fs.writeFileSync(store, JSON.stringify(data));

export const setViewOnce = (status) => {
  writeDB({ isEnabled: status });
};

export const isViewOnceEnabled = () => readDB().isEnabled;
