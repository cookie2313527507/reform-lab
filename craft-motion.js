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
    <div class="scroll-art" aria-hidden="true"><div class="scroll-paper"><div class="paper-frame">
      <span class="scroll-seal">工艺图谱</span><h2>天工开物</h2><span class="scroll-subtitle">材有所限 · 工有所成</span>
      <svg class="craft-diagram" viewBox="0 0 300 130" fill="none" aria-hidden="true">
        <g class="craft-old" stroke="currentColor" stroke-width=".8"><circle cx="63" cy="66" r="42"/><circle cx="63" cy="66" r="34"/><circle cx="63" cy="66" r="8"/><path d="M21 66h84M63 24v84M33 36l60 60M33 96l60-60M13 113h105M32 109l24-35m15 0 24 35M16 18h93M16 14v8m93-8v8"/></g>
        <path class="craft-transfer" d="M106 66h40l15-22h31" stroke="#b4a4ff" stroke-width="1.3"/>
        <g class="craft-new" stroke="#c5cee5"><path d="M190 27h64l21 21v53h-98V40Z" fill="#8290ff18"/><circle cx="202" cy="65" r="7"/><circle cx="250" cy="65" r="7"/><path d="M192 65h20m-10-10v20m38-10h20m-10-10v20M174 15h104m-104-4v8m104-8v8M286 26v76m-4-76h8m-8 76h8" stroke-width=".7"/></g>
      </svg><span class="scroll-caption">工艺意象 · 非测量图</span>
    </div></div><div class="scroll-roller roller-left"></div><div class="scroll-roller roller-right"></div></div>
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
