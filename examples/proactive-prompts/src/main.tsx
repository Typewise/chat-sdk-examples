import {
  StrictMode,
  useCallback,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { createRoot } from 'react-dom/client';
import { createClient, type TypewiseClient } from '@typewise/chat-sdk';
import { INITIAL_CART, SHIPPING, type CartItem, type Shipping } from './cart';
import { CartPage } from './CartPage';
import { ChatPanel } from './ChatPanel';
import { ConnectPanel } from './ConnectPanel';
import {
  TRIGGERS,
  useProactiveTriggers,
  type TriggerId,
} from './useProactiveTriggers';
import { loadSettings } from './settings';
import './styles.css';

type PageContext = { cart: CartItem[]; shipping: Shipping | null };

const page: { current: PageContext } = {
  current: { cart: INITIAL_CART, shipping: null },
};

const contextVariables = ({ cart, shipping }: PageContext) => ({
  cartValue: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
  cartItems: cart
    .map((item) => `${item.quantity}× ${item.name} (${item.size})`)
    .join(', '),
  deliveryOption: shipping ? SHIPPING[shipping].label : 'not chosen',
});

const settings = loadSettings();
const chat = settings.clientId
  ? createClient({
      clientId: settings.clientId,
      ...(settings.baseUrl && { baseUrl: settings.baseUrl }),
      ...(settings.workspaceId && { workspaceId: settings.workspaceId }),
      variables: () => contextVariables(page.current),
    })
  : null;
Object.assign(window, { chat });

type Nudge = {
  trigger: TriggerId;
  title: string;
  body: string;
  prompt: string;
};

function nudgeFor(trigger: TriggerId, { cart, shipping }: PageContext): Nudge {
  const pack = cart.find((item) => item.id === 'ridgeline');
  switch (trigger) {
    case 'dwell':
      return {
        trigger,
        title: 'Need it by a certain date?',
        body: 'Tell us when you head out and we’ll pick the delivery option that gets there in time.',
        prompt:
          'I leave for a hike on Saturday. Which delivery option gets my order here in time?',
      };
    case 'scroll-depth':
      return {
        trigger,
        title: 'Didn’t find your answer?',
        body: 'Ask about returns, sizing or warranties. We answer in seconds.',
        prompt:
          'What happens if the pack doesn’t fit after I’ve tried it on a short hike?',
      };
    case 'exit-intent':
      return {
        trigger,
        title: 'Before you go',
        body: shipping
          ? 'Anything holding you back? We can answer questions about your order right here.'
          : 'Not sure which delivery option to pick? We can help you finish your order.',
        prompt: 'I have a question about my order before I check out.',
      };
    case 'idle-cart':
      return {
        trigger,
        title: 'Not sure about the size?',
        body: `Our guides can help you choose between ${pack?.sizes.join(' and ') ?? 'sizes'} for the Ridgeline pack.`,
        prompt: `How do I choose between ${pack?.sizes.join(' and ') ?? 'the sizes'} for the Ridgeline 45L pack?`,
      };
  }
}

function App({ chat }: { chat: TypewiseClient | null }) {
  const [cart, setCart] = useState(INITIAL_CART);
  const [shipping, setShipping] = useState<Shipping | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [nudge, setNudge] = useState<Nudge | null>(null);
  const shippingRef = useRef<HTMLFieldSetElement>(null);
  page.current = { cart, shipping };

  const started = useStarted(chat);

  const showNudge = useCallback((trigger: TriggerId) => {
    setNudge(nudgeFor(trigger, page.current));
    chat?.track('proactive_nudge_shown', { trigger }).catch(() => undefined);
  }, []);

  const triggers = useProactiveTriggers({
    paused: chatOpen || started || nudge !== null,
    dwellTarget: shippingRef,
    onFire: showNudge,
  });

  const openChat = () => {
    setNudge(null);
    setChatOpen(true);
    chat?.resume().catch(() => undefined);
  };

  const acceptNudge = async (accepted: Nudge) => {
    if (!chat) return;
    openChat();
    chat
      .track('proactive_nudge_accepted', { trigger: accepted.trigger })
      .catch(() => undefined);
    await chat
      .setVariables({
        variables: {
          ...contextVariables(page.current),
          proactiveTrigger: accepted.trigger,
        },
      })
      .catch(() => undefined);
    chat.sendMessage(accepted.prompt).catch(() => undefined);
  };

  const updateShipping = (next: Shipping) => {
    setShipping(next);
    chat
      ?.setVariables({ variables: contextVariables({ cart, shipping: next }) })
      .catch(() => undefined);
  };

  return (
    <>
      <CartPage
        cart={cart}
        onCartChange={setCart}
        shipping={shipping}
        onShippingChange={updateShipping}
        shippingRef={shippingRef}
        onAskForHelp={openChat}
        aside={
          <aside className="panel triggers" aria-label="Proactive triggers">
            <p className="triggers-title">
              Proactive triggers
              <button type="button" onClick={triggers.reset}>
                Reset
              </button>
            </p>
            <ul>
              {(Object.keys(TRIGGERS) as TriggerId[]).map((id) => (
                <li key={id}>
                  <span className={`trigger-dot is-${triggers.statusOf(id)}`} />
                  <span>
                    <strong>{TRIGGERS[id].label}</strong>
                    <small>{TRIGGERS[id].rule}</small>
                  </span>
                  <button type="button" onClick={() => triggers.fire(id, true)}>
                    Fire
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        }
      />

      {nudge && !chatOpen && (
        <div className="nudge" role="status">
          <button
            type="button"
            className="nudge-dismiss"
            aria-label="Dismiss"
            onClick={() => {
              chat
                ?.track('proactive_nudge_dismissed', { trigger: nudge.trigger })
                .catch(() => undefined);
              setNudge(null);
            }}
          >
            ×
          </button>
          <p className="nudge-title">{nudge.title}</p>
          <p className="nudge-body">{nudge.body}</p>
          <button
            type="button"
            className="nudge-prompt"
            disabled={!chat}
            onClick={() => void acceptNudge(nudge)}
          >
            “{nudge.prompt}”
          </button>
          {!chat && (
            <p className="nudge-hint">
              Connect a Typewise client to send this.
            </p>
          )}
        </div>
      )}

      {chat && chatOpen ? (
        <ChatPanel chat={chat} onClose={() => setChatOpen(false)} />
      ) : (
        <button
          type="button"
          className="launcher"
          onClick={openChat}
          disabled={!chat}
        >
          Questions? Ask a guide
        </button>
      )}

      <ConnectPanel chat={chat} settings={settings} />
    </>
  );
}

const noopSubscribe = () => () => {};

/** True once the visitor has written: from then on the conversation speaks for itself. */
function useStarted(chat: TypewiseClient | null) {
  return useSyncExternalStore(
    chat?.subscribe ?? noopSubscribe,
    () =>
      chat?.getState().messages.some((message) => message.role === 'user') ??
      false,
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App chat={chat} />
  </StrictMode>,
);
