/* ── NAV INJECTION ─────────────────────────────────────────── */
const NAV_PAGES = [
  { href: 'index.html',      label: 'Home' },
  { href: 'experience.html', label: 'Experience' },
  { href: 'education.html',  label: 'Education' },
  { href: 'teaching.html',   label: 'Teaching' },
  { href: 'personal.html',   label: 'Personal' },
  { href: 'contact.html',    label: 'Contact' },
];

function injectNav() {
  const el = document.getElementById('main-nav');
  if (!el) return;
  const current = window.location.pathname.split('/').pop() || 'index.html';
  el.innerHTML = `
    <a href="index.html" class="nav-logo">
      <span class="logo-char" style="animation-delay:0s">M</span><span
           class="logo-char" style="animation-delay:0.38s">M</span><span
           class="logo-char" style="animation-delay:0.76s">K</span><span
           class="logo-ai-tag">&thinsp;·&thinsp;AI</span>
    </a>
    <ul class="nav-links" id="nav-links">
      ${NAV_PAGES.map(p => `
        <li><a href="${p.href}" class="${current === p.href ? 'active' : ''}">${p.label}</a></li>
      `).join('')}
    </ul>
    <div class="nav-toggle" id="nav-toggle" aria-label="Toggle menu">
      <span></span><span></span><span></span>
    </div>`;
  document.getElementById('nav-toggle').addEventListener('click', () => {
    document.getElementById('nav-links').classList.toggle('open');
  });
}

/* ── SCROLL REVEAL ─────────────────────────────────────────── */
function initScrollReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 70);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

/* ── NEURAL NETWORK CANVAS ─────────────────────────────────── */
/* Sparse, layer-by-layer activation with forward (purple→cyan)
   and backward (amber) propagation passes.                      */
function initCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const SIZES = [6, 9, 12, 9, 6];
  const PURPLE = [124, 58, 237];
  const CYAN   = [6, 182, 212];
  const AMBER  = [245, 158, 11];

  let nodes = [], edges = [];
  let tick = 0, pulsing = false, pulseCount = 0;

  const lerp = (a, b, t) => a + (b - a) * t;

  /* ── Build structured network ── */
  const build = () => {
    nodes = []; edges = [];
    const W = canvas.width, H = canvas.height;
    const mx  = W * 0.13;
    const gap = (W - 2 * mx) / (SIZES.length - 1);
    const maxN = Math.max(...SIZES);
    const ng  = Math.min(H * 0.62 / maxN, 58);

    SIZES.forEach((count, li) => {
      const x   = mx + li * gap;
      const t   = li / (SIZES.length - 1);
      const col = [
        Math.round(lerp(PURPLE[0], CYAN[0], t)),
        Math.round(lerp(PURPLE[1], CYAN[1], t)),
        Math.round(lerp(PURPLE[2], CYAN[2], t)),
      ];
      const totalH = (count - 1) * ng;
      const sy = H / 2 - totalH / 2;

      for (let i = 0; i < count; i++) {
        nodes.push({
          x,
          y:       count === 1 ? H / 2 : sy + i * ng,
          layer:   li, col,
          act:     0,      /* forward activation */
          backAct: 0,      /* backward / gradient activation */
          phase:   Math.random() * Math.PI * 2,
          r:       2.1 + Math.random() * 1.5,
        });
      }
    });

    /* All-to-all between adjacent layers */
    for (let li = 0; li < SIZES.length - 1; li++) {
      const A = nodes.filter(n => n.layer === li);
      const B = nodes.filter(n => n.layer === li + 1);
      A.forEach(a => B.forEach(b => edges.push({ a, b, backAct: 0 })));
    }
  };

  /* ── Smooth fade helpers ── */
  const fadeNode = (n, prop) => {
    const t = setInterval(() => {
      n[prop] = Math.max(0, n[prop] - 0.042);
      if (n[prop] <= 0) clearInterval(t);
    }, 20);
  };

  const fadeEdge = (e) => {
    const t = setInterval(() => {
      e.backAct = Math.max(0, e.backAct - 0.038);
      if (e.backAct <= 0) clearInterval(t);
    }, 20);
  };

  /* ── Forward pass: sparse, varied intensity ── */
  const forwardPulse = () => {
    SIZES.forEach((_, li) => {
      setTimeout(() => {
        nodes.filter(n => n.layer === li).forEach(n => {
          /* ~70% of neurons activate; varied intensity simulates real weights */
          n.act = Math.random() > 0.30
            ? 0.48 + Math.random() * 0.52   /* active: 0.48–1.0 */
            : 0.06;                          /* quiet but not off */
          setTimeout(() => fadeNode(n, 'act'), 480 + li * 35);
        });
      }, li * 300);
    });
  };

  /* ── Backward pass: gradient flows right→left in amber ── */
  const backwardPulse = () => {
    for (let li = SIZES.length - 1; li >= 0; li--) {
      const delay = (SIZES.length - 1 - li) * 270;
      setTimeout(() => {
        /* Neurons: ~65% receive gradient signal */
        nodes.filter(n => n.layer === li).forEach(n => {
          if (Math.random() > 0.35) {
            n.backAct = 0.42 + Math.random() * 0.52;
            setTimeout(() => fadeNode(n, 'backAct'), 430);
          }
        });
        /* Edges: ~28% of connections flash amber (weight update) */
        edges
          .filter(e => e.a.layer === li)
          .forEach(e => {
            if (Math.random() > 0.72) {
              e.backAct = 0.5 + Math.random() * 0.45;
              setTimeout(() => fadeEdge(e), 370);
            }
          });
      }, delay);
    }
  };

  /* ── Trigger: every 3rd pass is a backward pass ── */
  const triggerPulse = () => {
    if (pulsing) return;
    pulsing = true;
    pulseCount++;

    pulseCount % 3 === 0 ? backwardPulse() : forwardPulse();

    setTimeout(() => { pulsing = false; }, SIZES.length * 310 + 1400);
  };

  /* ── Main draw loop ── */
  const draw = () => {
    tick++;
    if (tick % 255 === 1) triggerPulse(); /* ~every 4.25 s at 60fps */

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* Edges */
    edges.forEach(({ a, b, backAct }) => {
      const fwdAct = (a.act + b.act) * 0.5;

      /* Base / forward edge */
      const fAlpha = 0.033 + fwdAct * 0.22;
      const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      g.addColorStop(0, `rgba(${a.col},${fAlpha})`);
      g.addColorStop(1, `rgba(${b.col},${fAlpha})`);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = g;
      ctx.lineWidth   = 0.42 + fwdAct * 1.0;
      ctx.stroke();

      /* Backward / gradient edge (amber, drawn right→left) */
      if (backAct > 0.01) {
        ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(a.x, a.y);
        ctx.strokeStyle = `rgba(${AMBER.join(',')},${backAct * 0.52})`;
        ctx.lineWidth   = 0.7 + backAct * 1.5;
        ctx.stroke();
      }
    });

    /* Nodes */
    nodes.forEach(n => {
      n.phase += 0.011;
      const p    = 0.82 + 0.18 * Math.sin(n.phase);
      const fAct = n.act     || 0;
      const bAct = n.backAct || 0;
      const total = Math.max(fAct, bAct * 0.9);

      /* Blend node colour toward amber during backward pass */
      let cs;
      if (bAct > fAct * 0.75) {
        const blend = bAct * 0.85;
        cs = [
          Math.round(lerp(n.col[0], AMBER[0], blend)),
          Math.round(lerp(n.col[1], AMBER[1], blend)),
          Math.round(lerp(n.col[2], AMBER[2], blend)),
        ].join(',');
      } else {
        cs = n.col.join(',');
      }

      const r    = (n.r + total * 3.8) * p;
      const glwR = (r + 9) * (1 + total);

      /* Halo */
      const halo = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glwR);
      halo.addColorStop(0, `rgba(${cs},${0.13 + total * 0.26})`);
      halo.addColorStop(1, `rgba(${cs},0)`);
      ctx.beginPath(); ctx.arc(n.x, n.y, glwR, 0, Math.PI * 2);
      ctx.fillStyle = halo; ctx.fill();

      /* Core */
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${cs},${0.4 + total * 0.52})`; ctx.fill();

      /* Ring */
      ctx.beginPath(); ctx.arc(n.x, n.y, r + 1.8, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${cs},${0.1 + total * 0.22})`;
      ctx.lineWidth   = 0.7; ctx.stroke();
    });

    requestAnimationFrame(draw);
  };

  const resize = () => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    build();
  };

  resize();
  setTimeout(triggerPulse, 900);
  draw();
  window.addEventListener('resize', resize);
}

