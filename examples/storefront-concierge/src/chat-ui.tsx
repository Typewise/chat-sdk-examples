import {
  AssistantRuntimeProvider,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useAuiState,
  useExternalStoreRuntime,
  type AppendMessage,
  type ThreadMessageLike,
} from '@assistant-ui/react';
import { MarkdownTextPrimitive } from '@assistant-ui/react-markdown';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from 'react';
import type { ChatState, Message, TypewiseClient } from '@typewise/chat-sdk';

type ChatContextValue = { chat: TypewiseClient; state: ChatState };
const ChatContext = createContext<ChatContextValue | null>(null);
export const useChat = () => useContext(ChatContext)!;

type Custom = {
  sdkRole: Message['role'];
  kind: Message['kind'];
  status: Message['status'];
  authorName?: string;
  error?: string;
  quickActions: { label: string; message: string }[];
};

const quickActionPattern = /<QuickActions\.Item((?:\s+[\w-]+="[^"]*")*)\s*\/>/g;
const attributePattern = /([\w-]+)="([^"]+)"/g;

function parseQuickAction(attributes: string) {
  const values = new Map(
    [...attributes.matchAll(attributePattern)].map(([, key, value]) => [
      key!,
      value!,
    ]),
  );
  const label = values.get('label');
  return label ? [{ label, message: values.get('message') ?? label }] : [];
}

function convertMessage(message: Message): ThreadMessageLike {
  const quickActions = [
    ...(message.content ?? '').matchAll(quickActionPattern),
  ].flatMap(([, attributes]) => parseQuickAction(attributes ?? ''));
  const custom: Custom = {
    sdkRole: message.role,
    kind: message.kind,
    status: message.status,
    quickActions,
    ...(message.authorName && { authorName: message.authorName }),
    ...(message.error && { error: message.error.message }),
  };
  return {
    id: message.id,
    role: message.role === 'user' ? 'user' : 'assistant',
    content: [{ type: 'text', text: message.text }],
    createdAt: new Date(message.createdAt),
    metadata: { custom },
  };
}

const textOf = (message: AppendMessage) =>
  message.content
    .map((part) => (part.type === 'text' ? part.text : ''))
    .join('\n')
    .trim();

const resumes = new WeakMap<TypewiseClient, Promise<void>>();

export function resumeChat(chat: TypewiseClient): Promise<void> {
  let resumed = resumes.get(chat);
  if (!resumed) {
    resumed = chat.resume().then(
      () => undefined,
      (error: unknown) => console.warn('[typewise]', error),
    );
    resumes.set(chat, resumed);
  }
  return resumed;
}

/** One SDK client and one runtime, shared by every chat surface on the page. */
export function ChatProvider({
  chat,
  children,
}: {
  chat: TypewiseClient;
  children: ReactNode;
}) {
  const state = useSyncExternalStore(chat.subscribe, chat.getState);

  useEffect(() => {
    void resumeChat(chat);
  }, [chat]);

  const runtime = useExternalStoreRuntime<Message>({
    messages: state.messages,
    convertMessage,
    onNew: async (message) => {
      await chat.sendMessage(textOf(message)).catch(() => undefined);
    },
  });

  const brand = state.config?.primaryColor;
  return (
    <ChatContext.Provider value={{ chat, state }}>
      <AssistantRuntimeProvider runtime={runtime}>
        <div
          className="tw"
          style={brand ? ({ '--tw-brand': brand } as CSSProperties) : undefined}
        >
          {children}
        </div>
      </AssistantRuntimeProvider>
    </ChatContext.Provider>
  );
}

export const assistantName = (state: ChatState) =>
  state.config?.aiAssistantName ?? 'Lumi';

export const hasUserMessages = (state: ChatState) =>
  state.messages.some((message) => message.role === 'user');

export function Avatar({ large }: { large?: boolean }) {
  const { state } = useChat();
  const logo = state.config?.logo;
  return (
    <span className={`tw-avatar ${large ? 'is-large' : ''}`}>
      {logo ? <img src={logo} alt="" /> : <SparkIcon />}
    </span>
  );
}

export function LiveStatus() {
  const { state } = useChat();
  const { connection, conversation, activity } = state;
  const label = conversation?.isHandledByHuman
    ? 'Team member joined'
    : activity.kind !== 'idle'
      ? 'Answering…'
      : connection === 'connecting'
        ? 'Connecting…'
        : connection === 'disconnected' || connection === 'suspended'
          ? 'Reconnecting…'
          : 'Online';
  const online = connection === 'connected' || connection === 'idle';
  return (
    <span className="tw-live">
      <span className={`tw-dot ${online ? 'is-online' : ''}`} />
      {label}
    </span>
  );
}

export function Suggestion({
  prompt,
  children,
}: {
  prompt: string;
  children?: ReactNode;
}) {
  return (
    <ThreadPrimitive.Suggestion prompt={prompt} send className="tw-chip">
      {children ?? prompt}
    </ThreadPrimitive.Suggestion>
  );
}

export function ConversationThread({ className }: { className?: string }) {
  return (
    <ThreadPrimitive.Viewport className={`tw-viewport ${className ?? ''}`}>
      <ThreadPrimitive.Messages>
        {({ message }) =>
          message.role === 'user' ? <UserMessage /> : <AssistantMessage />
        }
      </ThreadPrimitive.Messages>
      <TypingIndicator />
      <ClosedBanner />
    </ThreadPrimitive.Viewport>
  );
}

