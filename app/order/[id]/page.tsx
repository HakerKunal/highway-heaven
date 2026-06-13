"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Order, OrderStatus } from "@/lib/store";

const DELIVERY_STEPS: { key: OrderStatus; km: string; title: string; sub: string }[] = [
  { key: "placed", km: "0", title: "Order placed", sub: "We've got your order." },
  { key: "confirmed", km: "1", title: "Confirmed", sub: "The kitchen has accepted it." },
  { key: "preparing", km: "2", title: "Cooking", sub: "Fresh on the tawa and tandoor." },
  { key: "out", km: "3", title: "On the highway", sub: "Your food is on its way." },
  { key: "delivered", km: "4", title: "Delivered", sub: "Enjoy your meal!" },
];

const PICKUP_STEPS: { key: OrderStatus; km: string; title: string; sub: string }[] = [
  { key: "placed", km: "0", title: "Order placed", sub: "We've got your order." },
  { key: "confirmed", km: "1", title: "Confirmed", sub: "The kitchen has accepted it." },
  { key: "preparing", km: "2", title: "Cooking", sub: "Fresh on the tawa and tandoor." },
  { key: "out", km: "3", title: "Ready for pickup", sub: "Come collect it while it's hot!" },
  { key: "delivered", km: "4", title: "Picked up", sub: "Enjoy your meal!" },
];

