import { useEffect, useRef } from 'react';
import {
  Composer,
  ConversationThread,
  Icon,
  LiveStatus,
  Suggestion,
  hasUserMessages,
  useChat,
} from './chat-ui';

const STARTERS = [
  {
    prompt: 'Which lamp is best for a reading corner?',
    hint: 'Product advice',
  },
  { prompt: 'Where is my order?', hint: 'Orders' },
  { prompt: 'What is your return policy?', hint: 'Policies' },
  { prompt: 'Do you ship to Switzerland?', hint: 'Shipping' },
];

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function AskPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { state } = useChat();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = [
        ...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      const active = document.activeElement;
      const outside = !dialogRef.current.contains(active);
      if (event.shiftKey && (outside || active === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (outside || active === last)) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const started = hasUserMessages(state);

  return (
    <div className="palette-backdrop" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label="Search or ask"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <Composer
          placeholder="Search the store or ask a question…"
          autoFocus
          leading={
            <span className="palette-search-icon">
              <SearchIcon />
            </span>
          }
        />
        {started ? (
          <>
            <div className="palette-meta">
              <span>Answer</span>
              <LiveStatus />
            </div>
            <ConversationThread className="palette-thread" />
          </>
        ) : (
          <div className="palette-starters">
            <p className="palette-meta">Try asking</p>
            {STARTERS.map(({ prompt, hint }) => (
              <Suggestion key={prompt} prompt={prompt}>
                <span className="palette-row">
                  <span className="palette-row-icon">
                    <SearchIcon />
                  </span>
                  {prompt}
                  <kbd>{hint}</kbd>
                </span>
              </Suggestion>
            ))}
          </div>
        )}
        <footer className="palette-footer">
          <span>
            <kbd>↵</kbd> to ask · <kbd>esc</kbd> to close
          </span>
          <span>
            Answers by <strong>Typewise</strong>
          </span>
        </footer>
      </div>
    </div>
  );
}

export const SearchIcon = () => (
  <Icon size={18}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Icon>
);