/* ── TYPED TEXT (home page) ────────────────────────────────── */
function initTyped() {
  const el = document.getElementById('typed-text');
  if (!el) return;
  const phrases = ['AI Engineer', 'AI Trainer', 'Guest Lecturer', 'ML Practitioner', 'LLM Developer'];
  let pi = 0, ci = 0, deleting = false;
  const PAUSE = 2000, TYPE = 78, DEL = 42;

  const tick = () => {
    const phrase = phrases[pi];
    if (deleting) {
      el.textContent = phrase.slice(0, --ci);
      if (ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; setTimeout(tick, 300); return; }
    } else {
      el.textContent = phrase.slice(0, ++ci);
      if (ci === phrase.length) { deleting = true; setTimeout(tick, PAUSE); return; }
    }
    setTimeout(tick, deleting ? DEL : TYPE);
  };
  tick();
}

/* ── MMK · AI LOGO ANIMATION ───────────────────────────────── */
/* Wave glow: M → M → K → then AI bursts in, all JS-driven     */
function animateLogo() {
  const chars = Array.from(document.querySelectorAll('.logo-char'));
  const ai    = document.querySelector('.logo-ai-tag');
  if (!chars.length || !ai) return;

  const TRANS = 'filter 0.22s ease, transform 0.22s ease, opacity 0.22s ease';

  /* Set initial CSS transitions once */
  chars.forEach(c => {
    c.style.transition = TRANS;
    c.style.filter     = 'brightness(0.6)';
    c.style.transform  = 'translateY(0)';
  });
  ai.style.transition = TRANS;
  ai.style.opacity    = '0.45';
  ai.style.filter     = 'brightness(0.75)';
  ai.style.transform  = 'translateY(0) scale(1)';

  const run = () => {
    /* Each letter glows in sequence */
    chars.forEach((c, i) => {
      setTimeout(() => {
        c.style.filter    = 'brightness(2.4) drop-shadow(0 0 8px rgba(124,58,237,0.75))';
        c.style.transform = 'translateY(-2px)';
      }, i * 340);
      setTimeout(() => {
        c.style.filter    = 'brightness(0.6)';
        c.style.transform = 'translateY(0)';
      }, i * 340 + 500);
    });

    /* AI bursts in right after K */
    const aiDelay = chars.length * 340 + 30;
    setTimeout(() => {
      ai.style.opacity   = '1';
      ai.style.filter    = 'brightness(2) drop-shadow(0 0 10px rgba(245,158,11,0.7))';
      ai.style.transform = 'translateY(-2px) scale(1.12)';
    }, aiDelay);
    setTimeout(() => {
      ai.style.opacity   = '0.55';
      ai.style.filter    = 'brightness(0.85)';
      ai.style.transform = 'translateY(0) scale(1)';
    }, aiDelay + 620);
  };

  setTimeout(run, 600);
  setInterval(run, 3800);
}

/* ── INIT ──────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  injectNav();
  animateLogo();
  initScrollReveal();
  initCanvas();
  initTyped();
});