export default function OrderPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      const res = await fetch(`/api/orders/${params.id}`, { cache: "no-store" });
      if (!active) return;
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      const data = await res.json();
      setOrder(data.order);
    }
    load();
    const t = setInterval(load, 10000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [params.id]);

  const cancelled = order?.status === "cancelled";
  const isPickup = order?.fulfilment === "pickup";
  const STEPS = isPickup ? PICKUP_STEPS : DELIVERY_STEPS;
  const currentIdx = order ? STEPS.findIndex((s) => s.key === order.status) : -1;

  return (
    <div className="asphalt-texture min-h-screen">
      <header className="border-b border-gold/15">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold text-gold">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="h-9 w-auto" aria-hidden />
            Highway Heaven
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-cream/20 px-4 py-1.5 font-sign text-sm font-semibold uppercase tracking-wider text-mist hover:border-gold hover:text-gold"
          >
            ← Menu
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10">
        {notFound && (
          <div className="py-20 text-center">
            <p className="font-display text-3xl font-bold text-gold">Wrong exit!</p>
            <p className="mt-3 text-mist">
              We couldn't find an order with ID <span className="font-mono text-cream">{params.id}</span>. Check the ID
              and try again, or call us at{" "}
              <a className="text-gold" href="tel:+918318917038">
                +91 83189 17038
              </a>
              .
            </p>
          </div>
        )}

        {!order && !notFound && (
          <div className="py-24 text-center">
            <div className="road-line animate mx-auto max-w-xs" />
            <p className="mt-6 font-sign uppercase tracking-[0.3em] text-mist">Finding your order…</p>
          </div>
        )}

        {order && (
          <>
            <div className="text-center">
              <p className="font-sign text-sm font-semibold uppercase tracking-[0.35em] text-mist">Order</p>
              <h1 className="mt-1 font-display text-3xl font-bold text-gold">{order.id}</h1>
              <p className="mt-2 text-sm text-mist">
                Placed {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>

            {cancelled ? (
              <div className="mt-10 rounded-xl border border-wine bg-wine/15 p-6 text-center">
                <p className="font-display text-2xl font-bold text-cream">Order cancelled</p>
                <p className="mt-2 text-sm text-mist">
                  This order was cancelled. If that's unexpected, call us at{" "}
                  <a className="text-gold" href="tel:+918318917038">
                    +91 83189 17038
                  </a>
                  .
                </p>
              </div>
            ) : (
              /* ---- the highway: status milestones ---- */
              <div className="relative mx-auto mt-12 max-w-md">
                <div
                  className="absolute bottom-6 left-[1.65rem] top-2 w-1 rounded"
                  style={{
                    backgroundImage: "linear-gradient(180deg, var(--gold) 0 14px, transparent 14px 26px)",
                    backgroundSize: "4px 26px",
                    opacity: 0.5,
                  }}
                  aria-hidden
                />
                <ol className="space-y-8">
                  {STEPS.map((s, i) => {
                    const done = i <= currentIdx;
                    const current = i === currentIdx;
                    return (
                      <li key={s.key} className="relative flex items-center gap-5">
                        <span
                          className={`milestone transition ${done ? "" : "opacity-35 grayscale"} ${
                            current ? "shadow-glow" : ""
                          }`}
                        >
                          <span className="ms-top font-sign">{s.km}</span>
                          <span className="ms-bottom">KM</span>
                        </span>
                        <div>
                          <p
                            className={`font-sign text-lg font-bold uppercase tracking-wide ${
                              current ? "text-gold" : done ? "text-cream" : "text-mist/70"
                            }`}
                          >
                            {s.title}
                            {current && <span className="ml-2 inline-block animate-pulse">●</span>}
                          </p>
                          <p className="text-sm text-mist">{s.sub}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            {isPickup && !cancelled && (
              <div className={`mt-10 rounded-xl border p-4 text-sm ${order.status === "out" ? "border-gold bg-gold/15" : "border-cream/10 bg-tar"}`}>
                <p className="font-sign font-bold uppercase tracking-wider text-gold">
                  {order.status === "out" ? "Your order is ready — come and get it!" : "Pickup order"}
                </p>
                <p className="mt-1 text-cream">
                  Highway Heaven Restaurant &amp; Cafe — Baghar Road, near J.S. Group Medical College, Farrukhabad
                </p>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Highway+Heaven+Restaurant+%26+Cafe+Baghar+Road+Farrukhabad"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block font-sign font-semibold uppercase tracking-wider text-gold hover:text-cream"
                >
                  Get directions →
                </a>
              </div>
            )}

            {order.payment === "online" && (
              <div className={`mt-10 rounded-xl border p-4 text-center ${order.paymentStatus === "paid" ? "border-signgreen bg-signgreen/15" : "border-wine bg-wine/15"}`}>
                <p className="font-sign font-bold uppercase tracking-wider text-cream">
                  {order.paymentStatus === "paid" ? "✅ Payment received — order confirmed" : "⚠️ Payment pending"}
                </p>
                {order.paymentStatus !== "paid" && (
                  <p className="mt-1 text-sm text-mist">
                    We haven't received payment for this order yet. If money was deducted, call us at{" "}
                    <a className="text-gold" href="tel:+918318917038">+91 83189 17038</a> with your order ID.
                  </p>
                )}
              </div>
            )}

            {/* ---- bill ---- */}
            <div className="mt-12 rounded-xl border border-cream/10 bg-tar p-5">
              <h2 className="font-display text-lg font-bold text-gold">Your bill</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {order.items.map((it) => (
                  <li key={it.dishId} className="flex justify-between text-cream">
                    <span>
                      {it.name} <span className="text-mist">× {it.qty}</span>
                    </span>
                    <span>₹{it.price * it.qty}</span>
                  </li>
                ))}
              </ul>
              <div className="road-line my-3 opacity-25" />
              <div className="space-y-1 text-sm text-mist">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{order.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isPickup ? "Pickup" : "Delivery"}</span>
                  <span>{order.delivery === 0 ? "Free" : `₹${order.delivery}`}</span>
                </div>
                <div className="flex justify-between font-sign text-lg font-bold text-gold">
                  <span>
                    Total (
                    {order.payment === "online"
                      ? order.paymentStatus === "paid" ? "Paid online" : "Online — pending"
                      : isPickup
                      ? order.payment === "upi" ? "UPI at counter" : "Cash at counter"
                      : order.payment === "upi" ? "UPI on delivery" : "Cash on delivery"}
                    )
                  </span>
                  <span>₹{order.total}</span>
                </div>
              </div>
              <div className="mt-4 text-sm text-mist">
                <p className="font-sign font-bold uppercase tracking-wider text-cream">
                  {isPickup ? "Order for" : "Delivering to"}
                </p>
                <p className="mt-1">
                  {order.name} • {order.phone}
                </p>
                {!isPickup && <p>{order.address}</p>}
                {order.note && <p className="mt-1 italic">"{order.note}"</p>}
              </div>
            </div>

            <p className="mt-8 text-center text-sm text-mist">
              This page refreshes automatically. Questions? Call{" "}
              <a className="text-gold" href="tel:+918318917038">
                +91 83189 17038
              </a>{" "}
              or{" "}
              <a
                className="text-gold"
                target="_blank"
                rel="noreferrer"
                href={`https://wa.me/918318917038?text=${encodeURIComponent(`Hello! I placed order ${order.id} on the website.`)}`}
              >
                WhatsApp us
              </a>
              .
            </p>
          </>
        )}
      </main>
    </div>
  );
}
