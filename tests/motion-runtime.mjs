import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const frames = new Map();
let nextFrame = 0;
let scrollPosition = 110;
const scroller = {
  get scrollTop() { return scrollPosition; },
  set scrollTop(value) { scrollPosition = Math.max(0, Math.round(value)); },
  getBoundingClientRect: () => ({ top: 0 })
};
const window = { addEventListener() {} };
const root = { dataset: {}, style: { setProperty() {} } };
const tokens = { '--motion-normal': '240ms', '--motion-ease': 'ease' };
const context = vm.createContext({
  window, parent: window, AbortController, setTimeout, clearTimeout,
  document: { documentElement: root, querySelector: selector => selector === '.demo-scroll' ? scroller : null },
  matchMedia: () => ({ matches: false }),
  getComputedStyle: () => ({ getPropertyValue: name => tokens[name] || '' }),
  requestAnimationFrame: callback => { const id = ++nextFrame; frames.set(id, callback); return id; },
  cancelAnimationFrame: id => frames.delete(id)
});
vm.runInContext(await readFile(new URL('../demos/shared/runtime.js', import.meta.url), 'utf8'), context);
const api = window.MotionDemo;
function element() {
  const animations = [];
  const result = {
    height: 0, isConnected: true,
    getBoundingClientRect() { return { height: this.height, top: -20 }; },
    getAnimations() { return animations.filter(animation => animation.active); },
    animate() {
      let resolve, reject;
      const finished = new Promise((yes, no) => { resolve = yes; reject = no; });
      const animation = { active: true, finished, finish() { this.active = false; resolve(); }, cancel() { this.active = false; reject(new Error('Cancelled')); } };
      animations.push(animation); return animation;
    }
  };
  result.style = new Proxy({}, { set(object, key, value) { object[key] = value; if (key === 'height') result.height = parseFloat(value); return true; } });
  return result;
}
function tick() {
  const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback());
}
const slot = element();
const expansion = api.resize(slot, 112);
slot.height = 56; tick();
assert.equal(scroller.scrollTop, 166);
slot.height = 112;
slot.getAnimations()[0].finish();
assert.equal(await expansion, true);
assert.equal(scroller.scrollTop, 222, 'Final height delta must be compensated even without a final animation frame');
assert.equal(frames.size, 0);
slot.height = 0; scroller.scrollTop = 110;
const fractionalExpansion = api.resize(slot, 112);
for (let index = 1; index <= 128; index++) { slot.height = index * 112 / 128; tick(); }
slot.getAnimations()[0].finish();
assert.equal(await fractionalExpansion, true);
assert.equal(scroller.scrollTop, 222, 'Fractional per-frame heights must not accumulate rounded scroll deltas');
scroller.scrollTop = 120;
const fractionalCollapse = api.resize(slot, 0);
for (let index = 1; index <= 128; index++) { slot.height = 112 - index * 112 / 128; tick(); }
slot.getAnimations()[0].finish();
assert.equal(await fractionalCollapse, true);
assert.equal(scroller.scrollTop, 8, 'Slow collapse must retain its absolute reading anchor despite integer scroll rounding');
slot.height = 0; scroller.scrollTop = 110;
const withUserScroll = api.resize(slot, 112);
for (let index = 1; index <= 128; index++) {
  slot.height = index * 112 / 128;
  if (index === 64) scroller.scrollTop += 11;
  tick();
}
slot.getAnimations()[0].finish();
assert.equal(await withUserScroll, true);
assert.equal(scroller.scrollTop, 233, 'Actual user scrolling during an animation must be preserved');
assert.equal(frames.size, 0);

slot.height = 0; scroller.scrollTop = 110;
const interrupted = api.resize(slot, 112);
slot.height = 40; tick();
assert.equal(scroller.scrollTop, 150);
slot.height = 56;
slot.style.height = '56px';
api.stop(slot);
assert.equal(scroller.scrollTop, 166, 'Stopping mid-frame must flush the pending height delta');
assert.equal(await interrupted, false);
assert.equal(frames.size, 0);
const collapse = api.resize(slot, 0);
slot.height = 24; tick();
assert.equal(scroller.scrollTop, 134);
slot.height = 0; slot.getAnimations()[0].finish();
assert.equal(await collapse, true);
assert.equal(scroller.scrollTop, 110, 'Reverse collapse must restore the original reading anchor');
assert.equal(frames.size, 0);
assert.match(await readFile(new URL('../demos/shared/demo.css', import.meta.url), 'utf8'), /\.demo-scroll\s*\{[^}]*overflow-anchor:\s*none/, 'Native scroll anchoring must not double-compensate manual height anchoring');
console.log('PASS: terminal-frame anchoring, interruption/reverse, fractional scroll rounding, live user scroll, frame cleanup and native-anchor exclusion.');
