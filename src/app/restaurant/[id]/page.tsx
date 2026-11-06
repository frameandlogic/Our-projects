"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CustomizeModal } from "@/components/CustomizeModal";
import { HeartButton } from "@/components/Hearts";
import { dishesByRestaurant, restaurantById } from "@/data/catalog";
import type { Dish } from "@/data/types";
import { formatNPR, minsRange, priceMarks } from "@/lib/format";

export default function RestaurantPage() {
  const { id } = useParams<{ id: string }>();
  const restaurant = restaurantById(id);
  const menu = dishesByRestaurant(id);
  const cats = useMemo(
    () => Array.from(new Set(menu.map((d) => d.category))),
    [menu],
  );
  const [cat, setCat] = useState<string | null>(null);
  const [active, setActive] = useState<Dish | null>(null);

  if (!restaurant) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl">Kitchen not found</h1>
        <Link href="/explore" className="mt-4 inline-block text-crimson">
          Back to explore
        </Link>
      </div>
    );
  }

  const shown = cat ? menu.filter((d) => d.category === cat) : menu;

  return (
    <div>
      <div className="relative h-64 md:h-80">
        <Image src={restaurant.cover} alt="" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-navy-ink/35" />
        <div className="absolute bottom-6 left-0 right-0 mx-auto max-w-6xl px-4 md:px-6">
          <p className="text-xs uppercase tracking-[0.25em] text-white/70">
            {restaurant.city} · {restaurant.area}
          </p>
          <h1 className="font-display text-4xl text-white md:text-6xl">{restaurant.name}</h1>
        </div>
      </div>

      <div className="border-b border-sand bg-cream">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-6">
          <div>
            <p className="text-sm text-muted">{restaurant.tagline}</p>
            <p className="mt-1 text-sm">
              {restaurant.rating.toFixed(1)} ({restaurant.reviews.toLocaleString("en-IN")} reviews) ·{" "}
              {minsRange(restaurant.deliveryMins)} · {priceMarks(restaurant.priceLevel)} ·{" "}
              {formatNPR(restaurant.deliveryFee)} delivery
            </p>
          </div>
          <HeartButton kind="restaurant" id={restaurant.id} />
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:grid-cols-[220px_1fr] md:px-6">
        <aside>
          <p className="text-xs uppercase tracking-[0.2em] text-navy">The house</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">{restaurant.about}</p>
          <p className="mt-4 text-sm">Hours · {restaurant.hours}</p>
          <nav className="mt-8 flex flex-col gap-2 text-sm">
            <button
              type="button"
              onClick={() => setCat(null)}
              className={`text-left ${!cat ? "text-crimson" : "text-muted"}`}
            >
              Full menu
            </button>
            {cats.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                className={`text-left ${cat === c ? "text-crimson" : "text-muted"}`}
              >
                {c}
              </button>
            ))}
          </nav>
        </aside>

        <div>
          {shown.map((dish) => (
            <article
              key={dish.id}
              className="grid grid-cols-[1fr_120px] gap-4 border-b border-sand py-6 md:grid-cols-[1fr_160px]"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-2xl">{dish.name}</h2>
                  {dish.popular && (
                    <span className="text-[10px] uppercase tracking-widest text-crimson">Popular</span>
                  )}
                </div>
                <p className="font-deva text-sm text-navy">{dish.nepaliName}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{dish.description}</p>
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-sm font-medium">{formatNPR(dish.price)}</span>
                  <button
                    type="button"
                    onClick={() => setActive(dish)}
                    className="bg-crimson px-3 py-1.5 text-xs uppercase tracking-wider text-white"
                  >
                    Customise & add
                  </button>
                  <HeartButton kind="dish" id={dish.id} />
                </div>
              </div>
              <div className="relative h-28 md:h-36">
                <Image src={dish.image} alt="" fill className="object-cover" />
              </div>
            </article>
          ))}
        </div>
      </div>
      {active && <CustomizeModal dish={active} onClose={() => setActive(null)} />}
    </div>
  );
}
