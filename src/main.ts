import Box2DFactory from 'box2d-wasm';
import { CanvasDebugDraw } from './debugDraw';
import { Helpers } from './helpers';
import { WorldFactory } from './world';

type Point = {
  x: number;
  y: number;
};

const canvas = document.getElementById('box2d-canvas') as HTMLCanvasElement;

const box2D: typeof Box2D & EmscriptenModule = await Box2DFactory({
  /**
   * By default, this looks for Box2D.wasm relative to public/build/bundle.js:
   * @example (url, scriptDirectory) => `${scriptDirectory}${url}`
   * But we want to look for Box2D.wasm relative to public/index.html instead.
   */
  locateFile: (url: string) => `assets/${url}`,
});

const {
  b2Vec2,
  b2Draw: { e_shapeBit },
}: { b2Vec2: typeof Box2D.b2Vec2; b2Draw: typeof Box2D.b2Draw } = box2D;

const helpers: Helpers = new Helpers(box2D);
const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');

const canvasOffset: Point = {
  x: canvas.width / 2,
  y: canvas.height / 2,
};

const viewCenterPixel: Point = {
  x: canvas.width / 2,
  y: canvas.height / 2,
};

const pixelsPerMeter = 32;

const renderer: Box2D.JSDraw = new CanvasDebugDraw(box2D, helpers, ctx!, pixelsPerMeter).constructJSDraw();
renderer.SetFlags(e_shapeBit);
const { step, draw }: { step: (deltaMs: number) => void; draw: () => void } = new WorldFactory(box2D, helpers).create(
  renderer,
);

const myRound = (val: number, places: number): number => {
  let c = 1;
  for (let i = 0; i < places; i++) c *= 10;
  return Math.round(val * c) / c;
};

const getWorldPointFromPixelPoint = (pixelPoint: Point): Point => ({
  x: (pixelPoint.x - canvasOffset.x) / pixelsPerMeter,
  y: (pixelPoint.y - (canvas.height - canvasOffset.y)) / pixelsPerMeter,
});

const setViewCenterWorld = (pos: Box2D.b2Vec2, instantaneous: boolean): void => {
  const currentViewCenterWorld = getWorldPointFromPixelPoint(viewCenterPixel);
  const toMoveX = pos.get_x() - currentViewCenterWorld.x;
  const toMoveY = pos.get_y() - currentViewCenterWorld.y;
  const fraction = instantaneous ? 1 : 0.25;
  canvasOffset.x -= myRound(fraction * toMoveX * pixelsPerMeter, 0);
  canvasOffset.y += myRound(fraction * toMoveY * pixelsPerMeter, 0);
};
setViewCenterWorld(new b2Vec2(0, 0), true);

const drawCanvas = (): void => {
  if (!ctx) {
    return;
  }
  //black background
  ctx.fillStyle = 'rgb(0,0,0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(canvasOffset.x, canvasOffset.y);
  ctx.scale(pixelsPerMeter, -pixelsPerMeter);
  ctx.lineWidth /= pixelsPerMeter;

  ctx.fillStyle = 'rgb(255,255,0)';
  draw();

  ctx.restore();
};

let prevMs: number = window.performance.now();
function loop(): void {
  requestAnimationFrame(loop);
  const nowMs = window.performance.now();
  const deltaMs = nowMs - prevMs;
  step(deltaMs);
  drawCanvas();
  prevMs = nowMs;
}

loop();
