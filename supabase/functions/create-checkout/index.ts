// Crea una sesión de pago de Stripe para comprar súper duelos.
// Secretos necesarios (supabase secrets set ...): STRIPE_SECRET_KEY, STRIPE_PRICE_PACK1, STRIPE_PRICE_PACK5,
// STRIPE_PRICE_PACK15 y APP_URL (p. ej. https://mana-match-psi.vercel.app). Nunca van en la app.
import Stripe from 'npm:stripe@17';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
const PACKS: Record<string, { price: string; credits: number }> = {
  pack1: { price: Deno.env.get('STRIPE_PRICE_PACK1')!, credits: 1 },
  pack5: { price: Deno.env.get('STRIPE_PRICE_PACK5')!, credits: 5 },
  pack15: { price: Deno.env.get('STRIPE_PRICE_PACK15')!, credits: 15 },
};
const APP_URL = Deno.env.get('APP_URL')!;
const cors = { 'Access-Control-Allow-Origin': APP_URL, 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  // Quién compra: se saca del token de sesión, nunca de lo que diga la app
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('No autorizado', { status: 401, headers: cors });

  const { pack } = await req.json().catch(() => ({}));
  const p = PACKS[pack];
  if (!p) return new Response('Pack no válido', { status: 400, headers: cors });

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: p.price, quantity: 1 }],
    client_reference_id: user.id,
    metadata: { pack, credits: String(p.credits) },
    success_url: `${APP_URL}/?compra=ok`,
    cancel_url: `${APP_URL}/?compra=cancelada`,
  });
  return new Response(JSON.stringify({ url: session.url }), { headers: { ...cors, 'Content-Type': 'application/json' } });
});
