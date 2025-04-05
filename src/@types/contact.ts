/**
 * Contact entity in the system
 */
export interface Contact {
  /** The (JID) associated with the contact */
  jid: string;
  /** The (LID) associated with the contact */
  lid: string;
  /** The display name or push notification name for the contact */
  pushName: string;
}
