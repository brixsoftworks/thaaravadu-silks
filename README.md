# Shavili Vinayak Sarees

E-commerce storefront for a premium Kerala saree boutique (formerly
"Thaaravadu Silks"). Vanilla HTML/CSS/JS frontend with Firebase auth + cart
sync and Stripe Checkout, hosted on Vercel.

> **Status: demo/development.** Product catalog is hardcoded (6 items),
> Stripe is test-mode and was not fully configured. Do not launch without
> completing the checklist in "Going live" below.

## Stack

- Static HTML/CSS/JS (no framework; `js/main.js` cart UI, `js/auth.js`
  Firebase Auth v10 + Firestore)
- Firebase: Google sign-in, cloud cart sync, `orders` collection
- Stripe Checkout via Vercel serverless function (`api/create-checkout-session.js`)
- **Stripe webhook** (`api/stripe-webhook.js`): the only writer of paid status

## Payment security model

- Client places order → Firestore `orders/{id}` created with `status: "pending"`.
  Security rules allow create/read for the owner only.
- Browser redirect params (`?checkout_success=true`) are cosmetic — they clear
  the cart and show a message but NEVER change order status.
- `checkout.session.completed` webhook verifies Stripe's signature and writes
  `status: "paid"` through the Firebase Admin SDK.
- Firestore rules reject ALL client updates/deletes of orders
  (`allow update, delete: if false`). There is no client-side path to mark an
  order paid anymore.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in server secrets
vercel dev                   # runs static site + /api functions
```

### Environment variables (Vercel project settings)

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `FIREBASE_SERVICE_ACCOUNT_JSON` — service-account JSON as one string;
  generate in Firebase console → Project settings → Service accounts.

## Going live (manual checklist — requires owner decisions)

1. Replace the 6 hardcoded products with a real catalog (Firestore-backed or
   CMS) and support quantities — TODO by design, business decision.
2. Switch Stripe to live mode (`sk_live_…`) after account/business details
   are complete (previous config failed with "must set an account or business
   name").
3. Register the webhook endpoint (`https://<domain>/api/stripe-webhook`,
   event: `checkout.session.completed`, `checkout.session.expired`) and set
   its signing secret in Vercel.
4. Deploy the Firestore rules from this repo (`firebase deploy --only firestore:rules`)
   so the no-client-update rule is live before taking payments.

## Known limitations

- Quantity fixed at 1 per line item; wishlist/quick-view buttons have no handlers.
- No admin panel — orders are inspected in the Firebase console.
- Prices are parsed from DOM text at checkout time.
