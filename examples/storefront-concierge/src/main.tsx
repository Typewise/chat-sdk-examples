import { StrictMode, useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient, type TypewiseClient } from '@typewise/chat-sdk';
import { AskPalette } from './AskPalette';
import { ChatProvider, resumeChat } from './chat-ui';
import { Concierge, type PageContext } from './Concierge';
import { ConnectPanel } from './ConnectPanel';
import { ProductPage } from './ProductPage';
import { loadSettings, type Settings } from './settings';
import './styles.css';

const settings = loadSettings();
const chat = settings.clientId
  ? createClient({
      clientId: settings.clientId,
      ...(settings.baseUrl && { baseUrl: settings.baseUrl }),
      ...(settings.workspaceId && { workspaceId: settings.workspaceId }),
    })
  : null;
Object.assign(window, { chat });

function Storefront({ chat }: { chat: TypewiseClient }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const searchTrigger = useRef<HTMLElement | null>(null);

  const openSearch = useCallback((trigger: Element | null) => {
    searchTrigger.current = trigger instanceof HTMLElement ? trigger : null;
    setSearchOpen(true);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        if (searchOpen) setSearchOpen(false);
        else openSearch(document.activeElement);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen, openSearch]);

  useEffect(() => {
    if (!searchOpen) searchTrigger.current?.focus();
  }, [searchOpen]);

  const shareContext = useCallback(
    (context: PageContext) => {
      resumeChat(chat)
        .then(() =>
          chat.setVariables({
            variables: {
              product: 'Halo Table Lamp',
              productFinish: context.finish,
              productQuantity: context.quantity,
              productInBag: context.inBag,
            },
          }),
        )
        .catch(() => undefined);
    },
    [chat],
  );

  return (
    <ChatProvider chat={chat}>
      <ProductPage
        renderConcierge={(context) => <Concierge context={context} />}
        onContextChange={shareContext}
        onOpenSearch={openSearch}
      />
      <AskPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </ChatProvider>
  );
}

function App({
  chat,
  settings,
}: {
  chat: TypewiseClient | null;
  settings: Settings;
}) {
  return (
    <>
      {chat ? <Storefront chat={chat} /> : <ProductPage />}
      <ConnectPanel chat={chat} settings={settings} />
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App chat={chat} settings={settings} />
  </StrictMode>,
);
