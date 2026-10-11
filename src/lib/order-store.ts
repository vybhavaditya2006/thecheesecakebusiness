import { computed, map } from 'nanostores';
import { flavours, type FlavourId } from '../content/flavours';
import { priceFor } from '../content/pricing';

export type OrderItems = Record<FlavourId, number>;

const emptyOrder = (): OrderItems =>
  Object.fromEntries(flavours.map((flavour) => [flavour.id, 0])) as OrderItems;

// Number of bites chosen per flavour.
export const $order = map<OrderItems>(emptyOrder());

export const $totalBites = computed($order, (items) =>
  Object.values(items).reduce((sum, quantity) => sum + quantity, 0),
);

export const $totalPrice = computed($totalBites, (bites) => priceFor(bites));

export const setQuantity = (id: FlavourId, quantity: number): void => {
  $order.setKey(id, Math.max(0, Math.floor(quantity)));
};

export const addBite = (id: FlavourId): void => setQuantity(id, $order.get()[id] + 1);

export const removeBite = (id: FlavourId): void => setQuantity(id, $order.get()[id] - 1);

export const clearOrder = (): void => $order.set(emptyOrder());
