import type { WASocket } from 'baileys';
import ConnectionUpdate from './classes/Socket.ts';
import MessageUpsert from './classes/Message.ts';

export default class MakeListeners {
  private clientSocket: WASocket;
  private saveCreds: () => Promise<void>;

  constructor(clientSocket: WASocket, optionals: { saveCreds: () => Promise<void> }) {
    this.clientSocket = clientSocket;
    this.saveCreds = optionals.saveCreds;
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
