export default async function handler(req, res) {
  // CORS para que tu web WordPress pueda llamarlo
  res.setHeader('Access-Control-Allow-Origin', 'https://kotaingtoe.org');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { amount } = req.body || {};
    const monto = Number(amount) || 25; // USD por defecto

    const params = new URLSearchParams();

    // Wallet de destino en la red Base
    params.append('wallet_addresses[base]', '0xbA6D65c7e2896b7e2e227869f853a4E79b1AF57A');

    // Redes/monedas soportadas para el destino
    params.append('destination_networks[]', 'base');
    params.append('destination_currencies[]', 'usdc');

    // Destino por defecto y origen
    params.append('destination_currency', 'usdc');
    params.append('destination_network', 'base');
    params.append('source_currency', 'usd');
    params.append('source_amount', monto.toString());

    const r = await fetch('https://api.stripe.com/v1/crypto/onramp_sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const data = await r.json();
    if (!r.ok) return res.status(400).json({ error: data.error?.message || 'Stripe error' });

    return res.status(200).json({ client_secret: data.client_secret });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
