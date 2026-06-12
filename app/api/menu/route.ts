import { NextResponse } from "next/server";
import { getMenu, saveMenu, persistent, type Dish, CATEGORIES } from "@/lib/store";
import { isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const menu = await getMenu();
  return NextResponse.json({ menu, categories: CATEGORIES });
}

// Admin: add a dish
export async function POST(req: Request) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const err = validate(body);
  if (err) return NextResponse.json({ error: err }, { status: 400 });
  const menu = await getMenu();
  const dish: Dish = {
    id: "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    name: String(body.name).trim(),
    desc: String(body.desc || "").trim(),
    price: Math.round(Number(body.price)),
    category: String(body.category).trim(),
    veg: !!body.veg,
    available: body.available !== false,
    bestseller: !!body.bestseller,
    image: body.image ? String(body.image).trim() : undefined,
  };
  menu.push(dish);
  await saveMenu(menu);
  return NextResponse.json({ dish, persistent });
}

// Admin: update a dish ({ id, ...fields })
export async function PUT(req: Request) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "Missing dish id" }, { status: 400 });
  const menu = await getMenu();
  const idx = menu.findIndex((d) => d.id === body.id);
  if (idx === -1) return NextResponse.json({ error: "Dish not found" }, { status: 404 });
  const cur = menu[idx];
  const updated = {
    ...cur,
    ...(body.name !== undefined && { name: String(body.name).trim() }),
    ...(body.desc !== undefined && { desc: String(body.desc).trim() }),
    ...(body.price !== undefined && { price: Math.round(Number(body.price)) }),
    ...(body.category !== undefined && { category: String(body.category).trim() }),
    ...(body.veg !== undefined && { veg: !!body.veg }),
    ...(body.available !== undefined && { available: !!body.available }),
    ...(body.bestseller !== undefined && { bestseller: !!body.bestseller }),
    ...(body.image !== undefined && { image: body.image ? String(body.image).trim() : undefined }),
  };
  if (!updated.name || !Number.isFinite(updated.price) || updated.price <= 0) {
    return NextResponse.json({ error: "Invalid name or price" }, { status: 400 });
  }
  menu[idx] = updated;
  await saveMenu(menu);
  return NextResponse.json({ dish: updated });
}

// Admin: delete a dish (?id=)
export async function DELETE(req: Request) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing dish id" }, { status: 400 });
  const menu = await getMenu();
  const next = menu.filter((d) => d.id !== id);
  if (next.length === menu.length) return NextResponse.json({ error: "Dish not found" }, { status: 404 });
  await saveMenu(next);
  return NextResponse.json({ ok: true });
}

function validate(body: any): string | null {
  if (!body) return "Missing body";
  if (!body.name || !String(body.name).trim()) return "Dish name is required";
  const price = Number(body.price);
  if (!Number.isFinite(price) || price <= 0) return "Price must be a positive number";
  if (!body.category || !String(body.category).trim()) return "Category is required";
  return null;
}
