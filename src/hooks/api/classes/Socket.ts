import { DisconnectReason, jidNormalizedUser, type BaileysEventMap, type WASocket } from 'baileys';
import pm2 from 'pm2';
import { Boom } from '@hapi/boom';
import logger from '../../../utils/logger.ts';
import config from '../../../../config.ts';
import { setSudo } from '../../../models/sudo.ts';

export default class ConnectionUpdate {
  private client: WASocket;
  private events: BaileysEventMap['connection.update'];
  constructor(client: WASocket, events: BaileysEventMap['connection.update']) {
    this.client = client;
    this.events = events;
  }
  public async handleConnectionUpdate() {
    const { connection, lastDisconnect } = this.events;
    switch (connection) {
      case 'connecting':
        await this.handleConnecting();
        break;
      case 'close':
        await this.handleClose(lastDisconnect);
        break;
      case 'open':
        await this.handleOpen();
        break;
    }
  }
  private async handleConnecting() {
    logger.info('Connecting to WhatsApp...');
    if (this.client.user?.id) {
      await setSudo(jidNormalizedUser(this.client.user.id));
    }
  }
  private async handleClose(
    lastDisconnect?: BaileysEventMap['connection.update']['lastDisconnect'],
  ) {
    const error = lastDisconnect?.error as Boom;
    const statusCode = error?.output?.statusCode;

    if (statusCode === DisconnectReason.loggedOut) {
      this.client.ws.close();
      process.exit(1);
    } else {
      pm2.restart(config.PROCESS_NAME, async (error: Error) => {
        if (error) {
          logger.error('Rebooting using process exitor');
          process.exit();
        }
      });
    }
  }
  private async handleOpen() {
    logger.info('Connection Successful');
    if (this.client.user?.id) {
      await this.client.sendMessage(this.client.user.id, { text: 'Hello World' });
    }
  }
}
