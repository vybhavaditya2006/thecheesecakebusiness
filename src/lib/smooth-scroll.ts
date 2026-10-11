import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { reducedMotion } from './motion';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;
let tickerAttached = false;

const raf = (time: number): void => {
  lenis?.raf(time * 1000);
};

export const getLenis = (): Lenis | null => lenis;

// Called on every page load. Reduced motion keeps native scrolling.
export const startSmoothScroll = (): void => {
  if (lenis || reducedMotion()) return;

  lenis = new Lenis();
  lenis.on('scroll', ScrollTrigger.update);

  if (!tickerAttached) {
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    // Capture phase, so this runs before Astro's router jumps to the hash.
    document.addEventListener('click', glideToAnchor, true);
    tickerAttached = true;
  }
};

// Same-page jump links glide with Lenis instead of jumping.
const glideToAnchor = (event: MouseEvent): void => {
  if (!lenis || event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  const link = (event.target as Element).closest?.<HTMLAnchorElement>('a[href*="#"]');
  if (!link || link.target || link.origin !== location.origin) return;
  if (link.pathname !== location.pathname || link.hash.length < 2) return;

  const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
  if (!target) return;

  event.preventDefault();
  if (link.hash !== location.hash) history.pushState(history.state, '', link.hash);
  lenis.scrollTo(target);
  // Keep what a plain jump link does for keyboard users: move focus too.
  if (target.hasAttribute('tabindex')) target.focus({ preventScroll: true });
};

// Called before a page swap: drops the old page's ScrollTriggers and Lenis.
export const stopSmoothScroll = (): void => {
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  lenis?.destroy();
  lenis = null;
};
