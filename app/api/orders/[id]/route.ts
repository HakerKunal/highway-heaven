import { NextResponse } from "next/server";
import { getOrder, getOrders, saveOrders, type OrderStatus } from "@/lib/store";
import { isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

const STATUSES: OrderStatus[] = ["placed", "confirmed", "preparing", "out", "delivered", "cancelled"];

// Customer: track an order by id
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const order = await getOrder(params.id.toUpperCase());
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ order });
}

// Admin: update order status
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const status = body.status as OrderStatus;
  if (!STATUSES.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  const orders = await getOrders();
  const idx = orders.findIndex((o) => o.id === params.id.toUpperCase());
  if (idx === -1) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  orders[idx] = { ...orders[idx], status, updatedAt: Date.now() };
  await saveOrders(orders);
  return NextResponse.json({ order: orders[idx] });
}
