"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Dish } from "@/lib/store";

const PHONE = "+918318917038";
const WHATSAPP = "https://wa.me/918318917038?text=" + encodeURIComponent("Hello Highway Heaven! I'd like to place an order.");
const MAPS_URL = "https://www.google.com/maps/search/?api=1&query=Highway+Heaven+Restaurant+%26+Cafe+Baghar+Road+Farrukhabad";

type Cart = Record<string, number>;

export default function Home() {
  const router = useRouter();
  const [menu, setMenu] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Cart>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", address: "", note: "", payment: "cod", fulfilment: "delivery" });
  const [activeCat, setActiveCat] = useState("");

  /* load menu */
  useEffect(() => {
    fetch("/api/menu")
      .then((r) => r.json())
      .then((d) => {
        setMenu(d.menu || []);
        const cats: string[] = d.categories || [];
        const present = cats.filter((c: string) => (d.menu || []).some((m: Dish) => m.category === c));
        const extra = Array.from(new Set((d.menu || []).map((m: Dish) => m.category))).filter(
          (c) => !present.includes(c as string)
        ) as string[];
        setCategories([...present, ...extra]);
      })
      .finally(() => setLoading(false));
  }, []);

  /* cart persistence on this device */
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("hh-cart");
      if (saved) setCart(JSON.parse(saved));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      window.localStorage.setItem("hh-cart", JSON.stringify(cart));
    } catch {}
  }, [cart]);

  /* scroll reveal */
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
      { threshold: 0.08 }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [loading]);

  /* active category highlight while scrolling */
  useEffect(() => {
    const onScroll = () => {
      let current = "";
      for (const c of categories) {
        const el = document.getElementById(catId(c));
        if (el && el.getBoundingClientRect().top < 160) current = c;
      }
      setActiveCat(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [categories]);

  const byCategory = useMemo(() => {
    const map = new Map<string, Dish[]>();
    for (const c of categories) map.set(c, []);
    for (const d of menu) {
      if (!map.has(d.category)) map.set(d.category, []);
      map.get(d.category)!.push(d);
    }
    return map;
  }, [menu, categories]);

  const items = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ dish: menu.find((m) => m.id === id), qty }))
        .filter((x): x is { dish: Dish; qty: number } => !!x.dish && x.qty > 0),
    [cart, menu]
  );
  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.dish.price * i.qty, 0);
  const delivery = subtotal === 0 || form.fulfilment === "pickup" ? 0 : subtotal >= 499 ? 0 : 30;

  const add = useCallback((id: string, delta: number) => {
    setCart((c) => {
      const qty = Math.max(0, Math.min(20, (c[id] || 0) + delta));
      const next = { ...c };
      if (qty === 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  }, []);

  async function placeOrder() {
    setError("");
    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, cart }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not place the order. Please try again.");
      setCart({});
      try {
        window.localStorage.removeItem("hh-cart");
        const past = JSON.parse(window.localStorage.getItem("hh-orders") || "[]");
        window.localStorage.setItem("hh-orders", JSON.stringify([data.order.id, ...past].slice(0, 10)));
      } catch {}
      router.push(`/order/${data.order.id}`);
    } catch (e: any) {
      setError(e.message);
      setPlacing(false);
    }
  }

  return (
    <div className="asphalt-texture min-h-screen">
      {/* ---------- header ---------- */}
      <header className="sticky top-0 z-40 border-b border-gold/15 bg-asphalt/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <a href="#top" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="h-11 w-auto" aria-hidden />
            <span>
              <span className="block font-display text-base font-bold leading-tight text-gold sm:text-lg">
                Highway Heaven
              </span>
              <span className="block font-sign text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-mist">
                Cafe &amp; Restaurant
              </span>
            </span>
          </a>
          <button
            onClick={() => setCartOpen(true)}
            className="relative rounded-lg border border-gold/40 px-4 py-2 font-sign text-sm font-semibold uppercase tracking-wider text-gold transition hover:bg-gold hover:text-asphalt"
          >
            Cart
            {count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-wine text-xs font-bold text-cream">
                {count}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ---------- hero ---------- */}
      <section id="top" className="headlight relative overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 pb-16 pt-14 text-center sm:pb-20 sm:pt-20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Highway Heaven" className="mx-auto h-36 w-auto drop-shadow-[0_0_25px_rgba(220,167,63,0.25)] sm:h-44" />
          <h1 className="mx-auto mt-4 max-w-3xl font-display text-5xl font-bold leading-tight text-gold sm:text-7xl">
            Highway Heaven
          </h1>
          <div className="gold-bar mx-auto mt-4 inline-block rounded px-5 py-1.5 font-sign text-xs font-bold uppercase tracking-[0.4em] sm:text-sm">
            Restaurant &amp; Cafe
          </div>
          <p className="mt-5 font-display text-base italic text-cream sm:text-lg">
            Good Food<span className="slogan-dot" />Good Mood<span className="slogan-dot" />Great Time
          </p>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-mist sm:text-base">
            Our full pure-veg menu — tandoori starters, chaap, momos, Chinese, pizzas, shakes and more —
            fresh from Baghar Road, delivered to your doorstep in Farrukhabad.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#menu"
              className="rounded-lg bg-gold px-7 py-3 font-sign text-base font-bold uppercase tracking-wider text-asphalt shadow-glow transition hover:bg-cream"
            >
              Order now
            </a>
            <a
              href={WHATSAPP}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-signgreen bg-signgreen/15 px-7 py-3 font-sign text-base font-semibold uppercase tracking-wider text-cream transition hover:bg-signgreen"
            >
              WhatsApp
            </a>
            <a
              href={`tel:${PHONE}`}
              className="rounded-lg border border-cream/30 px-7 py-3 font-sign text-base font-semibold uppercase tracking-wider text-cream transition hover:border-gold hover:text-gold"
            >
              Call us
            </a>
          </div>

          {/* roadside facts as milestone stones */}
          <div className="mt-12 flex items-end justify-center gap-5 sm:gap-10">
            {[
              { top: "4.7★", bottom: "GOOGLE RATING" },
              { top: "10–10", bottom: "OPEN DAILY" },
              { top: "₹0", bottom: "DELIVERY 499+" },
            ].map((m) => (
              <div key={m.bottom} className="milestone" style={{ width: "4.6rem" }}>
                <span className="ms-top font-sign" style={{ fontSize: "1.05rem" }}>{m.top}</span>
                <span className="ms-bottom">{m.bottom}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="road-line animate" />
      </section>

      {/* ---------- category rail ---------- */}
      <nav className="sticky top-[61px] z-30 border-b border-gold/10 bg-asphalt/95 backdrop-blur">
        <div className="rail mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 py-3">
          {categories.map((c) => (
            <a
              key={c}
              href={`#${catId(c)}`}
              className={`chip-stone whitespace-nowrap border px-4 py-1.5 font-sign text-sm font-semibold uppercase tracking-wide transition ${
                activeCat === c
                  ? "border-gold bg-gold text-asphalt"
                  : "border-cream/20 text-mist hover:border-gold/60 hover:text-gold"
              }`}
            >
              {c}
            </a>
          ))}
        </div>
      </nav>

      {/* ---------- menu ---------- */}
      <main id="menu" className="mx-auto max-w-5xl px-4 pb-40 pt-10">
        {loading && (
          <div className="py-24 text-center">
            <div className="road-line animate mx-auto max-w-xs" />
            <p className="mt-6 font-sign uppercase tracking-[0.3em] text-mist">Loading the menu…</p>
          </div>
        )}

        {!loading &&
          categories.map((c) => {
            const dishes = byCategory.get(c) || [];
            if (!dishes.length) return null;
            return (
              <section key={c} id={catId(c)} className="scroll-mt-32 pt-6">
                <div className="reveal mb-6">
                  <h2 className="gold-bar inline-block rounded px-5 py-2 font-sign text-base font-bold uppercase tracking-[0.2em] sm:text-lg">
                    {c}
                  </h2>
                  <div className="gold-rule mt-3 max-w-[260px]" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {dishes.map((d) => (
                    <article
                      key={d.id}
                      className={`reveal flex gap-4 rounded-xl border border-cream/10 bg-tar p-4 shadow-card transition hover:border-gold/40 ${
                        !d.available ? "opacity-50" : ""
                      }`}
                    >
                      {d.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={d.image}
                          alt={d.name}
                          className="h-20 w-20 flex-shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-gravel font-display text-2xl font-bold text-gold/70">
                          {d.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="flex items-center gap-2 font-sign text-lg font-semibold leading-tight text-cream">
                            <span className={`fssai ${d.veg ? "veg" : "nonveg"}`} aria-label={d.veg ? "Veg" : "Non-veg"} />
                            {d.name}
                          </h3>
                          <span className="whitespace-nowrap font-sign text-lg font-bold text-gold">₹{d.price}</span>
                        </div>
                        {d.bestseller && (
                          <span className="mt-1 inline-block rounded bg-wine px-2 py-0.5 font-sign text-[0.65rem] font-bold uppercase tracking-wider text-cream">
                            ★ Bestseller
                          </span>
                        )}
                        <p className="mt-1 line-clamp-2 text-sm text-mist">{d.desc}</p>
                        <div className="mt-3">
                          {!d.available ? (
                            <span className="font-sign text-sm font-semibold uppercase tracking-wider text-wine">
                              Sold out today
                            </span>
                          ) : cart[d.id] ? (
                            <Stepper qty={cart[d.id]} onChange={(delta) => add(d.id, delta)} />
                          ) : (
                            <button
                              onClick={() => add(d.id, 1)}
                              className="rounded-lg border border-gold/50 px-5 py-1.5 font-sign text-sm font-bold uppercase tracking-wider text-gold transition hover:bg-gold hover:text-asphalt"
                            >
                              Add +
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
      </main>

      {/* ---------- floating cart bar (mobile) ---------- */}
      {count > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed inset-x-4 bottom-4 z-40 flex items-center justify-between rounded-xl bg-gold px-5 py-3.5 font-sign font-bold uppercase tracking-wider text-asphalt shadow-glow sm:left-auto sm:right-6 sm:w-80"
        >
          <span>
            {count} item{count > 1 ? "s" : ""} • ₹{subtotal}
          </span>
          <span>View cart →</span>
        </button>
      )}

      {/* ---------- cart drawer ---------- */}
      {cartOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/70" onClick={() => !placing && setCartOpen(false)} />
          <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-tar shadow-2xl">
            <div className="flex items-center justify-between border-b border-gold/15 px-5 py-4">
              <h2 className="font-display text-xl font-bold text-gold">
                {checkout ? "Delivery details" : "Your order"}
              </h2>
              <button
                onClick={() => (checkout ? setCheckout(false) : setCartOpen(false))}
                className="rounded-lg border border-cream/20 px-3 py-1.5 font-sign text-sm font-semibold uppercase text-mist hover:border-gold hover:text-gold"
              >
                {checkout ? "← Back" : "Close"}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="font-sign text-lg uppercase tracking-wider text-mist">The road is empty.</p>
                  <p className="mt-2 text-sm text-mist">Add something tasty from the menu to get rolling.</p>
                </div>
              ) : !checkout ? (
                <ul className="space-y-4">
                  {items.map(({ dish, qty }) => (
                    <li key={dish.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 font-sign font-semibold text-cream">
                          <span className={`fssai ${dish.veg ? "veg" : "nonveg"}`} />
                          {dish.name}
                        </p>
                        <p className="text-sm text-mist">₹{dish.price} each</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Stepper qty={qty} onChange={(delta) => add(dish.id, delta)} small />
                        <span className="w-14 text-right font-sign font-bold text-gold">₹{dish.price * qty}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="space-y-4">
                  <Field label="How would you like your food?">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { v: "delivery", t: "🛵 Delivery", s: "To your doorstep" },
                        { v: "pickup", t: "🥡 Pickup", s: "Collect from us" },
                      ].map((f) => (
                        <button
                          key={f.v}
                          onClick={() => setForm({ ...form, fulfilment: f.v })}
                          className={`rounded-lg border px-3 py-2.5 text-left transition ${
                            form.fulfilment === f.v
                              ? "border-gold bg-gold/15"
                              : "border-cream/20 hover:border-gold/50"
                          }`}
                        >
                          <span className={`block font-sign text-sm font-bold uppercase tracking-wide ${form.fulfilment === f.v ? "text-gold" : "text-mist"}`}>{f.t}</span>
                          <span className="block text-xs text-mist">{f.s}</span>
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Your name">
                    <input
                      className={inputCls}
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Kunal Singh"
                      autoComplete="name"
                    />
                  </Field>
                  <Field label="Phone number">
                    <input
                      className={inputCls}
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                      placeholder="10-digit mobile number"
                      inputMode="numeric"
                      autoComplete="tel"
                    />
                  </Field>
                  {form.fulfilment === "delivery" ? (
                    <Field label="Delivery address">
                      <textarea
                        className={`${inputCls} min-h-[84px] resize-none`}
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        placeholder="House / shop, street, landmark, area in Farrukhabad"
                      />
                    </Field>
                  ) : (
                    <div className="rounded-lg border border-gold/30 bg-gold/10 px-3 py-3 text-sm">
                      <p className="font-sign font-bold uppercase tracking-wider text-gold">Pick up from</p>
                      <p className="mt-1 text-cream">
                        Highway Heaven Restaurant &amp; Cafe
                        <br />
                        Baghar Road, near J.S. Group Medical College, Farrukhabad
                      </p>
                      <p className="mt-1 text-mist">We'll have it ready — track your order to see when it's done.</p>
                    </div>
                  )}
                  <Field label="Note for the kitchen (optional)">
                    <input
                      className={inputCls}
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      placeholder="Less spicy, extra chutney…"
                    />
                  </Field>
                  <Field label="Payment">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { v: "cod", t: form.fulfilment === "pickup" ? "Cash at counter" : "Cash on delivery" },
                        { v: "upi", t: form.fulfilment === "pickup" ? "UPI at counter" : "UPI on delivery" },
                      ].map((p) => (
                        <button
                          key={p.v}
                          onClick={() => setForm({ ...form, payment: p.v })}
                          className={`rounded-lg border px-3 py-2.5 font-sign text-sm font-semibold uppercase tracking-wide transition ${
                            form.payment === p.v
                              ? "border-gold bg-gold text-asphalt"
                              : "border-cream/20 text-mist hover:border-gold/50"
                          }`}
                        >
                          {p.t}
                        </button>
                      ))}
                    </div>
                  </Field>
                  {error && (
                    <p className="rounded-lg border border-wine bg-wine/20 px-3 py-2 text-sm text-cream">{error}</p>
                  )}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-gold/15 px-5 py-4">
                <div className="space-y-1 text-sm">
                  <Row label="Subtotal" value={`₹${subtotal}`} />
                  <Row
                    label={form.fulfilment === "pickup" ? "Pickup" : "Delivery"}
                    value={form.fulfilment === "pickup" ? "Free — collect from us" : delivery === 0 ? "Free" : `₹${delivery}`}
                  />
                  {form.fulfilment === "delivery" && subtotal < 499 && (
                    <p className="text-xs text-mist">Add ₹{499 - subtotal} more for free delivery.</p>
                  )}
                  <div className="road-line my-2 opacity-30" />
                  <Row label="Total" value={`₹${subtotal + delivery}`} bold />
                </div>
                <button
                  onClick={() => (checkout ? placeOrder() : (setCheckout(true), setError("")))}
                  disabled={placing}
                  className="mt-4 w-full rounded-xl bg-gold py-3.5 font-sign text-base font-bold uppercase tracking-wider text-asphalt transition hover:bg-cream disabled:opacity-60"
                >
                  {placing ? "Placing your order…" : checkout ? `Place order • ₹${subtotal + delivery}` : "Checkout →"}
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* ---------- footer ---------- */}
      <footer className="border-t border-gold/15 bg-tar">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:grid-cols-3">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="mb-2 h-16 w-auto" aria-hidden />
            <p className="font-display text-lg font-bold text-gold">Highway Heaven</p>
            <p className="mt-2 text-sm leading-relaxed text-mist">
              Baghar Road, near J.S. Group Medical College,
              <br />
              Farrukhabad, Uttar Pradesh 209602
            </p>
            <a href={MAPS_URL} target="_blank" rel="noreferrer" className="mt-2 inline-block font-sign text-sm font-semibold uppercase tracking-wider text-gold hover:text-cream">
              Open in Google Maps →
            </a>
          </div>
          <div>
            <p className="font-sign text-sm font-bold uppercase tracking-[0.25em] text-cream">Hours</p>
            <p className="mt-2 text-sm text-mist">Open every day<br />10:00 AM – 10:00 PM</p>
            <p className="mt-3 font-sign text-sm font-bold uppercase tracking-[0.25em] text-cream">Call</p>
            <a href={`tel:${PHONE}`} className="mt-1 inline-block text-sm text-gold hover:text-cream">
              +91 83189 17038
            </a>
            <br />
            <a href={WHATSAPP} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm text-gold hover:text-cream">
              Order on WhatsApp →
            </a>
          </div>
          <div>
            <p className="font-sign text-sm font-bold uppercase tracking-[0.25em] text-cream">Track an order</p>
            <TrackBox />
          </div>
        </div>
        <div className="road-line opacity-30" />
        <p className="px-4 py-5 text-center font-display text-sm italic text-mist">
          Good Food<span className="slogan-dot" />Good Mood<span className="slogan-dot" />Great Time
          <span className="mt-1 block font-sign text-xs not-italic uppercase tracking-[0.3em]">Rated 4.7★ on Google • Farrukhabad</span>
        </p>
      </footer>
    </div>
  );
}

/* ---------- small pieces ---------- */

const inputCls =
  "w-full rounded-lg border border-cream/20 bg-asphalt px-3 py-2.5 text-cream placeholder:text-mist/60 outline-none focus:border-gold";

function catId(c: string) {
  return "cat-" + c.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function Stepper({ qty, onChange, small }: { qty: number; onChange: (d: number) => void; small?: boolean }) {
  const cls = small ? "h-7 w-7 text-sm" : "h-8 w-9 text-base";
  return (
    <span className="inline-flex items-center overflow-hidden rounded-lg border border-gold/50">
      <button onClick={() => onChange(-1)} className={`${cls} bg-gravel font-bold text-gold hover:bg-gold hover:text-asphalt`} aria-label="Remove one">
        −
      </button>
      <span className={`${small ? "w-7" : "w-9"} text-center font-sign font-bold text-cream`}>{qty}</span>
      <button onClick={() => onChange(1)} className={`${cls} bg-gravel font-bold text-gold hover:bg-gold hover:text-asphalt`} aria-label="Add one">
        +
      </button>
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-sign text-xs font-bold uppercase tracking-[0.2em] text-mist">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-sign text-lg font-bold text-gold" : "text-mist"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function TrackBox() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    try {
      setRecent(JSON.parse(window.localStorage.getItem("hh-orders") || "[]"));
    } catch {}
  }, []);
  return (
    <div className="mt-2">
      <div className="flex gap-2">
        <input
          className={inputCls}
          placeholder="Order ID e.g. HH-AB12CDE"
          value={id}
          onChange={(e) => setId(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && id && router.push(`/order/${id.trim()}`)}
        />
        <button
          onClick={() => id && router.push(`/order/${id.trim()}`)}
          className="rounded-lg border border-gold/50 px-4 font-sign text-sm font-bold uppercase text-gold hover:bg-gold hover:text-asphalt"
        >
          Go
        </button>
      </div>
      {recent.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {recent.map((r) => (
            <a key={r} href={`/order/${r}`} className="rounded border border-cream/20 px-2 py-1 text-xs text-mist hover:border-gold hover:text-gold">
              {r}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
