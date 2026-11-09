(function () {
  'use strict';
  const normalize = value => String(value).toLocaleLowerCase().trim();
  const labels = (ids, entries) => ids.map(id => entries.find(entry => entry.id === id)?.label || id);
  function filter(effects, catalog, state) {
    const words = normalize(state.q || '').split(/\s+/).filter(Boolean);
    return effects.filter(effect => {
      const text = normalize([effect.title, effect.summary, effect.prompt, ...labels(effect.positions, catalog.positions), ...labels(effect.types, catalog.types)].join(' '));
      return words.every(word => text.includes(word)) &&
        (!state.positions.length || effect.positions.some(id => state.positions.includes(id))) &&
        (!state.types.length || effect.types.some(id => state.types.includes(id)));
    });
  }
  function resolveDependencies(id, effects) {
    const byId = new Map(effects.map(effect => [effect.id, effect]));
    const visited = new Set();
    const visiting = new Set();
    const result = [];
    function visit(key) {
      if (visiting.has(key)) throw new Error('依赖存在循环：' + key);
      if (visited.has(key)) return;
      const effect = byId.get(key);
      if (!effect) throw new Error('找不到依赖模块：' + key);
      visiting.add(key);
      effect.dependsOn.forEach(visit);
      visiting.delete(key);
      visited.add(key);
      result.push(effect);
    }
    visit(id);
    return result;
  }
  function bundle(id, effects) {
    return resolveDependencies(id, effects).map(effect => '【' + effect.title + '】\n' + effect.prompt).join('\n\n---\n\n');
  }
  window.MotionLibrary = { filter, labels, resolveDependencies, bundle };
}());
