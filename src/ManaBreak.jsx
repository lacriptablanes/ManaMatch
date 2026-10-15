import { useEffect, useRef, useState } from 'react';
import { t } from './i18n.js';

/* Minijuego para cuando no quedan jugadores: rompe-bloques. La bola de maná rebota en tu carta;
   la mueves con las cartas de la mano (Paso = izquierda, ¡Duelo! = derecha), arrastrando o con las flechas. */
const BEST_KEY = 'manamatch-manabreak-best';
const LIVES = 3;
const COLS = 7, ROWS = 6;
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

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const css = getComputedStyle(canvas);
    const col = (v, f) => css.getPropertyValue(v).trim() || f;
    const C = { brand: col('--brand', '#8B5CF6'), lime: '#C4F56A', limeEdge: '#6FA22B', card: col('--card', '#fff'), line: col('--line', 'rgba(127,127,127,0.25)'), text: col('--text', '#171522') };
    let W = 0, H = 0;
    const PW = 66, PH = 16, R = 6;
    const g = { run: false, held: true, over: false, px: 0, target: null, bx: 0, by: 0, vx: 0, vy: 0, bricks: [], parts: [], score: 0, lives: LIVES, level: 1, keys: 0 };
    game.current = g;

    const layout = () => {
      const gap = 6, top = 18, bw = (W - 16 - gap * (COLS - 1)) / COLS, bh = Math.round(Math.max(14, Math.min(20, H * 0.042)));
      return { gap, top, bw, bh };
    };
    const buildBricks = () => {
      const { gap, top, bw, bh } = layout();
      g.bricks = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          // las de arriba aguantan dos golpes a partir del nivel 2; algunas son de maná (más puntos)
          const hp = g.level > 1 && r === 0 ? 2 : 1;
          g.bricks.push({ x: 8 + c * (bw + gap), y: top + r * (bh + gap), w: bw, h: bh, hp, mana: Math.random() < 0.12 });
        }
      }
    };
    const speed = () => 4.2 + (g.level - 1) * 0.6;
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
      else if (oldW !== W) { // reajusta los bloques al nuevo ancho
        const { gap, bw } = layout();
        g.bricks.forEach((b) => { const c = Math.round((b.x - 8) / (b.w + gap)); b.x = 8 + c * (bw + gap); b.w = bw; });
      }
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const start = () => {
      Object.assign(g, { run: true, over: false, overAt: 0, pause: 0, score: 0, lives: LIVES, level: 1, parts: [] });
      setResult(null);
      buildBricks(); placeBall();
      setHud({ score: 0, lives: LIVES, level: 1 }); setState('play');
    };
    // tras perder, se vuelve a empezar con las cartas (o espacio); se espera un momento para no reiniciar sin querer
    const canRestart = () => !g.overAt || performance.now() - g.overAt > 900;
    g.action = () => { if (!g.run) { if (canRestart()) start(); } else if (!g.pause) launch(); };
    g.tapBoard = () => { if (!g.run && !g.over) start(); else if (g.run && !g.pause) launch(); };
    g.drag = (x) => { g.target = x; };

    const burst = (x, y, c) => { for (let i = 0; i < 7; i++) g.parts.push({ x, y, vx: Math.cos(i * 0.9) * 2, vy: Math.sin(i * 0.9) * 2, life: 20, c }); };

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
                b.hp--;
                if (b.hp <= 0) {
                  g.score += b.mana ? 50 : 10;
                  burst(b.x + b.w / 2, b.y + b.h / 2, b.mana ? C.lime : C.brand);
                } else g.score += 5;
                setHud({ score: g.score, lives: g.lives, level: g.level });
                break;
              }
            }
          }
          // nivel superado: más rápido y con bloques resistentes
          if (g.bricks.every((b) => b.hp <= 0)) {
            g.level++; g.score += 100; buildBricks(); placeBall();
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
      g.parts.forEach((p) => { p.x += p.vx; p.y += p.vy; p.life--; });
      g.parts = g.parts.filter((p) => p.life > 0);

      // ---- dibujo ----
      ctx.clearRect(0, 0, W, H);
      for (const b of g.bricks) {
        if (b.hp <= 0) continue;
        roundRect(ctx, b.x, b.y, b.w, b.h, 4);
        if (b.mana) { ctx.fillStyle = C.lime; ctx.fill(); ctx.strokeStyle = C.limeEdge; ctx.lineWidth = 1.6; ctx.stroke(); }
        else if (b.hp > 1) { ctx.fillStyle = C.brand; ctx.fill(); }
        else { ctx.fillStyle = C.card; ctx.fill(); ctx.strokeStyle = C.brand; ctx.lineWidth = 1.6; ctx.stroke(); }
      }
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
