// Stripe webhook — the ONLY component allowed to mark orders as paid.
//
// The client-facing success redirect (?checkout_success=true) is purely
// cosmetic; it can never be trusted. This endpoint verifies Stripe's
// signature, then writes the authoritative order status via the Firebase
// Admin SDK (which bypasses security rules by design).
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

let db;
function getDb() {
  if (db) return db;
  if (!admin.apps.length) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON not configured');
    }
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccountJson)),
    });
  }
  db = admin.firestore();
  return db;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).end('Webhook not configured');
  }

  // Vercel Node functions expose the raw body needed for signature checks
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody || req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Signature verification failed:', err.message);
    return res.status(400).end(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const orderId = session.metadata && session.metadata.orderId;
        if (!orderId) break;
        await getDb().collection('orders').doc(orderId).update({
          status: 'paid',
          paymentIntentId: session.payment_intent || null,
          paidAt: new Date().toISOString(),
        });
        break;
      }
      case 'checkout.session.expired':
      case 'checkout.session.async_payment_failed': {
        const session = event.data.object;
        const orderId = session.metadata && session.metadata.orderId;
        if (!orderId) break;
        await getDb().collection('orders').doc(orderId).update({
          status: 'payment_failed',
        });
        break;
      }
      default:
        // Unhandled event types are acknowledged silently
        break;
    }
  } catch (err) {
    console.error('Order update failed:', err);
    // 500 makes Stripe retry the delivery
    return res.status(500).end('Order update failed');
  }

  return res.status(200).json({ received: true });
};
