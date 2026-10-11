import { useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { monsterMarkup, monsterViewBox, type Mood } from './markup';
import { createMonster, type Monster } from './rig';

// The Crumb Monster inside the React island. Change `mood` to change what it does.
export default function CrumbMonster({ mood, className }: { mood: Mood; className?: string }) {
  const svg = useRef<SVGSVGElement>(null);
  const rig = useRef<Monster | null>(null);
  const calm = Boolean(useReducedMotion());

  useEffect(() => {
    if (!svg.current) return;
    const monster = createMonster(svg.current, calm);
    rig.current = monster;
    return () => monster.destroy();
  }, [calm]);

  useEffect(() => rig.current?.mood(mood), [mood, calm]);

  return (
    <svg
      ref={svg}
      className={className}
      viewBox={monsterViewBox}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: monsterMarkup }}
    />
  );
}
