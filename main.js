/* ═══════════════════════════════════════════════════════════
   LUNA — main.js
   All effects, animations and interactivity for the
   LUNA celestial story website.
═══════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
const lerp  = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const eio   = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

/* ─────────────────────────────────────────────────────────
   DEVICE DETECTION
───────────────────────────────────────────────────────── */
const isMobile  = window.matchMedia('(max-width: 768px)').matches;
const isTouch   = window.matchMedia('(hover: none)').matches;
const prefersRM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ─────────────────────────────────────────────────────────
   SCROLL STATE
───────────────────────────────────────────────────────── */
let scrollY = 0;
let scrollH = 1;
const getSP = () => clamp(scrollY / scrollH, 0, 1);

/* ─────────────────────────────────────────────────────────
   DOM CACHE  (query once, never again inside loops)
───────────────────────────────────────────────────────── */
const DOM = {
  cdot:       document.getElementById('cdot'),
  cring:      document.getElementById('cring'),
  flare:      document.getElementById('mouse-flare'),
  pbar:       document.getElementById('pbar'),
  aurora:     document.getElementById('aurora'),
  phaseLabel: document.getElementById('phase-label'),
  header:     document.getElementById('site-header'),
  ham:        document.getElementById('ham'),
  mobNav:     document.getElementById('mob-nav'),
  moonWrap:   document.getElementById('moon-wrap'),
  mSpec:      document.getElementById('mSpec'),
  moonPhoto:  document.querySelector('.moon-photo'),
  phaseCvs:   document.getElementById('phase-cvs'),
  starCvs:    document.getElementById('star-cvs'),
  nebCvs:     document.getElementById('neb-cvs'),
  metCvs:     document.getElementById('met-cvs'),
  earthBg:    document.getElementById('earthBg'),
  apolloSec:  document.getElementById('apollo'),
  heroTitle:  document.getElementById('heroTitle'),
  heroSub:    document.getElementById('heroSub'),
  fmWrap:     document.querySelector('.full-moon-img-wrap'),
  moonSphere: document.querySelector('.moon-sphere'),
  ndots:      [...document.querySelectorAll('.nd')],
  sections:   [...document.querySelectorAll('section[data-s]')],
};

/* ─────────────────────────────────────────────────────────
   LENIS SMOOTH SCROLL
───────────────────────────────────────────────────────── */
let lenis;
try {
  lenis = new Lenis({
    duration: 1.25,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: .9,
    touchMultiplier: 1.4,
  });
  lenis.on('scroll', ({ scroll }) => {
    scrollY = scroll;
    scrollH = document.documentElement.scrollHeight - window.innerHeight;
  });
  (function lenisRaf(t) { lenis.raf(t); requestAnimationFrame(lenisRaf); })();

  // Smooth anchor scrolling
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(a.getAttribute('href'));
      if (target) lenis.scrollTo(target, { offset: -80, duration: 1.6 });
    });
  });
} catch (err) {
  // Fallback for environments where Lenis isn't available
  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
    scrollH = document.documentElement.scrollHeight - window.innerHeight;
  }, { passive: true });
  document.documentElement.style.scrollBehavior = 'smooth';
}

/* ─────────────────────────────────────────────────────────
   HAMBURGER / MOBILE NAV
───────────────────────────────────────────────────────── */
DOM.ham.addEventListener('click', () => {
  const isOpen = DOM.ham.classList.toggle('open');
  DOM.mobNav.classList.toggle('open', isOpen);
  DOM.ham.setAttribute('aria-expanded', isOpen);
  if (lenis) isOpen ? lenis.stop() : lenis.start();
});
document.querySelectorAll('.mob-link').forEach(a => {
  a.addEventListener('click', () => {
    DOM.ham.classList.remove('open');
    DOM.mobNav.classList.remove('open');
    DOM.ham.setAttribute('aria-expanded', 'false');
    if (lenis) lenis.start();
  });
});

/* ─────────────────────────────────────────────────────────
   CURSOR  (desktop pointer devices only)
───────────────────────────────────────────────────────── */
let mx = innerWidth / 2, my = innerHeight / 2;
let rx = mx, ry = my, fx = mx, fy = my;

