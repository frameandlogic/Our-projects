"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DishCard, RestaurantCard } from "@/components/Cards";
import { CustomizeModal } from "@/components/CustomizeModal";
import { dishes, restaurants } from "@/data/catalog";
import type { Dish } from "@/data/types";

function SearchInner() {
  const params = useSearchParams();
  const router = useRouter();
  const q = params.get("q") ?? "";
  const [sort, setSort] = useState<"match" | "price" | "rating">("match");
  const [onlyVeg, setOnlyVeg] = useState(false);
  const [active, setActive] = useState<Dish | null>(null);
  const needle = q.trim().toLowerCase();

  const restHits = useMemo(() => {
    let list = restaurants.filter((r) => {
      if (!needle) return true;
      const blob = `${r.name} ${r.tagline} ${r.cuisines.join(" ")} ${r.area}`.toLowerCase();
      return blob.includes(needle);
    });
    if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [needle, sort]);

  const dishHits = useMemo(() => {
    let list = dishes.filter((d) => {
      if (onlyVeg && d.dietary === "nonveg") return false;
      if (!needle) return d.popular;
      const blob = `${d.name} ${d.nepaliName} ${d.description} ${d.category}`.toLowerCase();
      return blob.includes(needle);
    });
    if (sort === "price") list = [...list].sort((a, b) => a.price - b.price);
    return list;
  }, [needle, sort, onlyVeg]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <p className="text-[11px] uppercase tracking-[0.28em] text-navy">Search the doko</p>
      <h1 className="font-display mt-2 text-4xl md:text-5xl">
        {q ? `“${q}”` : "What are you hungry for?"}
      </h1>

      <form
        className="mt-6 flex flex-wrap gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const next = String(data.get("q") ?? "");
          router.push(`/search?q=${encodeURIComponent(next)}`);
        }}
      >
        <input
          name="q"
          defaultValue={q}
          className="min-w-[220px] flex-1 border border-sand bg-cream px-4 py-3 text-sm"
          placeholder="Try choila, thukpa, butter chicken…"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="border border-sand bg-paper px-3 py-3 text-sm"
        >
          <option value="match">Best match</option>
          <option value="price">Price · dishes</option>
          <option value="rating">Rating · kitchens</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyVeg} onChange={(e) => setOnlyVeg(e.target.checked)} />
          Veg dishes
        </label>
      </form>

      <section className="mt-12">
        <h2 className="font-display text-2xl">Kitchens</h2>
        <div className="mt-4">
          {restHits.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} layout="row" />
          ))}
          {restHits.length === 0 && <p className="text-muted">No restaurants matched.</p>}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl">Plates</h2>
        {dishHits.map((d) => (
          <DishCard key={d.id} dish={d} onAdd={() => setActive(d)} />
        ))}
        {dishHits.length === 0 && <p className="mt-4 text-muted">No dishes matched.</p>}
      </section>

      {active && <CustomizeModal dish={active} onClose={() => setActive(null)} />}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="p-8">Searching…</p>}>
      <SearchInner />
    </Suspense>
  );
}
