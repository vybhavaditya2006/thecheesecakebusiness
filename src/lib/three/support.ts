import { reducedMotion } from '../motion';

// The cheap checks, kept apart from the rest of the kit so that three.js is
// only downloaded when it is going to be used.

// For testing on slow machines: ?force3d skips the frame-rate check. Read once,
// as the page loads, because /box rewrites its own query string.
const forced = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('force3d');
export const forced3D = (): boolean => forced;

let webgl2: boolean | undefined;

const hasWebGL2 = (): boolean => {
  if (webgl2 === undefined) {
    try {
      webgl2 = Boolean(document.createElement('canvas').getContext('webgl2'));
    } catch {
      webgl2 = false;
    }
  }
  return webgl2;
};

// Once a page has run too slowly, stay on the 2D versions for the visit.
let tooSlow = false;
export const markTooSlow = (): void => {
  tooSlow = true;
};

// 3D is used only with WebGL2 and motion allowed; otherwise the 2D versions stay.
export const canUse3D = (): boolean => !reducedMotion() && !tooSlow && hasWebGL2();

// Phones get a lower pixel-ratio cap.
export const isPhone = (): boolean => window.matchMedia('(pointer: coarse), (max-width: 48rem)').matches;

// Calls back once the element is within a screen of the viewport.
export const whenNear = (element: Element, callback: () => void): (() => void) => {
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      callback();
    },
    { rootMargin: '100% 0px' },
  );
  observer.observe(element);
  return () => observer.disconnect();
};
