import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { flavourById } from '../../content/flavours';
import { formatPrice } from '../../content/pricing';
import { wholeCakes } from '../../content/whole-cakes';
import { addWholeCake } from '../../lib/order-store';
import { Chip } from './parts';

// The "Whole cheesecake" tab: a flavour, a size (once sizes exist), the date
// the customer would like and an optional message for the cake. It goes into
// the same order as the pieces; the date is confirmed on WhatsApp.

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="mt-6">
      <legend className="label-caps opacity-80">{label}</legend>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

// YYYY-MM-DD for a date in the visitor's own time zone.
const isoDate = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export default function WholeBuilder() {
  const sizes = wholeCakes.sizes ?? [];
  const [flavour, setFlavour] = useState<string | undefined>();
  const [size, setSize] = useState<string | undefined>(sizes[0]?.id);
  const [date, setDate] = useState('');
  const [message, setMessage] = useState('');
  const [added, setAdded] = useState(false);
  // Made to order: tomorrow is the earliest date to ask for.
  const earliest = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return isoDate(tomorrow);
  }, []);

  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => setAdded(false), 2200);
    return () => window.clearTimeout(timer);
  }, [added]);

  const chosen = flavour ? wholeCakes.flavours.find((id) => id === flavour) : undefined;
  const ready = Boolean(chosen && date >= earliest && (!sizes.length || size));

  const add = (): void => {
    if (!ready || !chosen) return;
    addWholeCake({
      flavour: chosen,
      date,
      ...(sizes.length && size ? { size } : {}),
      ...(message.trim() ? { message: message.trim() } : {}),
    });
    setAdded(true);
    setFlavour(undefined);
    setDate('');
    setMessage('');
  };

  return (
    <div className="mx-auto max-w-xl">
      <h2 className="text-center text-3xl">{wholeCakes.one}</h2>

      <Field label="Flavour">
        {wholeCakes.flavours.map((id) => (
          <Chip key={id} selected={flavour === id} onClick={() => setFlavour(id)}>
            {flavourById(id).name}
          </Chip>
        ))}
      </Field>

      {sizes.length > 0 && (
        <Field label="Size">
          {sizes.map((choice) => (
            <Chip key={choice.id} selected={size === choice.id} onClick={() => setSize(choice.id)}>
              {choice.label}
              {choice.price !== null && <span className="opacity-80"> · {formatPrice(choice.price)}</span>}
            </Chip>
          ))}
        </Field>
      )}

      <label className="mt-6 block">
        <span className="label-caps opacity-80">Date you would like it</span>
        <input
          type="date"
          className="mt-3 block w-full rounded-2xl border border-wine/40 bg-cream p-3 text-sm"
          min={earliest}
          required
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
        <span className="mt-1 block text-xs opacity-80">{wholeCakes.leadTimeShort}.</span>
      </label>

      <label className="mt-6 block">
        <span className="label-caps opacity-80">Message on the cake (optional)</span>
        <input
          type="text"
          className="mt-3 block w-full rounded-2xl border border-wine/40 bg-cream p-3 text-sm"
          maxLength={wholeCakes.messageLimit}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <span className="mt-1 block text-right text-xs opacity-80">
          {message.length} / {wholeCakes.messageLimit}
        </span>
      </label>

      <div className="mt-8 flex flex-col items-center gap-3">
        {sizes.every((choice) => choice.price === null) && (
          <p className="label-caps rounded-full border border-wine px-4 py-2">{wholeCakes.priceLater}</p>
        )}
        <button
          type="button"
          className="label-caps rounded-full bg-wine px-8 py-4 text-cream transition-opacity disabled:opacity-40"
          disabled={!ready}
          onClick={add}
        >
          Add to order
        </button>
        <p className="h-5 text-sm" role="status">
          {added ? 'Added to your order.' : !ready ? 'Pick a flavour and a date to add it.' : ''}
        </p>
      </div>
    </div>
  );
}
