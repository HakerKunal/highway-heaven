import type { Order } from "./store";

const BOT = process.env.TELEGRAM_BOT_TOKEN || "";
const CHATS = (process.env.TELEGRAM_CHAT_ID || "")
  .split(",")
  .map((c) => c.trim())
  .filter(Boolean);

function paymentLine(o: Order): string {
  if (o.payment === "online") return o.paymentStatus === "paid" ? "PAID ONLINE ✅" : "⚠️ Online payment PENDING — don't cook yet";
  const where = o.fulfilment === "pickup" ? "at counter" : "on delivery";
  return (o.payment === "upi" ? "UPI " : "Cash ") + where + " 💵";
}

/** Send the owner a Telegram message about an order. Fire-and-forget — never blocks or fails the order. */
export async function notifyOwner(o: Order, heading: string): Promise<void> {
  if (!BOT || CHATS.length === 0) return;
  const lines = [
    `${heading} ${o.id}`,
    `${o.fulfilment === "pickup" ? "🥡 PICKUP" : "🛵 DELIVERY"} • ${paymentLine(o)}`,
    "",
    ...o.items.map((i) => `${i.qty} × ${i.name} — ₹${i.price * i.qty}`),
    `Total: ₹${o.total}${o.delivery ? ` (incl. ₹${o.delivery} delivery)` : ""}`,
    "",
    `👤 ${o.name} • ${o.phone}`,
  ];
  if (o.fulfilment === "delivery") lines.push(`📍 ${o.address}`);
  if (o.note) lines.push(`📝 ${o.note}`);
  const text = lines.join("\n");
  await Promise.all(
    CHATS.map((chat_id) =>
      fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id, text }),
      }).catch((e) => console.error("Telegram notify failed for", chat_id, e))
    )
  );
}
