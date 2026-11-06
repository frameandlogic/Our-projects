import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-sand bg-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4 md:px-6">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            Doko carries valley kitchens to your door — thakali sets, Newari
            courtyards, midnight momos — packed the way a neighbour would.
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-navy">Kitchen</p>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link href="/explore">Explore restaurants</Link>
            <Link href="/search">Search dishes</Link>
            <Link href="/favorites">Saved plates</Link>
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-navy">You</p>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link href="/cart">Cart</Link>
            <Link href="/checkout">Checkout</Link>
            <Link href="/profile">Profile & orders</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-sand/80 px-4 py-4 text-center text-xs text-stone">
        Doko · Kathmandu Valley · Prices in Nepalese rupees (रु)
      </div>
    </footer>
  );
}
