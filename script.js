/* =====================================================================
   PROGILSA FUMIGACIONES — "MIRA"
   Todo el comportamiento en un solo IIFE. Cada módulo degrada con elegancia:
   si algo falla, el contenido sigue visible.
   ===================================================================== */

/* Número de WhatsApp (formato internacional, sin +). Única fuente de verdad. */
const WHATSAPP = "528187086538";

(function () {
  'use strict';

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b === undefined ? 1 : b, Math.max(a === undefined ? 0 : a, v));
  const root = document.documentElement;
  const safe = (fn) => { try { fn(); } catch (e) { if (window.console) console.warn('[progilsa]', e); } };

  root.classList.add('js', 'js-ok');

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer: fine)').matches;
  const hasAnime = typeof window.anime === 'function';
  if (hasAnime) root.classList.add('anime-ok');
  let lenis = null;
  let menuOpen = false;

  /* ---------------------------------------------------------------
     WhatsApp
     --------------------------------------------------------------- */
  function waHref(msg) {
    return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg || '');
  }
  function bindWA(scope) {
    $$('[data-wa]', scope).forEach((a) => {
      if (!WHATSAPP) { a.hidden = true; return; }
      a.href = waHref(a.dataset.msg);
      a.target = '_blank';
      a.rel = 'noopener';
    });
  }
  safe(() => {
    bindWA();
    if (!WHATSAPP) {
      const fs = $('#formSubmit'); if (fs) fs.hidden = true;
      const wf = $('#waFloat'); if (wf) wf.hidden = true;
    }
  });

  /* ---------------------------------------------------------------
     Scroll suave (Lenis) — opcional
     --------------------------------------------------------------- */
  safe(() => {
    if (!reduce && typeof window.Lenis === 'function') {
      lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95 });
    }
  });
  function lockScroll(lock) {
    if (lenis) { lock ? lenis.stop() : lenis.start(); }
    else { document.body.style.overflow = lock ? 'hidden' : ''; }
  }

  /* ---------------------------------------------------------------
     Cargador
     --------------------------------------------------------------- */
  let readyDone = false;
  function onReady() {
    if (readyDone) return;
    readyDone = true;
    safe(() => {
      const chips = $$('.lens-chip');
      if (hasAnime && !reduce) {
        chips.forEach((c) => { c.style.opacity = 0; c.style.transform = 'translateY(24px)'; });
      }
      root.classList.add('ready');
      if (hasAnime && !reduce) {
        window.anime({ targets: chips, opacity: [0, 1], translateY: [24, 0], delay: window.anime.stagger(160, { start: 1100 }), duration: 900, easing: 'easeOutExpo' });
      }
    });
    safe(startRotator);
    setTimeout(revealGeo, 300);
    setTimeout(revealGeo, 2000);
    setTimeout(() => { const w = $('#waFloat'); if (w) w.classList.add('show'); }, 4000);
    setTimeout(() => { const w = $('#waFloat'); if (w) w.classList.remove('show'); }, 10000);
  }

  function initLoader() {
    const L = $('#loader');
    if (!L) { onReady(); return; }
    const ring = $('#ldRing');
    const num = $('#ldNum');
    const notches = $$('.ld-n', L);
    const C = 440;
    const t0 = performance.now();
    let loaded = document.readyState === 'complete';
    let finished = false;
    window.addEventListener('load', () => { loaded = true; }, { once: true });
    const dur = reduce ? 300 : 1300;
    const minT = reduce ? 300 : 1200;
    const maxT = reduce ? 500 : 1700;

    if (ring) { ring.style.animation = 'none'; ring.style.strokeDashoffset = C; }
    notches.forEach((n) => { n.style.animation = 'none'; n.style.strokeDashoffset = 1; });
    if (hasAnime && !reduce) {
      window.anime({ targets: notches, strokeDashoffset: [1, 0], duration: 900, delay: window.anime.stagger(120, { start: 150 }), easing: 'easeOutExpo' });
    } else {
      notches.forEach((n) => { n.style.strokeDashoffset = 0; });
    }

    function finish() {
      if (finished) return;
      finished = true;
      if (ring) ring.style.strokeDashoffset = 0;
      if (num) num.textContent = '100';
      L.classList.add('out');
      onReady();
      setTimeout(() => { L.classList.add('gone'); }, 750);
    }
    function step(now) {
      if (finished) return;
      const el = now - t0;
      const p = clamp(el / dur);
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      let pct = Math.round(e * 100);
      const canEnd = (loaded && el >= minT) || el >= maxT;
      if (!canEnd) pct = Math.min(pct, 99);
      if (num) num.textContent = String(pct).padStart(2, '0');
      if (ring) ring.style.strokeDashoffset = C * (1 - pct / 100);
      if (canEnd && pct >= 100) { finish(); return; }
      if (canEnd && el >= maxT) { finish(); return; }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    setTimeout(finish, 2200);
  }

  /* ---------------------------------------------------------------
     Revelados (IntersectionObserver + respaldo por geometría)
     --------------------------------------------------------------- */
  const revealed = new WeakSet();
  const revEls = $$('[data-reveal]');
  function countUp(el) {
    const end = parseFloat(el.dataset.count);
    const suf = el.dataset.suffix || '';
    if (isNaN(end)) return;
    if (reduce) { el.textContent = end + suf; return; }
    const t0 = performance.now(), d = 1500;
    el.textContent = '0' + suf;
    (function f(now) {
      const p = clamp((now - t0) / d);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * e) + suf;
      if (p < 1) requestAnimationFrame(f);
    })(t0);
  }
  function reveal(el) {
    if (revealed.has(el)) return;
    revealed.add(el);
    el.classList.add('is-in');
    if (el.dataset.count !== undefined) countUp(el);
  }
  function revealGeo() {
    const vh = window.innerHeight;
    revEls.forEach((el) => {
      if (revealed.has(el)) return;
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) reveal(el);
    });
  }
  safe(() => {
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => {
        es.forEach((e) => { if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); } });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      revEls.forEach((el) => io.observe(el));
    }
    if (reduce) revEls.forEach(reveal);
  });

  /* ---------------------------------------------------------------
     Manifiesto: palabras que se encienden + píldoras de foto
     --------------------------------------------------------------- */
  const man = $('.man');
  let manWords = [];
  let manPills = [];
  safe(() => {
    if (!man) return;
    (function walk(node) {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            const s = document.createElement('span');
            s.className = 'w'; s.textContent = p; frag.appendChild(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName === 'MARK') {
          walk(n);
        }
      });
    })(man);
    manWords = $$('.w', man);
    manPills = $$('.pill', man);
    if (reduce) {
      manWords.forEach((w) => w.classList.add('on'));
      manPills.forEach((p) => p.style.setProperty('--pp', 1));
    } else {
      manPills.forEach((p) => p.style.setProperty('--pp', 0));
    }
  });

  /* ---------------------------------------------------------------
     Elementos del motor de scroll
     --------------------------------------------------------------- */
  const hdr = $('#header');
  const progressBar = $('#progressBar');
  const themed = $$('[data-tema]');
  const scrubs = $$('[data-scrub]');
  const metodo = $('#metodo');
  const steps = $$('.step');
  const san = $('#sanitizacion');
  const sect = $('#sectores');
  const track = $('#track');
  const sectCount = $('#sectCount');
  const sectBar = $('#sectBar');
  const cis = $$('.ci');
  const ribbon = $('#ribbon');
  const mqs = $$('.mq').map((m) => ({ tr: $('.mq-track', m), dir: parseInt(m.dataset.dir, 10) || -1, pos: 0, half: 0 }));

  const mqPin900 = window.matchMedia('(min-width: 900px)');
  let sectTotal = 0;
  let sectPinned = false;
  let dirty = true;

  function prog(el, mode) {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    if (mode === 'pin') return clamp(-r.top / Math.max(1, r.height - vh));
    if (mode === 'read') return clamp((vh * 0.85 - r.top) / (vh * 0.5 + r.height));
    return clamp((vh - r.top) / (vh + r.height));
  }

  function measure() {
    mqs.forEach((m) => { m.half = m.tr ? m.tr.scrollWidth / 2 : 0; });
    if (sect && track) {
      sectPinned = mqPin900.matches && !reduce;
      sect.classList.toggle('is-pinned', sectPinned);
      if (sectPinned) {
        sectTotal = Math.max(0, track.scrollWidth - window.innerWidth);
        sect.style.height = (sectTotal + window.innerHeight) + 'px';
      } else {
        sectTotal = 0;
        sect.style.height = '';
        track.style.transform = '';
      }
    }
    dirty = true;
  }

  /* ---------------------------------------------------------------
     Tick principal (un solo rAF)
     --------------------------------------------------------------- */
  let lastY = -1, prevT = 0, smoothVel = 0, skew = 0, dirAcc = 0, curStep = -1, lightNow = null;
  const metodoPinnedOn = () => mqPin900.matches && !reduce;

  function onScrollWork(y, dy) {
    const vh = window.innerHeight;
    /* barra de progreso */
    if (progressBar) {
      const max = Math.max(1, document.documentElement.scrollHeight - vh);
      progressBar.style.transform = 'scaleX(' + clamp(y / max).toFixed(4) + ')';
    }
    /* header: ocultar al bajar / tema */
    if (hdr) {
      if (!menuOpen) {
        if (Math.sign(dy) !== Math.sign(dirAcc)) dirAcc = 0;
        dirAcc += dy;
        if (y > 140 && dirAcc > 14) hdr.classList.add('hide');
        else if (dirAcc < -8 || y < 140) hdr.classList.remove('hide');
      }
      let light = false;
      for (let i = 0; i < themed.length; i++) {
        const r = themed[i].getBoundingClientRect();
        if (r.top <= 40 && r.bottom > 40) { light = themed[i].dataset.tema === 'claro'; break; }
      }
      if (light !== lightNow) { lightNow = light; hdr.classList.toggle('light', light); }
    }
    /* scrubs genéricos */
    scrubs.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -vh * 0.5 || r.top > vh * 1.5) return;
      const p = prog(el, el.dataset.scrub);
      el._p = p;
      el.style.setProperty('--p', p.toFixed(4));
    });
    /* manifiesto */
    if (man && !reduce && manWords.length) {
      const p = man._p !== undefined ? man._p : prog(man, 'read');
      const n = manWords.length;
      manWords.forEach((w, i) => { w.classList.toggle('on', i / n <= p * 1.08); });
      manPills.forEach((pl) => {
        const at = parseFloat(pl.dataset.at) || 0;
        pl.style.setProperty('--pp', clamp((p - at) / 0.16).toFixed(3));
      });
    }
    /* método */
    if (metodo) {
      if (metodoPinnedOn()) {
        const p = metodo._p || 0;
        const s = Math.min(3, Math.floor(p * 4));
        if (s !== curStep) {
          curStep = s;
          metodo.dataset.step = String(s);
          steps.forEach((el, i) => el.classList.toggle('act', i === s));
        }
      } else if (curStep !== -2) {
        curStep = -2;
        steps.forEach((el) => el.classList.add('act'));
      }
    }
    /* sanitización (iris) */
    if (san) {
      if (reduce) {
        san.dataset.stage = 'all';
        san.style.setProperty('--r', 1);
      } else {
        const p = san._p !== undefined ? san._p : prog(san, 'pin');
        const r = 0.1 + 0.9 * clamp(p / 0.6);
        san.style.setProperty('--r', r.toFixed(4));
        const st = r < 0.5 ? '1' : (r > 0.6 ? '2' : '0');
        if (san.dataset.stage !== st) san.dataset.stage = st;
      }
    }
    /* sectores */
    if (sect && track && sectPinned) {
      const p = sect._p !== undefined ? sect._p : prog(sect, 'pin');
      track.style.transform = 'translate3d(' + (-p * sectTotal).toFixed(1) + 'px,0,0)';
      if (sectCount) sectCount.textContent = '0' + Math.min(8, Math.floor(p * 8) + 1) + ' / 08';
      if (sectBar) sectBar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    }
    /* collage: parallax */
    if (!reduce) {
      const k = window.innerWidth < 768 ? 0.4 : 1;
      cis.forEach((ci) => {
        const r = ci.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const p = prog(ci, 'enter');
        const amp = parseFloat(ci.dataset.amp) || 80;
        ci.style.setProperty('--py', ((0.5 - p) * amp * k).toFixed(1));
      });
    }
  }

  function tick(now) {
    requestAnimationFrame(tick);
    if (lenis) lenis.raf(now);
    const dt = Math.min(0.05, (now - prevT) / 1000 || 0.016);
    prevT = now;
    const y = window.scrollY || window.pageYOffset;
    const dy = lastY < 0 ? 0 : y - lastY;
    const moved = dy !== 0 || dirty;
    lastY = y;
    if (moved) { onScrollWork(y, dy); revealGeo(); dirty = false; }
    /* cursor mira */
    if (cursorTick) cursorTick();
    /* cinta: velocidad ligada al scroll */
    if (!reduce) {
      smoothVel += (Math.abs(dy) - smoothVel) * 0.1;
      skew += (clamp(dy * 0.12, -5, 5) - skew) * 0.08;
      if (ribbon) ribbon.style.setProperty('--skew', skew.toFixed(3));
      mqs.forEach((m) => {
        if (!m.half || !m.tr) return;
        m.pos = (m.pos + (60 + smoothVel * 55) * dt) % m.half;
        const x = m.dir < 0 ? -m.pos : -m.half + m.pos;
        m.tr.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
      });
    }
  }

  /* ---------------------------------------------------------------
     Header / menú móvil
     --------------------------------------------------------------- */
  function setMenu(open) {
    menuOpen = open;
    root.classList.toggle('menu-open', open);
    const b = $('#burger'), m = $('#menu');
    if (b) { b.setAttribute('aria-expanded', String(open)); b.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú'); }
    if (m) m.setAttribute('aria-hidden', String(!open));
    if (hdr) hdr.classList.remove('hide');
    lockScroll(open);
  }
  safe(() => {
    const b = $('#burger');
    if (b) b.addEventListener('click', () => setMenu(!menuOpen));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) setMenu(false); });
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (!id || id.length < 2) return;
        let t = null;
        try { t = $(id); } catch (err) { t = null; }
        if (!t) return;
        e.preventDefault();
        if (menuOpen) setMenu(false);
        if (lenis) lenis.scrollTo(t, { offset: id === '#inicio' ? 0 : -4, duration: 1.5 });
        else t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      });
    });
  });

  /* ---------------------------------------------------------------
     Palabra rotatoria del h1
     --------------------------------------------------------------- */
  function startRotator() {
    const el = $('#rotW');
    if (!el || reduce) return;
    const words = ['cucarachas', 'termitas', 'roedores', 'chinches', 'hormigas', 'mosquitos', 'garrapatas'];
    let i = 0;
    setInterval(() => {
      if (document.hidden) return;
      el.classList.add('out');
      setTimeout(() => {
        i = (i + 1) % words.length;
        el.textContent = words[i];
        el.classList.add('pre');
        el.classList.remove('out');
        void el.offsetWidth;
        el.classList.remove('pre');
      }, 360);
    }, 2400);
  }

  /* ---------------------------------------------------------------
     Hero: canvas de hormigas + mira
     --------------------------------------------------------------- */
  function initHero() {
    const hero = $('#hero'), cv = $('#campo');
    if (!hero || !cv || !cv.getContext) return;
    const ctx = cv.getContext('2d');
    const hudE = $('#hudEstado');
    const small = window.innerWidth < 768;
    const NA = small ? 12 : 22, NF = small ? 18 : 40;
    let W = 0, H = 0, running = false, visible = true, last = 0;
    const rnd = (a, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
    const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

    function sprite(rgb) {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const g = c.getContext('2d');
      const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, 'rgba(' + rgb + ',.55)');
      gr.addColorStop(1, 'rgba(' + rgb + ',0)');
      g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
      return c;
    }
    const sprites = [sprite('255,255,255'), sprite('227,38,46'), sprite('61,165,64')];
    const fog = [], ants = [], parts = [], waves = [];
    const ptr = { on: false, x: 0, y: 0, t: 0 };
    const M = { x: 0, y: 0, r: 70, mode: 'patrol', t: 0, tgt: null, rot: 0, lock: false };
    let estado = '';
    function setE(t) { if (t !== estado && hudE) { estado = t; hudE.textContent = t; } }

    function size() {
      const r = hero.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function spawnEdge(a) {
      const s = (Math.random() * 4) | 0;
      if (s === 0) { a.x = rnd(W); a.y = -30; a.ang = Math.PI / 2 + rnd(-0.6, 0.6); }
      else if (s === 1) { a.x = W + 30; a.y = rnd(H); a.ang = Math.PI + rnd(-0.6, 0.6); }
      else if (s === 2) { a.x = rnd(W); a.y = H + 30; a.ang = -Math.PI / 2 + rnd(-0.6, 0.6); }
      else { a.x = -30; a.y = rnd(H); a.ang = rnd(-0.6, 0.6); }
      a.trail = []; a.alive = true; a.red = 0; a.hold = false;
    }
    function init() {
      size();
      ants.length = 0; fog.length = 0;
      for (let i = 0; i < NA; i++) {
        const a = { x: rnd(W), y: rnd(H), ang: rnd(6.28), sp: rnd(22, 44), ph: rnd(6.28), seed: rnd(100), t: 0, tt: 0, trail: [], alive: true, red: 0, hold: false, respawn: 0, size: rnd(0.85, 1.2) * (small ? 0.9 : 1.05) };
        ants.push(a);
      }
      for (let i = 0; i < NF; i++) {
        fog.push({ x: rnd(W), y: rnd(H), vx: rnd(-9, 9), vy: rnd(-6, 6), s: rnd(140, 340), k: i % 5 === 0 ? 1 : (i % 7 === 0 ? 2 : 0), a: rnd(0.04, 0.09) });
      }
      M.x = W * 0.5; M.y = H * 0.5;
    }
    function pickTarget() {
      const c = ants.filter((a) => a.alive && a.x > 40 && a.x < W - 40 && a.y > 60 && a.y < H - 60);
      ants.forEach((a) => { a.red = 0; a.hold = false; });
      M.tgt = c.length ? c[(Math.random() * c.length) | 0] : null;
    }
    function kill(a) {
      a.alive = false; a.red = 0; a.hold = false; a.respawn = 2; a.trail = [];
      waves.push({ x: a.x, y: a.y, t: 0 });
      for (let i = 0; i < 26; i++) {
        const an = rnd(6.28), sp = rnd(40, 180);
        parts.push({ x: a.x, y: a.y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, l: 1, s: rnd(1.5, 3.2) });
      }
      setE('OBJETIVO NEUTRALIZADO');
    }
    function update(dt) {
      fog.forEach((f) => {
        f.x += f.vx * dt; f.y += f.vy * dt;
        if (f.x < -f.s) f.x = W + f.s; if (f.x > W + f.s) f.x = -f.s;
        if (f.y < -f.s) f.y = H + f.s; if (f.y > H + f.s) f.y = -f.s;
      });
      ants.forEach((a) => {
        if (!a.alive) { a.respawn -= dt; if (a.respawn <= 0) spawnEdge(a); return; }
        a.t += dt;
        a.ang += Math.sin(a.t * 0.9 + a.seed) * dt * 1.4 + Math.sin(a.t * 2.3 + a.seed * 2) * dt * 0.6;
        const sp = a.hold ? a.sp * 0.12 : a.sp;
        a.x += Math.cos(a.ang) * sp * dt; a.y += Math.sin(a.ang) * sp * dt;
        a.ph += dt * sp * 0.3;
        a.tt += dt;
        if (a.tt > 0.05) { a.tt = 0; a.trail.push(a.x, a.y); if (a.trail.length > 24) a.trail.splice(0, 2); }
        if (a.x < -80 || a.x > W + 80 || a.y < -80 || a.y > H + 80) spawnEdge(a);
      });
      M.rot += dt * 0.8;
      const pOn = ptr.on && (performance.now() - ptr.t < 4000);
      if (pOn) {
        M.x += (ptr.x - M.x) * Math.min(1, 0.18 * dt * 60);
        M.y += (ptr.y - M.y) * Math.min(1, 0.18 * dt * 60);
        let best = null, bd = 90;
        ants.forEach((a) => { a.red = 0; a.hold = false; if (!a.alive) return; const d = Math.hypot(a.x - M.x, a.y - M.y); if (d < bd) { bd = d; best = a; } });
        if (best) {
          best.red = 1; best.hold = true;
          M.x += (best.x - M.x) * 0.25; M.y += (best.y - M.y) * 0.25;
          M.r += (34 - M.r) * 0.2; M.lock = true; setE('CONTACTO ▸ MARCANDO');
        } else { M.r += (70 - M.r) * 0.15; M.lock = false; setE('SECTOR A-07 ▸ ESCANEANDO'); }
        M.mode = 'patrol'; M.t = 0; M.tgt = null;
      } else {
        const T = M.tgt;
        if (M.mode === 'patrol') {
          M.lock = false;
          if (!T || !T.alive) pickTarget();
          M.t += dt;
          M.r += (70 - M.r) * Math.min(1, dt * 6);
          if (M.tgt) {
            M.x += (M.tgt.x - M.x) * Math.min(1, dt * 3.2);
            M.y += (M.tgt.y - M.y) * Math.min(1, dt * 3.2);
            if (M.t >= 1.2) { M.mode = 'acquire'; M.t = 0; setE('CONTACTO ▸ MARCANDO'); }
          } else if (M.t > 1.2) M.t = 0;
        } else if (M.mode === 'acquire') {
          M.t += dt; M.lock = true;
          if (!T || !T.alive) { M.mode = 'patrol'; M.t = 0; return; }
          M.r = 70 - 36 * ease(Math.min(1, M.t / 0.5));
          T.red = Math.min(1, M.t / 0.3); T.hold = true;
          M.x += (T.x - M.x) * 0.35; M.y += (T.y - M.y) * 0.35;
          if (M.t >= 0.5) { M.mode = 'hold'; M.t = 0; }
        } else if (M.mode === 'hold') {
          M.t += dt;
          if (!T || !T.alive) { M.mode = 'patrol'; M.t = 0; return; }
          M.x += (T.x - M.x) * 0.35; M.y += (T.y - M.y) * 0.35;
          if (M.t >= 0.35) { kill(T); M.mode = 'recover'; M.t = 0; }
        } else {
          M.t += dt; M.lock = false;
          M.r += (70 - M.r) * Math.min(1, dt * 6);
          if (M.t >= 0.55) { M.mode = 'patrol'; M.t = 0; M.tgt = null; setE('SECTOR A-07 ▸ ESCANEANDO'); }
        }
      }
      for (let i = waves.length - 1; i >= 0; i--) { waves[i].t += dt * 1.6; if (waves[i].t >= 1) waves.splice(i, 1); }
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy *= 0.96; p.l -= dt * 1.1;
        if (p.l <= 0) parts.splice(i, 1);
      }
    }
    function drawAnt(a) {
      const col = a.red > 0 ? 'rgba(227,38,46,' + (0.55 + a.red * 0.4) + ')' : 'rgba(244,241,234,.5)';
      const s = a.size;
      if (a.trail.length > 3) {
        ctx.lineWidth = 1.2; ctx.lineCap = 'round';
        for (let i = 2; i < a.trail.length; i += 2) {
          ctx.strokeStyle = 'rgba(244,241,234,' + (0.16 * i / a.trail.length) + ')';
          ctx.beginPath(); ctx.moveTo(a.trail[i - 2], a.trail[i - 1]); ctx.lineTo(a.trail[i], a.trail[i + 1]); ctx.stroke();
        }
      }
      ctx.save();
      ctx.translate(a.x, a.y); ctx.rotate(a.ang);
      ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 1 * s;
      ctx.beginPath(); ctx.ellipse(8.5 * s, 0, 2.7 * s, 2.3 * s, 0, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.ellipse(2 * s, 0, 3.6 * s, 2.5 * s, 0, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.ellipse(-7 * s, 0, 5.8 * s, 3.6 * s, 0, 0, 6.283); ctx.fill();
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const bx = (4 - i * 2.6) * s, sw = Math.sin(a.ph + i * 2.1) * 3 * s;
        ctx.moveTo(bx, 0); ctx.lineTo(bx + sw, -8 * s);
        ctx.moveTo(bx, 0); ctx.lineTo(bx - sw, 8 * s);
      }
      ctx.moveTo(10 * s, -1 * s); ctx.lineTo(14 * s, -4 * s);
      ctx.moveTo(10 * s, 1 * s); ctx.lineTo(14 * s, 4 * s);
      ctx.stroke();
      ctx.restore();
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      fog.forEach((f) => { ctx.globalAlpha = f.a; ctx.drawImage(sprites[f.k], f.x - f.s / 2, f.y - f.s / 2, f.s, f.s); });
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ants.forEach((a) => { if (a.alive) drawAnt(a); });
      /* ondas */
      waves.forEach((w) => {
        ctx.strokeStyle = 'rgba(61,165,64,' + (1 - w.t) * 0.8 + ')'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(w.x, w.y, w.t * 150, 0, 6.283); ctx.stroke();
        ctx.strokeStyle = 'rgba(244,241,234,' + (1 - w.t) * 0.4 + ')'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(w.x, w.y, w.t * 100, 0, 6.283); ctx.stroke();
      });
      parts.forEach((p) => { ctx.fillStyle = 'rgba(61,165,64,' + clamp(p.l) + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 6.283); ctx.fill(); });
      /* mira */
      const r = M.r, c = 'rgba(227,38,46,.95)';
      ctx.strokeStyle = c; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(M.x, M.y, r, 0, 6.283); ctx.stroke();
      ctx.strokeStyle = 'rgba(227,38,46,.35)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(M.x, M.y, r * 0.5, 0, 6.283); ctx.stroke();
      ctx.strokeStyle = c; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let k = 0; k < 4; k++) {
        const an = k * Math.PI / 2, ca = Math.cos(an), sa = Math.sin(an);
        ctx.moveTo(M.x + ca * (r - 10), M.y + sa * (r - 10)); ctx.lineTo(M.x + ca * (r + 12), M.y + sa * (r + 12));
      }
      ctx.stroke();
      ctx.strokeStyle = 'rgba(244,241,234,.55)'; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let k = 0; k < 16; k++) {
        const an = M.rot + k * Math.PI / 8, ca = Math.cos(an), sa = Math.sin(an);
        ctx.moveTo(M.x + ca * (r + 18), M.y + sa * (r + 18)); ctx.lineTo(M.x + ca * (r + 23), M.y + sa * (r + 23));
      }
      ctx.stroke();
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(M.x, M.y, 2, 0, 6.283); ctx.fill();
      if (M.lock) { ctx.font = '700 10px "JetBrains Mono",monospace'; ctx.fillStyle = '#fff'; ctx.fillText('LOCK', M.x + r + 10, M.y - r * 0.6); }
    }
    function frame(now) {
      if (!running) return;
      requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      if (document.hidden) return;
      update(dt); draw();
    }
    function start() { if (running || reduce) return; running = true; last = performance.now(); requestAnimationFrame(frame); }
    function stop() { running = false; }

    init();
    if (reduce) {
      for (let i = 0; i < 40; i++) update(0.05);
      draw();
    } else {
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((es) => { visible = es[0].isIntersecting; visible ? start() : stop(); }, { threshold: 0 }).observe(hero);
      }
      start();
    }
    let rt;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => { size(); M.x = Math.min(M.x, W); M.y = Math.min(M.y, H); if (reduce) draw(); }, 200);
    });

    /* Puntero: la mira sigue al cursor (solo ratón) */
    if (fine) {
      hero.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const r = hero.getBoundingClientRect();
        ptr.on = true; ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.t = performance.now();
      });
      hero.addEventListener('pointerleave', () => { ptr.on = false; });
      hero.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'mouse' || e.target.closest('a,button,input,select,textarea,summary')) return;
        const r = hero.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        let best = null, bd = 90;
        ants.forEach((a) => { if (!a.alive) return; const d = Math.hypot(a.x - x, a.y - y); if (d < bd) { bd = d; best = a; } });
        if (best) kill(best); else waves.push({ x: x, y: y, t: 0 });
      });
    }
  }

  /* Paralaje 3D de la lente */
  function initLens() {
    const hero = $('#hero'), lens = $('#lens'), img = $('#lensPhoto img');
    if (!hero || !lens || !fine || reduce) return;
    hero.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = hero.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      lens.style.transform = 'rotateY(' + (nx * 12).toFixed(2) + 'deg) rotateX(' + (-ny * 12).toFixed(2) + 'deg)';
      if (img) img.style.transform = 'translate(' + (-nx * 24).toFixed(1) + 'px,' + (-ny * 24).toFixed(1) + 'px)';
    });
    hero.addEventListener('pointerleave', () => {
      lens.style.transform = '';
      if (img) img.style.transform = '';
    });
  }

  /* ---------------------------------------------------------------
     Cursor mira, botones magnéticos, spotlight y tilt
     --------------------------------------------------------------- */
  let cursorTick = null;
  function initCursor() {
    const c = $('#cursor');
    if (!c || !fine || reduce) return;
    c.hidden = false;
    let x = -100, y = -100, cx = x, cy = y;
    window.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { x = e.clientX; y = e.clientY; } }, { passive: true });
    document.addEventListener('pointerover', (e) => {
      const t = e.target.closest && e.target.closest('a,button,summary,[data-hover],input,select,textarea,label,.blip');
      c.classList.toggle('is-lock', !!t);
    });
    document.addEventListener('pointerleave', () => { c.style.opacity = 0; });
    document.addEventListener('pointerenter', () => { c.style.opacity = 1; });
    cursorTick = () => {
      cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
      c.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
    };
  }
  function initMagnet() {
    if (!fine || reduce) return;
    const els = $$('[data-magnet]');
    if (!els.length) return;
    window.addEventListener('pointermove', (e) => {
      els.forEach((b) => {
        const r = b.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy);
        if (d < 140) {
          const k = (1 - d / 140) * 8;
          const n = d || 1;
          b.style.setProperty('--tx', (dx / n * k).toFixed(1) + 'px');
          b.style.setProperty('--ty', (dy / n * k).toFixed(1) + 'px');
        } else { b.style.removeProperty('--tx'); b.style.removeProperty('--ty'); }
      });
    }, { passive: true });
  }
  function initCards() {
    const tiltOn = fine && !reduce;
    $$('.spot').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        if (tiltOn && e.pointerType === 'mouse') {
          card.style.transform = 'perspective(900px) rotateX(' + ((0.5 - py) * 8).toFixed(2) + 'deg) rotateY(' + ((px - 0.5) * 8).toFixed(2) + 'deg)';
        }
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }

  /* ---------------------------------------------------------------
     Radar de plagas
     --------------------------------------------------------------- */
  function initRadar() {
    const rad = $('#rad'), detail = $('#radDetail');
    if (!rad || !detail) return;
    const PL = {
      'cucarachas': { t: 'Cucarachas', x: 'Viven en cocinas, drenajes y rincones oscuros y salen de noche. Se tratan en su origen, no solo donde las ves.', c: ['Cocinas', 'Drenajes', 'Bodegas'], art: 'las' },
      'hormigas': { t: 'Hormigas', x: 'Siguen rutas hasta su nido: si solo atacas la fila, regresan. Vamos por la colonia.', c: ['Jardines', 'Cocinas', 'Muros'], art: 'las' },
      'roedores': { t: 'Roedores', x: 'Ratas y ratones dañan cableado, contaminan alimentos y entran por huecos mínimos. Eliminación y monitoreo continuo.', c: ['Techos', 'Bodegas', 'Cocinas'], art: 'los' },
      'termitas': { t: 'Termitas', x: 'Trabajan por dentro de la madera sin que lo notes. Tratamiento especializado con garantía de hasta 5 años.', c: ['Madera', 'Marcos', 'Estructuras'], art: 'las' },
      'chinches de cama': { t: 'Chinches de cama', x: 'Viajan en maletas y colchones y se esconden en las costuras. Piden tratamiento especializado.', c: ['Colchones', 'Habitaciones', 'Muebles'], art: 'las' },
      'pulgas': { t: 'Pulgas', x: 'Llegan con las mascotas y se instalan en alfombras y tapetes. Atendemos el espacio completo.', c: ['Alfombras', 'Patios', 'Mascotas'], art: 'las' },
      'garrapatas': { t: 'Garrapatas', x: 'Se alojan en pasto y mascotas. Tratamos jardines y zonas de descanso.', c: ['Jardines', 'Patios', 'Perreras'], art: 'las' },
      'arañas': { t: 'Arañas', x: 'Tejen en esquinas y áreas poco transitadas. Control para tu tranquilidad.', c: ['Esquinas', 'Bodegas', 'Azoteas'], art: 'las' },
      'mosquitos': { t: 'Mosquitos', x: 'Se reproducen en agua estancada y áreas verdes. Reducimos su presencia en patios y exteriores.', c: ['Patios', 'Jardines', 'Coladeras'], art: 'los' }
    };
    const blips = $$('.blip', rad);
    const title = $('#radTitle'), text = $('#radText'), chips = $('#radChips'), cta = $('#radCta');
    let current = 'cucarachas', timer = 0;
    function ripple(b) {
      if (!hasAnime || reduce) return;
      const s = document.createElement('i');
      s.style.cssText = 'position:absolute;left:' + b.style.left + ';top:' + b.style.top + ';width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;border:2px solid #E3262E;pointer-events:none;z-index:1';
      rad.appendChild(s);
      window.anime({ targets: s, scale: [0.3, 5], opacity: [0.9, 0], duration: 900, easing: 'easeOutExpo', complete: () => s.remove() });
    }
    function select(key, b) {
      if (key === current) return;
      current = key;
      blips.forEach((x) => { const on = x === b; x.classList.toggle('sel', on); x.setAttribute('aria-pressed', String(on)); });
      ripple(b);
      const d = PL[key];
      detail.classList.add('swap');
      clearTimeout(timer);
      timer = setTimeout(() => {
        title.textContent = d.t;
        text.textContent = d.x;
        chips.innerHTML = '';
        d.c.forEach((c) => { const li = document.createElement('li'); li.textContent = c; chips.appendChild(li); });
        cta.querySelector('span').textContent = 'Quiero sacar a ' + d.art + ' ' + key;
        cta.dataset.msg = 'Hola, necesito control de ' + key + '.';
        bindWA(detail);
        detail.classList.remove('swap');
      }, 260);
    }
    blips.forEach((b) => b.addEventListener('click', () => select(b.dataset.p, b)));
  }

  /* ---------------------------------------------------------------
     Bruma de la sanitización
     --------------------------------------------------------------- */
  function initMist() {
    const m = $('#mist');
    if (!m || reduce) return;
    const n = window.innerWidth < 768 ? 12 : 22;
    for (let i = 0; i < n; i++) {
      const s = document.createElement('i');
      const sz = 80 + Math.random() * 180;
      s.style.cssText = 'left:' + (Math.random() * 100) + '%;top:' + (Math.random() * 100) + '%;width:' + sz + 'px;height:' + sz + 'px;animation-duration:' + (14 + Math.random() * 18) + 's;animation-direction:alternate;animation-delay:-' + (Math.random() * 20) + 's;--dx:' + ((Math.random() - 0.5) * 160) + 'px;--dy:' + ((Math.random() - 0.7) * 160) + 'px';
      m.appendChild(s);
    }
  }

  /* ---------------------------------------------------------------
     Preguntas frecuentes (acordeón animado)
     --------------------------------------------------------------- */
  function initFaq() {
    $$('.faq details').forEach((d) => {
      if (d.open) d.classList.add('is-open');
      const s = $('summary', d);
      s.addEventListener('click', (e) => {
        e.preventDefault();
        if (d.classList.contains('is-open')) {
          d.classList.remove('is-open');
          setTimeout(() => { if (!d.classList.contains('is-open')) d.open = false; }, 520);
        } else {
          d.open = true;
          requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add('is-open')));
        }
      });
    });
  }

  /* ---------------------------------------------------------------
     Formulario → WhatsApp
     --------------------------------------------------------------- */
  function initForm() {
    const form = $('#form');
    if (!form) return;
    const nombre = $('#f-nombre'), err = $('#err-nombre'), ok = $('#formOk');
    nombre.addEventListener('input', () => { err.textContent = ''; nombre.parentElement.classList.remove('bad'); nombre.removeAttribute('aria-invalid'); });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const n = nombre.value.trim();
      if (n.length < 2) {
        err.textContent = 'Escribe tu nombre para poder atenderte.';
        nombre.parentElement.classList.add('bad');
        nombre.setAttribute('aria-invalid', 'true');
        nombre.focus();
        return;
      }
      if (!WHATSAPP) return;
      const zona = $('#f-zona').value.trim();
      const esp = $('#f-espacio').value;
      const srv = $('#f-servicio').value;
      const msg = $('#f-msg').value.trim();
      let t = 'Hola, soy ' + n + '. Necesito ' + (srv ? srv.toLowerCase() : 'información de sus servicios');
      if (esp) t += ' para ' + esp.toLowerCase();
      if (zona) t += ' en ' + zona;
      t += '.';
      if (msg) t += ' ' + msg;
      if (ok) { ok.hidden = false; }
      window.open(waHref(t), '_blank', 'noopener');
    });
  }

  /* ---------------------------------------------------------------
     Lightbox con FLIP
     --------------------------------------------------------------- */
  function initLightbox() {
    const lb = $('#lb'), img = $('#lbImg'), cap = $('#lbCap'), x = $('#lbX');
    if (!lb || typeof lb.showModal !== 'function') return;
    let srcBtn = null, srcImg = null, closing = false;
    function open(btn) {
      srcBtn = btn; srcImg = $('img', btn);
      const first = srcImg.getBoundingClientRect();
      const fc = btn.parentElement.querySelector('figcaption');
      img.src = srcImg.currentSrc || srcImg.src;
      img.alt = srcImg.alt;
      cap.textContent = fc ? fc.textContent : '';
      img.style.transition = 'none';
      img.style.transform = '';
      if (lenis) lenis.stop();
      lb.showModal();
      const run = () => {
        const last = img.getBoundingClientRect();
        if (!reduce && last.width) {
          const s = first.width / last.width;
          const dx = (first.left + first.width / 2) - (last.left + last.width / 2);
          const dy = (first.top + first.height / 2) - (last.top + last.height / 2);
          img.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')';
          void img.offsetWidth;
          img.style.transition = '';
          img.style.transform = '';
        } else img.style.transition = '';
        x.focus();
      };
      (img.decode ? img.decode() : Promise.resolve()).then(run, run);
    }
    function close() {
      if (closing || !lb.open) return;
      closing = true;
      const done = () => {
        lb.close(); closing = false;
        img.style.transform = '';
        if (lenis && !menuOpen) lenis.start();
        if (srcBtn) srcBtn.focus({ preventScroll: true });
      };
      if (reduce || !srcImg) { done(); return; }
      const first = srcImg.getBoundingClientRect();
      const last = img.getBoundingClientRect();
      if (last.width && first.bottom > 0 && first.top < window.innerHeight) {
        const s = first.width / last.width;
        const dx = (first.left + first.width / 2) - (last.left + last.width / 2);
        const dy = (first.top + first.height / 2) - (last.top + last.height / 2);
        img.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')';
        setTimeout(done, 480);
      } else done();
    }
    $$('[data-lb]').forEach((b) => b.addEventListener('click', () => open(b)));
    x.addEventListener('click', (e) => { e.stopPropagation(); close(); });
    lb.addEventListener('click', close);
    lb.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
    lb.addEventListener('keydown', (e) => { if (e.key === 'Tab') { e.preventDefault(); x.focus(); } });
  }

  /* ---------------------------------------------------------------
     Arranque
     --------------------------------------------------------------- */
  safe(initLoader);
  safe(initHero);
  safe(initLens);
  safe(initCursor);
  safe(initMagnet);
  safe(initCards);
  safe(initRadar);
  safe(initMist);
  safe(initFaq);
  safe(initForm);
  safe(initLightbox);
  safe(measure);

  window.addEventListener('scroll', () => { dirty = true; }, { passive: true });
  let rz;
  window.addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => { measure(); revealGeo(); }, 120);
  });
  window.addEventListener('load', () => { measure(); revealGeo(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); });
  if (reduce) { revEls.forEach(reveal); }
  revealGeo();
  requestAnimationFrame(tick);
})();
