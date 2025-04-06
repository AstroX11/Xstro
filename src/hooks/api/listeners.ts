import type { WASocket } from 'baileys';

const processes = (await import('./classes/index.ts')).default;

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
        await new processes.ConnectionUpdate(
          this.clientSocket,
          events['connection.update'],
        ).handleConnectionUpdate();
      }

      if (events['messages.upsert']) {
        await new processes.MessageUpsert(this.clientSocket, events['messages.upsert']).queueAllTasks();
      }
    });
  }
}
