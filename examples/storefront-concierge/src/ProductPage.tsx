import { useEffect, useState, type ReactNode } from 'react';
import type { PageContext } from './Concierge';
import { FINISHES, LampArt, type Finish } from './LampArt';

const RELATED = [
  { name: 'Orbit Pendant', price: '€249', finish: FINISHES[2]!, tilt: 0 },
  { name: 'Halo Mini', price: '€129', finish: FINISHES[1]!, tilt: -6 },
  { name: 'Dune Floor Lamp', price: '€389', finish: FINISHES[0]!, tilt: 4 },
];

export function ProductPage({
  renderConcierge,
  onContextChange,
  onOpenSearch,
}: {
  renderConcierge?: (context: PageContext) => ReactNode;
  onContextChange?: (context: PageContext) => void;
  onOpenSearch?: (trigger: HTMLElement) => void;
}) {
  const [finish, setFinish] = useState<Finish>(FINISHES[1]!);
  const [quantity, setQuantity] = useState(1);
  const [view, setView] = useState(0);
  const [added, setAdded] = useState<{
    finish: string;
    quantity: number;
  } | null>(null);
  const inBag = added?.finish === finish.name && added.quantity === quantity;
  const context: PageContext = { finish: finish.name, quantity, inBag };

  useEffect(() => {
    onContextChange?.({ finish: finish.name, quantity, inBag });
  }, [onContextChange, finish.name, quantity, inBag]);

  return (
    <div className="store">
      <div className="store-announcement">
        Free carbon-neutral shipping on orders over €100 · 60-day returns
      </div>
      <header className="store-header">
        <a className="store-logo" href="#">
          LUMEN<span>&amp; Co.</span>
        </a>
        <nav>
          <a href="#">Shop</a>
          <a href="#">Collections</a>
          <a href="#">Journal</a>
          <a href="#">Showrooms</a>
        </nav>
        <button
          className="store-search"
          onClick={(event) => onOpenSearch?.(event.currentTarget)}
        >
          <SearchIcon />
          <span>Search or ask anything…</span>
          <kbd>⌘K</kbd>
        </button>
        <div className="store-actions">
          <button aria-label="Cart" className="store-cart">
            <BagIcon />
            {added && <span>{added.quantity}</span>}
          </button>
        </div>
      </header>

      <main className="store-main">
        <p className="store-breadcrumbs">
          Home / Table lamps / <strong>Halo</strong>
        </p>
        <section className="product">
          <div className="product-gallery">
            <div className="product-hero">
              <LampArt
                finish={finish}
                tilt={[0, -8, 8][view]}
                glow={view !== 2}
              />
              <span className="product-badge">New in</span>
            </div>
            <div className="product-thumbs">
              {[0, 1, 2].map((i) => (
                <button
                  key={i}
                  className={i === view ? 'is-active' : ''}
                  onClick={() => setView(i)}
                  aria-label={`View ${i + 1}`}
                >
                  <LampArt
                    finish={finish}
                    tilt={[0, -8, 8][i]}
                    glow={i !== 2}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="product-info">
            <p className="product-eyebrow">Table lamp · Handmade in Portugal</p>
            <h1>Halo Table Lamp</h1>
            <div className="product-rating">
              <Stars /> <span>4.8 · 212 reviews</span>
            </div>
            <p className="product-price">€189</p>
            <p className="product-description">
              A soft dome of mouth-blown opal glass on a brushed brass stem.
              Halo diffuses a warm 2700K glow that makes any corner feel like
              the golden hour, with a touch dimmer hidden in the base.
            </p>

            <div className="product-option">
              <p>
                Finish <strong>{finish.name}</strong>
              </p>
              <div className="product-swatches">
                {FINISHES.map((f) => (
                  <button
                    key={f.name}
                    className={f.name === finish.name ? 'is-active' : ''}
                    style={{ background: f.shade }}
                    onClick={() => setFinish(f)}
                    aria-label={f.name}
                  />
                ))}
              </div>
            </div>

            <div className="product-buy">
              <div className="product-quantity">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                  −
                </button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity((q) => q + 1)}>+</button>
              </div>
              <button
                className="product-add"
                onClick={() => setAdded({ finish: finish.name, quantity })}
              >
                {inBag ? 'Added to bag' : 'Add to bag'}
              </button>
            </div>

            {renderConcierge?.(context)}
          </div>
        </section>

        <section className="product-more">
          <ul className="product-perks">
            <li>
              <TruckIcon /> Ships in 2–3 business days
            </li>
            <li>
              <ReturnIcon /> Free returns within 60 days
            </li>
            <li>
              <ShieldIcon /> 5-year warranty on electrics
            </li>
          </ul>
          <div className="product-specs">
            <div>
              <h3>Details &amp; dimensions</h3>
              <p>
                Ø 28 cm · H 42 cm · 2.3 kg. E27 LED bulb included (8W, 2700K).
                1.8 m braided cable with in-line switch.
              </p>
            </div>
            <div>
              <h3>Care</h3>
              <p>
                Wipe the glass with a soft, dry cloth. Avoid abrasive cleaners
                on brass.
              </p>
            </div>
          </div>
        </section>

        <section className="related">
          <h2>You might also like</h2>
          <div className="related-grid">
            {RELATED.map((item) => (
              <article key={item.name}>
                <div className="related-art">
                  <LampArt finish={item.finish} tilt={item.tilt} />
                </div>
                <h3>{item.name}</h3>
                <p>{item.price}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="store-footer">
        <span>© 2026 Lumen &amp; Co.</span>
        <span>Shipping · Returns · Contact · Privacy</span>
      </footer>
    </div>
  );
}

function Stars() {
  return (
    <span className="stars" aria-hidden>
      {'★★★★★'}
    </span>
  );
}

const icon = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const SearchIcon = () => (
  <svg {...icon}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);
const BagIcon = () => (
  <svg {...icon}>
    <path d="M5 8h14l-1 12H6L5 8Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
);
const TruckIcon = () => (
  <svg {...icon}>
    <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" />
    <circle cx="7" cy="18" r="1.6" />
    <circle cx="17" cy="18" r="1.6" />
  </svg>
);
const ReturnIcon = () => (
  <svg {...icon}>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h11a5 5 0 0 1 0 10h-3" />
  </svg>
);
const ShieldIcon = () => (
  <svg {...icon}>
    <path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Z" />
  </svg>
);
