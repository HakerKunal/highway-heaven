"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Dish, Order, OrderStatus } from "@/lib/store";

const STATUS_LABEL: Record<OrderStatus, string> = {
  placed: "New",
  confirmed: "Confirmed",
  preparing: "Cooking",
  out: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
const PICKUP_STATUS_LABEL: Record<OrderStatus, string> = {
  ...STATUS_LABEL,
  out: "Ready for pickup",
  delivered: "Picked up",
};
const labelFor = (o: Order, s: OrderStatus) =>
  (o.fulfilment === "pickup" ? PICKUP_STATUS_LABEL : STATUS_LABEL)[s];
const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  placed: "confirmed",
  confirmed: "preparing",
  preparing: "out",
  out: "delivered",
};

const inputCls =
  "w-full rounded-lg border border-cream/20 bg-asphalt px-3 py-2.5 text-cream placeholder:text-mist/60 outline-none focus:border-gold";

export default function Admin() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setToken(window.localStorage.getItem("hh-admin-token"));
    } catch {}
    setReady(true);
  }, []);

  function onLogin(t: string) {
    try {
      window.localStorage.setItem("hh-admin-token", t);
    } catch {}
    setToken(t);
  }
  function logout() {
    try {
      window.localStorage.removeItem("hh-admin-token");
    } catch {}
    setToken(null);
  }

  if (!ready) return null;
  return (
    <div className="asphalt-texture min-h-screen">
      <header className="border-b border-gold/15 bg-asphalt/95">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <Link href="/" className="font-display text-lg font-bold text-gold">
              Highway Heaven
            </Link>
            <span className="ml-3 rounded bg-wine px-2 py-0.5 font-sign text-xs font-bold uppercase tracking-wider text-cream">
              Admin
            </span>
          </div>
          {token && (
            <button
              onClick={logout}
              className="rounded-lg border border-cream/20 px-4 py-1.5 font-sign text-sm font-semibold uppercase text-mist hover:border-gold hover:text-gold"
            >
              Log out
            </button>
          )}
        </div>
      </header>
      {token ? <Dashboard token={token} onAuthFail={logout} /> : <Login onLogin={onLogin} />}
    </div>
  );
}

/* ---------------- login ---------------- */

function Login({ onLogin }: { onLogin: (t: string) => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      onLogin(data.token);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-24">
      <div className="rounded-xl border border-cream/10 bg-tar p-6 shadow-card">
        <h1 className="font-display text-2xl font-bold text-gold">Owner login</h1>
        <p className="mt-1 text-sm text-mist">Enter the admin password to manage the menu and orders.</p>
        <input
          type="password"
          className={`${inputCls} mt-5`}
          placeholder="Admin password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        {err && <p className="mt-2 text-sm text-wine">{err}</p>}
        <button
          onClick={submit}
          disabled={busy || !pw}
          className="mt-4 w-full rounded-xl bg-gold py-3 font-sign font-bold uppercase tracking-wider text-asphalt hover:bg-cream disabled:opacity-60"
        >
          {busy ? "Checking…" : "Open dashboard"}
        </button>
      </div>
    </main>
  );
}

/* ---------------- dashboard ---------------- */

