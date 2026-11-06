"use client";

import Image from "next/image";
import { useState } from "react";
import type { Dish, Extra, SpiceLevel } from "@/data/types";
import { formatNPR } from "@/lib/format";
import { extraTotal, spiceLabel, useStore } from "@/lib/store";

export function CustomizeModal({
  dish,
  onClose,
}: {
  dish: Dish;
  onClose: () => void;
}) {
  const { addToCart } = useStore();
  const [spice, setSpice] = useState<SpiceLevel>("medium");
  const [picked, setPicked] = useState<Extra[]>([]);
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const unit = dish.price + extraTotal(picked);

  function toggle(extra: Extra) {
    setPicked((p) =>
      p.some((x) => x.id === extra.id)
        ? p.filter((x) => x.id !== extra.id)
        : [...p, extra],
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6">
      <button className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto bg-paper shadow-2xl">
        <div className="relative h-48">
          <Image src={dish.image} alt="" fill className="object-cover" />
        </div>
        <div className="p-6">
          <p className="font-deva text-crimson">{dish.nepaliName}</p>
          <h2 className="font-display text-3xl">{dish.name}</h2>
          <p className="mt-2 text-sm text-muted">{dish.description}</p>

          <p className="mt-6 text-xs uppercase tracking-[0.2em] text-navy">Heat</p>
          <div className="mt-2 flex gap-2">
            {(["mild", "medium", "hot"] as SpiceLevel[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpice(s)}
                className={`flex-1 border px-2 py-2 text-sm ${
                  spice === s
                    ? "border-crimson bg-crimson text-white"
                    : "border-sand"
                }`}
              >
                {spiceLabel(s)}
              </button>
            ))}
          </div>

          {dish.extras.length > 0 && (
            <>
              <p className="mt-6 text-xs uppercase tracking-[0.2em] text-navy">
                Add-ons
              </p>
              <ul className="mt-2 divide-y divide-sand">
                {dish.extras.map((ex) => {
                  const on = picked.some((p) => p.id === ex.id);
                  return (
                    <li key={ex.id} className="flex items-center justify-between py-2.5">
                      <span>{ex.name}</span>
                      <button
                        type="button"
                        onClick={() => toggle(ex)}
                        className={`text-sm ${on ? "text-crimson" : "text-navy"}`}
                      >
                        {on ? "Added" : `+ ${formatNPR(ex.price)}`}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          <label className="mt-5 block text-xs uppercase tracking-[0.2em] text-navy">
            Kitchen note
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-2 w-full border border-sand bg-cream px-3 py-2 text-sm normal-case tracking-normal text-ink"
              placeholder="Less oil, extra achar…"
            />
          </label>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center border border-sand">
              <button type="button" className="px-3 py-2" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                –
              </button>
              <span className="w-8 text-center">{qty}</span>
              <button type="button" className="px-3 py-2" onClick={() => setQty((q) => q + 1)}>
                +
              </button>
            </div>
            <button
              type="button"
              className="flex-1 bg-crimson py-3 text-sm tracking-wide text-white"
              onClick={() => {
                addToCart({
                  dishId: dish.id,
                  restaurantId: dish.restaurantId,
                  name: dish.name,
                  image: dish.image,
                  unitPrice: dish.price,
                  quantity: qty,
                  spice,
                  extras: picked,
                  notes,
                });
                onClose();
              }}
            >
              Add · {formatNPR(unit * qty)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
