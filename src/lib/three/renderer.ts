import {
  DirectionalLight,
  HemisphereLight,
  type Material,
  Mesh,
  type Object3D,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  type Texture,
  WebGLRenderer,
} from 'three';
import { forced3D, isPhone, markTooSlow } from './support';

// The one WebGL stage a page gets. It renders only while its canvas is on
// screen, and only when something asked for a frame. If the first second runs
// too slowly it removes itself and tells the caller to show the 2D version.

export interface Stage {
  scene: Scene;
  camera: PerspectiveCamera;
  canvas: HTMLCanvasElement;
  // Width over height of the canvas.
  aspect: () => number;
  // Ask for one more frame.
  invalidate: () => void;
  // Run on every frame while on screen (for idle motion). Returns a remover.
  onFrame: (callback: (seconds: number) => void) => () => void;
  onResize: (callback: () => void) => void;
  dispose: () => void;
}

interface Options {
  // Called if 3D turns out too slow here; the stage has already been removed.
  onFallback: () => void;
}

const MIN_FPS = 45;
const DPR_CAP = { desktop: 1.5, phone: 1.25 };

let current: Stage | null = null;
const disposers = new Set<() => void>();

// For shared caches (geometry, materials, textures) to empty themselves when
// the stage goes away.
export const onStageDispose = (callback: () => void): void => {
  disposers.add(callback);
};

export function createStage(container: HTMLElement, { onFallback }: Options): Stage {
  // One canvas per page: a new stage replaces the last one.
  current?.dispose();

  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isPhone() ? DPR_CAP.phone : DPR_CAP.desktop));

  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'display:block;width:100%;height:100%';
  container.append(canvas);

  const scene = new Scene();
  const camera = new PerspectiveCamera(28, 1, 0.1, 100);

  // Warm key light from the front right, a soft fill from the sky and the
  // cream page below, and a little light from behind to lift the edges.
  const key = new DirectionalLight('#fffaf3', 1.8);
  key.position.set(3.5, 7, 5);
  const fill = new HemisphereLight('#ffffff', '#f3e7da', 1.7);
  const rim = new DirectionalLight('#ffe2c4', 0.6);
  rim.position.set(-4, 3, -5);
  scene.add(key, fill, rim);

  const frameCallbacks = new Set<(seconds: number) => void>();
  const resizeCallbacks = new Set<() => void>();
  let onScreen = false;
  let dirty = true;
  let frame = 0;
  let disposed = false;

  // Frame-rate check over the first second of rendering.
  let measuring = !forced3D();
  let measured = 0;
  let frames = 0;
  let last = 0;

  const resize = (): void => {
    const { clientWidth: width, clientHeight: height } = container;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    resizeCallbacks.forEach((callback) => callback());
    dirty = true;
  };

  const loop = (now: number): void => {
    frame = 0;
    if (disposed || !onScreen || document.hidden) return;

    const elapsed = last ? now - last : 0;
    last = now;

    if (measuring && elapsed > 0 && elapsed < 250) {
      measured += elapsed;
      frames += 1;
      if (measured >= 1000) {
        measuring = false;
        if ((frames / measured) * 1000 < MIN_FPS) {
          markTooSlow();
          stage.dispose();
          onFallback();
          return;
        }
      }
    }

    if (dirty || measuring || frameCallbacks.size) {
      frameCallbacks.forEach((callback) => callback(now / 1000));
      renderer.render(scene, camera);
      dirty = false;
    }
    if (measuring || frameCallbacks.size) frame = requestAnimationFrame(loop);
  };

  const wake = (): void => {
    if (!frame && !disposed && onScreen && !document.hidden) {
      last = 0;
      frame = requestAnimationFrame(loop);
    }
  };

  const visibility = new IntersectionObserver((entries) => {
    onScreen = entries.some((entry) => entry.isIntersecting);
    wake();
  });
  visibility.observe(container);
  const sizes = new ResizeObserver(resize);
  sizes.observe(container);
  document.addEventListener('visibilitychange', wake);

  const stage: Stage = {
    scene,
    camera,
    canvas,
    aspect: () => camera.aspect,
    invalidate: () => {
      dirty = true;
      wake();
    },
    onFrame: (callback) => {
      frameCallbacks.add(callback);
      wake();
      return () => frameCallbacks.delete(callback);
    },
    onResize: (callback) => {
      resizeCallbacks.add(callback);
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frame);
      visibility.disconnect();
      sizes.disconnect();
      document.removeEventListener('visibilitychange', wake);
      document.removeEventListener('astro:before-swap', stage.dispose);

      scene.traverse((object: Object3D) => {
        if (!(object instanceof Mesh)) return;
        object.geometry.dispose();
        for (const material of [object.material].flat() as Material[]) {
          (material as Material & { map?: Texture | null }).map?.dispose();
          material.dispose();
        }
      });
      disposers.forEach((callback) => callback());
      renderer.dispose();
      canvas.remove();
      if (current === stage) current = null;
    },
  };

  document.addEventListener('astro:before-swap', stage.dispose);
  resize();
  current = stage;
  return stage;
}
