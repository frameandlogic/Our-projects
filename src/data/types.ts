export type SpiceLevel = "mild" | "medium" | "hot";

export type Dietary = "veg" | "vegan" | "nonveg" | "jain";

export type Cuisine =
  | "Thakali"
  | "Newari"
  | "Momo"
  | "Tibetan"
  | "Grill"
  | "Street"
  | "Indian"
  | "Breakfast"
  | "Chinese-Nepali";

export type Extra = {
  id: string;
  name: string;
  price: number;
};

export type Dish = {
  id: string;
  restaurantId: string;
  name: string;
  nepaliName: string;
  description: string;
  price: number;
  image: string;
  category: string;
  dietary: Dietary;
  popular?: boolean;
  spicy?: boolean;
  extras: Extra[];
};

export type Restaurant = {
  id: string;
  name: string;
  tagline: string;
  cuisine: Cuisine;
  cuisines: string[];
  area: string;
  city: string;
  image: string;
  cover: string;
  rating: number;
  reviews: number;
  deliveryMins: [number, number];
  deliveryFee: number;
  priceLevel: 1 | 2 | 3;
  dietary: Dietary[];
  featured?: boolean;
  offer?: string;
  about: string;
  hours: string;
};

export type CartItem = {
  lineId: string;
  dishId: string;
  restaurantId: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  spice: SpiceLevel;
  extras: Extra[];
  notes: string;
};

export type Address = {
  id: string;
  label: string;
  line: string;
  area: string;
  city: string;
  phone: string;
};

export type OrderStatus =
  | "placed"
  | "preparing"
  | "picked"
  | "nearby"
  | "delivered";

export type Order = {
  id: string;
  createdAt: string;
  items: CartItem[];
  restaurantIds: string[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  address: Address;
  instructions: string;
  payment: string;
  status: OrderStatus;
  etaMins: number;
};

export type UserProfile = {
  name: string;
  email: string;
  phone: string;
  addresses: Address[];
};
