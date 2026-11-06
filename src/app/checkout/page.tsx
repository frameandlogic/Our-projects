"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { extraTotal, useStore } from "@/lib/store";
import { formatNPR } from "@/lib/format";

const payments = [
  { id: "esewa", label: "eSewa" },
  { id: "khalti", label: "Khalti" },
  { id: "cod", label: "Cash on delivery" },
  { id: "card", label: "Card" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, user, setUser, subtotal, deliveryFee, total, placeOrder } = useStore();
  const [addressId, setAddressId] = useState(user.addresses[0]?.id ?? "home");
  const [instructions, setInstructions] = useState("Call when at the gate. Third floor, left.");
  const [payment, setPayment] = useState("esewa");
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);

  if (!cart.length && !placing) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-3xl">Nothing to check out</h1>
        <Link href="/explore" className="mt-4 inline-block text-crimson">
          Return to the bazaar
        </Link>
      </div>
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const address = user.addresses.find((a) => a.id === addressId);
    if (!address) {
      setError("Choose a delivery address.");
      return;
    }
    setPlacing(true);
    const order = placeOrder({
      address,
      instructions,
      payment: payments.find((p) => p.id === payment)?.label ?? payment,
    });
    if (order) router.push(`/orders/${order.id}`);
    else setPlacing(false);
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[1fr_320px] lg:px-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-navy">Almost at the door</p>
        <h1 className="font-display mt-2 text-4xl">Checkout</h1>

        <section className="mt-10">
          <h2 className="font-display text-2xl">Where should the doko land?</h2>
          <div className="mt-4 grid gap-3">
            {user.addresses.map((a) => (
              <label
                key={a.id}
                className={`block cursor-pointer border p-4 ${
                  addressId === a.id ? "border-crimson bg-cream" : "border-sand"
                }`}
              >
                <input
                  type="radio"
                  name="addr"
                  className="mr-2"
                  checked={addressId === a.id}
                  onChange={() => setAddressId(a.id)}
                />
                <span className="font-medium">{a.label}</span>
                <p className="mt-1 pl-6 text-sm text-muted">
                  {a.line}, {a.area}, {a.city}
                </p>
              </label>
            ))}
          </div>
          <button
            type="button"
            className="mt-3 text-sm text-navy"
            onClick={() => {
              const id = `addr-${Date.now()}`;
              setUser({
                ...user,
                addresses: [
                  ...user.addresses,
                  {
                    id,
                    label: "Guest house",
                    line: "Near the stupa, white gate",
                    area: "Boudha",
                    city: "Kathmandu",
                    phone: user.phone,
                  },
                ],
              });
              setAddressId(id);
            }}
          >
            + Save another address
          </button>
        </section>

        <label className="mt-10 block">
          <span className="font-display text-2xl">Delivery instructions</span>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={3}
            className="mt-3 w-full border border-sand bg-cream px-4 py-3 text-sm"
          />
        </label>

        <section className="mt-10">
          <h2 className="font-display text-2xl">Pay</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {payments.map((p) => (
              <label
                key={p.id}
                className={`cursor-pointer border px-4 py-3 text-sm ${
                  payment === p.id ? "border-navy bg-navy text-white" : "border-sand"
                }`}
              >
                <input
                  type="radio"
                  name="pay"
                  className="sr-only"
                  checked={payment === p.id}
                  onChange={() => setPayment(p.id)}
                />
                {p.label}
              </label>
            ))}
          </div>
        </section>
        {error && <p className="mt-4 text-sm text-crimson">{error}</p>}
      </div>

      <aside className="h-fit border border-sand bg-cream p-6">
        <h2 className="font-display text-xl">Order summary</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {cart.map((i) => (
            <li key={i.lineId} className="flex justify-between gap-3">
              <span>
                {i.quantity} × {i.name}
              </span>
              <span>{formatNPR((i.unitPrice + extraTotal(i.extras)) * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex justify-between text-sm">
          <span>Delivery</span>
          <span>{formatNPR(deliveryFee)}</span>
        </p>
        <p className="mt-2 flex justify-between border-t border-sand pt-3 font-medium">
          <span>Total</span>
          <span>{formatNPR(total)}</span>
        </p>
        <p className="mt-1 text-right text-xs text-stone">Subtotal {formatNPR(subtotal)}</p>
        <button type="submit" className="mt-6 w-full bg-crimson py-3 text-sm text-white">
          Place order
        </button>
      </aside>
    </form>
  );
}
