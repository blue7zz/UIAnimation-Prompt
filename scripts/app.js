(function () {
  'use strict';
  const effects = window.MotionEffects;
  const catalog = window.MotionCatalog;
  const lib = window.MotionLibrary;
  const main = document.querySelector('main');
  const search = document.querySelector('#search');
  const mediaTheme = matchMedia('(prefers-color-scheme: dark)');
  const mediaReduced = matchMedia('(prefers-reduced-motion: reduce)');
  const icons = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    home: '<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/>',
    list: '<path d="M9 5h12M9 12h12M9 19h12M3 5h1M3 12h1M3 19h1"/>',
    detail: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 7h6M9 11h6M9 15h3"/>',
    drawer: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M10 4v16M6 8h1M6 12h1"/>',
    ad: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 16 3-4 3 3 2-2 3 3"/><circle cx="8" cy="9" r="1"/>',
    overlay: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18M10 16h4"/>',
    tabs: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 4v5M15 4v5"/>',
    general: '<path d="m12 3 8 4v6c0 5-8 8-8 8s-8-3-8-8V7Z"/><path d="m8 12 3 3 5-6"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
    moon: '<path d="M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10Z"/>',
    replay: '<path d="M3 11a9 9 0 1 1 2 7M3 4v7h7"/>',
    copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>'
  };
  const svg = name => '<svg viewBox="0 0 24 24" aria-hidden="true">' + (icons[name] || icons.grid) + '</svg>';
  const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const positionIcons = ['home', 'list', 'detail', 'drawer', 'ad', 'overlay', 'tabs', 'general'];
  let state = { q: '', positions: [], types: [] };
  let returnHash = '#/library';
  let toastTimer;
  let themePreference;
  try { themePreference = localStorage.getItem('motion-theme'); } catch (_) { /* Storage is optional on local files. */ }
  let controls = { speed: 1, slowNetwork: false, reduced: mediaReduced.matches };
  let reducedOverride = false;

  function notify(message) {
    const toast = document.querySelector('#toast');
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 3200);
  }
  function applyTheme() {
    document.documentElement.dataset.theme = themePreference || (mediaTheme.matches ? 'dark' : 'light');
    document.querySelector('#theme-toggle').innerHTML = svg(document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon');
    sendPreview('settings');
  }
  function libraryHash(next = state) {
    const params = new URLSearchParams();
    if (next.q) params.set('q', next.q);
    if (next.positions.length) params.set('positions', next.positions.join(','));
    if (next.types.length) params.set('types', next.types.join(','));
    return '#/library' + (params.size ? '?' + params : '');
  }
  function navigateLibrary(next, replace = false) {
    state = next;
    const hash = libraryHash();
    if (replace) { history.replaceState(null, '', hash); route(); }
    else if (location.hash === hash) route();
    else location.hash = hash;
  }
  function toggleFilter(kind, id) {
    navigateLibrary({ ...state, [kind]: state[kind].includes(id) ? state[kind].filter(item => item !== id) : [...state[kind], id] });
  }
  function label(id, kind) { return catalog[kind].find(item => item.id === id)?.label || id; }
  function tag(id, kind) { return '<button class="tag" data-tag="' + esc(id) + '" data-kind="' + kind + '">' + esc(label(id, kind)) + '</button>'; }
  function sidebar() {
    const totalActive = !state.positions.length;
    const count = positions => lib.filter(effects, catalog, { ...state, positions }).length;
    document.querySelector('#positions').innerHTML = '<button class="nav-item ' + (totalActive ? 'active' : '') + '" data-all-positions aria-pressed="' + totalActive + '">' + svg('grid') + '<span>全部效果</span><span class="count">' + count([]) + '</span></button><hr class="nav-divider">' + catalog.positions.map((item, index) => '<button class="nav-item ' + (state.positions.includes(item.id) ? 'active' : '') + '" data-position="' + esc(item.id) + '" aria-pressed="' + state.positions.includes(item.id) + '">' + svg(positionIcons[index]) + '<span>' + esc(item.label) + '</span><span class="count">' + count([item.id]) + '</span></button>').join('');
  }
  function artwork(effect) {
    const index = effects.indexOf(effect);
    const complete = effect.id.startsWith('complete-');
    return '<div class="card-art art-' + index % 8 + '" aria-hidden="true"><span class="art-label">' + (complete ? 'SCENE / ' : 'MOTION / ') + String(index + 1).padStart(2, '0') + '</span><div class="mini-window"><div class="mini-top"><i></i><i></i><i></i></div><div class="mini-lines"><i></i><i></i><i></i></div></div><span class="mini-focus">' + ['✦', '↕', '▧', '≡', '☰', '→', '⌂', '≡'][index % 8] + '</span><span class="art-badge">INTERACTIVE</span></div>';
  }
  function card(effect) {
    const href = '#/effect/' + encodeURIComponent(effect.id);
    return '<article class="effect-card"><a class="card-link" href="' + href + '">' + artwork(effect) + '<div class="card-copy"><div class="card-kicker">' + (effect.id.startsWith('complete-') ? '完整场景' : '独立模块') + '<i></i>' + esc(label(effect.positions[0], 'positions')) + '</div><h3>' + esc(effect.title) + '</h3><p>' + esc(effect.summary) + '</p></div></a><div class="card-tags">' + effect.types.slice(0, 2).map(id => tag(id, 'types')).join('') + '</div><div class="card-footer"><span>' + effect.prompt.length.toLocaleString('zh-CN') + ' 字提示词</span><a class="open-link" href="' + href + '">预览与提示词 <span>↗</span></a></div></article>';
  }
  function renderLibrary() {
    const filtered = lib.filter(effects, catalog, state);
    const selected = state.q || state.positions.length || state.types.length;
    const names = [...state.positions.map(id => label(id, 'positions')), ...state.types.map(id => label(id, 'types'))];
    document.title = '动效档案 · Flutter Motion Library';
    document.querySelector('#breadcrumb-current').textContent = state.positions.length ? state.positions.map(id => label(id, 'positions')).join('、') : '全部效果';
    main.innerHTML = '<section class="hero"><div><p class="eyebrow">A LITTLE MOTION. A BETTER EXPERIENCE.</p><h1>每一种动效，都有<em>章可循。</em></h1><p>收集细腻的 Flutter 动效，让灵感成为可复用的提示词。<br>按场景查找，亲手预览，然后带到你的下一个项目。</p></div><div class="hero-stats"><div><strong>' + String(effects.length).padStart(2, '0') + '</strong><small>动效提示词</small></div><div><strong>' + String(catalog.positions.length).padStart(2, '0') + '</strong><small>页面位置</small></div><div><strong>∞</strong><small>持续生长</small></div></div></section><section class="filter-panel" aria-label="效果类型筛选"><span class="filter-caption">效果类型</span><div class="type-filters"><button class="filter-chip ' + (!state.types.length ? 'active' : '') + '" data-all-types aria-pressed="' + !state.types.length + '">全部类型</button>' + catalog.types.map(item => '<button class="filter-chip ' + (state.types.includes(item.id) ? 'active' : '') + '" data-type="' + esc(item.id) + '" aria-pressed="' + state.types.includes(item.id) + '">' + esc(item.label) + '</button>').join('') + '</div></section>' + (selected ? '<div class="active-filters">' + (state.q ? '<button class="active-tag" data-clear-query>搜索：' + esc(state.q) + ' ×</button>' : '') + names.map(name => '<span class="active-tag">' + esc(name) + '</span>').join('') + '<button class="text-button" data-clear>清空筛选</button></div>' : '') + '<div class="results-bar"><h2>' + (selected ? '筛选结果' : '探索全部效果') + '<span>' + filtered.length + ' 个效果</span></h2><span>点击卡片，探索交互细节 ↗</span></div><section class="cards" aria-label="效果列表">' + filtered.map(card).join('') + '</section>' + (!filtered.length ? '<div class="empty-state"><strong>这里还没有匹配的效果</strong><p>试试更短的关键词，或减少筛选条件。资料库也在等你的下一份灵感。</p><button class="button" data-clear>查看全部效果</button></div>' : '') + '<aside class="library-tip">' + svg('info') + '<span>先预览，再复制。独立模块建议连同通用规则一起使用。</span><a href="README.md" target="_blank">查看使用指南 ↗</a></aside>';
  }
  function renderDetail(id) {
    const effect = effects.find(item => item.id === id);
    if (!effect) {
      main.innerHTML = '<div class="empty-state"><strong>没有找到这个效果</strong><p>它可能已更名，试试回到资料库查找。</p><a class="button" href="#/library">返回资料库</a></div>';
      document.querySelector('#breadcrumb-current').textContent = '效果未找到';
      return;
    }
    document.title = effect.title + ' · 动效档案';
    document.querySelector('#breadcrumb-current').textContent = effect.title;
    const dependencies = lib.resolveDependencies(id, effects).filter(item => item.id !== id);
    main.innerHTML = '<a class="back-link" href="' + esc(returnHash) + '">← 返回资料库</a><header class="detail-header"><p class="eyebrow">MOTION IN DETAIL</p><h1>' + esc(effect.title) + '</h1><p>' + esc(effect.summary) + '</p><div class="detail-tags">' + effect.positions.map(key => tag(key, 'positions')).join('') + effect.types.map(key => tag(key, 'types')).join('') + '</div></header><div class="detail-layout"><section class="preview-panel"><div class="panel-heading"><h2>交互预览</h2><span>点击手机内按钮，试试看</span></div><div class="preview-stage"><div class="phone"><iframe id="demo-frame" title="' + esc(effect.title) + '交互预览" src="' + esc(effect.demo) + '" sandbox="allow-scripts"></iframe></div></div><div class="preview-controls"><div class="control-row"><button class="button" id="replay">' + svg('replay') + '重播</button><select id="speed" aria-label="播放速度"><option value="1">正常速度</option><option value="4"' + (controls.speed === 4 ? ' selected' : '') + '>4 倍慢放</option></select></div><div class="control-toggles"><label class="control-toggle"><input type="checkbox" id="slow-network"' + (controls.slowNetwork ? ' checked' : '') + '>模拟慢网络</label><label class="control-toggle"><input type="checkbox" id="reduced-motion"' + (controls.reduced ? ' checked' : '') + '>减少动态效果</label></div><p class="preview-disclaimer">网页模拟观感 · 非 Flutter 真机效果 · 慢网络仅影响模拟加载</p></div></section><div><section class="prompt-panel"><div class="panel-heading"><h2>完整提示词</h2><span>原文保留 · ' + effect.prompt.length.toLocaleString('zh-CN') + ' 字</span></div><pre class="prompt-body" id="prompt-text" tabindex="0"></pre><div class="copy-actions"><button class="button primary" id="copy-prompt">' + svg('copy') + '复制提示词</button>' + (dependencies.length ? '<button class="button" id="copy-bundle">连同依赖模块一起复制</button>' : '') + '</div>' + (dependencies.length ? '<div class="dependency-note">依赖模块：' + dependencies.map(item => '<a href="#/effect/' + encodeURIComponent(item.id) + '">' + esc(item.title) + '</a>').join(' · ') + '<br>一起复制将按依赖顺序拼接，并自动去重。</div>' : '<div class="dependency-note">' + (effect.id.startsWith('complete-') ? '这份完整提示词已包含通用规则，可独立复制使用。' : '通用规则模块，建议与其他独立模块搭配使用。') + '</div>') + '</section><div class="detail-meta"><span>更新于 ' + esc(effect.updatedAt) + '</span><code>' + esc(effect.id) + '</code></div></div></div>';
    document.querySelector('#prompt-text').textContent = effect.prompt;
    document.querySelector('#demo-frame').addEventListener('load', () => sendPreview('settings'));
    document.querySelector('#copy-prompt').onclick = () => copy(effect.prompt);
    document.querySelector('#copy-bundle')?.addEventListener('click', () => copy(lib.bundle(id, effects)));
    document.querySelector('#replay').onclick = () => sendPreview('replay');
    document.querySelector('#speed').onchange = event => { controls.speed = Number(event.target.value); sendPreview('settings'); };
    document.querySelector('#slow-network').onchange = event => { controls.slowNetwork = event.target.checked; sendPreview('settings'); };
    document.querySelector('#reduced-motion').onchange = event => { controls.reduced = event.target.checked; reducedOverride = true; sendPreview('settings'); };
  }
  function sendPreview(action) {
    const frame = document.querySelector('#demo-frame');
    frame?.contentWindow?.postMessage({ channel: 'motion-library', action, settings: { ...controls, theme: document.documentElement.dataset.theme } }, '*');
  }
  async function copy(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        try { await navigator.clipboard.writeText(text); notify('已复制，可直接粘贴给 AI'); return; } catch (_) { /* Fall back for denied clipboard permission. */ }
      }
      const input = document.createElement('textarea');
      input.value = text;
      input.setAttribute('aria-label', '待复制的提示词');
      Object.assign(input.style, { position: 'fixed', left: '-9999px', top: '0' });
      document.body.append(input);
      const active = document.activeElement;
      let copied = false;
      try { input.select(); copied = document.execCommand('copy'); } finally { input.remove(); active?.focus(); }
      if (!copied) throw new Error('Clipboard unavailable');
      notify('已复制，可直接粘贴给 AI');
    } catch (_) {
      const prompt = document.querySelector('#prompt-text');
      const selection = getSelection();
      if (prompt && selection) { const range = document.createRange(); range.selectNodeContents(prompt); selection.removeAllRanges(); selection.addRange(range); }
      if (text !== document.querySelector('#prompt-text')?.textContent) {
        const dialog = document.createElement('dialog');
        const title = document.createElement('p'); title.textContent = '浏览器未允许自动复制，请选中下方完整内容手动复制。';
        const field = document.createElement('textarea'); field.value = text; field.style.cssText = 'width:100%;height:45vh'; field.setAttribute('aria-label', '含依赖的完整提示词');
        const close = document.createElement('button'); close.textContent = '关闭'; close.className = 'button'; close.onclick = () => dialog.close();
        dialog.style.cssText = 'width:min(600px,90vw);border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--text)';
        dialog.append(title, field, close); document.body.append(dialog); dialog.onclose = () => dialog.remove(); dialog.showModal(); field.focus(); field.select();
      }
      notify('浏览器未允许自动复制，请手动复制已选中的文本');
    }
  }
  function route() {
    const hash = location.hash || '#/library';
    if (hash.startsWith('#/effect/')) {
      let id;
      try { id = decodeURIComponent(hash.slice(9)); } catch (_) { id = ''; }
      renderDetail(id);
    } else {
      const params = new URLSearchParams(hash.split('?')[1] || '');
      state = { q: params.get('q') || '', positions: (params.get('positions') || '').split(',').filter(id => catalog.positions.some(item => item.id === id)), types: (params.get('types') || '').split(',').filter(id => catalog.types.some(item => item.id === id)) };
      returnHash = libraryHash();
      search.value = state.q;
      renderLibrary();
    }
    sidebar();
  }
  document.addEventListener('click', event => {
    const target = event.target.closest('button');
    if (!target) return;
    if (target.hasAttribute('data-clear')) navigateLibrary({ q: '', positions: [], types: [] });
    if (target.hasAttribute('data-clear-query')) navigateLibrary({ ...state, q: '' });
    if (target.hasAttribute('data-all-positions')) navigateLibrary({ ...state, positions: [] });
    if (target.hasAttribute('data-all-types')) navigateLibrary({ ...state, types: [] });
    if (target.dataset.position) toggleFilter('positions', target.dataset.position);
    if (target.dataset.type) toggleFilter('types', target.dataset.type);
    if (target.dataset.tag) navigateLibrary({ ...state, [target.dataset.kind]: [target.dataset.tag] });
  });
  search.addEventListener('input', () => navigateLibrary({ ...state, q: search.value }, true));
  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); search.focus(); }
    if (event.key === 'Escape' && document.activeElement === search) { search.value = ''; navigateLibrary({ ...state, q: '' }, true); }
  });
  document.querySelector('#theme-toggle').onclick = () => {
    themePreference = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('motion-theme', themePreference); } catch (_) { /* Theme still works without storage. */ }
    applyTheme();
  };
  mediaTheme.addEventListener('change', () => { if (!themePreference) applyTheme(); });
  mediaReduced.addEventListener('change', event => {
    if (!reducedOverride) { controls.reduced = event.matches; const input = document.querySelector('#reduced-motion'); if (input) input.checked = controls.reduced; sendPreview('settings'); }
  });
  window.addEventListener('message', event => {
    const frame = document.querySelector('#demo-frame');
    if (event.source !== frame?.contentWindow || event.data?.channel !== 'motion-library') return;
    if (event.data.action === 'ready') sendPreview('settings');
    if (location.protocol === 'file:' && event.data.action === 'request-assets') {
      frame.contentWindow.postMessage({ channel: 'motion-library', action: 'shared-assets', assets: window.MotionPreviewAssets }, '*');
    }
  });
  window.addEventListener('hashchange', () => { route(); window.scrollTo(0, 0); });
  applyTheme();
  route();
}());
