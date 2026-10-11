import {
  DirectionalLight,
  HemisphereLight,
  type Material,
  Mesh,
  type Object3D,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  type Texture,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { forced3D, isPhone, markTooSlow } from './support';

// 3D for a page. There is one WebGL canvas, off screen, shared by every 3D
// view on the page: each view (a "stage") is rendered into it and the picture
// copied to that view's own plain canvas, which sits in the page like an
// image. A stage renders only while it is on screen, and only when something
// asked for a frame. If its first second runs too slowly it removes itself
// and tells the caller to show the 2D version.

export interface Stage {
  scene: Scene;
  camera: PerspectiveCamera;
  canvas: HTMLCanvasElement;
  // The main light, for a scene that wants it to cast shadows.
  key: DirectionalLight;
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
  // A small view can afford more pixels than the usual cap, to stay sharp.
  sharp?: boolean;
}

const MIN_FPS = 45;
const DPR_CAP = { desktop: 1.5, phone: 1.25, sharp: 2.5 };

// The shared renderer, made for the first stage and dropped with the last.
let shared: WebGLRenderer | null = null;
const stages = new Set<Stage>();
const disposers = new Set<() => void>();

// For shared caches (geometry, materials, textures) to empty themselves when
// the renderer goes away.
export const onStageDispose = (callback: () => void): void => {
  disposers.add(callback);
};

const renderer = (): WebGLRenderer => {
  if (!shared) {
    shared = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    shared.outputColorSpace = SRGBColorSpace;
    // Sizes below are already in device pixels.
    shared.setPixelRatio(1);
    shared.setScissorTest(true);
    // Costs nothing unless a scene has something casting a shadow.
    shared.shadowMap.enabled = true;
  }
  return shared;
};

// Soft, even studio light to reflect in glossy surfaces: a scene opts in by
// setting it as its environment.
let studio: Texture | null = null;
export const studioLight = (): Texture => {
  if (!studio) {
    const baker = new PMREMGenerator(renderer());
    studio = baker.fromScene(new RoomEnvironment(), 0.04).texture;
    baker.dispose();
  }
  return studio;
};

// Draws one stage into the corner of the shared canvas, growing it if need be.
const draw = (scene: Scene, camera: PerspectiveCamera, target: HTMLCanvasElement): void => {
  const gl = renderer();
  const { width, height } = target;
  const buffer = gl.domElement;
  if (buffer.width < width || buffer.height < height) {
    gl.setSize(Math.max(buffer.width, width), Math.max(buffer.height, height), false);
  }
  gl.setViewport(0, 0, width, height);
  gl.setScissor(0, 0, width, height);
  gl.clear();
  gl.render(scene, camera);

  // The viewport is measured from the bottom of the buffer; the copy from its top.
  const context = target.getContext('2d')!;
  context.clearRect(0, 0, width, height);
  context.drawImage(buffer, 0, buffer.height - height, width, height, 0, 0, width, height);
};

export function createStage(container: HTMLElement, { onFallback, sharp = false }: Options): Stage {
  const cap = sharp ? DPR_CAP.sharp : isPhone() ? DPR_CAP.phone : DPR_CAP.desktop;
  const ratio = Math.min(window.devicePixelRatio, cap);

  const canvas = document.createElement('canvas');
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
      if (canvas.width && canvas.height) draw(scene, camera, canvas);
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

  const resize = (): void => {
    const { clientWidth: width, clientHeight: height } = container;
    if (!width || !height) return;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    resizeCallbacks.forEach((callback) => callback());
    dirty = true;
    wake();
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
    key,
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
      canvas.remove();

      // The last stage out takes the renderer and the caches with it.
      stages.delete(stage);
      if (!stages.size) {
        disposers.forEach((callback) => callback());
        studio?.dispose();
        studio = null;
        shared?.dispose();
        shared = null;
      }
    },
  };

  stages.add(stage);
  document.addEventListener('astro:before-swap', stage.dispose);
  resize();
  return stage;
}