function Dashboard({ token, onAuthFail }: { token: string; onAuthFail: () => void }) {
  const [tab, setTab] = useState<"orders" | "menu">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [persistent, setPersistent] = useState(true);

  const authed = useCallback(
    (url: string, init: RequestInit = {}) =>
      fetch(url, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init.headers || {}) } }),
    [token]
  );

  const loadOrders = useCallback(async () => {
    const res = await authed("/api/orders");
    if (res.status === 401) return onAuthFail();
    const data = await res.json();
    setOrders(data.orders || []);
    setPersistent(data.persistent);
  }, [authed, onAuthFail]);

  const loadMenu = useCallback(async () => {
    const res = await fetch("/api/menu", { cache: "no-store" });
    const data = await res.json();
    setMenu(data.menu || []);
    setCategories(data.categories || []);
  }, []);

  useEffect(() => {
    loadOrders();
    loadMenu();
    const t = setInterval(loadOrders, 15000);
    return () => clearInterval(t);
  }, [loadOrders, loadMenu]);

  const newCount = orders.filter((o) => o.status === "placed").length;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      {!persistent && (
        <p className="mb-6 rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-cream">
          <strong className="text-gold">Heads up:</strong> the site is running on temporary storage, so menu changes and
          orders can reset when the server restarts. Connect a free Upstash Redis database on Vercel (Storage tab) to
          make everything permanent — instructions are in the README.
        </p>
      )}

      <div className="mb-6 flex gap-2">
        <TabBtn active={tab === "orders"} onClick={() => setTab("orders")}>
          Orders{newCount > 0 && <span className="ml-2 rounded-full bg-wine px-2 py-0.5 text-xs">{newCount} new</span>}
        </TabBtn>
        <TabBtn active={tab === "menu"} onClick={() => setTab("menu")}>
          Menu ({menu.length})
        </TabBtn>
      </div>

      {tab === "orders" ? (
        <OrdersBoard orders={orders} authed={authed} reload={loadOrders} />
      ) : (
        <MenuManager menu={menu} categories={categories} authed={authed} reload={loadMenu} />
      )}
    </main>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`chip-stone border px-5 py-2 font-sign font-bold uppercase tracking-wider transition ${
        active ? "border-gold bg-gold text-asphalt" : "border-cream/20 text-mist hover:border-gold/60 hover:text-gold"
      }`}
    >
      {children}
    </button>
  );
}

/* ---------------- orders ---------------- */

