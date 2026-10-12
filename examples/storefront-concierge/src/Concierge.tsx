import {
  Avatar,
  Composer,
  ConversationThread,
  LiveStatus,
  RefreshIcon,
  Suggestion,
  assistantName,
  hasUserMessages,
  useChat,
} from './chat-ui';

export type PageContext = { finish: string; quantity: number; inBag: boolean };

export function Concierge({ context }: { context: PageContext }) {
  const { chat, state } = useChat();
  const started = hasUserMessages(state);
  const name = assistantName(state);

  return (
    <section
      className={`concierge ${started ? 'is-started' : ''}`}
      aria-label={`Ask ${name}`}
    >
      <header className="concierge-header">
        <Avatar large />
        <div>
          <h2>Ask {name} about Halo</h2>
          <LiveStatus />
        </div>
        {state.conversation && (
          <button
            className="concierge-reset"
            title="Start over"
            onClick={() => chat.startNewConversation().catch(() => undefined)}
          >
            <RefreshIcon />
          </button>
        )}
      </header>

      {started ? (
        <ConversationThread className="concierge-thread" />
      ) : (
        <div className="concierge-intro">
          <p>
            Our product expert knows every finish, bulb and delivery option, and
            sees what you’re looking at.
          </p>
          <div className="tw-chips">
            <Suggestion
              prompt={`Will ${context.finish} suit a room with light oak floors?`}
            />
            <Suggestion prompt="Is the bulb included?" />
            <Suggestion prompt="How fast can it arrive in Berlin?" />
          </div>
        </div>
      )}

      <div
        className="concierge-context"
        title="Sent to the assistant with setVariables()"
      >
        <span className="concierge-context-label">Shared with {name}</span>
        <span>Halo Table Lamp</span>
        <span>{context.finish}</span>
        <span>Qty {context.quantity}</span>
        {context.inBag && <span>In your bag</span>}
      </div>

      <Composer placeholder={`Ask about Halo in ${context.finish}…`} />
    </section>
  );
}
