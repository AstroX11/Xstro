export function isPath(text: string): boolean {
  if (typeof text !== 'string' || text.trim() === '') return false;

  return /^(?:\.|\.\.|[a-zA-Z]:)?[\/\\]?[a-zA-Z0-9_\-.]+(?:[\/\\][a-zA-Z0-9_\-.]+)*(?:\.[a-zA-Z0-9]+)?$/.test(
    text.trim(),
  );
}

export function isText(text: string): boolean {
  if (typeof text !== 'string' || text.trim() === '') return false;

  const trimmedText = text.trim();
  const bufferPattern = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)$/;
  const hexPattern = /^(?:0x)?[0-9a-fA-F]+$/;

  return !bufferPattern.test(trimmedText) && !hexPattern.test(trimmedText);
}

export function formatDate(timestamp: number | Date): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatRuntime(seconds: number): string {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const dDisplay = d > 0 ? `${d} d ` : '';
  const hDisplay = h > 0 ? `${h} h ` : '';
  const mDisplay = m > 0 ? `${m} m ` : '';
  const sDisplay = s > 0 ? `${s} s` : '';
  return dDisplay + hDisplay + mDisplay + sDisplay;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))}${sizes[i]}`;
}

export function parseJid(jid: string): string | undefined {
  if (!jid) return undefined;
  const parsed = Array.isArray(jid)
    ? jid[0]
    : typeof jid === 'object'
      ? String(Object.values(jid)[0])
      : String(jid);
  const numbers = parsed.replace(/\D/g, '');
  if (!numbers) return undefined;
  const num = numbers.slice(0, 12);
  if (num.length < 11) return undefined;
  return `${num}@whatsapp.net`;
}