if (!isTouch) {
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    DOM.cdot.style.left = mx + 'px';
    DOM.cdot.style.top  = my + 'px';
  });
  document.querySelectorAll('a, button, .nd, .stat-card').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('lhov'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('lhov'));
  });
  (function ringLoop() {
    rx += (mx - rx) * .09; ry += (my - ry) * .09;
    fx += (mx - fx) * .04; fy += (my - fy) * .04;
    DOM.cring.style.left = rx + 'px'; DOM.cring.style.top = ry + 'px';
    DOM.flare.style.left = fx + 'px'; DOM.flare.style.top = fy + 'px';
    requestAnimationFrame(ringLoop);
  })();

  // Moon specular highlight tracks mouse
  document.addEventListener('mousemove', e => {
    const nx = 35 + (e.clientX - innerWidth  / 2) / innerWidth  * 22;
    const ny = 28 + (e.clientY - innerHeight / 2) / innerHeight * 20;
    DOM.mSpec.style.background =
      `radial-gradient(circle at ${nx}% ${ny}%,rgba(255,248,215,.12) 0%,transparent 52%)`;
  });
}

/* ─────────────────────────────────────────────────────────
   STAR CANVAS
   Fewer stars on mobile for performance.
───────────────────────────────────────────────────────── */
const sx = DOM.starCvs.getContext('2d');
const STAR_COUNT = isMobile ? 140 : 320;
let stars = [];

function initStars() {
  DOM.starCvs.width  = innerWidth;
  DOM.starCvs.height = innerHeight;
  stars = Array.from({ length: STAR_COUNT }, () => ({
    x:   Math.random() * DOM.starCvs.width,
    y:   Math.random() * DOM.starCvs.height,
    r:   Math.random() * 1.4 + .28,
    a:   Math.random(),
    spd: .001 + Math.random() * .003,
    ph:  Math.random() * Math.PI * 2,
  }));
}
initStars();

let st = 0;
(function starLoop() {
  sx.clearRect(0, 0, DOM.starCvs.width, DOM.starCvs.height);
  st += .016;
  stars.forEach(s => {
    const a = (.36 + .64 * Math.sin(st * s.spd * 60 + s.ph)) * s.a;
    sx.beginPath();
    sx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    sx.fillStyle = `rgba(255,248,225,${a})`;
    sx.fill();
  });
  requestAnimationFrame(starLoop);
})();

/* ─────────────────────────────────────────────────────────
   NEBULA CANVAS
───────────────────────────────────────────────────────── */
const nctx = DOM.nebCvs.getContext('2d');
function initNebula() {
  DOM.nebCvs.width  = innerWidth;
  DOM.nebCvs.height = innerHeight;
}
initNebula();

let nt = 0;
(function nebLoop() {
  nt += .004;
  nctx.clearRect(0, 0, DOM.nebCvs.width, DOM.nebCvs.height);
  const cx = DOM.nebCvs.width / 2, cy = DOM.nebCvs.height / 2;
  const g1 = nctx.createRadialGradient(cx + Math.sin(nt * .65) * 90, cy + Math.cos(nt * .5) * 70, 0, cx, cy, DOM.nebCvs.width * .55);
  g1.addColorStop(0, 'rgba(48,66,144,.022)'); g1.addColorStop(1, 'transparent');
  nctx.fillStyle = g1; nctx.fillRect(0, 0, DOM.nebCvs.width, DOM.nebCvs.height);
  const g2 = nctx.createRadialGradient(cx + Math.cos(nt * .42) * 120, cy + Math.sin(nt * .85) * 78, 0, cx, cy, DOM.nebCvs.width * .47);
  g2.addColorStop(0, 'rgba(66,48,122,.017)'); g2.addColorStop(1, 'transparent');
  nctx.fillStyle = g2; nctx.fillRect(0, 0, DOM.nebCvs.width, DOM.nebCvs.height);
  requestAnimationFrame(nebLoop);
})();

/* ─────────────────────────────────────────────────────────
   METEOR CANVAS
   Disabled on mobile to save battery / performance.
───────────────────────────────────────────────────────── */
const mmctx = DOM.metCvs.getContext('2d');
let meteors = [];
const METEOR_RATE = isMobile ? .003 : .009;

