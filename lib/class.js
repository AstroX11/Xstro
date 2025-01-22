import fs from 'fs';
import os from 'os';
import path from 'path';
import { detectType, FileTypeFromBuffer, getBuffer, getMimeType } from 'xstro-utils';
import { downloadMediaMessage } from 'baileys';
import { isUrl, toJid } from '#utils';

class Message {
  constructor(client, data) {
    Object.defineProperties(this, {
      client: { value: client, writable: true, configurable: true },
      data: { value: data, writable: true, configurable: true },
      sendMessage: { value: data?.send, writable: true, configurable: true },
    });
    if (data) this._events(data);
  }

  _events(data) {
    this.data = data;
    this.key = data.key;
    this.id = data.key.id;
    this.jid = data.key.remoteJid;
    this.isAdmin = data.isAdmin;
    this.isBotAdmin = data.isBotAdmin;
    this.isGroup = data.isGroup;
    this.fromMe = data.key.fromMe;
    this.pushName = data.pushName;
    this.message = data.message;
    this.prefix = data.prefix;
    this.sender = data.sender;
    this.mtype = data.type;
    this.user = toJid(this.client.user.id);
    this.timestamp = data.messageTimestamp?.low || data.messageTimestamp || Date.now();
    this.text = data.body || '';
    this.bot = /^(BAE5|3EB0)/.test(data.key.id);
    this.mention = data.mention;
    this.sendMessage = data.send;
    this.quoted = data.quoted;

    if (data.quoted) {
      const quoted = data.quoted;
      this.reply_message = {
        id: quoted.key.id,
        fromMe: quoted.key.fromMe,
        sender: toJid(quoted.key.participant || quoted.key.remoteJid),
        key: quoted.key,
        bot: /^(BAE5|3EB0)/.test(quoted.key.id),
        message: quoted.message,
        text: quoted.body,
        image: quoted.type === 'imageMessage',
        video: quoted.type === 'videoMessage',
        audio: quoted.type === 'audioMessage',
        sticker: quoted.type === 'stickerMessage',
        document: quoted.type === 'documentMessage',
        viewonce: quoted.viewonce,
      };
    } else {
      this.reply_message = null;
    }
  }

  async isUserAdmin() {
    if (!this.isAdmin) {
      await this.send('```You are not an Admin```');
      return false;
    }
    if (!this.isBotAdmin) {
      await this.send('```I need to be an Admin first!```');
      return false;
    }
    return true;
  }

  async edit(content) {
    const msg = await this.client.sendMessage(this.jid, {
      text: content,
      edit: this.reply_message?.key || this.key,
    });
    return new Message(this.client, msg);
  }

  async react(emoji, opts = {}) {
    const msg = await this.client.sendMessage(this.jid, {
      react: { text: emoji, key: opts.key || this.key },
    });
    return new Message(this.client, msg);
  }

  async delete() {
    const msg = await this.client.sendMessage(this.jid, {
      delete: this.reply_message?.key || this.key,
    });
    return new Message(this.client, msg);
  }

  async clearChat() {
    const msg = await this.client.chatModify(
      {
        delete: true,
        lastMessages: [
          {
            key: this.key,
            messageTimestamp: this.timestamp,
          },
        ],
      },
      this.jid
    );
    return new Message(this.client, msg);
  }

  async archiveChat(opts = true) {
    const lstMsg = {
      message: this.message,
      key: this.key,
      messageTimestamp: this.timestamp,
    };
    const msg = await this.client.chatModify(
      {
        archive: opts,
        lastMessages: [lstMsg],
      },
      this.jid
    );
    return new Message(this.client, msg);
  }

  async updateName(name) {
    return await this.client.updateProfileName(this.user, name);
  }

  async updatePP(imageBuffer) {
    return await this.client.updateProfilePicture(this.user, imageBuffer);
  }

  async rPP() {
    return await this.client.removeProfilePicture(this.user);
  }

  async Block(jid) {
    this.send(`_@${jid.split('@')[0]} Blocked_`, { mentions: [jid] });
    return await this.client.updateBlockStatus(jid, 'block');
  }

  async Unblock(jid) {
    this.send(`_@${jid.split('@')[0]} Unblocked_`, { mentions: [jid] });
    return await this.client.updateBlockStatus(jid, 'unblock');
  }

  async getUserJid(match) {
    let jid;
    if (!match && !this.isGroup) {
      jid = this.data.key.remoteJid || this.reply_message?.sender;
    } else if (!match && this.isGroup) {
      jid = this.reply_message?.sender || this.mention[0];
    } else {
      jid = toJid(match);
    }
    if (!jid) return this.send('```Reply Or Tag User```');
    return jid;
  }

  async getProfileImage(jid) {
    const picture = await this.client.profilePictureUrl(jid, 'image');
    const buffer = await getBuffer(picture);
    return buffer || '_No Profile Photo_';
  }

  async send(content, opts = {}) {
    const jid = opts.jid || this.jid;
    const type = opts.type || (await detectType(content));
    const mentions = opts.mentions || [];
    const contextInfo = opts.contextInfo || {};
    const msg = await this.client.sendMessage(jid, {
      [type]: content,
      contextInfo: { mentionedJid: mentions, ...contextInfo, ...opts },
      ...opts,
    });
    return new Message(this.client, msg);
  }

  async sendFile(file, fileName, caption, opts = {}) {
    try {
      if (!file) throw new Error('No file provided');
      if (isUrl(file)) file = await getBuffer(file);
      if (!Buffer.isBuffer(file)) throw new Error('File must be a buffer or a valid URL');
      const mime = await getMimeType(file);
      if (!mime) throw new Error('Unable to detect mime type');
      const defaults = {
        document: file,
        mimetype: mime,
        fileName: fileName || 'χѕтяσ м∂',
        caption: caption || '',
        ...opts,
      };
      const data = await this.client.sendMessage(this.jid, defaults, {
        quoted: opts.quoted,
        ...opts,
      });
      return new Message(this.client, data);
    } catch (error) {
      throw new Error(`Error sending file: ${error.message}`);
    }
  }

  async sendFromUrl(url, opts = {}) {
    if (!isUrl(url)) throw new Error('Invalid URL');
    let buffer;
    try {
      buffer = await getBuffer(url);
      const content = await detectType(buffer);
      if (!content) throw new Error('Unsupported content type detected');
      const sendType = ['text', 'image', 'sticker', 'video', 'document'];
      if (!opts.type || !sendType.includes(opts.type))
        throw new Error('No valid content type specified');
      const data = await this.client.sendMessage(
        this.jid,
        { [opts.type || content]: buffer, ...opts },
        { ...opts }
      );
      return new Message(this.client, data);
    } catch (error) {
      throw new Error(`Error sending message: ${error.message}`);
    }
  }

  async forward(jid, message, options = {}) {
    const waMessage = await this.client.sendMessage(
      jid,
      { forward: message, ...options },
      { quoted: this.data }
    );
    return new Message(this.client, waMessage);
  }

  async download(file = false) {
    const buffer = await downloadMediaMessage(
      {
        key: this?.data?.quoted.key,
        message: this?.data?.quoted?.message,
      },
      'buffer',
      {},
      {
        logger: console,
        reuploadRequest: this.client.updateMediaMessage,
      }
    );
    if (file) {
      const ext = await FileTypeFromBuffer(buffer);
      const tmp = path.join(os.tmpdir(), `${Date.now()}.${ext}`);
      await fs.promises.writeFile(tmp, buffer);
      return tmp;
    }
    return buffer;
  }
}

export default Message;
