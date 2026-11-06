"use client";

import Image from "next/image";
import Link from "next/link";
import { restaurants } from "@/data/catalog";
import type { Dish, Restaurant } from "@/data/types";
import { formatNPR, minsRange, priceMarks } from "@/lib/format";
import { HeartButton } from "./Hearts";

export function RestaurantCard({
  restaurant,
  layout = "grid",
}: {
  restaurant: Restaurant;
  layout?: "grid" | "row" | "featured";
}) {
  if (layout === "featured") {
    return (
      <Link href={`/restaurant/${restaurant.id}`} className="group relative block min-h-[340px] overflow-hidden">
        <Image
          src={restaurant.cover}
          alt={restaurant.name}
          fill
          sizes="(max-width: 768px) 100vw, 60vw"
          className="object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-ink/90 via-navy-ink/20 to-transparent" />
        <div className="absolute left-5 right-5 bottom-5 text-white">
          <p className="text-[11px] uppercase tracking-[0.25em] text-white/70">
            {restaurant.city} · {restaurant.cuisine}
          </p>
          <h3 className="font-display mt-1 text-3xl">{restaurant.name}</h3>
          <p className="mt-1 text-sm text-white/80">{restaurant.tagline}</p>
        </div>
        <HeartButton kind="restaurant" id={restaurant.id} className="absolute right-4 top-4" />
      </Link>
    );
  }

  if (layout === "row") {
    return (
      <Link
        href={`/restaurant/${restaurant.id}`}
        className="flex gap-4 border-b border-sand py-4 transition hover:bg-cream/60"
      >
        <div className="relative h-24 w-28 shrink-0 overflow-hidden">
          <Image src={restaurant.image} alt="" fill sizes="112px" className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-xl">{restaurant.name}</h3>
            <HeartButton kind="restaurant" id={restaurant.id} />
          </div>
          <p className="text-sm text-muted">{restaurant.tagline}</p>
          <p className="mt-2 text-xs text-stone">
            {restaurant.rating.toFixed(1)} · {minsRange(restaurant.deliveryMins)} ·{" "}
            {priceMarks(restaurant.priceLevel)}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/restaurant/${restaurant.id}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={restaurant.image}
          alt={restaurant.name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        {restaurant.offer && (
          <span className="absolute bottom-3 left-3 bg-crimson px-2 py-1 text-[11px] tracking-wide text-white">
            {restaurant.offer}
          </span>
        )}
        <HeartButton kind="restaurant" id={restaurant.id} className="absolute right-3 top-3" />
      </div>
      <div className="flex items-end justify-between gap-3 pt-3">
        <div>
          <h3 className="font-display text-xl leading-tight">{restaurant.name}</h3>
          <p className="mt-1 text-sm text-muted">
            {restaurant.cuisines.join(" · ")} · {restaurant.area}
          </p>
        </div>
        <p className="shrink-0 text-sm tabular-nums text-navy">{restaurant.rating.toFixed(1)}</p>
      </div>
      <p className="mt-1 text-xs text-stone">
        {minsRange(restaurant.deliveryMins)} · {priceMarks(restaurant.priceLevel)} ·{" "}
        {formatNPR(restaurant.deliveryFee)} delivery
      </p>
    </Link>
  );
}

export function DishCard({
  dish,
  onAdd,
}: {
  dish: Dish;
  onAdd?: () => void;
}) {
  const house = restaurants.find((r) => r.id === dish.restaurantId);
  return (
    <article className="grid grid-cols-[1fr_110px] gap-3 border-b border-sand py-5 md:grid-cols-[1fr_140px]">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-navy">
          {house?.name}
        </p>
        <h3 className="font-display mt-1 text-2xl leading-tight">
          {dish.name}
        </h3>
        <p className="font-deva text-sm text-crimson">{dish.nepaliName}</p>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
          {dish.description}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <span className="text-sm font-medium">{formatNPR(dish.price)}</span>
          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="border border-crimson px-3 py-1 text-xs uppercase tracking-wider text-crimson transition hover:bg-crimson hover:text-white"
            >
              Add
            </button>
          )}
          <HeartButton kind="dish" id={dish.id} />
        </div>
      </div>
      <div className="relative h-28 overflow-hidden md:h-32">
        <Image src={dish.image} alt="" fill sizes="140px" className="object-cover" />
      </div>
    </article>
  );
}
