import { useEffect, useRef, useState } from 'react';
import { t } from './i18n.js';

/* Minijuego para cuando no quedan jugadores: rompe-bloques. La bola de maná rebota en tu carta;
   la mueves con las cartas de la mano (Paso = izquierda, ¡Duelo! = derecha), arrastrando o con las flechas. */
const BEST_KEY = 'manamatch-manabreak-best';
const LIVES = 3;
const COLS = 7;
/* Niveles dibujados a mano (7 columnas): . vacío · n normal · g maná (más puntos) · p morado (2 golpes)
   · b explosivo (desde el nivel 3: late y, al romperse, revienta los de alrededor). Después del último, se generan solos. */
const LEVELS = [
  ['...g...', '..nnn..', '.nnnnn.', 'nngnnng', '.nnnnn.'],
  ['ppppppp', 'n.n.n.n', '.g.g.g.', 'n.n.n.n', 'nnnnnnn'],
  ['...p...', '..pnp..', '.pnbnp.', 'pnbgbnp', '.pnbnp.', '..pnp..', '...p...'],
  ['.n...n.', '..nnn..', '.nngnn.', 'nnpnpnn', 'nbnnnbn', 'n.n.n.n'],
  ['ppppppp', 'pgggggp', 'pbnnnbp', 'p.....p', 'nn.b.nn'],
  ['b.....b', 'pp...pp', 'nppgppn', '..nnn..', 'g.nbn.g', '..nnn..'],
  ['gnpbpng', '.......', 'pbpnpbp', '.......', 'nngggnn', '.p.p.p.'],
];
const POINTS = { n: 10, g: 50, p: 20, b: 30 };
// Nivel generado: simétrico, con más morados y explosivos según se sube
function randomLevel(level) {
  const rows = 5 + Math.min(3, Math.floor((level - 6) / 2));
  const pP = Math.min(0.42, 0.18 + (level - 7) * 0.03), pB = Math.min(0.16, 0.07 + (level - 7) * 0.01);
  const grid = [];
  for (let r = 0; r < rows; r++) {
    const half = [];
    for (let c = 0; c < 4; c++) {
      const x = Math.random();
      half.push(x < 0.18 ? '.' : x < 0.18 + pP ? 'p' : x < 0.18 + pP + pB ? 'b' : x < 0.3 + pP + pB ? 'g' : 'n');
    }
    grid.push(half.join('') + half.slice(0, 3).reverse().join(''));
  }
  if (!grid.join('').includes('b')) grid[Math.floor(rows / 2)] = grid[Math.floor(rows / 2)].slice(0, 3) + 'b' + grid[Math.floor(rows / 2)].slice(4);
  return grid;
}
const readBest = () => { try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; } };
const saveBest = (n) => { try { localStorage.setItem(BEST_KEY, String(n)); } catch { /* sin almacenamiento */ } };

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function hexPath(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 6 + (i * Math.PI) / 3;
    ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.closePath();
}