function initMeteor() {
  DOM.metCvs.width  = innerWidth;
  DOM.metCvs.height = innerHeight;
}
initMeteor();

(function metLoop() {
  mmctx.clearRect(0, 0, DOM.metCvs.width, DOM.metCvs.height);
  if (Math.random() < METEOR_RATE) {
    const a = .2 + Math.random() * .6;
    meteors.push({
      x: Math.random() * DOM.metCvs.width * .75,
      y: Math.random() * DOM.metCvs.height * .35,
      vx: Math.cos(a) * (8 + Math.random() * 10),
      vy: Math.sin(a) * (8 + Math.random() * 10),
      len: 70 + Math.random() * 140,
      life: 1,
      decay: .018 + Math.random() * .03,
    });
  }
  meteors = meteors.filter(m => m.life > 0);
  meteors.forEach(m => {
    const spd = Math.hypot(m.vx, m.vy);
    const tx = m.x - m.vx / spd * m.len;
    const ty = m.y - m.vy / spd * m.len;
    const g = mmctx.createLinearGradient(tx, ty, m.x, m.y);
    g.addColorStop(0, 'rgba(240,218,158,0)');
    g.addColorStop(1, `rgba(240,218,158,${m.life * .9})`);
    mmctx.beginPath(); mmctx.moveTo(tx, ty); mmctx.lineTo(m.x, m.y);
    mmctx.strokeStyle = g; mmctx.lineWidth = m.life * 1.9; mmctx.stroke();
    m.x += m.vx; m.y += m.vy; m.life -= m.decay;
  });
  requestAnimationFrame(metLoop);
})();

/* ─────────────────────────────────────────────────────────
   RESIZE  (debounced 200ms)
───────────────────────────────────────────────────────── */
let rszTimer;
window.addEventListener('resize', () => {
  clearTimeout(rszTimer);
  rszTimer = setTimeout(() => {
    initStars();
    initNebula();
    initMeteor();
    initPhaseCanvas();
    scrollH = document.documentElement.scrollHeight - window.innerHeight;
  }, 200);
}, { passive: true });

/* ─────────────────────────────────────────────────────────
   MOON PHASE CANVAS
   Draws the astronomical terminator correctly each frame.
   illuminated (0 = new moon, 1 = full moon)
───────────────────────────────────────────────────────── */
const pctx = DOM.phaseCvs.getContext('2d');
let phaseCvsSize = 0;

function initPhaseCanvas() {
  const el = DOM.moonSphere;
  const sz = (el && el.offsetWidth > 10) ? el.offsetWidth : 360;
  DOM.phaseCvs.width  = sz;
  DOM.phaseCvs.height = sz;
  phaseCvsSize = sz;
}

function drawMoonPhase(illuminated){
  const sz = phaseCvsSize || 360;
  const r  = Math.max(sz / 2 - 1, 1);
  const cx = sz / 2, cy = sz / 2;

  pctx.clearRect(0, 0, sz, sz);

  if (illuminated >= .998) return;        // Full moon — no shadow needed
  if (illuminated <= .002) {              // New moon — entire circle is dark
    pctx.save();
    pctx.beginPath(); pctx.arc(cx, cy, r, 0, Math.PI * 2);
    pctx.fillStyle = 'rgba(2,2,10,.97)'; pctx.fill();
    pctx.restore();
    return;
  }

  pctx.save();
  // Clip all drawing to the moon circle
  pctx.beginPath(); pctx.arc(cx, cy, r, 0, Math.PI * 2); pctx.clip();

  pctx.fillStyle = 'rgba(2,2,10,.97)';
  pctx.beginPath();

  // ── Shadow is always on the LEFT side ──────────────────────────────────────
  // Arc from top (-π/2) to bottom (π/2) going ANTICLOCKWISE (true) sweeps the
  // LEFT semicircle.  This is always the dark/shadow side.
  pctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, true);

  // ── Terminator ellipse ──────────────────────────────────────────────────────
  // ex = r·cos(illuminated·π)
  //   illuminated=0   → ex= r  (terminator at right edge → new moon, full shadow)
  //   illuminated=0.5 → ex= 0  (terminator is vertical → half moon)
  //   illuminated=1   → ex=-r  (terminator at left edge → full moon, no shadow)
  const ex = r * Math.cos(illuminated * Math.PI);

  if (ex >= 0) {
    // Waxing (0→0.5): shadow bulges left; terminator curves toward right.
    // Ellipse going CLOCKWISE (false) sweeps the RIGHT side, closing the shadow shape.
    pctx.ellipse(cx, cy, ex, r, 0, Math.PI / 2, -Math.PI / 2, false);
  } else {
    // Gibbous (0.5→1): only a crescent of shadow on the left.
    // Ellipse going ANTICLOCKWISE (true) sweeps the LEFT side, eating into the shadow.
    pctx.ellipse(cx, cy, -ex, r, 0, Math.PI / 2, -Math.PI / 2, true);
  }

  pctx.closePath();
  pctx.fill();

  // Soft radial vignette at the terminator boundary (avoids a hard visible edge)
  const edgeGrad = pctx.createRadialGradient(cx, cy, r * .72, cx, cy, r * .99);
  edgeGrad.addColorStop(0, 'rgba(2,2,10,0)');
  edgeGrad.addColorStop(1, 'rgba(2,2,10,.14)');
  pctx.fillStyle = edgeGrad;
  pctx.fillRect(0, 0, sz, sz);

  pctx.restore();
}

