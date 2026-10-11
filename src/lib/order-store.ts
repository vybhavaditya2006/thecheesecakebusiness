import { atom, computed } from 'nanostores';
import { isCustomOptionId, type CustomOptionId } from '../content/custom';
import { flavours, type FlavourId } from '../content/flavours';
import { priceFor, pricing } from '../content/pricing';

// A custom request; priced and confirmed on WhatsApp, never here.
export interface CustomRequest {
  id: string;
  type: CustomOptionId;
  title: string;
  details: string[];
}

interface SavedOrder {
  bites: FlavourId[];
  custom: CustomRequest[];
  singles: boolean;
}

const STORAGE_KEY = 'order';
const inBrowser = typeof window !== 'undefined';

export const isFlavourId = (id: unknown): id is FlavourId =>
  flavours.some((flavour) => flavour.id === id);

const isCustomRequest = (value: unknown): value is CustomRequest => {
  const request = value as CustomRequest | null;
  return (
    typeof request?.id === 'string' &&
    isCustomOptionId(request.type) &&
    typeof request.title === 'string' &&
    Array.isArray(request.details) &&
    request.details.every((detail) => typeof detail === 'string')
  );
};

// The order is kept in local storage so it survives reloads and page changes.
const savedOrder = (): SavedOrder => {
  const order: SavedOrder = { bites: [], custom: [], singles: false };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');

    if (Array.isArray(saved?.bites)) {
      order.bites = saved.bites.filter(isFlavourId);
      order.custom = Array.isArray(saved.custom) ? saved.custom.filter(isCustomRequest) : [];
      order.singles = saved.singles === true;
    } else {
      // Older format: a count per flavour.
      for (const flavour of flavours) {
        const quantity = Number(saved?.[flavour.id]);
        if (Number.isInteger(quantity) && quantity > 0) {
          order.bites.push(...Array<FlavourId>(quantity).fill(flavour.id));
        }
      }
    }
  } catch {
    // Storage blocked or corrupt: start with an empty order.
  }
  return order;
};

const initial: SavedOrder = inBrowser ? savedOrder() : { bites: [], custom: [], singles: false };

// Every bite in the order, in the order it was added. Each run of five is a box.
export const $bites = atom<FlavourId[]>(initial.bites);
export const $custom = atom<CustomRequest[]>(initial.custom);
// "Just singles": show counters instead of the box. It does not change the price.
export const $singlesMode = atom<boolean>(initial.singles);

if (inBrowser) {
  const save = (): void => {
    const order: SavedOrder = {
      bites: $bites.get(),
      custom: $custom.get(),
      singles: $singlesMode.get(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
    } catch {
      // Storage blocked: the order just won't survive a reload.
    }
  };
  $bites.listen(save);
  $custom.listen(save);
  $singlesMode.listen(save);
}

export const $totalBites = computed($bites, (bites) => bites.length);
export const $totalPrice = computed($totalBites, (bites) => priceFor(bites));

export const addBite = (id: FlavourId): void => $bites.set([...$bites.get(), id]);

export const removeBiteAt = (index: number): void =>
  $bites.set($bites.get().filter((_, position) => position !== index));

// Removes the most recently added bite of a flavour.
export const removeBite = (id: FlavourId): void => {
  const index = $bites.get().lastIndexOf(id);
  if (index >= 0) removeBiteAt(index);
};

// Removes a whole packed box (the nth run of five).
export const removeBox = (box: number): void => {
  const size = pricing.box.bites;
  $bites.set($bites.get().filter((_, position) => Math.floor(position / size) !== box));
};

export const addCustom = (request: Omit<CustomRequest, 'id'>): void =>
  $custom.set([...$custom.get(), { ...request, id: `${Date.now()}-${$custom.get().length}` }]);

export const removeCustom = (id: string): void =>
  $custom.set($custom.get().filter((request) => request.id !== id));

export const clearOrder = (): void => {
  $bites.set([]);
  $custom.set([]);
};

// How many of each flavour, in menu order, leaving out the ones not chosen.
export const countByFlavour = (bites: readonly FlavourId[]) =>
  flavours
    .map((flavour) => ({ flavour, count: bites.filter((id) => id === flavour.id).length }))
    .filter((line) => line.count > 0);
