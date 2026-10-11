// Lets scenes wait for the page curtain to clear before they start.
let clear: Promise<void> = Promise.resolve();

export const setCurtainBusy = (untilClear: Promise<void>): void => {
  clear = untilClear;
};

export const curtainClear = (): Promise<void> => clear;
