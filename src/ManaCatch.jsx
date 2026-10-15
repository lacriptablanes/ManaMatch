import { useEffect, useRef, useState } from 'react';
import { t } from './i18n.js';

/* Minijuego para cuando no quedan jugadores: mueve tu carta para recoger el maná que cae
   (verde +1, cristal lila +5) y esquiva las fichas de «Paso». Tres vidas; las rachas multiplican. */
const BEST_KEY = 'manamatch-manacatch-best';
const LIVES = 3;
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

export default function ManaCatch({ onClose }) {
  const canvasRef = useRef(null);
  const game = useRef(null);
  const [hud, setHud] = useState({ score: 0, lives: LIVES, combo: 1 });
  const [best, setBest] = useState(readBest);
  const [state, setState] = useState('ready'); // ready | play | over

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const css = getComputedStyle(canvas);
    const col = (v, f) => css.getPropertyValue(v).trim() || f;
    const C = { brand: col('--brand', '#8B5CF6'), lime: '#C4F56A', red: '#EF4444', card: col('--card', '#fff'), line: col('--line', 'rgba(127,127,127,0.25)') };
    let W = 0, H = 0;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const PW = 64, PH = 22;
    const g = { run: false, x: W / 2, target: W / 2, items: [], pops: [], spawn: 30, t: 0, score: 0, lives: LIVES, combo: 1, streak: 0, shake: 0, keys: 0 };
    game.current = g;

    const start = () => {
      Object.assign(g, { run: true, items: [], pops: [], spawn: 30, t: 0, score: 0, lives: LIVES, combo: 1, streak: 0 });
      setHud({ score: 0, lives: LIVES, combo: 1 }); setState('play');
    };
    g.tap = (x) => { if (!g.run) start(); if (x != null) g.target = x; };
    g.move = (x) => { g.target = x; };

    const level = () => Math.min(1, g.t / 3600); // dificultad: llega al máximo en ~1 minuto
    let raf;
    const frame = () => {
      if (g.run) {
        g.t++;
        g.target = Math.max(PW / 2, Math.min(W - PW / 2, g.target + g.keys * 7));
        g.x += (g.target - g.x) * 0.35;
        if (--g.spawn <= 0) {
          const r = Math.random();
          const kind = r < 0.22 + level() * 0.18 ? 'nope' : r > 0.93 ? 'crystal' : 'mana';
          g.items.push({ kind, x: 16 + Math.random() * (W - 32), y: -14, vy: 1.8 + level() * 2.6 + Math.random() * 0.8, rot: Math.random() * 6 });
          g.spawn = 34 - level() * 18 + Math.random() * 14;
        }
        const py = H - 20;
        for (const it of g.items) {
          it.y += it.vy; it.rot += 0.03;
          if (!it.done && it.y > py - PH / 2 - 8 && it.y < py + 6 && Math.abs(it.x - g.x) < PW / 2 + 6) {
            it.done = true;
            if (it.kind === 'nope') {
              g.lives--; g.combo = 1; g.streak = 0; g.shake = 10;
              g.pops.push({ x: it.x, y: py - 24, text: '✕', c: C.red, life: 30 });
              if (g.lives <= 0) {
                g.run = false;
                const s = g.score;
                setBest((b) => { if (s > b) { saveBest(s); return s; } return b; });
                setState('over');
              }
            } else {
              const pts = (it.kind === 'crystal' ? 5 : 1) * g.combo;
              g.score += pts; g.streak++;
              if (g.streak % 8 === 0) g.combo = Math.min(5, g.combo + 1);
              g.pops.push({ x: it.x, y: py - 24, text: `+${pts}`, c: it.kind === 'crystal' ? C.brand : C.lime, life: 30 });
            }
            setHud({ score: g.score, lives: Math.max(0, g.lives), combo: g.combo });
          }
          // el maná que se escapa corta la racha
          if (!it.done && it.y > H + 10) { it.done = true; if (it.kind !== 'nope') { g.streak = 0; if (g.combo > 1) { g.combo = 1; setHud({ score: g.score, lives: g.lives, combo: 1 }); } } }
        }
        g.items = g.items.filter((it) => !it.done);
      }
      g.pops.forEach((p) => { p.y -= 0.8; p.life--; });
      g.pops = g.pops.filter((p) => p.life > 0);

      // ---- dibujo ----
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      if (g.shake > 0) { ctx.translate((Math.random() - 0.5) * g.shake, 0); g.shake *= 0.8; if (g.shake < 0.5) g.shake = 0; }
      for (const it of g.items) {
        if (it.kind === 'mana') {
          hexPath(ctx, it.x, it.y, 8); ctx.fillStyle = C.lime; ctx.fill();
        } else if (it.kind === 'crystal') {
          ctx.beginPath(); ctx.moveTo(it.x, it.y - 12); ctx.lineTo(it.x + 9, it.y - 2); ctx.lineTo(it.x, it.y + 12); ctx.lineTo(it.x - 9, it.y - 2); ctx.closePath();
          ctx.fillStyle = C.brand; ctx.fill();
        } else {
          ctx.beginPath(); ctx.arc(it.x, it.y, 10, 0, Math.PI * 2); ctx.fillStyle = C.red; ctx.fill();
          ctx.save(); ctx.translate(it.x, it.y); ctx.rotate(it.rot);
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(-4, -4); ctx.lineTo(4, 4); ctx.moveTo(4, -4); ctx.lineTo(-4, 4); ctx.stroke();
          ctx.restore();
        }
      }
      // tu carta, tumbada, con el hexágono como las de la mano
      const py = H - 20;
      roundRect(ctx, g.x - PW / 2, py - PH / 2, PW, PH, 7);
      ctx.fillStyle = C.card; ctx.fill();
      ctx.strokeStyle = C.brand; ctx.lineWidth = 2; ctx.stroke();
      hexPath(ctx, g.x, py, 6); ctx.strokeStyle = C.brand; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
      ctx.font = '800 13px system-ui, sans-serif'; ctx.textAlign = 'center';
      for (const p of g.pops) { ctx.globalAlpha = p.life / 30; ctx.fillStyle = p.c; ctx.fillText(p.text, p.x, p.y); }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const down = (e) => {
      if (e.code === 'ArrowLeft') g.keys = -1;
      else if (e.code === 'ArrowRight') g.keys = 1;
      else if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); if (!g.run) g.tap(); }
      else if (e.code === 'Escape') onClose();
    };
    const up = (e) => { if ((e.code === 'ArrowLeft' && g.keys < 0) || (e.code === 'ArrowRight' && g.keys > 0)) g.keys = 0; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [onClose]);

  const xOf = (e) => e.clientX - e.currentTarget.getBoundingClientRect().left;
  return (
    <div className="mana-catch">
      <div className="mc-head">
        <span className="mc-lives" aria-label={t('{n} vidas', { n: hud.lives })}>
          {Array.from({ length: LIVES }, (_, i) => <i key={i} className={i < hud.lives ? 'on' : ''} />)}
        </span>
        {hud.combo > 1 && <span className="mc-combo">×{hud.combo}</span>}
        <span className="mc-score">{hud.score}</span>
        <span className="mc-best">{t('Récord')} {best}</span>
      </div>
      <canvas ref={canvasRef} className="mc-canvas" role="img" aria-label={t('Minijuego: mueve tu carta para recoger maná')}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); game.current?.tap(xOf(e)); }}
        onPointerMove={(e) => { if (e.buttons || e.pointerType === 'mouse') game.current?.move(xOf(e)); }} />
      <p className="mc-hint">
        {state === 'ready' && t('Toca para empezar. Arrastra tu carta: recoge el maná y esquiva los «Paso».')}
        {state === 'play' && t('Cada 8 seguidos sube el multiplicador')}
        {state === 'over' && t('¡Fin de la partida! Toca para jugar otra')}
      </p>
      <button type="button" className="link-btn mc-close" onClick={onClose}>{t('Volver')}</button>
    </div>
  );
}
