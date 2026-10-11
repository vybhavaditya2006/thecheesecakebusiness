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
  gsap.set(mouth, { transformOrigin: '50% 50%' });
  gsap.set(tongue, { transformOrigin: '50% 0%' });

  // At rest the mouth is a closed line.
  const CLOSED = 0.12;

  const rest = (): void => {
    gsap.set(root, { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 });
    gsap.set([armLeft, armRight], { rotation: 0, opacity: 1 });
    gsap.set(thumb, { opacity: 0, scale: 1 });
    gsap.set(pupils, { x: 0, y: 0 });
    gsap.set(mouth, { scaleY: CLOSED });
    gsap.set(tongue, { opacity: 0, x: 0, rotation: 0 });
  };

  // Arms swing up from the shoulder: clockwise on the left, the other way on the right.
  const raise = (degrees: number): void => {
    gsap.set(armLeft, { rotation: degrees });
    gsap.set(armRight, { rotation: -degrees });
  };

  // The movement is kept small and unhurried: a character, not a cartoon.
  const moods: Record<Mood, { pose: () => void; play?: (timeline: Timeline) => void }> = {
    // Arms a little raised, mouth open, looking up at what might be dropped in.
    hungry: {
      pose: () => {
        raise(35);
        gsap.set(mouth, { scaleY: 0.7 });
        gsap.set(pupils, { y: -4 });
      },
      play: (timeline) => {
        timeline.to(root, { y: -3, duration: 1.4, ease: 'sine.inOut', repeat: -1, yoyo: true }, 0);
      },
    },

    // One bite: open, then shut.
    chomp: {
      pose: () => gsap.set(mouth, { scaleY: CLOSED }),
      play: (timeline) => {
        timeline
          .fromTo(mouth, { scaleY: 0.7 }, { scaleY: 1.3, duration: 0.1, ease: 'power2.out' })
          .to(mouth, { scaleY: CLOSED, duration: 0.07, ease: 'power3.in' })
          .to(root, { scaleX: 1.02, scaleY: 0.98, duration: 0.05 }, '<')
          .to(root, { scaleX: 1, scaleY: 1, duration: 0.15, ease: 'power2.out' });
      },
    },

    chew: {
      pose: () => {
        gsap.set(mouth, { scaleY: 0.2 });
        gsap.set(pupils, { y: 2 });
      },
      play: (timeline) => {
        timeline.to(mouth, { scaleY: 0.5, duration: 0.14, ease: 'sine.inOut', repeat: -1, yoyo: true }, 0);
      },
    },

    'thumbs-up': {
      pose: () => {
        gsap.set(armRight, { opacity: 0 });
        gsap.set(thumb, { opacity: 1 });
        gsap.set(mouth, { scaleY: 0.35 });
      },
      play: (timeline) => {
        timeline.from(thumb, { rotation: 40, opacity: 0, duration: 0.25, ease: 'power2.out' }, 0);
      },
    },

    // Only the eyes and the top of the head show above the bottom edge.
    peek: {
      pose: () => gsap.set(root, { y: 104 }),
      play: (timeline) => {
        timeline
          .from(root, { y: 200, duration: 0.6, ease: 'power3.out' }, 0)
          .to(pupils, { x: -4, duration: 0.4, ease: 'sine.inOut' }, 0.9)
          .to(pupils, { x: 4, duration: 0.7, ease: 'sine.inOut', repeat: -1, yoyo: true, repeatDelay: 1 });
      },
    },

    // Full, and licking its lips.
    lick: {
      pose: () => {
        gsap.set(mouth, { scaleY: 0.4 });
        gsap.set(tongue, { opacity: 1, x: -6, rotation: 10 });
        gsap.set(pupils, { y: 2 });
      },
      play: (timeline) => {
        timeline.to(
          tongue,
          { x: 6, rotation: -10, duration: 0.8, ease: 'sine.inOut', repeat: -1, yoyo: true, repeatDelay: 0.6 },
          0,
        );
      },
    },
  };

  let playing: Timeline | undefined;
  const blink = calm
    ? undefined
    : gsap
        .timeline({ repeat: -1, repeatDelay: 3.4, delay: 1.2 })
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
