(function () {
  'use strict';
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let settings = { speed: 1, slowNetwork: false, reduced: media.matches, theme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light' };
  let builder;
  let abort = new AbortController();
  let generation = 0;
  const timers = new Set();
  const animations = new Set();
  function token(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function ms(name) {
    const raw = token(name);
    return parseFloat(raw) * (raw.endsWith('ms') ? 1 : 1000);
  }
  function duration(name) { return settings.reduced ? 1 : ms(name) * settings.speed; }
  function later(fn, delay) {
    const version = generation;
    const timer = setTimeout(() => { timers.delete(timer); if (version === generation) fn(); }, delay);
    timers.add(timer);
    return timer;
  }
  function listen(element, event, handler, options = {}) { element.addEventListener(event, handler, { ...options, signal: abort.signal }); }
  async function animate(element, frames, timing = '--motion-normal', delay = 0) {
    if (!element?.isConnected) return false;
    const version = generation;
    const actualFrames = settings.reduced ? frames.map(frame => ({ ...frame, ...(frame.transform ? { transform: 'none' } : {}) })) : frames;
    const animation = element.animate(actualFrames, { duration: duration(timing), delay: settings.reduced ? 0 : delay, easing: token('--motion-ease'), fill: 'both' });
    animations.add(animation);
    try {
      await animation.finished;
      if (version !== generation) return false;
      const last = actualFrames[actualFrames.length - 1];
      Object.entries(last).forEach(([key, value]) => { if (!['offset', 'easing', 'composite'].includes(key)) element.style[key] = value; });
      return true;
    } catch (_) { return false; }
    finally { animations.delete(animation); animation.cancel(); }
  }
  function stop(element) { element.getAnimations().forEach(animation => animation.cancel()); }
  async function resize(element, target) {
    const from = element.getBoundingClientRect().height;
    stop(element);
    const scroller = document.querySelector('.demo-scroll');
    const preserve = scroller && element.getBoundingClientRect().top < scroller.getBoundingClientRect().top;
    let previousHeight = from;
    let tracking = true;
    let frame;
    const track = () => {
      if (!tracking || !element.isConnected) return;
      const current = element.getBoundingClientRect().height;
      if (preserve) scroller.scrollTop += current - previousHeight;
      previousHeight = current;
      frame = requestAnimationFrame(track);
    };
    if (preserve) track();
    const result = await animate(element, [{ height: from + 'px' }, { height: target + 'px' }]);
    tracking = false;
    cancelAnimationFrame(frame);
    return result;
  }
  function reset() {
    generation++;
    timers.forEach(clearTimeout); timers.clear();
    animations.forEach(animation => animation.cancel()); animations.clear();
    abort.abort(); abort = new AbortController();
    document.querySelector('#demo').replaceChildren();
    if (builder) builder(api);
  }
  function apply(next) {
    const previous = settings;
    settings = next;
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.dataset.reduced = String(settings.reduced);
    document.documentElement.style.setProperty('--motion-rate', settings.reduced ? 0.004 : settings.speed);
    if (previous.speed !== next.speed || previous.slowNetwork !== next.slowNetwork || previous.reduced !== next.reduced) reset();
  }
  const api = {
    token, ms, duration, later, listen, animate, stop, resize,
    get settings() { return { ...settings }; },
    get loadTime() { return ms(settings.slowNetwork ? '--motion-load-slow' : '--motion-load'); },
    get distance() { return settings.reduced ? '0px' : token('--motion-distance'); },
    mount(fn) { builder = fn; reset(); if (parent !== window) parent.postMessage({ channel: 'motion-library', action: 'ready' }, '*'); }
  };
  window.MotionDemo = api;
  apply(settings);
  window.addEventListener('message', event => {
    if (event.source !== parent || event.data?.channel !== 'motion-library') return;
    const { action, settings: next } = event.data;
    if (!['settings', 'replay'].includes(action) || !next || ![1, 4].includes(next.speed) || typeof next.slowNetwork !== 'boolean' || typeof next.reduced !== 'boolean' || !['light', 'dark'].includes(next.theme)) return;
    const same = settings.speed === next.speed && settings.slowNetwork === next.slowNetwork && settings.reduced === next.reduced;
    apply({ speed: next.speed, slowNetwork: next.slowNetwork, reduced: next.reduced, theme: next.theme });
    if (action === 'replay' && same) reset();
  });
}());
