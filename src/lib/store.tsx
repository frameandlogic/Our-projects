"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { restaurants, sampleOrders, sampleUser } from "@/data/catalog";
import type {
  Address,
  CartItem,
  Extra,
  Order,
  SpiceLevel,
  UserProfile,
} from "@/data/types";

type Store = {
  ready: boolean;
  location: string;
  setLocation: (v: string) => void;
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "lineId">) => void;
  updateQty: (lineId: string, quantity: number) => void;
  updateLine: (lineId: string, patch: Partial<CartItem>) => void;
  removeLine: (lineId: string) => void;
  clearCart: () => void;
  favorites: { restaurants: string[]; dishes: string[] };
  toggleFavRestaurant: (id: string) => void;
  toggleFavDish: (id: string) => void;
  user: UserProfile;
  setUser: (u: UserProfile) => void;
  orders: Order[];
  placeOrder: (input: {
    address: Address;
    instructions: string;
    payment: string;
  }) => Order | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
};

const KEY = "doko-store-v1";
const StoreContext = createContext<Store | null>(null);

function lineKey(item: Pick<CartItem, "dishId" | "spice" | "extras" | "notes">) {
  return [
    item.dishId,
    item.spice,
    item.extras.map((e) => e.id).sort().join(","),
    item.notes.trim(),
  ].join("|");
}

function extraSum(extras: Extra[]) {
  return extras.reduce((s, e) => s + e.price, 0);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [location, setLocation] = useState("Patan Durbar Square");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<{
    restaurants: string[];
    dishes: string[];
  }>({ restaurants: ["thakali-ghar", "momo-durbar"], dishes: ["sel-roti", "jhol-momo"] });
  const [user, setUser] = useState<UserProfile>(sampleUser);
  const [orders, setOrders] = useState<Order[]>(sampleOrders);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.location) setLocation(parsed.location);
        if (parsed.cart) setCart(parsed.cart);
        if (parsed.favorites) setFavorites(parsed.favorites);
        if (parsed.user) setUser(parsed.user);
        if (parsed.orders) setOrders(parsed.orders);
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(
      KEY,
      JSON.stringify({ location, cart, favorites, user, orders }),
    );
  }, [ready, location, cart, favorites, user, orders]);

  const addToCart: Store["addToCart"] = (item) => {
    setCart((prev) => {
      const key = lineKey(item);
      const existing = prev.find((p) => lineKey(p) === key);
      if (existing) {
        return prev.map((p) =>
          p.lineId === existing.lineId
            ? { ...p, quantity: p.quantity + item.quantity }
            : p,
        );
      }
      return [
        ...prev,
        { ...item, lineId: `${item.dishId}-${Date.now()}` },
      ];
    });
  };

  const updateQty = (lineId: string, quantity: number) => {
    setCart((prev) =>
      prev
        .map((p) => (p.lineId === lineId ? { ...p, quantity } : p))
        .filter((p) => p.quantity > 0),
    );
  };

  const updateLine = (lineId: string, patch: Partial<CartItem>) => {
    setCart((prev) =>
      prev.map((p) => (p.lineId === lineId ? { ...p, ...patch } : p)),
    );
  };

  const removeLine = (lineId: string) => {
    setCart((prev) => prev.filter((p) => p.lineId !== lineId));
  };

  const clearCart = () => setCart([]);

  const toggleFavRestaurant = (id: string) => {
    setFavorites((f) => ({
      ...f,
      restaurants: f.restaurants.includes(id)
        ? f.restaurants.filter((x) => x !== id)
        : [...f.restaurants, id],
    }));
  };

  const toggleFavDish = (id: string) => {
    setFavorites((f) => ({
      ...f,
      dishes: f.dishes.includes(id)
        ? f.dishes.filter((x) => x !== id)
        : [...f.dishes, id],
    }));
  };

  const subtotal = cart.reduce(
    (s, i) => s + (i.unitPrice + extraSum(i.extras)) * i.quantity,
    0,
  );
  const restaurantFees = Array.from(new Set(cart.map((c) => c.restaurantId)))
    .map((id) => restaurants.find((r) => r.id === id)?.deliveryFee ?? 80)
    .reduce((s, n) => s + n, 0);
  const deliveryFee = cart.length ? restaurantFees : 0;
  const total = subtotal + deliveryFee;

  const placeOrder: Store["placeOrder"] = ({ address, instructions, payment }) => {
    if (!cart.length) return null;
    const order: Order = {
      id: `DK-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      items: cart,
      restaurantIds: Array.from(new Set(cart.map((c) => c.restaurantId))),
      subtotal,
      deliveryFee,
      total,
      address,
      instructions,
      payment,
      status: "placed",
      etaMins: 38,
    };
    setOrders((o) => [order, ...o]);
    setCart([]);
    return order;
  };

  const value = useMemo(
    () => ({
      ready,
      location,
      setLocation,
      cart,
      addToCart,
      updateQty,
      updateLine,
      removeLine,
      clearCart,
      favorites,
      toggleFavRestaurant,
      toggleFavDish,
      user,
      setUser,
      orders,
      placeOrder,
      subtotal,
      deliveryFee,
      total,
    }),
    [
      ready,
      location,
      cart,
      favorites,
      user,
      orders,
      subtotal,
      deliveryFee,
      total,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function extraTotal(extras: Extra[]) {
  return extras.reduce((s, e) => s + e.price, 0);
}

export function spiceLabel(s: SpiceLevel) {
  return s === "mild" ? "Nilo" : s === "medium" ? "Majhilo" : "Piro";
}
