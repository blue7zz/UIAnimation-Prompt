(function () {
  'use strict';
  const api = window.MotionDemo;
  const root = document.querySelector('#demo');
  function node(html) { const template = document.createElement('template'); template.innerHTML = html.trim(); return template.content.firstElementChild; }
  function button(text, handler, active = false) {
    const result = node('<button class="demo-button' + (active ? ' active' : '') + '"></button>');
    result.textContent = text; api.listen(result, 'click', handler); return result;
  }
  function feedback(parent, text) { const el = node('<p class="feedback" role="status"></p>'); el.textContent = text; parent.append(el); return el; }
  function shell(title, subtitle) {
    root.innerHTML = '<div class="demo-app"><div class="statusbar"><span>9:41</span><span class="status-icons">▮▮▮ ◒ ▰</span></div><header class="demo-header"><div><div class="wordmark">SLOW DAYS / 拾光</div><h1></h1><p></p></div></header><div class="demo-scroll"></div></div>';
    root.querySelector('h1').textContent = title; root.querySelector('.demo-header p').textContent = subtitle;
    return root.querySelector('.demo-scroll');
  }
  function actions(parent, entries) {
    const bar = node('<div class="action-bar"></div>');
    entries.forEach(([title, handler]) => bar.append(button(title, handler)));
    parent.append(bar); return bar;
  }
  function note(parent, text) { const el = node('<div class="mini-note"></div>'); el.textContent = text; parent.append(el); }
  function menu(parent) {
    const box = node('<div class="menu-shell"><div class="menu-inner"></div></div>');
    const inner = box.firstElementChild;
    parent.append(box);
    let twoRows = false; let large = false; let ready = false; let revision = 0;
    async function render() {
      const current = ++revision;
      const start = box.getBoundingClientRect().height;
      api.stop(box); api.stop(inner);
      inner.innerHTML = '<div class="menu-links' + (large ? ' large' : '') + '"></div>';
      const links = inner.firstElementChild;
      const labels = twoRows ? ['为你推荐', '设计灵感', '城市漫游', '生活方式', '好物收藏', '本周精选'] : ['推荐', '设计', '生活'];
      labels.forEach((label, index) => {
        const item = button(label, () => { links.querySelectorAll('button').forEach(child => child.classList.remove('selected')); item.classList.add('selected'); });
        if (!index) item.classList.add('selected'); links.append(item);
      });
      const target = inner.getBoundingClientRect().height + 2;
      box.style.height = start + 'px';
      await Promise.all([api.resize(box, target), api.animate(inner, [{ opacity: 0 }, { opacity: 1 }], '--motion-fast')]);
      if (current === revision) box.style.height = 'auto';
    }
    function reload() {
      const current = ++revision; ready = false; api.stop(box); api.stop(inner); inner.style.opacity = '1';
      box.style.height = 'auto';
      inner.innerHTML = '<div class="menu-skeleton"><i class="skeleton"></i><i class="skeleton"></i><i class="skeleton"></i><i class="skeleton"></i><i class="skeleton"></i><i class="skeleton"></i></div>';
      api.later(() => { if (current === revision) { ready = true; render(); } }, api.loadTime);
    }
    reload();
    return { one() { twoRows = false; if (ready) render(); }, two() { twoRows = true; if (ready) render(); }, font() { large = !large; if (ready) render(); }, reload };
  }
  const titles = ['在日常里，发现一点新意', '把周末留给一场慢行', '属于你的安静角落', '光落下来的地方', '收集生活里的小美好', '山野之间，自有答案'];
  function row(index, interactive = false) {
    const el = node('<' + (interactive ? 'button type="button"' : 'article') + ' class="list-row" data-id="story-' + index + '"><div class="row-thumb tone-' + index % 4 + '"></div><div class="row-copy"><h3></h3><p>灵感手记 · 3 分钟阅读</p><small>生活方式 / DAILY</small></div><span class="row-arrow">›</span></' + (interactive ? 'button' : 'article') + '>');
    el.querySelector('h3').textContent = titles[index % titles.length]; return el;
  }
  function list(parent, extra = false) {
    const heading = node('<div class="section-label">今日灵感 <small>为你精选</small></div>'); parent.append(heading);
    const status = feedback(parent, '骨架占位中，内容正在路上…');
    const region = node('<div class="list-region"></div>'); parent.append(region);
    let revision = 0; let mode = 'loading'; let refreshCount = 0;
    for (let i = 0; i < 4; i++) region.append(node('<div class="list-row row-skeleton"><div class="row-thumb skeleton"></div><div class="row-copy"><i class="skeleton"></i><i class="skeleton"></i></div></div>'));
    async function show(next, entrance = false) {
      const current = ++revision; mode = next;
      const start = region.getBoundingClientRect().height; api.stop(region);
      region.replaceChildren(); region.style.height = 'auto';
      if (next === 'content') {
        for (let i = 0; i < (extra ? 6 : 4); i++) region.append(row(i));
        status.textContent = entrance ? '首次入场 · 只对首屏可见项短促错峰' : '内容已恢复 · 不重播整表入场';
      } else {
        const empty = next === 'empty';
        const state = node('<div class="state-card"><span class="state-icon">' + (empty ? '◌' : '↯') + '</span><strong>' + (empty ? '灵感暂时留白' : '这次没能加载成功') + '</strong><p>' + (empty ? '换个分类，或稍后再来看看。' : '已有页面不闪白，重试只更新这里。') + '</p></div>');
        state.append(button(empty ? '查看内容' : '重新加载', () => show('content'))); region.append(state);
        status.textContent = empty ? '空状态 · 仅列表区域变化' : '错误状态 · 可直接重试';
      }
      const target = region.getBoundingClientRect().height; region.style.height = start + 'px';
      const resizing = api.resize(region, target);
      if (entrance) {
        const visibleBottom = parent.getBoundingClientRect().bottom;
        let visibleIndex = 0;
        region.querySelectorAll('.list-row').forEach(el => {
          if (el.getBoundingClientRect().top >= visibleBottom) return;
          const delay = api.settings.reduced ? 0 : Math.min(visibleIndex++ * api.ms('--motion-stagger'), api.ms('--motion-stagger-cap')) * api.settings.speed;
          api.animate(el, [{ opacity: 0, transform: 'translateY(' + api.distance + ')' }, { opacity: 1, transform: 'translateY(0px)' }], '--motion-normal', delay);
        });
      } else api.animate(region, [{ opacity: 0 }, { opacity: 1 }], '--motion-fast');
      await resizing;
      if (current === revision) region.style.height = 'auto';
    }
    function refresh() {
      if (mode !== 'content') { status.textContent = '先恢复内容，再试试局部刷新。'; return; }
      const current = ++revision; status.textContent = '正在刷新 · 保留已有内容与位置…';
      api.later(() => {
        if (current !== revision) return;
        const changed = region.querySelector('[data-id="story-1"]');
        if (!changed) return;
        refreshCount++; changed.querySelector('h3').textContent = refreshCount % 2 ? '新灵感：走一条没走过的路' : titles[1];
        changed.querySelector('small').textContent = '刚刚更新 · 第 ' + refreshCount + ' 次';
        api.stop(changed);
        api.animate(changed, [{ backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--tint').trim() }, { backgroundColor: 'transparent' }], '--motion-slow');
        status.textContent = '仅第 2 项已更新 · 其余项零动画';
      }, api.loadTime);
    }
    api.later(() => { if (revision === 0) show('content', true); }, api.loadTime);
    return { refresh, empty: () => show('empty'), error: () => show('error'), content: () => show('content') };
  }
  function ad(parent) {
    const slot = node('<div class="ad-slot"><div class="ad-inner"><small>A LITTLE BREAK</small><span class="ad-label">测试广告</span><h3>给生活，留一点绿。</h3><p>周末自然计划 · 仅作动效演示</p><button class="ad-close" aria-label="关闭广告">×</button></div><div class="ad-placeholder">广告 · 浅色占位</div></div>');
    parent.append(slot);
    const status = feedback(parent, '广告请求中 · 首页主体不等待'); status.classList.add('ad-status');
    const inner = slot.querySelector('.ad-inner'); const placeholder = slot.querySelector('.ad-placeholder');
    let revision = 0; let reserved = false;
    async function close(message = '已关闭 · 先淡出内容，再收起高度') {
      const current = ++revision;
      const height = slot.getBoundingClientRect().height;
      const opacity = getComputedStyle(inner).opacity;
      const transform = getComputedStyle(inner).transform;
      slot.style.height = height + 'px';
      inner.style.opacity = opacity;
      inner.style.transform = transform;
      api.stop(slot); api.stop(inner);
      if (Number(opacity) > 0) {
        const done = await api.animate(inner, [{ opacity }, { opacity: 0 }], '--motion-fast');
        if (!done || current !== revision) return;
      }
      placeholder.hidden = true;
      const done = await api.resize(slot, 0);
      if (done && current === revision) status.textContent = message;
    }
    function request(reserve = reserved) {
      reserved = reserve; const current = ++revision;
      api.stop(slot); api.stop(inner);
      inner.style.opacity = '0'; inner.style.transform = 'none'; placeholder.hidden = false;
      slot.style.height = reserved ? inner.offsetHeight + 'px' : '0px';
      status.textContent = reserved ? '按最终广告尺寸占位 · 只等待内容' : '未预留位置 · 就绪后先展开高度';
      api.later(async () => {
        if (current !== revision) return;
        if (!reserved) {
          status.textContent = '广告已就绪 · 先平滑展开位置';
          const done = await api.resize(slot, inner.offsetHeight);
          if (!done || current !== revision) return;
        }
        placeholder.hidden = true;
        const done = await api.animate(inner, [{ opacity: 0, transform: 'scale(' + api.token('--motion-scale') + ')' }, { opacity: 1, transform: 'scale(1)' }], '--motion-fast');
        if (done && current === revision) status.textContent = '内容已显现 · 其他区域不重新加载';
      }, api.loadTime);
    }
    api.listen(slot.querySelector('.ad-close'), 'click', () => close());
    return { request, close: () => close(), fail: () => close('无填充 / 请求失败 · 广告区域已收起') };
  }
  function drawer(onNavigate) {
    const overlay = node('<div class="drawer-shell" aria-hidden="true"><button class="drawer-overlay" aria-label="点击遮罩关闭抽屉" tabindex="-1"></button><section class="drawer-panel" aria-label="抽屉菜单" inert><button class="round-button drawer-close" aria-label="关闭抽屉">×</button><div class="profile-dot">木</div><h2>慢一点，也很好。</h2><p>留一点时间，给喜欢的生活。</p><div class="drawer-items"></div><span class="drawer-footnote">向左轻扫关闭 · ESC 返回</span></section></div>');
    root.append(overlay);
    const panel = overlay.querySelector('.drawer-panel'); const shade = overlay.querySelector('.drawer-overlay');
    let open = false; let revision = 0; let selected = '今日灵感'; let previousFocus;
    let drag = null; let suppressClick = false;
    function releaseDrag() {
      const previous = drag; drag = null; overlay.classList.remove('dragging');
      if (previous && panel.hasPointerCapture(previous.id)) panel.releasePointerCapture(previous.id);
      return previous;
    }
    async function setOpen(next) {
      const current = ++revision;
      if (next && !open) previousFocus = document.activeElement;
      open = next; releaseDrag();
      const fromPanel = getComputedStyle(panel).transform; const fromShade = getComputedStyle(shade).opacity;
      panel.style.transform = fromPanel; shade.style.opacity = fromShade;
      api.stop(panel); api.stop(shade); overlay.classList.add('visible');
      overlay.classList.toggle('closing', !next);
      if (!next) previousFocus?.focus();
      panel.inert = !next; overlay.setAttribute('aria-hidden', String(!next));
      const result = await Promise.all([api.animate(panel, [{ transform: fromPanel }, { transform: next ? 'translateX(0)' : 'translateX(calc(-1 * var(--motion-drawer-distance)))' }], '--motion-slow'), api.animate(shade, [{ opacity: fromShade }, { opacity: next ? 1 : 0 }], '--motion-slow')]);
      if (current !== revision || result.some(done => !done)) return false;
      if (!next) { overlay.classList.remove('visible'); previousFocus?.focus(); }
      else panel.querySelector('button').focus();
      return true;
    }
    ['今日灵感', '我的收藏', '周末计划'].forEach(title => {
      const item = node('<button class="drawer-item"></button>'); item.textContent = title;
      if (title === selected) item.classList.add('selected');
      api.listen(item, 'click', async () => {
        const change = title !== selected;
        const done = await setOpen(false);
        if (!done || !change) return;
        selected = title;
        overlay.querySelectorAll('.drawer-item').forEach(child => child.classList.toggle('selected', child.textContent === selected));
        onNavigate(title);
      });
      overlay.querySelector('.drawer-items').append(item);
    });
    api.listen(shade, 'click', () => setOpen(false)); api.listen(overlay.querySelector('.drawer-close'), 'click', () => setOpen(false));
    api.listen(document, 'keydown', event => {
      if (!open) return;
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false); }
      if (event.key === 'Tab') {
        const items = [...panel.querySelectorAll('button')]; const first = items[0]; const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
    api.listen(panel, 'pointerdown', event => {
      if (!open || !event.isPrimary || event.button !== 0) return;
      suppressClick = false;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, active: false };
    });
    api.listen(panel, 'pointermove', event => {
      if (!drag || drag.id !== event.pointerId) return;
      const dx = event.clientX - drag.x; const dy = event.clientY - drag.y;
      if (!drag.active) {
        if (Math.abs(dx) < 4 || Math.abs(dx) <= Math.abs(dy)) return;
        drag.offset = new DOMMatrixReadOnly(getComputedStyle(panel).transform).m41;
        ++revision; api.stop(panel); api.stop(shade);
        drag.active = true; panel.setPointerCapture(event.pointerId); overlay.classList.add('dragging');
      }
      event.preventDefault();
      const width = panel.getBoundingClientRect().width;
      const offset = Math.max(-width, Math.min(0, drag.offset + dx));
      panel.style.transform = 'translateX(' + offset + 'px)';
      shade.style.opacity = String(1 + offset / width);
    });
    api.listen(panel, 'pointerup', event => {
      if (!drag || drag.id !== event.pointerId) return;
      const previous = releaseDrag();
      if (!previous.active) return;
      suppressClick = true; event.preventDefault();
      setOpen(event.clientX - previous.x >= -45);
    });
    function cancelDrag(event) {
      if (drag?.id === event.pointerId && releaseDrag()?.active) setOpen(true);
    }
    api.listen(panel, 'pointercancel', cancelDrag);
    api.listen(panel, 'lostpointercapture', cancelDrag);
    api.listen(panel, 'click', event => {
      if (!suppressClick || event.detail === 0) return;
      suppressClick = false; event.preventDefault(); event.stopImmediatePropagation();
    }, { capture: true });
    return { toggle: () => setOpen(!open), close: () => setOpen(false) };
  }
  function addDrawerButton(controller) {
    const trigger = node('<button class="round-button" aria-label="打开抽屉">☰</button>');
    api.listen(trigger, 'click', controller.toggle); root.querySelector('.demo-header').append(trigger);
  }
  window.MotionParts = { node, button, feedback, shell, actions, note, menu, list, ad, drawer, addDrawerButton, row, titles };
}());
