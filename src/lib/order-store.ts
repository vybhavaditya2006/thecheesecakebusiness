import { atom, computed } from 'nanostores';
import { isCustomOptionId, type CustomOptionId } from '../content/custom';
import { flavours, type FlavourId } from '../content/flavours';
import { priceFor, pricing } from '../content/pricing';
import { isWholeCakeFlavour, wholeCakes, wholeCakeSize } from '../content/whole-cakes';

// A custom request; priced and confirmed on WhatsApp, never here.
export interface CustomRequest {
  id: string;
  type: CustomOptionId;
  title: string;
  details: string[];
}

// A whole cheesecake. Its price comes from its size, if that has one;
// otherwise it is confirmed on WhatsApp.
export interface WholeCakeOrder {
  id: string;
  flavour: FlavourId;
  // A size id from src/content/whole-cakes.ts, once sizes exist.
  size?: string;
  // The date the customer would like, as YYYY-MM-DD; confirmed on WhatsApp.
  date: string;
  // Written on the cake.
  message?: string;
}

interface SavedOrder {
  bites: FlavourId[];
  custom: CustomRequest[];
  whole: WholeCakeOrder[];
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

const isWholeCakeOrder = (value: unknown): value is WholeCakeOrder => {
  const cake = value as WholeCakeOrder | null;
  return (
    typeof cake?.id === 'string' &&
    isWholeCakeFlavour(cake.flavour) &&
    (cake.size === undefined || Boolean(wholeCakeSize(cake.size))) &&
    typeof cake.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(cake.date) &&
    (cake.message === undefined || (typeof cake.message === 'string' && cake.message.length <= wholeCakes.messageLimit))
  );
};

// The order is kept in local storage so it survives reloads and page changes.
const savedOrder = (): SavedOrder => {
  const order: SavedOrder = { bites: [], custom: [], whole: [], singles: false };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');

    if (Array.isArray(saved?.bites)) {
      order.bites = saved.bites.filter(isFlavourId);
      order.custom = Array.isArray(saved.custom) ? saved.custom.filter(isCustomRequest) : [];
      order.whole = Array.isArray(saved.whole) ? saved.whole.filter(isWholeCakeOrder) : [];
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

const initial: SavedOrder = inBrowser ? savedOrder() : { bites: [], custom: [], whole: [], singles: false };

// Every bite in the order, in the order it was added. Each run of five is a box.
export const $bites = atom<FlavourId[]>(initial.bites);
export const $custom = atom<CustomRequest[]>(initial.custom);
export const $wholeCakes = atom<WholeCakeOrder[]>(initial.whole);
// "Just singles": show counters instead of the box. It does not change the price.
export const $singlesMode = atom<boolean>(initial.singles);

if (inBrowser) {
  const save = (): void => {
    const order: SavedOrder = {
      bites: $bites.get(),
      custom: $custom.get(),
      whole: $wholeCakes.get(),
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
  $wholeCakes.listen(save);
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

export const addWholeCake = (cake: Omit<WholeCakeOrder, 'id'>): void =>
  $wholeCakes.set([...$wholeCakes.get(), { ...cake, id: `${Date.now()}-${$wholeCakes.get().length}` }]);

export const removeWholeCake = (id: string): void =>
  $wholeCakes.set($wholeCakes.get().filter((cake) => cake.id !== id));

// A whole cheesecake's price, or null when it is to be confirmed.
export const wholeCakePrice = (cake: WholeCakeOrder): number | null => wholeCakeSize(cake.size)?.price ?? null;

// What the priced whole cheesecakes add to the total, and whether any are
// still to be priced.
export const wholeCakeTotals = (cakes: readonly WholeCakeOrder[]): { priced: number; unpriced: number } =>
  cakes.reduce(
    (totals, cake) => {
      const price = wholeCakePrice(cake);
      return price === null
        ? { ...totals, unpriced: totals.unpriced + 1 }
        : { ...totals, priced: totals.priced + price };
    },
    { priced: 0, unpriced: 0 },
  );

export const clearOrder = (): void => {
  $bites.set([]);
  $custom.set([]);
  $wholeCakes.set([]);
};

// How many of each flavour, in menu order, leaving out the ones not chosen.
export const countByFlavour = (bites: readonly FlavourId[]) =>
  flavours
    .map((flavour) => ({ flavour, count: bites.filter((id) => id === flavour.id).length }))
    .filter((line) => line.count > 0);
