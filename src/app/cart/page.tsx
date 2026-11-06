"use client";

import Image from "next/image";
import Link from "next/link";
import { restaurantById } from "@/data/catalog";
import type { SpiceLevel } from "@/data/types";
import { formatNPR } from "@/lib/format";
import { extraTotal, spiceLabel, useStore } from "@/lib/store";

export default function CartPage() {
  const { cart, updateQty, updateLine, removeLine, subtotal, deliveryFee, total } = useStore();

  if (!cart.length) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="font-deva text-crimson">डोको खाली छ</p>
        <h1 className="font-display mt-2 text-4xl">Your doko is empty</h1>
        <p className="mt-3 text-muted">Fill it with momo, a thakali set, or morning sel roti.</p>
        <Link href="/explore" className="mt-8 inline-block bg-crimson px-6 py-3 text-sm text-white">
          Explore kitchens
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[1fr_340px] lg:px-6">
      <div>
        <h1 className="font-display text-4xl">Your doko</h1>
        <p className="mt-1 text-sm text-muted">
          {(() => {
            const n = cart.reduce((s, i) => s + i.quantity, 0);
            return `${n} ${n === 1 ? "item" : "items"} packed`;
          })()}
        </p>
        <ul className="mt-8 divide-y divide-sand">
          {cart.map((item) => {
            const house = restaurantById(item.restaurantId);
            const line = (item.unitPrice + extraTotal(item.extras)) * item.quantity;
            return (
              <li key={item.lineId} className="grid grid-cols-[96px_1fr] gap-4 py-6">
                <div className="relative h-24">
                  <Image src={item.image} alt="" fill className="object-cover" />
                </div>
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-navy">{house?.name}</p>
                      <h2 className="font-display text-2xl">{item.name}</h2>
                    </div>
                    <button type="button" className="text-xs text-stone" onClick={() => removeLine(item.lineId)}>
                      Remove
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(["mild", "medium", "hot"] as SpiceLevel[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => updateLine(item.lineId, { spice: s })}
                        className={`px-2 py-1 text-xs ${
                          item.spice === s ? "bg-navy text-white" : "bg-cream"
                        }`}
                      >
                        {spiceLabel(s)}
                      </button>
                    ))}
                  </div>
                  {item.extras.length > 0 && (
                    <p className="mt-2 text-xs text-muted">
                      {item.extras.map((e) => e.name).join(" · ")}
                    </p>
                  )}
                  <label className="mt-2 block text-xs text-stone">
                    Note
                    <input
                      value={item.notes}
                      onChange={(e) => updateLine(item.lineId, { notes: e.target.value })}
                      className="ml-2 border-b border-sand bg-transparent text-ink outline-none"
                    />
                  </label>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center border border-sand">
                      <button type="button" className="px-3 py-1" onClick={() => updateQty(item.lineId, item.quantity - 1)}>
                        –
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button type="button" className="px-3 py-1" onClick={() => updateQty(item.lineId, item.quantity + 1)}>
                        +
                      </button>
                    </div>
                    <span className="text-sm font-medium">{formatNPR(line)}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <aside className="bill-paper h-fit border border-sand p-6">
        <p className="text-xs uppercase tracking-[0.25em] text-navy">Kitchen bill</p>
        <h2 className="font-display mt-1 text-2xl">Estimate</h2>
        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatNPR(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Delivery</dt>
            <dd>{formatNPR(deliveryFee)}</dd>
          </div>
          <div className="flex justify-between border-t border-dashed border-navy/30 pt-3 font-medium">
            <dt>Total</dt>
            <dd>{formatNPR(total)}</dd>
          </div>
        </dl>
        <Link href="/checkout" className="mt-8 block bg-crimson py-3 text-center text-sm text-white">
          Continue to checkout
        </Link>
        <Link href="/explore" className="mt-3 block text-center text-sm text-navy">
          Add another kitchen
        </Link>
      </aside>
    </div>
  );
}
