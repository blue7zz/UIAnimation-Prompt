import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFile(path.join(root, file), 'utf8');
const context = vm.createContext({ window: {} });
for (const file of ['data/taxonomy.js', 'data/effects.js', 'data/preview-assets.js', 'scripts/library.js']) vm.runInContext(await read(file), context, { filename: file });
const effects = JSON.parse(JSON.stringify(context.window.MotionEffects));
const catalog = JSON.parse(JSON.stringify(context.window.MotionCatalog));
const lib = context.window.MotionLibrary;
const source = await read('sources/flutter-prompts.md');
const prompts = [...source.matchAll(/```text\n([\s\S]*?)\n```/g)].map(match => match[1]);
const originalIds = ['complete-home', 'complete-list', 'module-a-rules', 'module-b-menu', 'module-c-ad', 'module-d-list', 'module-e-drawer', 'module-f-transition'];
assert.equal(prompts.length, 8, 'Original source must retain all eight text blocks');
originalIds.forEach((id, index) => assert.equal(effects.find(effect => effect.id === id)?.prompt, prompts[index], id + ': prompt changed from original source'));
const ids = new Set(effects.map(effect => effect.id));
assert.equal(ids.size, effects.length, 'Duplicate effect IDs');
for (const kind of ['positions', 'types']) {
  assert.equal(new Set(catalog[kind].map(item => item.id)).size, catalog[kind].length, 'Duplicate taxonomy IDs');
  catalog[kind].forEach(item => assert.ok(item.id && item.label));
}
for (const effect of effects) {
  for (const field of ['id', 'title', 'summary', 'prompt', 'demo', 'updatedAt']) assert.ok(typeof effect[field] === 'string' && effect[field], effect.id + ': missing ' + field);
  assert.match(effect.id, /^[a-z0-9-]+$/);
  assert.match(effect.updatedAt, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(!Number.isNaN(Date.parse(effect.updatedAt)));
  for (const kind of ['positions', 'types']) {
    assert.ok(Array.isArray(effect[kind]) && effect[kind].length);
    effect[kind].forEach(id => assert.ok(catalog[kind].some(item => item.id === id), effect.id + ': unknown ' + kind + ' ' + id));
  }
  assert.ok(Array.isArray(effect.dependsOn));
  effect.dependsOn.forEach(id => assert.ok(ids.has(id), 'Missing dependency ' + id));
  assert.match(effect.demo, /^demos\/[a-z0-9-]+\.html$/);
  assert.ok((await stat(path.join(root, effect.demo))).isFile());
  const demo = await read(effect.demo);
  assert.ok(demo.includes('../styles/motion-tokens.css'), 'Shared tokens missing');
  assert.ok(demo.includes('shared/runtime.js') && demo.includes('api.mount(') && demo.includes('request-assets'), 'Demo runtime, local-file bootstrap or independent scene missing');
  const resolved = [...lib.resolveDependencies(effect.id, effects)];
  assert.equal(resolved.at(-1).id, effect.id);
  assert.equal(new Set(resolved.map(item => item.id)).size, resolved.length);
  assert.ok(lib.bundle(effect.id, effects).includes(effect.prompt));
  if (effect.authorship === 'curated') {
    assert.ok(Array.isArray(effect.references) && effect.references.length > 0, effect.id + ': missing references');
    effect.references.forEach(ref => {
      assert.ok(typeof ref.title === 'string' && ref.title);
      const url = new URL(ref.url);
      assert.equal(url.protocol, 'https:');
      assert.ok(['docs.flutter.dev', 'api.flutter.dev', 'm3.material.io', 'm2.material.io'].includes(url.hostname), effect.id + ': non-official reference');
    });
    assert.ok(Array.isArray(effect.acceptance) && effect.acceptance.length >= 3, effect.id + ': missing observable acceptance checks');
    effect.acceptance.forEach(check => assert.ok(typeof check === 'string' && check.trim()));
    assert.ok(effect.dependsOn.includes('module-a-rules'), effect.id + ': missing shared rules');
    assert.ok(effect.prompt.length >= 200, effect.id + ': incomplete prompt');
    assert.ok(!effect.prompt.includes('\uFFFD'), effect.id + ': replacement character in prompt');
    assert.match(effect.prompt, /减少动态|禁用动画|disableAnimations/);
  }
  for (const position of effect.positions) {
    const result = lib.filter(effects, catalog, { q: effect.title, positions: [position], types: [effect.types[0]] });
    assert.ok(result.some(item => item.id === effect.id), 'Cannot find effect by combined search: ' + effect.id);
  }
}
assert.equal(lib.filter(effects, catalog, { q: '', positions: [], types: [] }).length, effects.length);
assert.equal(lib.filter(effects, catalog, { q: 'definitely-no-such-effect', positions: [], types: [] }).length, 0);
assert.deepEqual([...lib.filter(effects, catalog, { q: '', positions: ['overlay'], types: [] })].map(effect => effect.id), effects.filter(effect => effect.positions.includes('overlay')).map(effect => effect.id));
assert.equal(lib.filter(effects, catalog, { q: '  FLUTTER  ', positions: [], types: [] }).length, effects.filter(effect => effect.prompt.toLowerCase().includes('flutter')).length);
assert.deepEqual([...lib.filter(effects, catalog, { q: '减少动态效果', positions: [], types: [] })].map(effect => effect.id), effects.filter(effect => effect.prompt.includes('减少动态效果') || effect.types.includes('reduced-motion')).map(effect => effect.id));
const bundleOrder = [...lib.resolveDependencies('complete-list', effects)].map(effect => effect.id);
assert.deepEqual(bundleOrder, ['module-a-rules', 'module-b-menu', 'module-d-list', 'complete-list']);
assert.throws(() => lib.resolveDependencies('missing', effects), /找不到依赖/);
assert.throws(() => lib.resolveDependencies('a', [{ id: 'a', dependsOn: ['b'] }, { id: 'b', dependsOn: ['a'] }]), /循环/);
const extra = { ...effects[0], id: 'new-effect', title: '新增效果', positions: ['new-position'], types: ['new-type'], dependsOn: [] };
const expanded = { positions: [...catalog.positions, { id: 'new-position', label: '新位置' }], types: [...catalog.types, { id: 'new-type', label: '新类型' }] };
assert.equal(lib.filter([...effects, extra], expanded, { q: '新位置', positions: ['new-position'], types: ['new-type'] })[0].id, 'new-effect');
assert.equal(context.window.MotionPreviewAssets.css, (await read('styles/motion-tokens.css')) + '\n' + (await read('demos/shared/demo.css')), 'Regenerate local-file assets after changing shared CSS');
assert.equal(context.window.MotionPreviewAssets.runtime, await read('demos/shared/runtime.js'), 'Regenerate local-file runtime cache');
assert.equal(context.window.MotionPreviewAssets.components, await read('demos/shared/components.js'), 'Regenerate local-file components cache');

async function checkLinks(file) {
  const html = await read(file);
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const url = match[1];
    if (/^(?:https?:|#|data:)/.test(url)) continue;
    assert.ok((await stat(path.resolve(root, path.dirname(file), url))).isFile(), file + ': missing ' + url);
  }
}
const demoCSS = await read('styles/motion-tokens.css') + '\n' + await read('demos/shared/demo.css');
const definedTokens = new Set([...demoCSS.matchAll(/(--[\w-]+)\s*:/g)].map(match => match[1]));
for (const match of demoCSS.matchAll(/var\((--[\w-]+)\s*\)/g)) assert.ok(definedTokens.has(match[1]), 'Undefined demo CSS token: ' + match[1]);
await checkLinks('index.html');
for (const entry of await readdir(path.join(root, 'demos'))) if (entry.endsWith('.html')) {
  await checkLinks('demos/' + entry);
  for (const script of (await read('demos/' + entry)).matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(script[1], { filename: entry });
}
console.log('PASS: source fidelity, schema, taxonomy, demo links, dependency order/dedup/cycles, search/filter combinations, and extensibility.');
