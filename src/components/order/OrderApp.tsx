// Scene 5: pack your box. The only React island on the site.
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { useEffect, useState } from 'react';
import { customOptions, isCustomOptionId, type CustomOptionId } from '../../content/custom';
import BoxBuilder from './BoxBuilder';
import CustomBuilder from './CustomBuilder';
import DetailsForm from './DetailsForm';
import OrderSummary from './OrderSummary';
import { BiteImagesContext, type BiteImages } from './parts';

type Tab = 'box' | 'custom';

const tabs: readonly { id: Tab; label: string }[] = [
  { id: 'box', label: 'Build a box' },
  { id: 'custom', label: 'Custom' },
];

// /box?tab=custom&type=<option> opens straight on a custom option.
const fromUrl = (): { tab: Tab; type: CustomOptionId } => {
  const params = new URLSearchParams(window.location.search);
  const type = params.get('type');
  return {
    tab: params.get('tab') === 'custom' ? 'custom' : 'box',
    type: isCustomOptionId(type) ? type : customOptions[0]!.id,
  };
};

export default function OrderApp({ biteImages = {} }: { biteImages?: BiteImages }) {
  const [tab, setTab] = useState<Tab>(() => fromUrl().tab);
  const [type, setType] = useState<CustomOptionId>(() => fromUrl().type);

  // Keep the address in step, so the current view can be shared or reloaded.
  useEffect(() => {
    const query = tab === 'custom' ? `?tab=custom&type=${type}` : '';
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${query}`);
  }, [tab, type]);

  return (
    <MotionConfig reducedMotion="user">
      <BiteImagesContext.Provider value={biteImages}>
      <div className="mx-auto grid max-w-6xl items-start gap-10 px-5 pb-28 lg:grid-cols-[1fr_20rem] lg:pb-16">
        <div>
          <div
            className="mx-auto flex w-fit rounded-full border border-wine p-1"
            role="tablist"
            aria-label="Order type"
            // Arrow keys move between tabs, as screen-reader users expect.
            onKeyDown={(event) => {
              if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
              const next = tab === 'box' ? 'custom' : 'box';
              setTab(next);
              event.currentTarget.querySelector<HTMLElement>(`#tab-${next}`)?.focus();
            }}
          >
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`tab-${item.id}`}
                aria-selected={tab === item.id}
                tabIndex={tab === item.id ? 0 : -1}
                aria-controls="order-panel"
                className={`label-caps relative rounded-full px-5 py-3 transition-colors ${tab === item.id ? 'text-cream' : 'text-wine'}`}
                onClick={() => setTab(item.id)}
              >
                {tab === item.id && (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-full bg-wine"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  />
                )}
                <span className="relative">{item.label}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              id="order-panel"
              role="tabpanel"
              aria-labelledby={`tab-${tab}`}
              className="mt-4 sm:mt-8"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.2 }}
            >
              {tab === 'box' ? <BoxBuilder /> : <CustomBuilder type={type} onType={setType} />}
            </motion.div>
          </AnimatePresence>

          {/* Shared by both tabs, so switching never loses what was typed. */}
          <DetailsForm />
        </div>

        <OrderSummary />
      </div>
      </BiteImagesContext.Provider>
    </MotionConfig>
  );
}
