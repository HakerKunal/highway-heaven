import { Redis } from "@upstash/redis";
import { seedMenu, MENU_CATEGORIES } from "./menu-data";

export type Dish = {
  id: string;
  name: string;
  desc: string;
  price: number;
  category: string;
  veg: boolean;
  available: boolean;
  bestseller?: boolean;
  image?: string;
};

export type OrderStatus = "placed" | "confirmed" | "preparing" | "out" | "delivered" | "cancelled";

export type OrderItem = { dishId: string; name: string; price: number; qty: number };

export type Fulfilment = "delivery" | "pickup";

export type Order = {
  id: string;
  fulfilment: Fulfilment;
  items: OrderItem[];
  subtotal: number;
  delivery: number;
  total: number;
  name: string;
  phone: string;
  address: string;
  note?: string;
  payment: "cod" | "upi" | "online";
  paymentStatus?: "pending" | "paid";
  razorpayOrderId?: string;
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
};

export const CATEGORIES = MENU_CATEGORIES;

export const STATUS_FLOW: OrderStatus[] = ["placed", "confirmed", "preparing", "out", "delivered"];



/* ----------------------- storage ----------------------- */

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

export const persistent = !!redis;

type Mem = { menu: Dish[]; orders: Order[] };
const g = globalThis as unknown as { __hh?: Mem };
function mem(): Mem {
  if (!g.__hh) g.__hh = { menu: [...seedMenu], orders: [] };
  return g.__hh;
}

const MENU_KEY = "hh:menu";
const ORDERS_KEY = "hh:orders";

export async function getMenu(): Promise<Dish[]> {
  if (redis) {
    const data = await redis.get<Dish[]>(MENU_KEY);
    if (data && Array.isArray(data) && data.length) return data;
    await redis.set(MENU_KEY, seedMenu);
    return [...seedMenu];
  }
  return mem().menu;
}

export async function saveMenu(menu: Dish[]): Promise<void> {
  if (redis) {
    await redis.set(MENU_KEY, menu);
  } else {
    mem().menu = menu;
  }
}

export async function getOrders(): Promise<Order[]> {
  if (redis) {
    const data = await redis.get<Order[]>(ORDERS_KEY);
    return data && Array.isArray(data) ? data : [];
  }
  return mem().orders;
}

export async function saveOrders(orders: Order[]): Promise<void> {
  // keep a sane cap so the single key never grows unbounded
  const capped = orders.slice(-500);
  if (redis) {
    await redis.set(ORDERS_KEY, capped);
  } else {
    mem().orders = capped;
  }
}

export async function getOrder(id: string): Promise<Order | undefined> {
  const orders = await getOrders();
  return orders.find((o) => o.id === id);
}

export function newOrderId(): string {
  const t = Date.now().toString(36).slice(-4).toUpperCase();
  const r = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `HH-${t}${r}`;
}
