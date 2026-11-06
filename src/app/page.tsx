"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { RestaurantCard } from "@/components/Cards";
import { CustomizeModal } from "@/components/CustomizeModal";
import { HeartButton } from "@/components/Hearts";
import {
  categories,
  locations,
  offers,
  popularDishes,
  restaurants,
} from "@/data/catalog";
import type { Dish } from "@/data/types";
import { formatNPR } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function HomePage() {
  const router = useRouter();
  const { location, setLocation } = useStore();
  const [q, setQ] = useState("");
  const [active, setActive] = useState<Dish | null>(null);
  const featured = restaurants.filter((r) => r.featured);
  const rest = restaurants.filter((r) => !r.featured);
  const trending = popularDishes();

  function go(e: FormEvent) {
    e.preventDefault();
    router.push(q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : "/explore");
  }

  return (
    <div>
      <section className="relative overflow-hidden bg-navy-ink text-white">
        <div className="absolute inset-y-0 right-0 hidden w-[54%] md:block">
          <Image
            src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1600&q=80"
            alt="Himalayan ridgeline"
            fill
            priority
            sizes="54vw"
            className="object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy-ink via-navy-ink/40 to-transparent" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
          <p className="text-[11px] uppercase tracking-[0.35em] text-white/60">
            Kathmandu Valley · Est. 2081
          </p>
          <h1 className="font-display mt-4 max-w-xl text-5xl leading-[0.95] md:text-7xl">
            Carry the kitchen
            <span className="mt-2 block text-crimson">home in a doko.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-white/75">
            Thakali khana, courtyard Newari plates, steamer momos, charcoal
            sekuwa. Ordered from neighbourhood kitchens — priced in rupees,
            packed with care.
          </p>

          <form
            onSubmit={go}
            className="mt-10 grid max-w-xl gap-px bg-white text-ink md:grid-cols-[0.9fr_1.4fr_auto]"
          >
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-cream px-4 py-4 text-sm outline-none"
            >
              {locations.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Momo, sel roti, Newari…"
              className="bg-paper px-4 py-4 text-sm outline-none"
            />
            <button type="submit" className="bg-crimson px-6 py-4 text-sm tracking-wide text-white">
              Find khana
            </button>
          </form>
          <p className="mt-3 font-deva text-sm text-white/50">खाना खोज्नुहोस्</p>
        </div>
        <svg className="relative block w-full text-paper" viewBox="0 0 1440 70" preserveAspectRatio="none">
          <path fill="currentColor" d="M0 70L120 32L260 58L420 18L600 50L760 10L940 44L1120 22L1440 48V70H0Z" />
        </svg>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-3xl">The bazaar lane</h2>
          <Link href="/explore" className="text-sm text-navy">
            All kitchens →
          </Link>
        </div>
        <div className="no-scrollbar mt-6 flex gap-4 overflow-x-auto pb-2">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/explore?cuisine=${encodeURIComponent(c.label)}`}
              className="w-36 shrink-0"
            >
              <div className="relative h-40 overflow-hidden">
                <Image src={c.image} alt="" fill className="object-cover" />
              </div>
              <p className="mt-2 font-display text-lg leading-tight">{c.label}</p>
              <p className="font-deva text-xs text-crimson">{c.nepali}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-cream">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 md:grid-cols-12 md:px-6">
          <div className="md:col-span-5">
            <p className="text-[11px] uppercase tracking-[0.28em] text-navy">Houses we love</p>
            <h2 className="font-display mt-2 text-4xl">Popular kitchens</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Not a feed of identical cards. These are rooms with histories —
              a steamer in Thamel, a courtyard in Bhaktapur, a sel roti pan
              that starts before sunrise.
            </p>
          </div>
          <div className="md:col-span-7">
            {featured[0] && <RestaurantCard restaurant={featured[0]} layout="featured" />}
          </div>
          <div className="grid gap-6 sm:grid-cols-2 md:col-span-12">
            {featured.slice(1).map((r) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <h2 className="font-display text-4xl">Trending across the valley</h2>
        <ol className="mt-8 divide-y divide-sand">
          {trending.map((dish, i) => (
            <li key={dish.id} className="grid grid-cols-[3rem_1fr_auto] items-center gap-4 py-5">
              <span className="font-display text-3xl text-crimson/80">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <p className="font-display text-2xl">{dish.name}</p>
                <p className="text-sm text-muted">
                  {formatNPR(dish.price)} · {dish.nepaliName}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <HeartButton kind="dish" id={dish.id} />
                <button
                  type="button"
                  onClick={() => setActive(dish)}
                  className="border border-crimson px-3 py-1.5 text-xs uppercase tracking-wider text-crimson"
                >
                  Add
                </button>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="dhaka">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <h2 className="font-display text-4xl">Folded offers</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {offers.map((o) => (
              <article key={o.id} className="bg-paper">
                <div className="relative h-40">
                  <Image src={o.image} alt="" fill className="object-cover" />
                </div>
                <div className="p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-crimson">{o.discount}</p>
                  <h3 className="font-display mt-1 text-2xl">{o.title}</h3>
                  <p className="mt-1 text-sm text-muted">{o.subtitle}</p>
                  <p className="mt-4 border border-dashed border-navy px-2 py-1 text-center text-xs tracking-widest text-navy">
                    {o.code}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-3xl">For your table tonight</h2>
          <Link href="/explore" className="text-sm text-navy">Browse →</Link>
        </div>
        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </div>
      </section>

      {active && <CustomizeModal dish={active} onClose={() => setActive(null)} />}
    </div>
  );
}
