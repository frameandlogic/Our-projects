"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { locations } from "@/data/catalog";
import { useStore } from "@/lib/store";
import { Logo } from "./Logo";

const nav = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/favorites", label: "Favorites" },
  { href: "/profile", label: "Profile" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { location, setLocation, cart, user } = useStore();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const count = cart.reduce((s, i) => s + i.quantity, 0);

  function search(e: FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-sand/80 bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 md:px-6">
        <Link href="/" aria-label="Doko home">
          <Logo />
        </Link>

        <label className="relative hidden min-w-[180px] md:block">
          <span className="sr-only">Delivery location</span>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full cursor-pointer appearance-none border-0 bg-transparent pr-6 text-sm font-medium text-navy outline-none"
          >
            {locations.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[10px] text-navy">
            ▼
          </span>
        </label>

        <form onSubmit={search} className="hidden flex-1 sm:block">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search momo, thakali, sekuwa…"
            className="w-full border border-sand bg-cream px-4 py-2.5 text-sm outline-none transition focus:border-crimson"
          />
        </form>

        <nav className="ml-auto hidden items-center gap-5 text-sm lg:flex">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`tracking-wide ${
                pathname === n.href ? "text-crimson" : "text-muted hover:text-ink"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/profile"
          className="hidden text-sm text-muted md:block"
        >
          {user.name.split(" ")[0]}
        </Link>

        <Link
          href="/cart"
          className="relative inline-flex h-10 items-center border border-navy px-3 text-sm font-medium text-navy"
        >
          Cart
          {count > 0 && (
            <span className="ml-2 bg-crimson px-1.5 py-0.5 text-[11px] text-white">
              {count}
            </span>
          )}
        </Link>

        <button
          type="button"
          className="lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          <span className="block h-px w-5 bg-ink" />
          <span className="mt-1.5 block h-px w-5 bg-ink" />
        </button>
      </div>

      {open && (
        <div className="border-t border-sand px-4 py-4 lg:hidden">
          <form onSubmit={search} className="mb-3 sm:hidden">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search dishes…"
              className="w-full border border-sand bg-cream px-3 py-2 text-sm"
            />
          </form>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mb-3 w-full border border-sand bg-cream px-3 py-2 text-sm md:hidden"
          >
            {locations.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <div className="flex flex-col gap-2 text-sm">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)}>
                {n.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
