export type CartItem = {
  id: string;
  name: string;
  variant: string;
  price: number;
  quantity: number;
  sizes: string[];
  size: string;
};

export type Shipping = 'standard' | 'express' | 'pickup';

export const SHIPPING: Record<
  Shipping,
  { label: string; detail: string; price: number }
> = {
  standard: { label: 'Standard', detail: '3–5 business days', price: 0 },
  express: { label: 'Express', detail: '1–2 business days', price: 12 },
  pickup: {
    label: 'Pick up in store',
    detail: 'Ready tomorrow, Zurich',
    price: 0,
  },
};

export const INITIAL_CART: CartItem[] = [
  {
    id: 'ridgeline',
    name: 'Ridgeline 45L trekking pack',
    variant: 'Moss green',
    price: 189,
    quantity: 1,
    sizes: ['S/M', 'M/L'],
    size: 'M/L',
  },
  {
    id: 'merino',
    name: 'Merino 200 base layer',
    variant: 'Charcoal',
    price: 79,
    quantity: 2,
    sizes: ['S', 'M', 'L', 'XL'],
    size: 'M',
  },
];

export const formatPrice = (value: number) =>
  new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(
    value,
  );
