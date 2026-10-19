import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState, type ReactNode } from 'react';
import { customOptions, customPriceNote, giftNoteLimit, ideaLimit, type CustomOptionId } from '../../content/custom';
import { flavourById, flavours, type FlavourId } from '../../content/flavours';
import { addCustom } from '../../lib/order-store';
import { Chip } from './parts';

interface Props {
  type: CustomOptionId;
  onType: (type: CustomOptionId) => void;
}

const optionById = (id: CustomOptionId) => customOptions.find((option) => option.id === id)!;
const allFlavours = flavours.map((flavour) => flavour.id);
const flavourNames = (ids: readonly FlavourId[]): string =>
  flavours
    .filter((flavour) => ids.includes(flavour.id))
    .map((flavour) => flavour.name)
    .join(', ');

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="mt-6">
      <legend className="label-caps opacity-80">{label}</legend>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

// Tick which flavours to include; at least one stays ticked.
function FlavourMix({ value, onChange }: { value: FlavourId[]; onChange: (next: FlavourId[]) => void }) {
  return (
    <Field label="Flavours to include">
      {flavours.map((flavour) => {
        const selected = value.includes(flavour.id);
        return (
          <Chip
            key={flavour.id}
            selected={selected}
            disabled={selected && value.length === 1}
            onClick={() => onChange(selected ? value.filter((id) => id !== flavour.id) : [...value, flavour.id])}
          >
            {flavour.name}
          </Chip>
        );
      })}
    </Field>
  );
}

export default function CustomBuilder({ type, onType }: Props) {
  const option = optionById(type);
  const sizes = option.sizes ?? [];

  const [idea, setIdea] = useState('');
  const [halves, setHalves] = useState<[FlavourId?, FlavourId?]>([]);
  const [size, setSize] = useState<number | undefined>(sizes[0]);
  const [mix, setMix] = useState<FlavourId[]>(allFlavours);
  const [note, setNote] = useState('');
  const [added, setAdded] = useState(false);

  // Each option starts from a clean form.
  useEffect(() => {
    setIdea('');
    setHalves([]);
    setSize(optionById(type).sizes?.[0]);
    setMix(allFlavours);
    setNote('');
  }, [type]);

  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => setAdded(false), 2200);
    return () => window.clearTimeout(timer);
  }, [added]);

  // What will be added, or null while the form is incomplete.
  const details = ((): string[] | null => {
    switch (type) {
      case 'build-your-own':
        return idea.trim() ? [`Idea: ${idea.trim()}`] : null;
      case 'half-and-half': {
        const [left, right] = halves;
        return left && right ? [`${flavourById(left).name} + ${flavourById(right).name}`] : null;
      }
      case 'gift-box':
        return size
          ? [`${size} pieces`, `Flavours: ${flavourNames(mix)}`, ...(note.trim() ? [`Note: ${note.trim()}`] : [])]
          : null;
      case 'party-platter':
        return size ? [`${size} pieces`, `Even mix of: ${flavourNames(mix)}`] : null;
    }
  })();

  const add = (): void => {
    if (!details) return;
    addCustom({ type, title: option.name, details });
    setAdded(true);
    setIdea('');
    setHalves([]);
    setNote('');
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Kind of custom order">
        {customOptions.map((choice) => (
          <Chip key={choice.id} selected={choice.id === type} onClick={() => onType(choice.id)}>
            {choice.name}
          </Chip>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={type}
          className="mt-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.2 }}
        >
          <h2 className="text-center text-3xl">{option.name}</h2>

          {type === 'build-your-own' && (
            // Shlok has not yet said which bases, fillings and toppings he
            // offers, so the customer describes the bite in their own words.
            <label className="mt-6 block">
              <span className="label-caps opacity-80">The bite you would like</span>
              <textarea
                className="mt-3 block w-full rounded-2xl border border-wine/40 bg-cream p-3 text-sm"
                rows={3}
                maxLength={ideaLimit}
                placeholder="The base, filling, centre and topping you have in mind"
                value={idea}
                onChange={(event) => setIdea(event.target.value)}
              />
              <span className="mt-1 block text-right text-xs opacity-80">
                {idea.length} / {ideaLimit}
              </span>
            </label>
          )}

          {type === 'half-and-half' && (
            <>
              {(['First half', 'Second half'] as const).map((label, half) => (
                <Field key={label} label={label}>
                  {flavours.map((flavour) => (
                    <Chip
                      key={flavour.id}
                      selected={halves[half] === flavour.id}
                      // The two halves must be different flavours.
                      disabled={halves[1 - half] === flavour.id}
                      onClick={() => setHalves(half === 0 ? [flavour.id, halves[1]] : [halves[0], flavour.id])}
                    >
                      {flavour.name}
                    </Chip>
                  ))}
                </Field>
              ))}
            </>
          )}

          {(type === 'gift-box' || type === 'party-platter') && (
            <>
              <Field label="How many pieces">
                {sizes.map((choice) => (
                  <Chip key={choice} selected={size === choice} onClick={() => setSize(choice)}>
                    {choice} pieces
                  </Chip>
                ))}
              </Field>
              <FlavourMix value={mix} onChange={setMix} />
            </>
          )}

          {type === 'gift-box' && (
            <label className="mt-6 block">
              <span className="label-caps opacity-80">Gift note (optional)</span>
              <textarea
                className="mt-3 block w-full rounded-2xl border border-wine/40 bg-cream p-3 text-sm"
                rows={3}
                maxLength={giftNoteLimit}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
              <span className="mt-1 block text-right text-xs opacity-80">
                {note.length} / {giftNoteLimit}
              </span>
            </label>
          )}

          <div className="mt-8 flex flex-col items-center gap-3">
            <p className="label-caps rounded-full border border-wine px-4 py-2">{customPriceNote}</p>
            <motion.button
              type="button"
              className="label-caps rounded-full bg-wine px-8 py-4 text-cream disabled:opacity-40"
              disabled={!details}
              onClick={add}
            >
              Add to order
            </motion.button>
            <p className="h-5 text-sm" role="status">
              {added ? 'Added to your order.' : !details ? 'Make your choices above to add it.' : ''}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