export default function ManaBreak({ steer, onClose }) {
  const canvasRef = useRef(null);
  const game = useRef(null);
  const [hud, setHud] = useState({ score: 0, lives: LIVES, level: 1 });
  const [best, setBest] = useState(readBest);
  const [state, setState] = useState('ready'); // ready | play | over
  const [lost, setLost] = useState(0); // contador para relanzar la animación de vida perdida
  const [result, setResult] = useState(null); // { score, record } al terminar
  const [banner, setBanner] = useState(null); // aviso de nivel nuevo

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const css = getComputedStyle(canvas);
    const col = (v, f) => css.getPropertyValue(v).trim() || f;
    const C = { brand: col('--brand', '#8B5CF6'), lime: '#C4F56A', limeEdge: '#6FA22B', bomb: '#FF5A5F', bombEdge: '#C81E2B', card: col('--card', '#fff'), line: col('--line', 'rgba(127,127,127,0.25)'), text: col('--text', '#171522') };
    let W = 0, H = 0;
    const PW = 66, PH = 16, R = 6;
    const g = { run: false, held: true, over: false, px: 0, target: null, bx: 0, by: 0, vx: 0, vy: 0, bricks: [], parts: [], booms: [], fuses: [], score: 0, lives: LIVES, level: 1, keys: 0, t: 0, shake: 0 };
    game.current = g;

    const layout = () => {
      const gap = 6, top = 16, bw = (W - 16 - gap * (COLS - 1)) / COLS, bh = Math.round(Math.max(13, Math.min(20, H * 0.04)));
      return { gap, top, bw, bh };
    };
    const place = () => {
      const { gap, top, bw, bh } = layout();
      g.bricks.forEach((b) => { b.x = 8 + b.c * (bw + gap); b.y = top + b.r * (bh + gap); b.w = bw; b.h = bh; });
    };
    const buildBricks = () => {
      const grid = LEVELS[g.level - 1] ?? randomLevel(g.level);
      g.bricks = []; g.fuses = []; g.booms = [];
      grid.forEach((row, r) => [...row].forEach((ch, c) => {
        if (ch === '.') return;
        const type = ch === 'b' && g.level < 3 ? 'n' : ch;
        g.bricks.push({ c, r, type, hp: type === 'p' ? 2 : 1, phase: Math.random() * 6 });
      }));
      place();
    };
    const speed = () => Math.min(7.4, 4.2 + (g.level - 1) * 0.4);
    const placeBall = () => { g.held = true; g.bx = g.px; g.by = H - 26 - PH / 2 - R; g.vx = 0; g.vy = 0; };
    const launch = () => {
      if (!g.held) return;
      g.held = false;
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 0.8;
      g.vx = Math.cos(a) * speed(); g.vy = Math.sin(a) * speed();
    };
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const oldW = W;
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!oldW) { g.px = W / 2; buildBricks(); placeBall(); }
      else place(); // reajusta los bloques al nuevo tamaño
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const start = () => {
      Object.assign(g, { run: true, over: false, overAt: 0, pause: 0, score: 0, lives: LIVES, level: 1, parts: [] });
      setResult(null);
      buildBricks(); placeBall(); announce();
      setHud({ score: 0, lives: LIVES, level: 1 }); setState('play');
    };
    // tras perder, se vuelve a empezar con las cartas (o espacio); se espera un momento para no reiniciar sin querer
    const canRestart = () => !g.overAt || performance.now() - g.overAt > 900;
    g.action = () => { if (!g.run) { if (canRestart()) start(); } else if (!g.pause) launch(); };
    g.tapBoard = () => { if (!g.run && !g.over) start(); else if (g.run && !g.pause) launch(); };
    g.drag = (x) => { g.target = x; };

    const burst = (x, y, c, n = 7, f = 2) => { for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + Math.random(); g.parts.push({ x, y, vx: Math.cos(a) * f * (0.6 + Math.random() * 0.6), vy: Math.sin(a) * f * (0.6 + Math.random() * 0.6), life: 22, c }); } };
    const colorOf = (b) => (b.type === 'g' ? C.lime : b.type === 'b' ? C.bomb : C.brand);
    // Romper un bloque; los explosivos dejan una mecha corta y luego revientan los de alrededor (en cadena)
    const destroy = (b) => {
      if (b.hp <= 0) return;
      b.hp = 0; g.score += POINTS[b.type];
      burst(b.x + b.w / 2, b.y + b.h / 2, colorOf(b));
      if (b.type === 'b') g.fuses.push({ b, t: 7 });
    };
    const explode = (b) => {
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      g.booms.push({ x: cx, y: cy, t: 0, r: b.w * 1.7 });
      burst(cx, cy, C.bomb, 14, 3.4);
      g.shake = 9; navigator.vibrate?.(40);
      g.bricks.forEach((o) => { if (o.hp > 0 && Math.abs(o.c - b.c) <= 1 && Math.abs(o.r - b.r) <= 1) destroy(o); });
    };
    const hit = (b) => {
      if (b.type === 'p' && b.hp > 1) { b.hp--; b.flash = 10; g.score += 5; burst(b.x + b.w / 2, b.y + b.h / 2, C.brand, 4, 1.4); }
      else destroy(b);
    };
    // Aviso de nivel (en el 3 se presentan los explosivos)
    const announce = () => {
      g.pause = 70; g.held = true;
      setBanner({ level: g.level, key: Math.random(), tip: g.level === 3 ? 'bomb' : g.level === 2 ? 'purple' : g.level === 1 ? 'mana' : null });
    };


    let raf;
    const frame = () => {
      // pulsar una carta de la mano también empieza (o reinicia) la partida
      const sd = steer?.current || 0;
      if (!g.run && sd && !g.lastDir && canRestart()) start();
      g.lastDir = sd;
      if (g.run) {
        // carta: botones de la mano o flechas; arrastrar la lleva al dedo
        const dir = steer?.current || g.keys;
        if (dir) { g.target = null; g.px += dir * 6.5; }
        else if (g.target != null) g.px += (g.target - g.px) * 0.35;
        g.px = Math.max(PW / 2, Math.min(W - PW / 2, g.px));
        if (g.pause > 0 && --g.pause === 0) placeBall();
        if (dir && g.held && !g.pause) launch(); // al mover con las cartas, la bola sale sola

        if (g.pause) { /* pausa tras perder una vida */ }
        else if (g.held) { g.bx = g.px; g.by = H - 26 - PH / 2 - R; }
        else {
          // dos subpasos para que la bola no atraviese bloques a velocidad alta
          for (let s = 0; s < 2; s++) {
            g.bx += g.vx / 2; g.by += g.vy / 2;
            if (g.bx < R) { g.bx = R; g.vx = Math.abs(g.vx); }
            if (g.bx > W - R) { g.bx = W - R; g.vx = -Math.abs(g.vx); }
            if (g.by < R) { g.by = R; g.vy = Math.abs(g.vy); }
            // carta: el ángulo depende de dónde golpea
            const py = H - 26;
            if (g.vy > 0 && g.by + R > py - PH / 2 && g.by < py + PH / 2 && Math.abs(g.bx - g.px) < PW / 2 + R) {
              const off = Math.max(-1, Math.min(1, (g.bx - g.px) / (PW / 2)));
              const a = -Math.PI / 2 + off * 1.05;
              const sp = Math.hypot(g.vx, g.vy);
              g.vx = Math.cos(a) * sp; g.vy = Math.sin(a) * sp; g.by = py - PH / 2 - R;
            }
            for (const b of g.bricks) {
              if (b.hp <= 0) continue;
              if (g.bx + R > b.x && g.bx - R < b.x + b.w && g.by + R > b.y && g.by - R < b.y + b.h) {
                const ox = Math.min(g.bx + R - b.x, b.x + b.w - (g.bx - R));
                const oy = Math.min(g.by + R - b.y, b.y + b.h - (g.by - R));
                if (ox < oy) g.vx = -g.vx; else g.vy = -g.vy;
                hit(b);
                setHud({ score: g.score, lives: g.lives, level: g.level });
                break;
              }
            }
          }
          // nivel superado (cuando ya no queda ninguna mecha encendida)
          if (!g.fuses.length && g.bricks.every((b) => b.hp <= 0)) {
            g.level++; g.score += 100; buildBricks(); placeBall(); announce();
            setHud({ score: g.score, lives: g.lives, level: g.level });
          }
          // se cae la bola
          if (g.by > H + R) {
            g.lives--;
            setLost((n) => n + 1);
            navigator.vibrate?.(60);
            if (g.lives <= 0) {
              g.run = false; g.over = true; g.overAt = performance.now();
              const s = g.score, prev = readBest();
              if (s > prev) saveBest(s);
              setBest(Math.max(s, prev));
              setResult({ score: s, record: s > prev && s > 0 });
              setState('over');
            } else { g.pause = 55; g.held = true; }
            setHud({ score: g.score, lives: Math.max(0, g.lives), level: g.level });
          }
        }
      }
      g.t++;
      if (g.fuses.length) {
        const ready = g.fuses.filter((f) => --f.t <= 0);
        g.fuses = g.fuses.filter((f) => f.t > 0);
        ready.forEach((f) => explode(f.b));
        if (ready.length) setHud({ score: g.score, lives: g.lives, level: g.level });
      }
      g.booms.forEach((o) => { o.t++; });
      g.booms = g.booms.filter((o) => o.t < 22);
      g.parts.forEach((p) => { p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life--; });
      g.parts = g.parts.filter((p) => p.life > 0);

      // ---- dibujo ----
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      if (g.shake > 0.4) { ctx.translate((Math.random() - 0.5) * g.shake, (Math.random() - 0.5) * g.shake); g.shake *= 0.85; } else g.shake = 0;
      for (const b of g.bricks) {
        if (b.hp <= 0) continue;
        if (b.type === 'b') {
          // explosivo: se hincha y deshincha; con la mecha encendida, tiembla
          const k = 1 + 0.1 * Math.sin(g.t * 0.11 + b.phase);
          const w = b.w * k, h = b.h * (1 + (k - 1) * 1.6);
          const x = b.x + (b.w - w) / 2, y = b.y + (b.h - h) / 2;
          ctx.save();
          ctx.shadowColor = C.bomb; ctx.shadowBlur = 6 + (k - 1) * 80;
          roundRect(ctx, x, y, w, h, 5); ctx.fillStyle = C.bomb; ctx.fill();
          ctx.restore();
          roundRect(ctx, x, y, w, h, 5); ctx.strokeStyle = C.bombEdge; ctx.lineWidth = 1.6; ctx.stroke();
          continue;
        }
        roundRect(ctx, b.x, b.y, b.w, b.h, 4);
        if (b.type === 'g') { ctx.fillStyle = C.lime; ctx.fill(); ctx.strokeStyle = C.limeEdge; ctx.lineWidth = 1.6; ctx.stroke(); }
        else if (b.type === 'p') {
          // morado: mismo aspecto hasta romperse; el primer golpe solo da un destello
          ctx.fillStyle = C.brand; ctx.fill();
          if (b.flash > 0) { ctx.globalAlpha = b.flash / 10; ctx.fillStyle = '#fff'; ctx.fill(); ctx.globalAlpha = 1; b.flash--; }
        }
        else { ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.brand; ctx.lineWidth = 1.6; ctx.stroke(); }
      }
      // fogonazo y onda de las explosiones
      for (const o of g.booms) {
        const q = o.t / 22;
        ctx.globalAlpha = 1 - q;
        ctx.beginPath(); ctx.arc(o.x, o.y, o.r * (0.3 + q), 0, Math.PI * 2);
        ctx.strokeStyle = C.bomb; ctx.lineWidth = 4 * (1 - q) + 1; ctx.stroke();
        if (o.t < 6) { ctx.globalAlpha = 0.35 * (1 - o.t / 6); ctx.fillStyle = C.bomb; ctx.fill(); }
      }
      ctx.globalAlpha = 1;
      ctx.restore();
      for (const p of g.parts) { ctx.globalAlpha = p.life / 20; ctx.fillStyle = p.c; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); }
      ctx.globalAlpha = 1;
      // tu carta, tumbada, con el hexágono de las cartas de la mano
      const py = H - 26;
      roundRect(ctx, g.px - PW / 2, py - PH / 2, PW, PH, 6);
      ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.brand; ctx.lineWidth = 2; ctx.stroke();
      hexPath(ctx, g.px, py, 4.5); ctx.strokeStyle = C.brand; ctx.lineWidth = 1.4; ctx.stroke();
      // bola de maná
      if (!g.over && !g.pause) {
        hexPath(ctx, g.bx, g.by, R + 1.5); ctx.fillStyle = C.lime; ctx.fill();
        ctx.strokeStyle = C.limeEdge; ctx.lineWidth = 1.8; ctx.lineJoin = 'round'; ctx.stroke();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const down = (e) => {
      if (e.code === 'ArrowLeft') g.keys = -1;
      else if (e.code === 'ArrowRight') g.keys = 1;
      else if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowUp') { e.preventDefault(); g.action(); }
      else if (e.code === 'Escape') onClose();
    };
    const up = (e) => { if ((e.code === 'ArrowLeft' && g.keys < 0) || (e.code === 'ArrowRight' && g.keys > 0)) g.keys = 0; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [onClose, steer]);

  const xOf = (e) => e.clientX - e.currentTarget.getBoundingClientRect().left;
  return (
    <div className="mana-break">
      <div className="mb-head">
        <span className="mb-lives" aria-label={t('{n} vidas', { n: hud.lives })}>
          {Array.from({ length: LIVES }, (_, i) => <i key={i === hud.lives ? `l${lost}` : i} className={i < hud.lives ? 'on' : i === hud.lives && lost ? 'lost' : ''} />)}
        </span>
        <span className="mb-level">{t('Nivel {n}', { n: hud.level })}</span>
        <span className="mb-score">{hud.score}</span>
        <span className="mb-best">{t('Récord')} {best}</span>
        <button type="button" className="mb-close" onClick={onClose} aria-label={t('Volver')} title={t('Volver')}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
      <div className="mb-board">
        <canvas ref={canvasRef} className="mb-canvas" role="img" aria-label={t('Minijuego: rompe los bloques con la bola de maná')}
          onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); game.current?.drag(xOf(e)); game.current?.tapBoard(); }}
          onPointerMove={(e) => { if (e.buttons) game.current?.drag(xOf(e)); }} />
        {banner && state === 'play' && (
          <div key={banner.key} className="mb-level-up" role="status">
            <b>{t('Nivel {n}', { n: banner.level })}</b>
            {banner.tip === 'mana' && <span><i className="tip-g" />{t('Los verdes dan más puntos')}</span>}
            {banner.tip === 'purple' && <span><i className="tip-p" />{t('Los morados aguantan dos golpes')}</span>}
            {banner.tip === 'bomb' && <span><i className="tip-b" />{t('¡Explosivos! Revientan los bloques de al lado')}</span>}
          </div>
        )}
        {/* Vida perdida: el rombo aparece en el tablero y se parte */}
        {lost > 0 && state === 'play' && (
          <div key={lost} className="mb-lost" role="status">
            <span className="mb-gem"><i /><i /></span>
            <b>{t('−1 vida')}</b>
          </div>
        )}
        {state === 'over' && result && (
          <div className="mb-over" role="status">
            <span className="mb-over-gems">{Array.from({ length: LIVES }, (_, i) => <span key={i} className="mb-gem" style={{ '--d': `${i * 0.12}s` }}><i /><i /></span>)}</span>
            <h3>{t('¡Sin vidas!')}</h3>
            <p className="mb-over-score">{result.score} <small>{t('puntos')}</small></p>
            {result.record && <span className="mb-record">{t('¡Nuevo récord!')}</span>}
            <p className="mb-over-hint">{t('Pulsa «Paso» o «¡Duelo!» para volver a empezar')}</p>
          </div>
        )}
      </div>
      <p className="mb-hint">
        {state === 'ready' && t('Toca para empezar. Mantén pulsadas «Paso» y «¡Duelo!» para mover tu carta.')}
        {state === 'play' && t('Paso ← · → ¡Duelo!')}
        {state === 'over' && t('Paso ← · → ¡Duelo!')}
      </p>
    </div>
  );
}