// Initialise once fonts/layout are ready, then again on load
setTimeout(initPhaseCanvas, 100);
window.addEventListener('load', initPhaseCanvas);

/* ─────────────────────────────────────────────────────────
   PHASE NAME LABEL
   Hidden on hero (sp < 0.07). Only appears after scrolling.
───────────────────────────────────────────────────────── */
const PHASE_NAMES = [
  { max: .25, name: 'New Moon' },
  { max: .50, name: 'Waxing Crescent' },
  { max: .72, name: 'First Quarter' },
  { max: .90, name: 'Waxing Gibbous' },
  { max: 1.0, name: 'Full Moon' },
];
let lastPhaseName = '';

function updatePhaseLabel(sp, illuminated) {
  // Stay hidden while on the hero to avoid overlapping the subtitle
  if (sp < .07) {
    DOM.phaseLabel.style.opacity = '0';
    lastPhaseName = '';
    return;
  }
  const entry = PHASE_NAMES.find(p => illuminated <= p.max) || PHASE_NAMES[PHASE_NAMES.length - 1];
  if (entry.name !== lastPhaseName) {
    lastPhaseName = entry.name;
    DOM.phaseLabel.style.opacity = '0';
    setTimeout(() => {
      DOM.phaseLabel.textContent = entry.name;
      DOM.phaseLabel.style.opacity = '1';
    }, 400);
  }
}

/* ─────────────────────────────────────────────────────────
   MOON TRAJECTORY — 9 keyframes
───────────────────────────────────────────────────────── */
const phases = [
  { sc: .00, scale: .42, bright: .20, y:   0, blur:  0 },
  { sc: .10, scale: .64, bright: .38, y: -18, blur:  0 },
  { sc: .22, scale: .77, bright: .54, y: -28, blur:  0 },
  { sc: .35, scale: .86, bright: .69, y: -16, blur:  0 },
  { sc: .50, scale: .93, bright: .82, y:   0, blur:  0 },
  { sc: .63, scale:1.08, bright:1.00, y:  18, blur:  0 },
  { sc: .76, scale: .90, bright: .74, y:  48, blur:  0 },
  { sc: .88, scale: .70, bright: .50, y:  88, blur:  4 },
  { sc:1.00, scale: .48, bright: .24, y: 130, blur: 12 },
];

function interpPhases(sp) {
  for (let i = 0; i < phases.length - 1; i++) {
    const a = phases[i], b = phases[i + 1];
    if (sp >= a.sc && sp <= b.sc) {
      const t = eio((sp - a.sc) / (b.sc - a.sc));
      return {
        scale:  lerp(a.scale,  b.scale,  t),
        bright: lerp(a.bright, b.bright, t),
        y:      lerp(a.y,      b.y,      t),
        blur:   lerp(a.blur,   b.blur,   t),
      };
    }
  }
  return phases[phases.length - 1];
}

