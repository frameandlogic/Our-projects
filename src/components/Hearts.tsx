"use client";

import { useStore } from "@/lib/store";

export function HeartButton({
  kind,
  id,
  className = "",
}: {
  kind: "restaurant" | "dish";
  id: string;
  className?: string;
}) {
  const { favorites, toggleFavRestaurant, toggleFavDish } = useStore();
  const on =
    kind === "restaurant"
      ? favorites.restaurants.includes(id)
      : favorites.dishes.includes(id);

  return (
    <button
      type="button"
      aria-label={on ? "Remove favourite" : "Save favourite"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (kind === "restaurant") toggleFavRestaurant(id);
        else toggleFavDish(id);
      }}
      className={`inline-flex h-9 w-9 items-center justify-center bg-white/90 text-lg ${className}`}
    >
      <span className={on ? "text-crimson" : "text-stone"}>{on ? "♥" : "♡"}</span>
    </button>
  );
}
