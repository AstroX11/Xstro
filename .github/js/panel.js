import { existsSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const CONFIG = {
  SESSION_ID: '', // Put your Session ID Here kid!
  PROJECT_DIR: 'Xstro',
  REPO_URL: 'https://github.com/AstroX11/Xstro.git',
  APP_NAME: 'Xstro',
  MAIN_SCRIPT: 'index.js',
};

/**
 * Logs an error message and terminates the application with a failure status.
 * @param {string} message - A descriptive error message explaining the context of the failure.
 * @param {Error} [error] - Optional error object providing additional details about the error.
 * @throws {Error} Exits the process with a status code of 1, terminating the application.
 */
function handleError(message, error) {
  console.error(message, error);
  process.exit(1);
}

/**
 * Clones the project repository to the specified project directory.
 * 
 * @description Executes a Git clone command to download the project repository
 * from the configured repository URL into the predefined project directory.
 * Uses synchronous spawning to ensure the cloning process completes before
 * continuing. Supports cross-platform execution with shell option.
 * 
 * @throws {Error} Terminates the process if repository cloning fails
 * 
 * @see handleError For error handling mechanism
 * 
 * @returns {void}
 */
function cloneRepository() {
  console.log('Cloning repository...');
  const cloneResult = spawnSync('git', ['clone', CONFIG.REPO_URL, CONFIG.PROJECT_DIR], {
    stdio: 'inherit',
    shell: true, // For Windows compatibility
  });
  if (cloneResult.error || cloneResult.status !== 0) {
    handleError('Failed to clone repository.', cloneResult.error);
  }
}

/**
 * Writes a session ID to a .env file in the project directory.
 * 
 * @description Creates a .env file with the SESSION_ID from the configuration.
 * If file writing fails, it triggers an error handling process.
 * 
 * @throws {Error} Throws an error if unable to write the .env file, which is then handled by handleError()
 */
function writeEnvFile() {
  try {
    writeFileSync(join(CONFIG.PROJECT_DIR, '.env'), `SESSION_ID=${CONFIG.SESSION_ID}`);
  } catch (error) {
    handleError('Failed to write .env file', error);
  }
}

/**
 * Installs project dependencies using Yarn package manager.
 * 
 * @description Executes 'yarn install' in the project directory to install all required dependencies.
 * Uses spawnSync to run the command synchronously, ensuring dependencies are fully installed before proceeding.
 * 
 * @throws {Error} Throws an error if dependency installation fails or encounters an unexpected issue.
 * 
 * @returns {void}
 * 
 * @note Uses shell mode for improved cross-platform compatibility, particularly with Windows systems.
 * Logs progress and handles potential installation errors via handleError function.
 */
function installDependencies() {
  console.log('Installing dependencies...');
  const installResult = spawnSync('yarn', ['install'], {
    cwd: resolve(CONFIG.PROJECT_DIR),
    stdio: 'inherit',
    shell: true, // Ensure compatibility with Windows
  });
  if (installResult.error || installResult.status !== 0) {
    handleError('Failed to install dependencies.', installResult.error);
  }
}

/**
 * Starts the application using PM2 process manager, with a fallback to direct Node.js execution.
 * 
 * @description Attempts to start the application first via PM2, providing process management features.
 * If PM2 fails, it falls back to starting the application directly using Node.js.
 * 
 * @throws {Error} Throws an error if both PM2 and direct Node.js startup methods fail.
 * 
 * @returns {void}
 * 
 * @example
 * // Starts the application, managing it through PM2 or direct Node.js execution
 * startApplication();
 */
function startApplication() {
  console.log('Starting application...');
  const startResult = spawnSync(
    'pm2',
    ['start', CONFIG.MAIN_SCRIPT, '--name', CONFIG.APP_NAME, '--attach'],
    {
      cwd: resolve(CONFIG.PROJECT_DIR),
      stdio: 'inherit',
      shell: true, // Ensure compatibility with Windows
    }
  );

  if (startResult.error || startResult.status !== 0) {
    console.error('PM2 start failed. Falling back to Node.js.');
    const nodeResult = spawnSync('node', [CONFIG.MAIN_SCRIPT], {
      cwd: resolve(CONFIG.PROJECT_DIR),
      stdio: 'inherit',
      shell: true,
    });
    if (nodeResult.error || nodeResult.status !== 0) {
      handleError('Failed to start the application with Node.js.', nodeResult.error);
    }
  }
}

/**
 * Initializes and sets up the Xstro project environment.
 * 
 * This function performs a series of setup steps:
 * 1. Clones the repository if the project directory doesn't exist
 * 2. Writes the environment configuration file
 * 3. Installs project dependencies
 * 4. Starts the application
 * 
 * @throws {Error} Propagates any errors encountered during setup process
 */
function XstroPanel() {
  if (!existsSync(CONFIG.PROJECT_DIR)) cloneRepository();
  writeEnvFile();
  installDependencies();
  startApplication();
}

XstroPanel();