// Mouse tilt (desktop only)
let tiltX = 0, tiltY = 0, curTX = 0, curTY = 0;
if (!isTouch) {
  document.addEventListener('mousemove', e => {
    tiltX = (e.clientX - innerWidth  / 2) / innerWidth  * 9;
    tiltY = (e.clientY - innerHeight / 2) / innerHeight * -9;
  });
}

/* ─────────────────────────────────────────────────────────
   HERO PARALLAX
───────────────────────────────────────────────────────── */
function updateHero(sp) {
  const p = clamp(sp / .2, 0, 1);
  const e = eio(p);
  if (DOM.heroTitle) {
    DOM.heroTitle.style.transform = `translateY(${e * 82}px) scale(${1 + e * .06})`;
    DOM.heroTitle.style.opacity   = String(Math.max(1 - e * 1.6, 0));
  }
  if (DOM.heroSub) {
    const ps = clamp(sp / .15, 0, 1);
    DOM.heroSub.style.opacity   = String(Math.max(1 - ps * 2, 0));
    DOM.heroSub.style.transform = `translateY(${ps * 42}px)`;
  }
}

/* ─────────────────────────────────────────────────────────
   FULL MOON PARALLAX
───────────────────────────────────────────────────────── */
function updateFM() {
  if (!DOM.fmWrap) return;
  const rect = DOM.fmWrap.closest('section').getBoundingClientRect();
  const p    = (innerHeight / 2 - (rect.top + rect.height / 2)) / innerHeight;
  DOM.fmWrap.style.transform = `translateY(${p * 30}px)`;
}

/* ─────────────────────────────────────────────────────────
   EARTH PARALLAX
───────────────────────────────────────────────────────── */
function updateEarth() {
  if (!DOM.earthBg || !DOM.apolloSec) return;
  const rect = DOM.apolloSec.getBoundingClientRect();
  const p    = 1 - clamp(rect.top / innerHeight, 0, 1);
  DOM.earthBg.style.transform = `scale(1.1) translateY(${p * -45}px)`;
}

/* ─────────────────────────────────────────────────────────
   AURORA
───────────────────────────────────────────────────────── */
function updateAurora(sp) {
  const inRange = sp > .46 && sp < .78;
  const val     = inRange ? clamp(Math.min((sp - .46) / .1, (.78 - sp) / .1), 0, 1) * .8 : 0;
  DOM.aurora.style.opacity = String(val);
}

/* ─────────────────────────────────────────────────────────
   BACKGROUND COLOUR SHIFT
───────────────────────────────────────────────────────── */
function updateBg(sp) {
  let r, g, b;
  if (sp < .32) {
    const t = sp / .32;
    r = Math.round(2 + t * 4); g = Math.round(2 + t * 3); b = Math.round(10 + t * 16);
  } else if (sp < .66) {
    const t = (sp - .32) / .34;
    r = Math.round(6 + t * 5); g = Math.round(5 + t * 3); b = Math.round(26 - t * 13);
  } else {
    const t = (sp - .66) / .34;
    r = Math.round(11 - t * 9); g = Math.round(8 - t * 6); b = Math.round(13 - t * 11);
  }
  document.body.style.background = `rgb(${r},${g},${b})`;
}

/* ─────────────────────────────────────────────────────────
   HEADER GLASS
───────────────────────────────────────────────────────── */
function updateHeader() {
  DOM.header.classList.toggle('glass', scrollY > 50);
}

/* ─────────────────────────────────────────────────────────
   NAV DOTS
───────────────────────────────────────────────────────── */
// Unique sections only (quote-section shares data-s="2" with mythology)
const uniqueSections = DOM.sections.filter(
  (s, i, arr) => arr.findIndex(x => x.dataset.s === s.dataset.s) === i
);

DOM.ndots.forEach(d => {
  d.addEventListener('click', () => {
    const target = uniqueSections[+d.dataset.idx];
    if (!target) return;
    if (lenis) lenis.scrollTo(target, { offset: -80, duration: 1.6 });
    else target.scrollIntoView({ behavior: 'smooth' });
  });
});

