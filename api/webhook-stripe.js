import crypto from 'crypto';

export const config = { api: { bodyParser: false } };

async function readRaw(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const raw = await readRaw(req);
  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  // Verificación de firma Stripe
  try {
    const parts = Object.fromEntries(sig.split(',').map(s => s.split('=')));
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${parts.t}.${raw}`)
      .digest('hex');
    if (expected !== parts.v1) return res.status(400).send('Bad signature');
  } catch {
    return res.status(400).send('Bad signature');
  }

  const event = JSON.parse(raw);
  if (event.type === 'crypto.onramp_session.updated') {
    const s = event.data.object;
    console.log('Onramp', s.id, s.status, s.transaction_details?.destination_amount);
    // Aquí más adelante: guardar en BBDD, enviar email, etc.
  }
  return res.status(200).json({ received: true });
}
