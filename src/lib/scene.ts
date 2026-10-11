import { reducedMotion } from './motion';

type CleanUp = (() => void) | void;

// Runs `build` for every element matching `selector` once it is about a
// screen away, on each page load. Skipped entirely for reduced motion, so the
// markup's own finished state is what those visitors see. ScrollTriggers are
// removed globally on page change; return a function for any other clean-up.
export const lazyScene = (selector: string, build: (scene: HTMLElement) => CleanUp): void => {
  document.addEventListener('astro:page-load', () => {
    if (reducedMotion()) return;

    const scenes = document.querySelectorAll<HTMLElement>(selector);
    if (!scenes.length) return;

    const cleanUps: CleanUp[] = [];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          cleanUps.push(build(entry.target as HTMLElement));
        }
      },
      { rootMargin: '100% 0px' },
    );
    scenes.forEach((scene) => observer.observe(scene));

    document.addEventListener(
      'astro:before-swap',
      () => {
        observer.disconnect();
        cleanUps.forEach((cleanUp) => cleanUp?.());
      },
      { once: true },
    );
  });
};