function OrdersBoard({
  orders,
  authed,
  reload,
}: {
  orders: Order[];
  authed: (u: string, i?: RequestInit) => Promise<Response>;
  reload: () => void;
}) {
  const [busyId, setBusyId] = useState("");

  async function setStatus(id: string, status: OrderStatus) {
    setBusyId(id);
    await authed(`/api/orders/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    await reload();
    setBusyId("");
  }

  if (!orders.length)
    return (
      <div className="rounded-xl border border-cream/10 bg-tar py-20 text-center">
        <p className="font-sign text-lg uppercase tracking-[0.25em] text-mist">No orders yet</p>
        <p className="mt-2 text-sm text-mist">New orders will appear here automatically.</p>
      </div>
    );

  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <div key={o.id} className="rounded-xl border border-cream/10 bg-tar p-4 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-sign text-lg font-bold text-gold">
                {o.id}
                <span
                  className={`ml-2 rounded px-2 py-0.5 align-middle font-sign text-[0.65rem] font-bold uppercase tracking-wider ${
                    o.fulfilment === "pickup" ? "bg-gold text-asphalt" : "bg-gravel text-cream"
                  }`}
                >
                  {o.fulfilment === "pickup" ? "🥡 Pickup" : "🛵 Delivery"}
                </span>
              </p>
              <p className="text-xs text-mist">
                {new Date(o.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} •{" "}
                {o.payment === "upi" ? "UPI" : "Cash"} {o.fulfilment === "pickup" ? "at counter" : "on delivery"}
              </p>
            </div>
            <span
              className={`rounded px-3 py-1 font-sign text-xs font-bold uppercase tracking-wider ${
                o.status === "delivered"
                  ? "bg-signgreen text-cream"
                  : o.status === "cancelled"
                  ? "bg-wine text-cream"
                  : o.status === "placed"
                  ? "bg-gold text-asphalt"
                  : "bg-gravel text-gold"
              }`}
            >
              {labelFor(o, o.status)}
            </span>
          </div>

          <ul className="mt-3 space-y-1 text-sm text-cream">
            {o.items.map((it) => (
              <li key={it.dishId}>
                {it.qty} × {it.name} <span className="text-mist">— ₹{it.price * it.qty}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 font-sign font-bold text-gold">Total ₹{o.total}</p>
          <p className="mt-2 text-sm text-mist">
            <span className="text-cream">{o.name}</span> • <a href={`tel:${o.phone}`} className="text-gold">{o.phone}</a>
            {o.fulfilment !== "pickup" && (
              <>
                <br />
                {o.address}
              </>
            )}
            {o.note && (
              <>
                <br />
                <span className="italic">Note: "{o.note}"</span>
              </>
            )}
          </p>

          {o.status !== "delivered" && o.status !== "cancelled" && (
            <div className="mt-4 flex flex-wrap gap-2">
              {NEXT[o.status] && (
                <button
                  onClick={() => setStatus(o.id, NEXT[o.status]!)}
                  disabled={busyId === o.id}
                  className="rounded-lg bg-gold px-4 py-2 font-sign text-sm font-bold uppercase tracking-wider text-asphalt hover:bg-cream disabled:opacity-60"
                >
                  Mark {labelFor(o, NEXT[o.status]!).toLowerCase()} →
                </button>
              )}
              <button
                onClick={() => setStatus(o.id, "cancelled")}
                disabled={busyId === o.id}
                className="rounded-lg border border-wine px-4 py-2 font-sign text-sm font-bold uppercase tracking-wider text-wine hover:bg-wine hover:text-cream disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------------- menu manager ---------------- */

type Draft = {
  id?: string;
  name: string;
  desc: string;
  price: string;
  category: string;
  veg: boolean;
  available: boolean;
  bestseller: boolean;
  image: string;
};

const emptyDraft = (cat: string): Draft => ({
  name: "",
  desc: "",
  price: "",
  category: cat,
  veg: true,
  available: true,
  bestseller: false,
  image: "",
});

function MenuManager({
  menu,
  categories,
  authed,
  reload,
}: {
  menu: Dish[];
  categories: string[];
  authed: (u: string, i?: RequestInit) => Promise<Response>;
  reload: () => void;
}) {
  const allCats = useMemo(
    () => Array.from(new Set([...categories, ...menu.map((m) => m.category)])),
    [categories, menu]
  );
  const [draft, setDraft] = useState<Draft | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!draft) return;
    setBusy(true);
    setErr("");
    try {
      const payload = { ...draft, price: Number(draft.price) };
      const res = await authed("/api/menu", {
        method: draft.id ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save the dish");
      setDraft(null);
      await reload();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(d: Dish) {
    await authed("/api/menu", { method: "PUT", body: JSON.stringify({ id: d.id, available: !d.available }) });
    reload();
  }

  async function remove(d: Dish) {
    if (!window.confirm(`Delete "${d.name}" from the menu? This can't be undone.`)) return;
    await authed(`/api/menu?id=${encodeURIComponent(d.id)}`, { method: "DELETE" });
    reload();
  }

  return (
    <div>
      <button
        onClick={() => {
          setErr("");
          setDraft(emptyDraft(allCats[0] || "Starters"));
        }}
        className="mb-6 rounded-xl bg-gold px-6 py-3 font-sign font-bold uppercase tracking-wider text-asphalt hover:bg-cream"
      >
        + Add a new dish
      </button>

      {draft && (
        <div className="mb-8 rounded-xl border border-gold/40 bg-tar p-5 shadow-card">
          <h3 className="font-display text-xl font-bold text-gold">{draft.id ? "Edit dish" : "New dish"}</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Dish name">
              <input className={inputCls} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Tandoori Momos" />
            </Field>
            <Field label="Price (₹)">
              <input className={inputCls} value={draft.price} inputMode="numeric" onChange={(e) => setDraft({ ...draft, price: e.target.value.replace(/[^\d]/g, "") })} placeholder="e.g. 180" />
            </Field>
            <Field label="Category">
              <div className="flex gap-2">
                <select className={inputCls} value={allCats.includes(draft.category) ? draft.category : "__new"} onChange={(e) => setDraft({ ...draft, category: e.target.value === "__new" ? "" : e.target.value })}>
                  {allCats.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="__new">+ New category…</option>
                </select>
              </div>
              {!allCats.includes(draft.category) && (
                <input className={`${inputCls} mt-2`} value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} placeholder="Type the new category name" />
              )}
            </Field>
            <Field label="Photo URL (optional)">
              <input className={inputCls} value={draft.image} onChange={(e) => setDraft({ ...draft, image: e.target.value })} placeholder="https://…" />
            </Field>
            <Field label="Description" full>
              <textarea className={`${inputCls} min-h-[70px] resize-none`} value={draft.desc} onChange={(e) => setDraft({ ...draft, desc: e.target.value })} placeholder="One tasty line about this dish" />
            </Field>
          </div>
          <div className="mt-4 flex flex-wrap gap-4">
            <Toggle label="Vegetarian" on={draft.veg} set={(v) => setDraft({ ...draft, veg: v })} />
            <Toggle label="Available today" on={draft.available} set={(v) => setDraft({ ...draft, available: v })} />
            <Toggle label="Bestseller tag" on={draft.bestseller} set={(v) => setDraft({ ...draft, bestseller: v })} />
          </div>
          {err && <p className="mt-3 text-sm text-wine">{err}</p>}
          <div className="mt-5 flex gap-3">
            <button onClick={save} disabled={busy} className="rounded-xl bg-gold px-6 py-2.5 font-sign font-bold uppercase tracking-wider text-asphalt hover:bg-cream disabled:opacity-60">
              {busy ? "Saving…" : "Save dish"}
            </button>
            <button onClick={() => setDraft(null)} className="rounded-xl border border-cream/20 px-6 py-2.5 font-sign font-semibold uppercase tracking-wider text-mist hover:border-gold hover:text-gold">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {menu.map((d) => (
          <div key={d.id} className={`flex flex-wrap items-center gap-3 rounded-xl border border-cream/10 bg-tar p-4 ${!d.available ? "opacity-60" : ""}`}>
            <span className={`fssai ${d.veg ? "veg" : "nonveg"}`} />
            <div className="min-w-0 flex-1">
              <p className="font-sign font-bold text-cream">
                {d.name} <span className="text-gold">₹{d.price}</span>
                {d.bestseller && <span className="ml-2 rounded bg-wine px-1.5 py-0.5 text-[0.6rem] font-bold uppercase text-cream">★</span>}
              </p>
              <p className="text-xs text-mist">{d.category}{d.desc ? ` — ${d.desc}` : ""}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => toggle(d)} className={`rounded-lg border px-3 py-1.5 font-sign text-xs font-bold uppercase tracking-wider ${d.available ? "border-signgreen text-signgreen" : "border-mist text-mist"}`}>
                {d.available ? "In stock" : "Sold out"}
              </button>
              <button
                onClick={() => {
                  setErr("");
                  setDraft({ id: d.id, name: d.name, desc: d.desc, price: String(d.price), category: d.category, veg: d.veg, available: d.available, bestseller: !!d.bestseller, image: d.image || "" });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="rounded-lg border border-gold/50 px-3 py-1.5 font-sign text-xs font-bold uppercase tracking-wider text-gold hover:bg-gold hover:text-asphalt"
              >
                Edit
              </button>
              <button onClick={() => remove(d)} className="rounded-lg border border-wine px-3 py-1.5 font-sign text-xs font-bold uppercase tracking-wider text-wine hover:bg-wine hover:text-cream">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 block font-sign text-xs font-bold uppercase tracking-[0.2em] text-mist">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ label, on, set }: { label: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <button
      onClick={() => set(!on)}
      className={`rounded-lg border px-4 py-2 font-sign text-sm font-bold uppercase tracking-wider transition ${
        on ? "border-gold bg-gold/15 text-gold" : "border-cream/20 text-mist"
      }`}
    >
      {on ? "✓ " : ""}{label}
    </button>
  );
}
