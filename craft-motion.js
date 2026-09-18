/* Presentation only: no geometry, inventory, constraint or approval state. */
(() => {
  'use strict';
  const key = 'reform-scroll-intro-v1';
  const pulses = new WeakMap();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let seen = true, staticMode = false, stage, timer, observer;
  try { seen = sessionStorage.getItem(key) === 'seen'; staticMode = sessionStorage.getItem('reform-static') === 'true'; }
  catch { /* Storage unavailable: stable, expanded composition. */ }
  const stageMarkup = () => `<aside class="craft-stage" aria-label="天工开物卷轴开场">
    <div class="scroll-art supplied-scroll" role="img" aria-label="天工开物，材有所限，工有所成。工艺意象，非测量图。"><div class="scroll-paper"><div class="supplied-paper-image"></div></div><div class="scroll-roller roller-left"></div><div class="scroll-roller roller-right"></div></div>
    <div class="intro-controls"><button type="button" class="intro-toggle">重播开场</button><button type="button" class="motion-toggle" aria-pressed="${staticMode}">${staticMode?'启用动态':'静态模式'}</button></div>
  </aside>`;
  function finish() {
    clearTimeout(timer);
    if (!stage) return;
    stage.classList.remove('intro-playing');
    stage.querySelector('.intro-toggle').textContent = '重播开场';
  }
  function play() {
    finish();
    if (!stage || reduced.matches || staticMode) return;
    stage.classList.remove('intro-playing'); void stage.offsetWidth;
    stage.classList.add('intro-playing');
    stage.querySelector('.intro-toggle').textContent = '跳过开场';
    seen = true;
    try { sessionStorage.setItem(key, 'seen'); } catch {}
    timer = setTimeout(finish, 3100);
  }
  function mount(page) {
    // Reuse the same stage across whole-page business renders; never replay on inputs.
    const title = document.querySelector('.work-title');
    if (page !== 'work' || !title) { finish(); observer?.disconnect(); stage?.remove(); return; }
    if (!stage) { const t = document.createElement('template'); t.innerHTML = stageMarkup(); stage = t.content.firstElementChild;
      stage.querySelector('.intro-toggle').onclick = () => stage.classList.contains('intro-playing') ? finish() : play();
      stage.querySelector('.motion-toggle').onclick = e => {
        staticMode = !staticMode; finish();
        document.documentElement.classList.toggle('motion-static', staticMode);
        e.currentTarget.setAttribute('aria-pressed', String(staticMode));
        e.currentTarget.textContent = staticMode ? '启用动态' : '静态模式';
        try { sessionStorage.setItem('reform-static', String(staticMode)); } catch {}
      };
    }
    title.append(stage);
    document.documentElement.classList.toggle('motion-static', staticMode);
    observer?.disconnect();
    if ('IntersectionObserver' in window) { observer = new IntersectionObserver(entries => {
      stage.classList.toggle('offstage', !entries[0].isIntersecting);
    }); observer.observe(stage); }
    if (!seen) play();
  }
  function feedback(selector) {
    if (reduced.matches || staticMode) return;
    const el = document.querySelector(selector);
    if (el?.animate) { pulses.get(el)?.cancel(); pulses.set(el, el.animate([{boxShadow:'inset 0 0 0 1px #b4a4ff'},{boxShadow:'inset 0 0 0 1px transparent'}], {duration:520,easing:'ease-out'})); }
  }
  document.addEventListener('keydown', e => { if(e.key === 'Escape') finish(); });
  document.addEventListener('visibilitychange', () => { document.documentElement.classList.toggle('motion-hidden', document.hidden); if(document.hidden) finish(); });
  reduced.addEventListener('change', finish);
  window.addEventListener('pagehide', () => { finish(); observer?.disconnect(); });
  window.ReformCraft = {mount, feedback};
})();
