import { bot } from '#lib';
import fs from 'fs';
import path from 'path';

/**
 * Recursively generates a formatted string representation of a directory's structure.
 * @param {string} dir - The path of the directory to explore.
 * @param {string} [prefix=''] - Prefix used for visual tree-like formatting.
 * @param {boolean} [isLast=true] - Indicates if the current directory is the last in its parent directory.
 * @returns {string} A formatted string depicting the directory structure.
 * @description Traverses a directory, excluding specific system and configuration folders, and creates a tree-like visualization of files and subdirectories.
 */
function getDirectoryStructure(dir, prefix = '', isLast = true) {
  const files = fs.readdirSync(dir);
  let structure = '';

  files.forEach((file, index) => {
    const isLastItem = index === files.length - 1;
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    const isDirectory = stats.isDirectory();

    if (
      file === 'node_modules' ||
      file.startsWith('.git') ||
      file === '.env' ||
      file === '.npm' ||
      file === 'session'
    )
      return;

    structure += `${prefix}${isLast ? '└── ' : '├── '}${file}${isDirectory ? '/' : ''}\n`;

    if (isDirectory) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      structure += getDirectoryStructure(filePath, newPrefix, isLastItem);
    }
  });

  return structure;
}

bot(
  {
    pattern: 'structure',
    public: true,
    desc: 'Get the directory structure of the bot',
    type: 'misc',
  },
  async (message) => {
    const projectRoot = process.cwd();
    const structureText = `
AstroX11/Xstro:
${getDirectoryStructure(projectRoot)}`.trim();

    return await message.send(`\`\`\`${structureText}\`\`\``);
  }
);
