# Highway Heaven Cafe & Restaurant — Online Ordering

Full ordering website for **Highway Heaven Restaurant & Cafe**, Baghar Road, Farrukhabad.

- **Customer site** (`/`) — the complete printed menu (204 pure-veg dishes across 24 categories), styled to match the restaurant's black-and-gold menu design with the Ganesha emblem and the "Good Food | Good Mood | Great Time" slogan. Cart and checkout with a Delivery or Pickup choice — pickup orders skip the address, are always free, and show the restaurant address with directions. Pay by cash or UPI (on delivery or at the counter). Call and WhatsApp buttons included.
- **Order tracking** (`/order/HH-XXXXXXX`) — customers watch their order travel down the highway, milestone by milestone. Auto-refreshes.
- **Admin panel** (`/admin`) — password-protected. Manage orders (confirm → cooking → out for delivery → delivered, or cancel) and the full menu (add / edit / delete dishes, mark sold out, set categories, prices, veg/non-veg, bestseller tags, photo URLs).

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — admin is at http://localhost:3000/admin
Default admin password: `highway@123` (change it — see below).

## Deploy on Vercel (5 minutes)

1. Push this folder to a GitHub repository (or use `npx vercel` directly from the folder).
2. On [vercel.com](https://vercel.com) → **Add New Project** → import the repo. Vercel auto-detects Next.js — just press **Deploy**.
3. In the project → **Settings → Environment Variables**, add:
   - `ADMIN_PASSWORD` = your own strong password (this protects `/admin`).
4. **Make data permanent (recommended):** in the project → **Storage** tab → **Create Database** → choose **Upstash (Redis)** → connect it to the project. Vercel adds the connection variables automatically. Redeploy once.
   - Without this, the site still works, but menu changes and orders live in server memory and reset on redeploys — the admin panel will show a yellow warning until Redis is connected.

## Environment variables

| Variable | What it does |
| --- | --- |
| `ADMIN_PASSWORD` | Password for `/admin`. Defaults to `highway@123` — always set your own in production. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Added automatically when you connect Upstash Redis on Vercel. Enables permanent storage. (`KV_REST_API_URL`/`KV_REST_API_TOKEN` also work.) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Optional. Enables the "Pay now" online payment option. |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | Optional. Sends a phone alert for every new order. |

## Changing restaurant details

Phone number, address, hours and the Google Maps link live in `app/page.tsx` and `app/order/[id]/page.tsx` (constants at the top). The starting menu (extracted from the printed menu PDF) lives in `lib/menu-data.ts` — but it's easier to just edit dishes from the admin panel. The logo image is `public/logo.png`.


## Online payments (Razorpay) + phone alerts (Telegram)

Both are optional — the site works without them (falls back to cash/UPI on delivery, no alerts). Add the environment variables in Vercel (Settings -> Environment Variables) to switch them on, then redeploy.

### Online payment — "Pay now" at checkout
1. Create an account at [razorpay.com](https://razorpay.com) and complete the KYC/business verification.
2. Dashboard -> Settings -> API Keys -> Generate Key. Copy both values.
3. In Vercel add: `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
When set, a "Pay now — UPI / Card" option appears. The order is only confirmed after payment is verified on the server (signature-checked), so unpaid orders never get cooked. If a customer closes the payment window, their order stays unpaid and they can retry the same order (no duplicates).

### Phone alerts — Telegram (free, instant)
1. On Telegram, open a chat with **@BotFather** -> send `/newbot` -> follow prompts -> copy the **bot token**.
2. Send your new bot any message (say "hi") so it can message you back.
3. Open `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` in a browser and copy the `"chat":{"id": ...}` number.
4. In Vercel add: `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.
Now every order pings your phone with the customer name, phone, items, total, delivery address or pickup, and whether it's PAID online or cash. (Online orders alert only after payment succeeds; cash/UPI orders alert immediately.)

### Knowing who ordered & where
The **/admin** panel shows every order with the customer's name, a tap-to-call phone number, the full delivery address (or a Pickup badge), items, total, and a green **Paid** / red **Unpaid** badge for online orders. A sound plays in the admin tab whenever a new order arrives.

## Tech

Next.js 14 (App Router) · Tailwind CSS · Upstash Redis (optional) · zero other services needed.
