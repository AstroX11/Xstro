import dotenv from 'dotenv';
dotenv.config();

const config = {
  SESSION_ID: process.env.SESSION_ID || 'XSTRO_67_95_07',
  SUDO: process.env.SUDO || '',
  BOT_INFO: process.env.BOT_INFO || 'Outlawz ;Kay95',
  WARN_COUNT: process.env.WARN_COUNT || 3,
  TIME_ZONE: process.env.TIME_ZONE || 'Africa/Lagos',
  VERSION: '1.3.3',
};

export { config };
export default { config };
