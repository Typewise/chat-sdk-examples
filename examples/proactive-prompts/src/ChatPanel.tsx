import { useEffect, useRef, useState } from 'react';
import type { ChatState, Message, TypewiseClient } from '@typewise/chat-sdk';
import { quickActionsOf, useChatState } from './useChat';

const assistantName = (state: ChatState) =>
  state.config?.aiAssistantName ?? 'Trailhead guide';

export function ChatPanel({
  chat,
  onClose,
}: {
  chat: TypewiseClient;
  onClose: () => void;
}) {
  const state = useChatState(chat);
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [state.messages.length, state.activity.kind]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    // Failed sends stay in the list with status 'failed'.
    chat.sendMessage(trimmed).catch(() => undefined);
  };

  const last = state.messages.at(-1);
  const actions = last && last.role !== 'user' ? quickActionsOf(last) : [];

  return (
    <section className="chat" aria-label={`Chat with ${assistantName(state)}`}>
      <header className="chat-header">
        <div>
          <h2>{assistantName(state)}</h2>
          <p>{statusLabel(state)}</p>
        </div>
        <button
          type="button"
          title="Start over"
          onClick={() => chat.startNewConversation().catch(() => undefined)}
        >
          ↻
        </button>
        <button type="button" aria-label="Close" onClick={onClose}>
          ×
        </button>
      </header>

      <ol className="chat-messages" ref={listRef} aria-live="polite">
        {state.messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            name={assistantName(state)}
          />
        ))}
        {state.activity.kind !== 'idle' && (
          <li className="chat-typing">
            {state.activity.kind === 'agent_typing'
              ? 'Typing…'
              : state.activity.kind === 'waiting_for_agent'
                ? 'Connecting you with the team…'
                : (state.activity.text ?? 'Thinking…')}
          </li>
        )}
        {state.conversation?.isClosed && (
          <li className="chat-closed">
            This conversation has ended.{' '}
            <button
              type="button"
              onClick={() => chat.startNewConversation().catch(() => undefined)}
            >
              Start a new one
            </button>
          </li>
        )}
      </ol>

      {actions.length > 0 && (
        <div className="chat-actions">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => send(action.message)}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      <form
        className="chat-composer"
        onSubmit={(event) => {
          event.preventDefault();
          send(draft);
          setDraft('');
        }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask about sizing, delivery, returns…"
          autoFocus
        />
        <button type="submit" aria-label="Send" disabled={!draft.trim()}>
          ↑
        </button>
      </form>
    </section>
  );
}

function ChatMessage({ message, name }: { message: Message; name: string }) {
  if (message.kind === 'error') {
    return (
      <li className="chat-notice">
        Something went wrong on our side. Please try again.
      </li>
    );
  }
  return (
    <li
      className={`chat-message is-${message.role} ${message.status === 'sending' ? 'is-sending' : ''}`}
    >
      {message.role !== 'user' && (
        <span className="chat-author">
          {message.role === 'agent'
            ? (message.authorName ?? 'Support team')
            : name}
        </span>
      )}
      <p>{message.text}</p>
      {message.status === 'failed' && (
        <span className="chat-failed">Not delivered</span>
      )}
    </li>
  );
}

function statusLabel(state: ChatState) {
  if (state.conversation?.isHandledByHuman) return 'A team member joined';
  if (state.activity.kind !== 'idle') return 'Answering…';
  if (state.connection === 'connecting') return 'Connecting…';
  if (state.connection === 'disconnected' || state.connection === 'suspended')
    return 'Reconnecting…';
  return 'Usually replies instantly';
}