export function Composer({
  placeholder,
  autoFocus,
  leading,
}: {
  placeholder: string;
  autoFocus?: boolean;
  leading?: ReactNode;
}) {
  return (
    <ComposerPrimitive.Root className="tw-composer">
      {leading}
      <ComposerPrimitive.Input
        className="tw-input"
        placeholder={placeholder}
        rows={1}
        autoFocus={autoFocus}
      />
      <ComposerPrimitive.Send className="tw-send" aria-label="Send">
        <ArrowUpIcon />
      </ComposerPrimitive.Send>
    </ComposerPrimitive.Root>
  );
}

const useCustom = () =>
  useAuiState((s) => s.message.metadata.custom as unknown as Custom);

function UserMessage() {
  const custom = useCustom();
  return (
    <MessagePrimitive.Root className="tw-row is-user">
      <div
        className={`tw-bubble is-user ${custom.status === 'sending' ? 'is-sending' : ''}`}
      >
        <MessagePrimitive.Parts />
      </div>
      {custom.status === 'failed' && (
        <p className="tw-failed">
          Not delivered{custom.error ? ` · ${custom.error}` : ''}
        </p>
      )}
    </MessagePrimitive.Root>
  );
}

function MarkdownText() {
  return <MarkdownTextPrimitive className="tw-markdown" />;
}

function AssistantMessage() {
  const custom = useCustom();
  const isLast = useAuiState((s) => s.message.isLast);
  const { state } = useChat();

  if (custom.kind === 'error') {
    return (
      <MessagePrimitive.Root className="tw-notice">
        Something went wrong on our side. Please try again in a moment.
      </MessagePrimitive.Root>
    );
  }

  const isAgent = custom.sdkRole === 'agent';
  return (
    <MessagePrimitive.Root className="tw-row is-assistant">
      <Avatar />
      <div className="tw-stack">
        <span className="tw-author">
          {isAgent
            ? (custom.authorName ?? 'Support team')
            : assistantName(state)}
          {isAgent && <em>Team</em>}
        </span>
        {custom.kind === 'csat_request' ? (
          <CsatCard />
        ) : custom.kind === 'email_verification_requested' ? (
          <VerificationCard />
        ) : custom.kind === 'email_verification_verified' ? (
          <div className="tw-bubble is-assistant">
            Thanks, your email is verified ✓
          </div>
        ) : (
          <div className="tw-bubble is-assistant">
            <MessagePrimitive.Parts components={{ Text: MarkdownText }} />
          </div>
        )}
        {isLast && custom.quickActions.length > 0 && (
          <div className="tw-chips">
            {custom.quickActions.map((action) => (
              <Suggestion key={action.label} prompt={action.message}>
                {action.label}
              </Suggestion>
            ))}
          </div>
        )}
      </div>
    </MessagePrimitive.Root>
  );
}

function CsatCard() {
  const { chat } = useChat();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [sent, setSent] = useState(false);
  return (
    <div className="tw-card">
      <p>
        {sent
          ? 'Thank you for your feedback!'
          : 'How would you rate this conversation?'}
      </p>
      <div className="tw-stars" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            disabled={sent}
            className={value <= (hover || rating) ? 'is-on' : ''}
            onMouseEnter={() => setHover(value)}
            onClick={() => {
              setRating(value);
              chat.csat.submit({ rating: value }).then(
                () => setSent(true),
                () => undefined,
              );
            }}
            aria-label={`${value} star${value > 1 ? 's' : ''}`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

function VerificationCard() {
  const { chat } = useChat();
  const [code, setCode] = useState('');
  const [result, setResult] = useState<string | null>(null);
  return (
    <form
      className="tw-card"
      onSubmit={(event) => {
        event.preventDefault();
        chat.verification.verifyCode(code).then(
          (r) =>
            setResult(
              r.success ? 'Verified ✓' : 'That code didn’t work, try again.',
            ),
          () => setResult('Could not verify right now.'),
        );
      }}
    >
      <p>We sent a 6-digit code to your email.</p>
      <div className="tw-code">
        <input
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
          }
          placeholder="123456"
          inputMode="numeric"
        />
        <button disabled={code.length !== 6}>Verify</button>
      </div>
      {result && <small>{result}</small>}
    </form>
  );
}

function TypingIndicator() {
  const { state } = useChat();
  const { activity } = state;
  if (activity.kind === 'idle') return null;
  const label =
    activity.kind === 'agent_typing'
      ? 'Typing…'
      : activity.kind === 'waiting_for_agent'
        ? 'Connecting you with our team…'
        : (activity.text ?? `${assistantName(state)} is thinking…`);
  return (
    <div className="tw-row is-assistant tw-typing">
      <Avatar />
      <div className="tw-bubble is-assistant">
        <span className="tw-dots">
          <i />
          <i />
          <i />
        </span>
        <span className="tw-typing-label">{label}</span>
      </div>
    </div>
  );
}

function ClosedBanner() {
  const { chat, state } = useChat();
  if (!state.conversation?.isClosed) return null;
  return (
    <div className="tw-closed">
      <span>This conversation has ended.</span>
      <button
        onClick={() => chat.startNewConversation().catch(() => undefined)}
      >
        Start a new one
      </button>
    </div>
  );
}

const svg = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export const Icon = ({
  children,
  size = 20,
}: {
  children: ReactNode;
  size?: number;
}) => (
  <svg {...svg} width={size} height={size}>
    {children}
  </svg>
);
export const SparkIcon = () => (
  <Icon size={18}>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
    <path d="M19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" />
  </Icon>
);
export const RefreshIcon = () => (
  <Icon size={16}>
    <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.3L3 16M3 21v-5h5" />
  </Icon>
);
const ArrowUpIcon = () => (
  <Icon size={18}>
    <path d="M12 19V5M5 12l7-7 7 7" />
  </Icon>
);
