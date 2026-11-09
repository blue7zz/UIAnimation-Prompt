import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const html = await readFile(new URL('../demos/progress-status.html', import.meta.url), 'utf8');
const scene = html.match(/function mountScene\(\) \{[\s\S]*?(?=\n  let started)/)[0];

async function check(source) {
  let controls;
  let active;
  let width = 0;
  const queued = [];
  const fill = { isConnected: true, style: {}, getAnimations: () => active ? [active] : [], getBoundingClientRect: () => ({ width }) };
  const track = { firstElementChild: fill, attributes: {}, setAttribute(key, value) { this.attributes[key] = value; }, getBoundingClientRect: () => ({ width: 100 }) };
  const label = { textContent: '' };
  const parts = {
    node: value => value.includes('progress-track') ? track : label,
    shell: () => ({ append() {} }), feedback: () => ({}),
    actions: (_, entries) => { controls = Object.fromEntries(entries); },
    to: (_, target) => {
      if (active) active.resolve(false);
      return new Promise(resolve => { active = { resolve, width: parseFloat(target.width) }; });
    }
  };
  const context = vm.createContext({
    window: {
      MotionParts: parts,
      MotionDemo: {
        mount: callback => callback(), later: callback => queued.push(callback),
        stop: () => { if (active) active.resolve(false); active = null; width = 0; }
      }
    }, document: { querySelector: () => ({}) }
  });
  vm.runInContext(source + '\nmountScene();', context);
  function finish() { width = active.width; const { resolve } = active; active = null; resolve(true); }
  function flush() { const current = queued.splice(0); current.forEach(callback => callback()); }

  controls['开始任务']();
  const running = [];
  for (let i = 0; i < 4; i++) running.push(controls['增加25%']());
  finish(); await Promise.all(running);
  assert.equal(label.textContent, '✓ 已完成 · 100%');
  flush(); flush();
  assert.equal(label.textContent, '✓ 已完成 · 100%', 'late samples must not overwrite completion');
  assert.equal(track.attributes['aria-valuenow'], '100');
  controls['开始任务'](); await controls['增加25%']();
  assert.equal(label.textContent, '✓ 已完成 · 100%', 'duplicate start/increase must preserve completion');

  controls['重置任务'](); controls['开始任务']();
  const old = controls['增加25%']();
  controls['重置任务'](); await old; flush();
  assert.equal(label.textContent, '准备开始 · 0%');
  assert.equal(track.attributes['aria-valuenow'], '0');
  controls['开始任务']();
  const next = controls['增加25%'](); finish(); await next; flush();
  assert.equal(label.textContent, '处理中 · 25%');
}

await check(scene);
await assert.rejects(check(scene.replace('!sampling || ', '')), /late samples must not overwrite completion/);
console.log('PASS: completion survives late samples; rapid targets, duplicate starts and reset invalidate old progress.');
