import { NextResponse } from "next/server";
import { getOrders, saveOrders } from "@/lib/store";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { notifyOwner } from "@/lib/notify";

export const dynamic = "force-dynamic";

// Called by the customer's browser after Razorpay checkout succeeds.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const orderId = String(body?.orderId || "").toUpperCase();
  const paymentId = String(body?.razorpay_payment_id || "");
  const rzpOrderId = String(body?.razorpay_order_id || "");
  const signature = String(body?.razorpay_signature || "");
  if (!orderId || !paymentId || !rzpOrderId || !signature) {
    return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
  }

  const orders = await getOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  const order = orders[idx];

  if (order.razorpayOrderId !== rzpOrderId) {
    return NextResponse.json({ error: "Payment does not match this order" }, { status: 400 });
  }
  if (!verifyPaymentSignature(rzpOrderId, paymentId, signature)) {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  // Payment verified: mark paid and auto-confirm the order.
  orders[idx] = { ...order, paymentStatus: "paid", status: order.status === "placed" ? "confirmed" : order.status, updatedAt: Date.now() };
  await saveOrders(orders);
  notifyOwner(orders[idx], "🆕 New order").catch(() => {});
  return NextResponse.json({ order: orders[idx] });
}
