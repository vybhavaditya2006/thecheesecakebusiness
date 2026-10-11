export interface OrderDetails {
  name: string;
  phone: string;
  address: string;
  date: string; // yyyy-mm-dd
  notes: string;
}

export type DetailsErrors = Partial<Record<keyof OrderDetails, string>>;

export const emptyDetails: OrderDetails = { name: '', phone: '', address: '', date: '', notes: '' };

export const NOTES_LIMIT = 300;
// How far ahead an order can be placed.
const MAX_DAYS_AHEAD = 30;

// yyyy-mm-dd in the visitor's own time zone, `daysAhead` days from today.
export const localDate = (daysAhead = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const lastOrderDate = (): string => localDate(MAX_DAYS_AHEAD);

// An Indian mobile number as ten digits, or null if it isn't one. Accepts
// spaces, dashes and a leading +91, 91 or 0.
export const normalisePhone = (phone: string): string | null => {
  const digits = phone.replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '');
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
};

export const validateDetails = (details: OrderDetails): DetailsErrors => {
  const errors: DetailsErrors = {};

  if (details.name.trim().length < 2) errors.name = 'Please tell us your name.';
  if (!normalisePhone(details.phone)) errors.phone = 'Enter a 10-digit mobile number.';
  if (details.address.trim().length < 10) errors.address = 'Please give your full delivery address.';

  if (!/^\d{4}-\d{2}-\d{2}$/.test(details.date)) errors.date = 'Pick a delivery date.';
  else if (details.date < localDate()) errors.date = 'That date has already passed.';
  else if (details.date > lastOrderDate()) errors.date = `Pick a date within ${MAX_DAYS_AHEAD} days.`;

  if (details.notes.length > NOTES_LIMIT) errors.notes = `Keep notes under ${NOTES_LIMIT} characters.`;

  return errors;
};
