"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { RestaurantCard } from "@/components/Cards";
import { restaurants } from "@/data/catalog";
import { Suspense } from "react";

const cuisines = ["All", "Thakali", "Newari", "Momo", "Tibetan", "Grill", "Street", "Indian", "Breakfast", "Chinese-Nepali"];
const diets = [
  { id: "any", label: "Any diet" },
  { id: "veg", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "jain", label: "Jain / satvik" },
  { id: "nonveg", label: "Non-veg" },
];

function ExploreInner() {
  const params = useSearchParams();
  const initialCuisine = params.get("cuisine") ?? "All";
  const [cuisine, setCuisine] = useState(
    cuisines.includes(initialCuisine) ? initialCuisine : "All",
  );
  const [price, setPrice] = useState<0 | 1 | 2 | 3>(0);
  const [rating, setRating] = useState(0);
  const [speed, setSpeed] = useState(false);
  const [diet, setDiet] = useState("any");

  const list = useMemo(() => {
    return restaurants.filter((r) => {
      if (cuisine !== "All" && r.cuisine !== cuisine && !r.cuisines.includes(cuisine)) {
        return false;
      }
      if (price && r.priceLevel > price) return false;
      if (rating && r.rating < rating) return false;
      if (speed && r.deliveryMins[1] > 35) return false;
      if (diet !== "any" && !r.dietary.includes(diet as never)) return false;
      return true;
    });
  }, [cuisine, price, rating, speed, diet]);

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:grid-cols-[240px_1fr] md:px-6">
      <aside>
        <p className="text-[11px] uppercase tracking-[0.28em] text-navy">Filter the valley</p>
        <h1 className="font-display mt-2 text-4xl">Explore</h1>
        <p className="mt-2 text-sm text-muted">{list.length} kitchens open for delivery</p>

        <fieldset className="mt-8">
          <legend className="text-xs uppercase tracking-[0.18em] text-stone">Cuisine</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {cuisines.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCuisine(c)}
                className={`px-3 py-1.5 text-sm ${
                  cuisine === c ? "bg-navy text-white" : "bg-cream text-ink"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-8">
          <legend className="text-xs uppercase tracking-[0.18em] text-stone">Price</legend>
          <div className="mt-3 flex gap-2">
            {([0, 1, 2, 3] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPrice(p)}
                className={`px-3 py-1.5 text-sm ${price === p ? "bg-crimson text-white" : "bg-cream"}`}
              >
                {p === 0 ? "Any" : "रु".repeat(p)}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-8">
          <legend className="text-xs uppercase tracking-[0.18em] text-stone">Rating</legend>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            {[0, 4.5, 4.7].map((n) => (
              <label key={n} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="rating"
                  checked={rating === n}
                  onChange={() => setRating(n)}
                />
                {n === 0 ? "All ratings" : `${n}+`}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="mt-8 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={speed} onChange={(e) => setSpeed(e.target.checked)} />
          Under 35 minutes
        </label>

        <fieldset className="mt-8">
          <legend className="text-xs uppercase tracking-[0.18em] text-stone">Dietary</legend>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            {diets.map((d) => (
              <label key={d.id} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="diet"
                  checked={diet === d.id}
                  onChange={() => setDiet(d.id)}
                />
                {d.label}
              </label>
            ))}
          </div>
        </fieldset>
      </aside>

      <div className="grid gap-10 sm:grid-cols-2">
        {list.map((r) => (
          <RestaurantCard key={r.id} restaurant={r} />
        ))}
        {list.length === 0 && (
          <p className="text-muted">No kitchens match those filters. Loosen a notch.</p>
        )}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<p className="p-8">Loading kitchens…</p>}>
      <ExploreInner />
    </Suspense>
  );
}
