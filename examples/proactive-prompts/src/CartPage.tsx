import type { ReactNode, RefObject } from 'react';
import { SHIPPING, formatPrice, type CartItem, type Shipping } from './cart';

const FAQ = [
  {
    q: 'What if it doesn’t fit?',
    a: 'Return unused gear within 60 days for a full refund. Exchanges ship free.',
  },
  {
    q: 'Do you price match?',
    a: 'We match any authorised Swiss retailer’s advertised price for 14 days after purchase.',
  },
  {
    q: 'How long is the warranty?',
    a: 'Packs carry a lifetime warranty against defects; apparel is covered for 2 years.',
  },
  {
    q: 'Can I rent before I buy?',
    a: 'Our Zurich store rents packs by the weekend. The rental fee is credited if you buy within 30 days.',
  },
];

export function CartPage({
  cart,
  onCartChange,
  shipping,
  onShippingChange,
  shippingRef,
  onAskForHelp,
  aside,
}: {
  aside?: ReactNode;
  cart: CartItem[];
  onCartChange: (cart: CartItem[]) => void;
  shipping: Shipping | null;
  onShippingChange: (shipping: Shipping) => void;
  shippingRef: RefObject<HTMLFieldSetElement | null>;
  onAskForHelp: () => void;
}) {
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const delivery = shipping ? SHIPPING[shipping].price : 0;
  const update = (id: string, patch: Partial<CartItem>) =>
    onCartChange(
      cart.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );

  return (
    <div className="shop">
      <header className="shop-header">
        <a className="shop-logo" href="#">
          ▲ Trailhead <span>Outfitters</span>
        </a>
        <ol className="shop-steps">
          <li className="is-done">Cart</li>
          <li className="is-current">Delivery</li>
          <li>Payment</li>
        </ol>
        <button type="button" className="shop-help" onClick={onAskForHelp}>
          Need help?
        </button>
      </header>

      <main className="checkout">
        <div className="checkout-main">
          <section className="panel">
            <h2>Your cart</h2>
            {cart.map((item) => (
              <article key={item.id} className="cart-item">
                <div className="cart-art" aria-hidden>
                  {item.id === 'ridgeline' ? '🎒' : '🧥'}
                </div>
                <div className="cart-info">
                  <h3>{item.name}</h3>
                  <p>{item.variant}</p>
                  <label>
                    Size
                    <select
                      value={item.size}
                      onChange={(event) =>
                        update(item.id, { size: event.target.value })
                      }
                    >
                      {item.sizes.map((size) => (
                        <option key={size}>{size}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="cart-quantity">
                  <button
                    type="button"
                    aria-label="Fewer"
                    onClick={() =>
                      update(item.id, {
                        quantity: Math.max(1, item.quantity - 1),
                      })
                    }
                  >
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    aria-label="More"
                    onClick={() =>
                      update(item.id, { quantity: item.quantity + 1 })
                    }
                  >
                    +
                  </button>
                </div>
                <p className="cart-price">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </article>
            ))}
          </section>

          <fieldset className="panel shipping" ref={shippingRef}>
            <legend>
              <h2>Delivery</h2>
            </legend>
            {(Object.keys(SHIPPING) as Shipping[]).map((option) => (
              <label
                key={option}
                className={`shipping-option ${shipping === option ? 'is-selected' : ''}`}
              >
                <input
                  type="radio"
                  name="shipping"
                  checked={shipping === option}
                  onChange={() => onShippingChange(option)}
                />
                <span>
                  <strong>{SHIPPING[option].label}</strong>
                  <small>{SHIPPING[option].detail}</small>
                </span>
                <em>
                  {SHIPPING[option].price
                    ? formatPrice(SHIPPING[option].price)
                    : 'Free'}
                </em>
              </label>
            ))}
          </fieldset>

          <section className="panel faq" id="faq">
            <h2>Good to know</h2>
            {FAQ.map(({ q, a }) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </section>
        </div>

        <div className="checkout-side">
          <aside className="panel summary">
            <h2>Order summary</h2>
            <dl>
              <dt>Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
              <dt>Delivery</dt>
              <dd>
                {shipping ? (delivery ? formatPrice(delivery) : 'Free') : '—'}
              </dd>
              <dt className="summary-total">Total</dt>
              <dd className="summary-total">
                {formatPrice(subtotal + delivery)}
              </dd>
            </dl>
            <button type="button" className="summary-pay" disabled={!shipping}>
              Continue to payment
            </button>
            <p className="summary-note">
              60-day returns · Lifetime pack warranty
            </p>
          </aside>
          {aside}
        </div>
      </main>
    </div>
  );
}
