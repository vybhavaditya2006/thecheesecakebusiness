import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reducedMotion } from './motion';

gsap.registerPlugin(ScrollTrigger);

// Numbers that count up as they come into view. Mark the element holding the
// number with data-count: whatever comes before and after the digits (a ₹, a
// unit) is kept. The page's own text is the final value, so with reduced
// motion, or without scripts, the number is simply there.
document.addEventListener('astro:page-load', () => {
  if (reducedMotion()) return;

  for (const element of document.querySelectorAll<HTMLElement>('[data-count]')) {
    const [, before = '', digits = '', after = ''] = /^(\D*)(\d+)(.*)$/s.exec(element.textContent ?? '') ?? [];
    const total = Number(digits);
    if (!total) continue;

    const count = { value: 0 };
    gsap.to(count, {
      value: total,
      duration: 1.1,
      ease: 'power2.out',
      snap: { value: 1 },
      scrollTrigger: { trigger: element, start: 'top 90%', once: true },
      onUpdate: () => {
        element.textContent = `${before}${count.value}${after}`;
      },
    });
  }
});
