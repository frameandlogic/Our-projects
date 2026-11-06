"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { restaurantById } from "@/data/catalog";
import type { OrderStatus } from "@/data/types";
import { formatNPR } from "@/lib/format";
import { extraTotal, useStore } from "@/lib/store";

const steps: { id: OrderStatus; label: string; detail: string }[] = [
  { id: "placed", label: "Order received", detail: "The kitchen has the ticket." },
  { id: "preparing", label: "On the flame", detail: "Steamers, woks, and charcoal at work." },
  { id: "picked", label: "In the doko", detail: "A rider has collected your plates." },
  { id: "nearby", label: "Crossing the tole", detail: "Almost at your gate." },
  { id: "delivered", label: "At your door", detail: "Khana has arrived. Enjoy." },
];

function statusFromAge(ms: number): OrderStatus {
  if (ms > 8 * 60_000) return "delivered";
  if (ms > 5 * 60_000) return "nearby";
  if (ms > 3 * 60_000) return "picked";
  if (ms > 60_000) return "preparing";
  return "placed";
}

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const { orders } = useStore();
  const order = orders.find((o) => o.id === id);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 4000);
    return () => clearInterval(t);
  }, []);

  const status = useMemo(() => {
    if (!order || now === null) return "placed" as OrderStatus;
    return statusFromAge(now - new Date(order.createdAt).getTime());
  }, [order, now]);

  const idx = steps.findIndex((s) => s.id === status);
  const etaLeft =
    order && now !== null
      ? Math.max(
          0,
          order.etaMins - Math.floor((now - new Date(order.createdAt).getTime()) / 60000),
        )
      : order?.etaMins ?? 0;

  if (!order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-3xl">No order with that number</h1>
        <Link href="/profile" className="mt-4 inline-block text-crimson">
          See order history
        </Link>
      </div>
    );
  }

  const houses = order.restaurantIds
    .map((rid) => restaurantById(rid)?.name)
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <p className="text-[11px] uppercase tracking-[0.28em] text-navy">Live trail</p>
      <h1 className="font-display mt-2 text-4xl">Order {order.id}</h1>
      <p className="mt-2 text-muted">
        From {houses}.{" "}
        {status === "delivered"
          ? "Delivered."
          : `About ${etaLeft} min remaining.`}
      </p>

      <div className="relative mt-12 overflow-hidden bg-navy-ink px-6 py-10 text-white">
        <svg className="absolute bottom-0 left-0 w-full text-white/10" viewBox="0 0 400 80">
          <path fill="currentColor" d="M0 80L40 40L90 62L140 20L200 55L260 18L320 50L400 28V80H0Z" />
        </svg>
        <p className="relative text-sm text-white/70">Estimated arrival</p>
        <p className="relative font-display text-5xl">
          {status === "delivered" ? "Here" : `${etaLeft} min`}
        </p>
        <p className="relative mt-2 flex items-center gap-2 text-sm">
          <span className="live-dot inline-block h-2 w-2 rounded-full bg-crimson" />
          {steps[idx]?.detail}
        </p>
      </div>

      <ol className="mt-10 space-y-0">
        {steps.map((s, i) => {
          const done = i <= idx;
          return (
            <li key={s.id} className="grid grid-cols-[20px_1fr] gap-4">
              <div className="flex flex-col items-center">
                <span
                  className={`h-3 w-3 rounded-full ${done ? "bg-crimson" : "bg-sand"}`}
                />
                {i < steps.length - 1 && (
                  <span className={`w-px flex-1 ${done ? "bg-crimson/50" : "bg-sand"}`} />
                )}
              </div>
              <div className={`pb-8 ${done ? "text-ink" : "text-stone"}`}>
                <p className="font-medium">{s.label}</p>
                <p className="text-sm">{s.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <section className="border-t border-sand pt-8">
        <h2 className="font-display text-2xl">In this doko</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {order.items.map((i) => (
            <li key={i.lineId} className="flex justify-between">
              <span>
                {i.quantity} × {i.name}
              </span>
              <span>{formatNPR((i.unitPrice + extraTotal(i.extras)) * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex justify-between font-medium">
          <span>Paid · {order.payment}</span>
          <span>{formatNPR(order.total)}</span>
        </p>
        <p className="mt-4 text-sm text-muted">
          {order.address.label}: {order.address.line}, {order.address.area}
        </p>
        {order.instructions && (
          <p className="mt-1 text-sm text-muted">Note: {order.instructions}</p>
        )}
      </section>
    </div>
  );
}