function updateNavDots() {
  let active = 0;
  uniqueSections.forEach((s, i) => {
    if (s.getBoundingClientRect().top < innerHeight * .58) active = i;
  });
  DOM.ndots.forEach((d, i) => d.classList.toggle('active', i === active));
}

/* ─────────────────────────────────────────────────────────
   MAIN RAF LOOP
───────────────────────────────────────────────────────── */
(function mainLoop() {
  const sp = getSP();
  const { scale, bright, y, blur } = interpPhases(sp);

  // Moon tilt (desktop only)
  if (!isTouch) {
    curTX += (tiltX - curTX) * .04;
    curTY += (tiltY - curTY) * .04;
  }

  // Moon transform + brightness + blur
  DOM.moonWrap.style.transform =
    `translate(-50%, calc(-50% + ${y}px)) scale(${scale}) ` +
    `perspective(900px) rotateX(${curTY}deg) rotateY(${curTX}deg)`;
  DOM.moonWrap.style.filter =
    `brightness(${bright})${blur > 0 ? ` blur(${blur.toFixed(1)}px)` : ''}`;
  DOM.moonWrap.style.opacity =
    sp > .93 ? String(clamp(1 - (sp - .93) * 14, 0, 1)) : '1';

  // Moon phase (canvas) — driven by brightness, not raw scroll
  // bright goes 0.20→1.0→0.24 matching new-moon→full→waning across the story
  if (phaseCvsSize > 0) drawMoonPhase(bright);

  // Photo sepia warmth increases with scroll
  DOM.moonPhoto.style.filter = `sepia(${Math.round(sp * 22)}%) contrast(1.05)`;

  // Phase label also tracks brightness so the name matches the visual phase
  updatePhaseLabel(sp, bright);
  updateHero(sp);
  if (!isMobile) updateFM();      // skip on mobile (no visible parallax benefit)
  updateEarth();
  updateAurora(sp);
  updateBg(sp);
  updateNavDots();
  updateHeader();

  requestAnimationFrame(mainLoop);
})();

/* ─────────────────────────────────────────────────────────
   STAR PARALLAX ON SCROLL
───────────────────────────────────────────────────────── */
const applyStarParallax = scroll => {
  DOM.starCvs.style.transform = `translateY(${scroll * .28}px)`;
};
if (lenis) {
  lenis.on('scroll', ({ scroll }) => applyStarParallax(scroll));
} else {
  window.addEventListener('scroll', () => applyStarParallax(window.scrollY), { passive: true });
}

/* ─────────────────────────────────────────────────────────
   SCROLL REVEAL  (IntersectionObserver)
───────────────────────────────────────────────────────── */
const revEls = document.querySelectorAll('.rv, .rv-l, .rv-r, .rv-s, .rv-b, .quote-rule');
const revObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
}, { threshold: .1, rootMargin: '0px 0px -35px 0px' });
revEls.forEach(el => revObs.observe(el));

/* ─────────────────────────────────────────────────────────
   STAT COUNTERS  (IntersectionObserver)
───────────────────────────────────────────────────────── */
const countEls = document.querySelectorAll('[data-count]');
const cntObs   = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el     = e.target;
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const dec    = target % 1 !== 0 ? 1 : 0;
    const dur    = 1900;
    let start    = null;
    const step   = ts => {
      if (!start) start = ts;
      const p = clamp((ts - start) / dur, 0, 1);
      el.textContent = (target * (1 - Math.pow(1 - p, 3))).toFixed(dec) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    cntObs.unobserve(el);
  });
}, { threshold: .5 });
countEls.forEach(el => cntObs.observe(el));

/* ─────────────────────────────────────────────────────────
   PROGRESS BAR
───────────────────────────────────────────────────────── */
const applyProgress = (scroll, limit) => {
  DOM.pbar.style.width = clamp(scroll / (limit || 1) * 100, 0, 100) + '%';
};
if (lenis) {
  lenis.on('scroll', ({ scroll, limit }) => applyProgress(scroll, limit));
} else {
  window.addEventListener('scroll', () => {
    applyProgress(window.scrollY, document.documentElement.scrollHeight - window.innerHeight);
  }, { passive: true });
}