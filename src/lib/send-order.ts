import { brand } from '../content/brand';
import { contact } from '../content/info';

const WEB3FORMS_URL = 'https://api.web3forms.com/submit';

// Everything about one order, as plain labelled text.
export type OrderRecord = Record<string, string>;

export type SendResult = 'sent' | 'failed' | 'not-configured';

// Emails the order through Web3Forms. The email goes to whichever address the
// access key was created for.
const emailOrder = async (record: OrderRecord): Promise<SendResult> => {
  if (!contact.web3formsKey) return 'not-configured';

  try {
    const response = await fetch(WEB3FORMS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: contact.web3formsKey,
        subject: `New order from ${record.Name ?? 'the website'}`,
        from_name: `${brand.name} website`,
        // Web3Forms' honeypot: real visitors never fill this in.
        botcheck: '',
        ...record,
      }),
    });
    const result: { success?: boolean } = await response.json();
    return response.ok && result.success ? 'sent' : 'failed';
  } catch {
    return 'failed';
  }
};

// Optional copy to a Google Apps Script web app (for a spreadsheet log, say).
// Sent as a "simple" request because Apps Script cannot answer a CORS
// preflight; the reply is unreadable, so this is best effort.
const logOrder = (record: OrderRecord): void => {
  if (!contact.orderScriptUrl) return;

  fetch(contact.orderScriptUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ ...record, 'Sent at': new Date().toISOString() }),
  }).catch(() => {});
};

export const sendOrder = async (record: OrderRecord): Promise<SendResult> => {
  logOrder(record);
  return emailOrder(record);
};
