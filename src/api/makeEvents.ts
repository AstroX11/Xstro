import type { WASocket } from 'baileys';
import ConnectionUpdate from './connection.ts';
import MessageUpsert from './Message.ts';

export default class MakeListeners {
  private clientSocket: WASocket;
  private saveCreds: () => Promise<void>;

  constructor(clientSocket: WASocket, { saveCreds }: { saveCreds: () => Promise<void> }) {
    this.clientSocket = clientSocket;
    this.saveCreds = saveCreds;
  }

  async manageProcesses() {
    return this.clientSocket.ev.process(async (events) => {
      if (events['creds.update']) {
        await this.saveCreds();
      }

      if (events['connection.update']) {
        await new ConnectionUpdate(
          this.clientSocket,
          events['connection.update'],
        ).handleConnectionUpdate();
      }

      if (events['messages.upsert']) {
        await new MessageUpsert(this.clientSocket, events['messages.upsert']).queueAllTasks();
      }
    });
  }
}
