"use client";

import Link from "next/link";
import { FormEvent } from "react";
import { formatNPR } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function ProfilePage() {
  const { user, setUser, orders, location } = useStore();

  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setUser({
      ...user,
      name: String(data.get("name")),
      email: String(data.get("email")),
      phone: String(data.get("phone")),
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <div className="grid gap-8 bg-navy-ink text-white md:grid-cols-[280px_1fr]">
        <div className="dhaka p-8 text-ink">
          <p className="text-[11px] uppercase tracking-[0.28em] text-navy">Member card</p>
          <p className="font-deva mt-6 text-3xl text-crimson">डोको</p>
          <h1 className="font-display mt-2 text-4xl">{user.name}</h1>
          <p className="mt-6 text-sm">Delivering to {location}</p>
        </div>
        <form onSubmit={save} className="grid gap-4 p-8 sm:grid-cols-2">
          <label className="block text-sm">
            Name
            <input
              name="name"
              defaultValue={user.name}
              className="mt-1 w-full border border-white/20 bg-transparent px-3 py-2 text-white outline-none"
            />
          </label>
          <label className="block text-sm">
            Phone
            <input
              name="phone"
              defaultValue={user.phone}
              className="mt-1 w-full border border-white/20 bg-transparent px-3 py-2 text-white outline-none"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            Email
            <input
              name="email"
              defaultValue={user.email}
              className="mt-1 w-full border border-white/20 bg-transparent px-3 py-2 text-white outline-none"
            />
          </label>
          <button type="submit" className="bg-crimson px-4 py-2 text-sm sm:col-span-2">
            Save details
          </button>
        </form>
      </div>

      <section className="mt-14">
        <h2 className="font-display text-3xl">Saved addresses</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {user.addresses.map((a) => (
            <article key={a.id} className="border border-sand p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-navy">{a.label}</p>
              <p className="mt-2 font-medium">{a.line}</p>
              <p className="text-sm text-muted">
                {a.area}, {a.city}
              </p>
              <p className="mt-2 text-sm">{a.phone}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-3xl">Order history</h2>
        {orders.length === 0 && (
          <p className="mt-4 text-muted">
            No orders yet.{" "}
            <Link href="/explore" className="text-crimson">
              Start with a kitchen.
            </Link>
          </p>
        )}
        <ul className="mt-6 divide-y divide-sand">
          {orders.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="font-medium">{o.id}</p>
                <p className="text-sm text-muted">
                  {o.createdAt.slice(0, 10)} · {o.items.length} lines ·{" "}
                  {formatNPR(o.total)}
                </p>
              </div>
              <Link href={`/orders/${o.id}`} className="text-sm text-navy">
                Track →
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-10 text-sm">
        <Link href="/favorites" className="text-crimson">
          Open saved restaurants & dishes →
        </Link>
      </p>
    </div>
  );
}
