import Database from '@astrox11/sqlite';
import config from '../../config.ts';

/**
 * Custom ORM handles everything effortlessly, and it supports only `node:sqlite`
 * It can do everything Sequelize does, but simpler, easier and very robust as well
 * Library is stable and can be found at https://github.com/AstroX11/sqlite
 * This ORM is made to be promisfyable, for asynchronous tasks
 * Be expecting a little overhead while using it
 */
const database = new Database(config.DATABASE, {
  open: true,
  enableForeignKeyConstraints: true,
  readOnly: false,
  verbose: true,
});

export default database;
