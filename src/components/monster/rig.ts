import gsap from 'gsap';
import type { Mood } from './markup';

// The Crumb Monster's rig. Each mood is a pose plus, when motion is allowed,
// a short animation on top of it. Only transforms and opacity are touched.

export interface Monster {
  mood: (mood: Mood) => void;
  destroy: () => void;
}

type Timeline = gsap.core.Timeline;

export function createMonster(svg: SVGSVGElement, calm = false): Monster {
  const part = (name: string): SVGElement[] => Array.from(svg.querySelectorAll<SVGElement>(`[data-m="${name}"]`));
  const root = part('root');
  const armLeft = part('arm-l');
  const armRight = part('arm-r');
  const thumb = part('thumb');
  const eyes = part('eye');
  const pupils = part('pupil');
  const mouth = part('mouth');
  const tongue = part('tongue');
  const all = [root, armLeft, armRight, thumb, eyes, pupils, mouth, tongue].flat();

  // Where each part turns or scales from.
  gsap.set(root, { transformOrigin: '50% 100%' });
  gsap.set(armLeft, { transformOrigin: '100% 0%' });
  gsap.set(armRight, { transformOrigin: '0% 0%' });
  gsap.set(thumb, { transformOrigin: '0% 100%' });
  gsap.set(eyes, { transformOrigin: '50% 50%' });
  gsap.set(mouth, { transformOrigin: '50% 0%' });
  gsap.set(tongue, { transformOrigin: '50% 0%' });

  const rest = (): void => {
    gsap.set(root, { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 });
    gsap.set([armLeft, armRight], { rotation: 0, opacity: 1 });
    gsap.set(thumb, { opacity: 0, scale: 1 });
    gsap.set(pupils, { x: 0, y: 0 });
    gsap.set(mouth, { scaleY: 0.45 });
    gsap.set(tongue, { opacity: 0, x: 0, rotation: 0 });
  };

  // Arms swing up from the shoulder: clockwise on the left, the other way on the right.
  const raise = (degrees: number): void => {
    gsap.set(armLeft, { rotation: degrees });
    gsap.set(armRight, { rotation: -degrees });
  };

  const moods: Record<Mood, { pose: () => void; play?: (timeline: Timeline) => void }> = {
    // Arms up, mouth open, looking up at whatever might be dropped in.
    hungry: {
      pose: () => {
        raise(55);
        gsap.set(mouth, { scaleY: 0.9 });
        gsap.set(pupils, { y: -5 });
      },
      play: (timeline) => {
        timeline
          .to(root, { y: -5, duration: 0.5, ease: 'sine.inOut', repeat: -1, yoyo: true }, 0)
          .to(armLeft, { rotation: 70, duration: 0.25, ease: 'sine.inOut', repeat: -1, yoyo: true }, 0)
          .to(armRight, { rotation: -70, duration: 0.25, ease: 'sine.inOut', repeat: -1, yoyo: true }, 0);
      },
    },

    // One big bite: wide open, then snapped shut with a squash.
    chomp: {
      pose: () => gsap.set(mouth, { scaleY: 0.2 }),
      play: (timeline) => {
        timeline
          .fromTo(mouth, { scaleY: 0.9 }, { scaleY: 1.7, duration: 0.09, ease: 'power2.out' })
          .to(mouth, { scaleY: 0.12, duration: 0.06, ease: 'power3.in' })
          .to(root, { scaleX: 1.08, scaleY: 0.9, duration: 0.05 }, '<')
          .to(root, { scaleX: 1, scaleY: 1, duration: 0.12, ease: 'back.out(3)' });
      },
    },

    chew: {
      pose: () => {
        gsap.set(mouth, { scaleY: 0.3 });
        gsap.set(pupils, { y: 2 });
      },
      play: (timeline) => {
        timeline
          .to(mouth, { scaleY: 0.75, duration: 0.11, ease: 'sine.inOut', repeat: -1, yoyo: true }, 0)
          .to(root, { scaleX: 1.04, scaleY: 0.96, duration: 0.11, ease: 'sine.inOut', repeat: -1, yoyo: true }, 0);
      },
    },

    'thumbs-up': {
      pose: () => {
        gsap.set(armRight, { opacity: 0 });
        gsap.set(thumb, { opacity: 1 });
        gsap.set(mouth, { scaleY: 0.8 });
      },
      play: (timeline) => {
        timeline
          .from(thumb, { scale: 0, duration: 0.25, ease: 'back.out(2.5)' }, 0)
          .to(root, { y: -9, duration: 0.12, ease: 'power2.out', repeat: 1, yoyo: true }, 0);
      },
    },

    // Only the eyes and the top of the head show above the bottom edge.
    peek: {
      pose: () => gsap.set(root, { y: 98 }),
      play: (timeline) => {
        timeline
          .from(root, { y: 200, duration: 0.45, ease: 'back.out(1.6)' }, 0)
          .to(pupils, { x: -6, duration: 0.3, ease: 'sine.inOut' }, 0.7)
          .to(pupils, { x: 6, duration: 0.5, ease: 'sine.inOut', repeat: -1, yoyo: true, repeatDelay: 0.6 });
      },
    },

    // Full, and licking its lips.
    lick: {
      pose: () => {
        gsap.set(mouth, { scaleY: 0.6 });
        gsap.set(tongue, { opacity: 1, x: -12, rotation: 14 });
        gsap.set(pupils, { y: 3 });
      },
      play: (timeline) => {
        timeline.to(
          tongue,
          { x: 12, rotation: -14, duration: 0.5, ease: 'sine.inOut', repeat: -1, yoyo: true, repeatDelay: 0.25 },
          0,
        );
      },
    },
  };

  let playing: Timeline | undefined;
  const blink = calm
    ? undefined
    : gsap
        .timeline({ repeat: -1, repeatDelay: 2.6, delay: 1.2 })
        .to(eyes, { scaleY: 0.1, duration: 0.07 })
        .to(eyes, { scaleY: 1, duration: 0.1 });

  rest();

  return {
    mood: (mood) => {
      playing?.kill();
      rest();
      moods[mood].pose();
      const play = moods[mood].play;
      if (calm || !play) return;
      playing = gsap.timeline();
      play(playing);
    },
    destroy: () => {
      playing?.kill();
      blink?.kill();
      gsap.killTweensOf(all);
    },
  };
}
