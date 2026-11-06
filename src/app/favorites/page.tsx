"use client";

import { useState } from "react";
import { DishCard, RestaurantCard } from "@/components/Cards";
import { CustomizeModal } from "@/components/CustomizeModal";
import { dishById, restaurantById } from "@/data/catalog";
import type { Dish } from "@/data/types";
import { useStore } from "@/lib/store";

export default function FavoritesPage() {
  const { favorites } = useStore();
  const [tab, setTab] = useState<"kitchens" | "plates">("kitchens");
  const [active, setActive] = useState<Dish | null>(null);
  const kitchens = favorites.restaurants
    .map((id) => restaurantById(id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));
  const plates = favorites.dishes
    .map((id) => dishById(id))
    .filter((d): d is Dish => Boolean(d));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <p className="text-[11px] uppercase tracking-[0.28em] text-navy">Kept aside</p>
      <h1 className="font-display mt-2 text-4xl md:text-5xl">Favorites</h1>
      <div className="mt-6 flex gap-6 border-b border-sand text-sm">
        <button
          type="button"
          onClick={() => setTab("kitchens")}
          className={`pb-3 ${tab === "kitchens" ? "border-b-2 border-crimson text-crimson" : "text-muted"}`}
        >
          Kitchens ({kitchens.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("plates")}
          className={`pb-3 ${tab === "plates" ? "border-b-2 border-crimson text-crimson" : "text-muted"}`}
        >
          Plates ({plates.length})
        </button>
      </div>

      {tab === "kitchens" && (
        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          {kitchens.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
          {kitchens.length === 0 && (
            <p className="text-muted">Tap the heart on a restaurant to keep it here.</p>
          )}
        </div>
      )}

      {tab === "plates" && (
        <div className="mt-4">
          {plates.map((d) => (
            <DishCard key={d.id} dish={d} onAdd={() => setActive(d)} />
          ))}
          {plates.length === 0 && (
            <p className="mt-6 text-muted">Save a dish from any menu and it will land here.</p>
          )}
        </div>
      )}

      {active && <CustomizeModal dish={active} onClose={() => setActive(null)} />}
    </div>
  );
}
