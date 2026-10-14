// Recibe la confirmación de pago de Stripe y suma los súper duelos. Es lo ÚNICO que puede añadir saldo.
// Secretos: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET. Usa la clave de servicio de Supabase (solo en el servidor).
// Desplegar sin verificación de JWT (Stripe no envía uno): supabase functions deploy stripe-webhook --no-verify-jwt
import Stripe from 'npm:stripe@17';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature') ?? '';
  const body = await req.text();
  let event: Stripe.Event;
  try {
    // Comprueba la firma: así nadie puede inventarse un "pago" llamando a esta función
    event = await stripe.webhooks.constructEventAsync(body, signature, Deno.env.get('STRIPE_WEBHOOK_SECRET')!);
  } catch {
    return new Response('Firma no válida', { status: 400 });
  }
  if (event.type === 'checkout.session.completed') {
    const s = event.data.object as Stripe.Checkout.Session;
    if (s.payment_status !== 'paid' || !s.client_reference_id) return new Response('ok');
    const credits = Number(s.metadata?.credits ?? 0);
    // Idempotente: si Stripe reenvía el aviso, la compra ya existe y no se suma dos veces
    const { error } = await admin.from('super_purchases').insert({
      stripe_session: s.id, user_id: s.client_reference_id, pack: s.metadata?.pack ?? '', credits,
      amount_cents: s.amount_total ?? 0, currency: s.currency ?? 'eur',
    });
    if (!error) await admin.rpc('add_super_credits', { target: s.client_reference_id, amount: credits });
  }
  return new Response('ok');
});
