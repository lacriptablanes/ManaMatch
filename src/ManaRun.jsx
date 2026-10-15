import { useEffect, useRef, useState } from 'react';
import { t } from './i18n.js';

/* Minijuego para cuando no quedan jugadores (como el dinosaurio de Chrome sin conexión):
   el cristal de maná salta las cartas que llegan y recoge gemas. Toca o pulsa espacio para saltar. */
const H = 190;
const GROUND = H - 34;
const BEST_KEY = 'manamatch-manarun-best';

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

export default function ManaRun({ onClose }) {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(readBest);
  const [state, setState] = useState('ready'); // ready | play | over
  const game = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const css = getComputedStyle(canvas);
    const col = (v, f) => css.getPropertyValue(v).trim() || f;
    const C = {
      brand: col('--brand', '#8B5CF6'), lime: '#C4F56A', text: col('--text', '#171522'),
      muted: col('--muted', '#8b8799'), line: col('--line', 'rgba(127,127,127,0.25)'), card: col('--card', '#fff'),
    };
    let W = 0;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      W = canvas.clientWidth;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const g = {
      run: false, over: false, y: 0, vy: 0, speed: 4.2, dist: 0, bonus: 0, t: 0,
      obs: [], gems: [], spawn: 60, sparks: [],
    };
    game.current = g;
    const PX = 46;

    const reset = () => {
      Object.assign(g, { run: true, over: false, y: 0, vy: 0, speed: 4.2, dist: 0, bonus: 0, obs: [], gems: [], spawn: 50, sparks: [] });
      setState('play'); setScore(0);
    };
    g.jump = () => {
      if (!g.run) { reset(); return; }
      if (g.y === 0) g.vy = 10.5;
    };

    let raf;
    const frame = () => {
      g.t++;
      if (g.run) {
        g.speed = Math.min(10, 4.2 + g.dist / 900);
        g.dist += g.speed;
        // salto
        g.vy -= 0.62; g.y = Math.max(0, g.y + g.vy); if (g.y === 0) g.vy = 0;
        // nuevas cartas (a veces dos seguidas) y gemas en el aire
        if (--g.spawn <= 0) {
          const tall = Math.random() < 0.3;
          g.obs.push({ x: W + 10, w: 22, h: tall ? 40 : 28 });
          if (Math.random() < 0.22 && g.dist > 600) g.obs.push({ x: W + 36, w: 22, h: 28 });
          if (Math.random() < 0.5) g.gems.push({ x: W + 110 + Math.random() * 60, y: 52 + Math.random() * 40 });
          g.spawn = 48 + Math.random() * 55 - Math.min(20, g.dist / 400);
        }
        g.obs.forEach((o) => { o.x -= g.speed; });
        g.gems.forEach((o) => { o.x -= g.speed; });
        g.obs = g.obs.filter((o) => o.x > -40);
        g.gems = g.gems.filter((o) => o.x > -20 && !o.got);
        // choques: el cristal es un rombo, así que la caja es algo más pequeña que el dibujo
        const py = GROUND - g.y;
        for (const o of g.obs) {
          if (PX + 9 > o.x + 3 && PX - 9 < o.x + o.w - 3 && py > GROUND - o.h + 4) {
            g.run = false; g.over = true;
            const s = Math.floor(g.dist / 10) + g.bonus;
            setBest((b) => { const nb = Math.max(b, s); if (nb > b) saveBest(nb); return nb; });
            setState('over');
          }
        }
        for (const o of g.gems) {
          if (Math.abs(o.x - PX) < 16 && Math.abs(o.y - (py - 14)) < 18) {
            o.got = true; g.bonus += 25;
            for (let i = 0; i < 8; i++) g.sparks.push({ x: o.x, y: o.y, vx: Math.cos(i) * 2.2, vy: Math.sin(i) * 2.2, life: 18 });
          }
        }
        if (g.t % 6 === 0) setScore(Math.floor(g.dist / 10) + g.bonus);
      }
      g.sparks.forEach((s) => { s.x += s.vx; s.y += s.vy; s.life--; });
      g.sparks = g.sparks.filter((s) => s.life > 0);

      // ---- dibujo ----
      ctx.clearRect(0, 0, W, H);
      // suelo punteado que avanza
      ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.setLineDash([6, 8]);
      ctx.lineDashOffset = g.dist % 14;
      ctx.beginPath(); ctx.moveTo(0, GROUND + 1); ctx.lineTo(W, GROUND + 1); ctx.stroke();
      ctx.setLineDash([]);
      // cartas: rectángulo redondeado con un hexágono, como las de la mano
      for (const o of g.obs) {
        roundRect(ctx, o.x, GROUND - o.h, o.w, o.h, 5);
        ctx.fillStyle = C.card; ctx.fill();
        ctx.strokeStyle = C.brand; ctx.lineWidth = 2; ctx.stroke();
        hexPath(ctx, o.x + o.w / 2, GROUND - o.h / 2, 5);
        ctx.strokeStyle = C.brand; ctx.lineWidth = 1.5; ctx.stroke();
      }
      // gemas de maná
      for (const o of g.gems) {
        const bob = Math.sin((g.t + o.x) / 9) * 3;
        hexPath(ctx, o.x, o.y + bob, 7);
        ctx.fillStyle = C.lime; ctx.fill();
      }
      for (const s of g.sparks) {
        ctx.globalAlpha = s.life / 18; ctx.fillStyle = C.lime;
        ctx.fillRect(s.x - 2, s.y - 2, 4, 4);
      }
      ctx.globalAlpha = 1;
      // el cristal (el mismo icono del estado vacío), inclinado en el aire
      const py = GROUND - g.y;
      ctx.save();
      ctx.translate(PX, py - 14);
      if (g.y > 0) ctx.rotate(Math.min(0.35, g.vy * -0.03));
      ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(11, -3); ctx.lineTo(0, 14); ctx.lineTo(-11, -3); ctx.closePath();
      ctx.fillStyle = g.over ? C.muted : C.brand; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(-11, -3); ctx.lineTo(11, -3); ctx.moveTo(0, -14); ctx.lineTo(0, 14); ctx.stroke();
      ctx.restore();
      // sombra en el suelo
      ctx.fillStyle = C.line;
      ctx.beginPath(); ctx.ellipse(PX, GROUND + 1, Math.max(4, 10 - g.y / 10), 2, 0, 0, Math.PI * 2); ctx.fill();

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onKey = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); g.jump(); }
      if (e.code === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  return (
    <div className="mana-run">
      <div className="mr-head">
        <span className="mr-score">{String(score).padStart(5, '0')}</span>
        <span className="mr-best">{t('Récord')} {String(best).padStart(5, '0')}</span>
      </div>
      <canvas ref={canvasRef} className="mr-canvas" style={{ height: H }}
        onPointerDown={(e) => { e.preventDefault(); game.current?.jump(); }}
        aria-label={t('Minijuego: toca para saltar las cartas')} role="img" />
      <p className="mr-hint">
        {state === 'ready' && t('Toca para empezar. Salta las cartas y recoge maná.')}
        {state === 'play' && t('Toca para saltar')}
        {state === 'over' && t('¡Fin de la partida! Toca para jugar otra')}
      </p>
      <button type="button" className="link-btn mr-close" onClick={onClose}>{t('Volver')}</button>
    </div>
  );
}
