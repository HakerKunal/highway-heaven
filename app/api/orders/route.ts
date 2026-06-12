import { NextResponse } from "next/server";
import { getMenu, getOrders, saveOrders, newOrderId, persistent, type Order, type OrderItem, type Fulfilment } from "@/lib/store";
import { isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Customer: place an order
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Missing body" }, { status: 400 });

  const name = String(body.name || "").trim();
  const phone = String(body.phone || "").replace(/\D/g, "");
  const address = String(body.address || "").trim();
  const note = String(body.note || "").trim();
  const payment = body.payment === "upi" ? "upi" : "cod";
  const fulfilment: Fulfilment = body.fulfilment === "pickup" ? "pickup" : "delivery";
  const cart: Record<string, number> = body.cart && typeof body.cart === "object" ? body.cart : {};

  if (name.length < 2) return NextResponse.json({ error: "Please enter your name" }, { status: 400 });
  if (phone.length !== 10) return NextResponse.json({ error: "Please enter a valid 10-digit phone number" }, { status: 400 });
  if (fulfilment === "delivery" && address.length < 8)
    return NextResponse.json({ error: "Please enter a full delivery address" }, { status: 400 });

  const menu = await getMenu();
  const items: OrderItem[] = [];
  for (const [dishId, qtyRaw] of Object.entries(cart)) {
    const qty = Math.min(20, Math.max(0, Math.round(Number(qtyRaw))));
    if (!qty) continue;
    const dish = menu.find((d) => d.id === dishId && d.available);
    if (!dish) continue;
    items.push({ dishId, name: dish.name, price: dish.price, qty });
  }
  if (!items.length) return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = fulfilment === "pickup" ? 0 : subtotal >= 499 ? 0 : 30;
  const order: Order = {
    id: newOrderId(),
    fulfilment,
    items,
    subtotal,
    delivery,
    total: subtotal + delivery,
    name,
    phone,
    address: fulfilment === "pickup" ? "Pickup from restaurant" : address,
    note: note || undefined,
    payment,
    status: "placed",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const orders = await getOrders();
  orders.push(order);
  await saveOrders(orders);
  return NextResponse.json({ order });
}

// Admin: list all orders
export async function GET(req: Request) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orders = await getOrders();
  return NextResponse.json({ orders: [...orders].reverse(), persistent });
}
