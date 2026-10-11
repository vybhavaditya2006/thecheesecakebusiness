import { computed, map } from 'nanostores';
import { flavours, type FlavourId } from '../content/flavours';
import { priceFor } from '../content/pricing';

export type OrderItems = Record<FlavourId, number>;

const STORAGE_KEY = 'order';
const inBrowser = typeof window !== 'undefined';

const emptyOrder = (): OrderItems =>
  Object.fromEntries(flavours.map((flavour) => [flavour.id, 0])) as OrderItems;

// The box is kept in local storage so it survives reloads and page changes.
const savedOrder = (): OrderItems => {
  const order = emptyOrder();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    for (const flavour of flavours) {
      const quantity = Number(saved?.[flavour.id]);
      if (Number.isInteger(quantity) && quantity > 0) order[flavour.id] = quantity;
    }
  } catch {
    // Storage blocked or corrupt: start with an empty box.
  }
  return order;
};

// Number of bites chosen per flavour.
export const $order = map<OrderItems>(inBrowser ? savedOrder() : emptyOrder());

if (inBrowser) {
  $order.listen((items) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage blocked: the box just won't survive a reload.
    }
  });
}

export const $totalBites = computed($order, (items) =>
  Object.values(items).reduce((sum, quantity) => sum + quantity, 0),
);

export const $totalPrice = computed($totalBites, (bites) => priceFor(bites));

export const isFlavourId = (id: unknown): id is FlavourId =>
  flavours.some((flavour) => flavour.id === id);

export const setQuantity = (id: FlavourId, quantity: number): void => {
  $order.setKey(id, Math.max(0, Math.floor(quantity)));
};

export const addBite = (id: FlavourId): void => setQuantity(id, $order.get()[id] + 1);

export const removeBite = (id: FlavourId): void => setQuantity(id, $order.get()[id] - 1);

export const clearOrder = (): void => $order.set(emptyOrder());
