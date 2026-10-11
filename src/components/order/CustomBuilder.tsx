import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState, type ReactNode } from 'react';
import {
  comboLayers,
  customOptions,
  customPriceNote,
  giftNoteLimit,
  type ComboLayer,
  type CustomOptionId,
} from '../../content/custom';
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

type Layers = Partial<Record<ComboLayer['id'], string>>;

// The bite, built up one layer at a time as choices are made.
function ComboBite({ layers }: { layers: Layers }) {
  const colour = (layer: ComboLayer['id']): string | null | undefined =>
    comboLayers.find((group) => group.id === layer)?.choices.find((choice) => choice.id === layers[layer])?.colour;
  const drop = {
    initial: { y: -60, opacity: 0, scaleY: 1.3 },
    animate: { y: 0, opacity: 1, scaleY: 1 },
    exit: { opacity: 0, scale: 0.8 },
    transition: { type: 'spring', stiffness: 420, damping: 14 },
  } as const;
  const base = colour('base');
  const filling = colour('filling');
  const centreColour = colour('centre');
  const topping = colour('topping');

  return (
    <div className="mx-auto flex h-44 w-40 flex-col items-center justify-end" aria-hidden="true">
      <AnimatePresence>
        {topping && (
          <motion.div key={`topping-${topping}`} className="flex gap-1.5 pb-0.5" {...drop}>
            {[0, 1, 2, 3, 4].map((piece) => (
              <span
                key={piece}
                className="size-4 rounded-full border border-wine"
                style={{ backgroundColor: topping, translate: `0 ${piece % 2 ? 3 : 0}px` }}
              />
            ))}
          </motion.div>
        )}
        {filling && (
          <motion.div
            key={`filling-${filling}`}
            className="relative flex h-20 w-36 items-center justify-center rounded-t-2xl border-[1.5px] border-wine"
            style={{ backgroundColor: filling }}
            {...drop}
          >
            <AnimatePresence>
              {centreColour && (
                <motion.span
                  key={centreColour}
                  className="size-9 rounded-full border-[1.5px] border-wine"
                  style={{ backgroundColor: centreColour }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 14 }}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
        {base && (
          <motion.div
            key={`base-${base}`}
            className="h-6 w-36 rounded-b-xl border-[1.5px] border-wine"
            style={{ backgroundColor: base }}
            {...drop}
          />
        )}
      </AnimatePresence>
      {!base && !filling && !topping && <p className="pb-10 text-center text-sm opacity-70">Your bite builds up here.</p>}
    </div>
  );
}

// A round cake split down the middle in the two flavours' colours.
function HalfCake({ left, right }: { left?: FlavourId; right?: FlavourId }) {
  const empty = 'var(--color-cream)';
  return (
    <svg className="mx-auto w-40 text-wine" viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <motion.path d="M60 6A54 54 0 0 0 60 114Z" animate={{ fill: left ? flavourById(left).accent : empty }} />
      <motion.path d="M60 6A54 54 0 0 1 60 114Z" animate={{ fill: right ? flavourById(right).accent : empty }} />
      <circle cx="60" cy="60" r="44" strokeWidth="1" stroke="var(--color-cream)" opacity="0.6" />
      <path d="M60 2V118" strokeDasharray="4 4" stroke="var(--color-cream)" />
    </svg>
  );
}

export default function CustomBuilder({ type, onType }: Props) {
  const option = optionById(type);
  const sizes = option.sizes ?? [];

  const [layers, setLayers] = useState<Layers>({ centre: 'none' });
  const [halves, setHalves] = useState<[FlavourId?, FlavourId?]>([]);
  const [size, setSize] = useState<number | undefined>(sizes[0]);
  const [mix, setMix] = useState<FlavourId[]>(allFlavours);
  const [note, setNote] = useState('');
  const [added, setAdded] = useState(false);

  // Each option starts from a clean form.
  useEffect(() => {
    setLayers({ centre: 'none' });
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

  const layerName = (layer: ComboLayer): string | undefined =>
    layer.choices.find((choice) => choice.id === layers[layer.id])?.name;

  // What will be added, or null while the form is incomplete.
  const details = ((): string[] | null => {
    switch (type) {
      case 'combo':
        return comboLayers.every(layerName)
          ? comboLayers.map((layer) => `${layer.name}: ${layerName(layer)}`)
          : null;
      case 'half-and-half': {
        const [left, right] = halves;
        return left && right ? [`${flavourById(left).name} + ${flavourById(right).name}`] : null;
      }
      case 'gift-box':
        return size
          ? [`${size} bites`, `Flavours: ${flavourNames(mix)}`, ...(note.trim() ? [`Note: ${note.trim()}`] : [])]
          : null;
      case 'party-platter':
        return size ? [`${size} bites`, `Even mix of: ${flavourNames(mix)}`] : null;
    }
  })();

  const add = (): void => {
    if (!details) return;
    addCustom({ type, title: option.name, details });
    setAdded(true);
    setLayers({ centre: 'none' });
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
          <p className="mt-1 text-center text-sm">{option.description}</p>

          {type === 'combo' && (
            <>
              <div className="mt-6">
                <ComboBite layers={layers} />
              </div>
              {comboLayers.map((layer) => (
                <Field key={layer.id} label={layer.name}>
                  {layer.choices.map((choice) => (
                    <Chip
                      key={choice.id}
                      selected={layers[layer.id] === choice.id}
                      onClick={() => setLayers({ ...layers, [layer.id]: choice.id })}
                    >
                      {choice.name}
                    </Chip>
                  ))}
                </Field>
              ))}
            </>
          )}

          {type === 'half-and-half' && (
            <>
              <div className="mt-6">
                <HalfCake left={halves[0]} right={halves[1]} />
              </div>
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
              <Field label="How many bites">
                {sizes.map((choice) => (
                  <Chip key={choice} selected={size === choice} onClick={() => setSize(choice)}>
                    {choice} bites
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
              <span className="mt-1 block text-right text-xs opacity-70">
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
              whileTap={{ scaleX: 1.07, scaleY: 0.88 }}
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
