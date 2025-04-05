import { type BaileysEventMap, type WAMessage, type WASocket } from 'baileys';
import type { Serialize } from '../../../@types/command.ts';
import logger from '../../../utils/logger.ts';
import { Semaphore } from '../../cache/semaphore.ts';
import { serialize } from '../functions/serialize.ts';
import { storeMessages } from '../../../models/store.ts';
import { runCommands } from '../tasks/runCommand.ts';

export default class MessageUpsert {
  private client: WASocket;
  private upserts: BaileysEventMap['messages.upsert'];

  constructor(client: WASocket, upserts: BaileysEventMap['messages.upsert']) {
    this.client = client;
    this.upserts = upserts;
  }

  public async queueAllTasks() {
    const semaphore = new Semaphore(5);
    const taskPromises: Promise<void>[] = [];
    let failedTasks: number = 0;

    const tasks = [
      async (message: WAMessage, msg: Serialize) => {
        await storeMessages(message);
        await runCommands(msg);
      },
    ];

    try {
      for (const message of this.upserts.messages) {
        for (const task of tasks) {
          taskPromises.push(
            semaphore
              .acquire()
              .then(async () => {
                try {
                  const msg = await serialize(this.client, message);
                  logger.info(msg);
                  await task(message, msg);
                } catch (error) {
                  failedTasks++;
                  logger.error(`Task error: ${error}`);
                }
              })
              .finally(() => semaphore.release()),
          );
        }
      }
      await Promise.all(taskPromises);
      logger.info(`Processed ${taskPromises.length} tasks (${failedTasks} failed)`);
    } catch (error) {
      logger.error(`Batch failed: ${error}`);
    }
  }
}
