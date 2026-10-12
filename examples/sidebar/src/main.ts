import {
  createClient,
  type ChatState,
  type Message,
  type TypewiseClient,
} from '@typewise/chat-sdk';
import { mountConnectPanel } from './connect';
import { quickActionsOf } from './quick-actions';
import { loadSettings } from './settings';
import './styles.css';

const PAGE = 'Northwind Analytics handbook';

const SUGGESTIONS: Record<string, string[]> = {
  'Getting started': [
    'How long does the first sync take?',
    'Can I connect a read-only database user?',
  ],
  Dashboards: [
    'How do I schedule a weekly PDF to Slack?',
    'How many tiles can a dashboard have?',
  ],
  Alerts: [
    'Why is my anomaly alert not firing yet?',
    'Can alerts go to PagerDuty?',
  ],
  'Plans and billing': [
    'What happens to my invoice if I upgrade mid-month?',
    'Is SSO included in the Team plan?',
  ],
};

let section = 'Getting started';

const settings = loadSettings();
const chat = settings.clientId
  ? createClient({
      clientId: settings.clientId,
      ...(settings.baseUrl && { baseUrl: settings.baseUrl }),
      ...(settings.workspaceId && { workspaceId: settings.workspaceId }),
      // Read when a conversation starts, so the first message already carries the context.
      variables: () => ({ docsPage: PAGE, docsSection: section }),
    })
  : null;
Object.assign(window, { chat });
mountConnectPanel(settings, chat);

const $ = <T extends Element>(selector: string) =>
  document.querySelector<T>(selector)!;
const toggle = $<HTMLButtonElement>('.help-toggle');
const panel = $<HTMLElement>('.help');
const title = $<HTMLElement>('.help-title');
const status = $<HTMLElement>('.help-status');
const context = $<HTMLElement>('.help-context');
const list = $<HTMLOListElement>('.help-messages');
const suggestions = $<HTMLElement>('.help-suggestions');
const form = $<HTMLFormElement>('.help-composer');
const input = $<HTMLTextAreaElement>('.help-composer textarea');

let resumed: Promise<unknown> | null = null;
const resume = (client: TypewiseClient) =>
  (resumed ??= client.resume().catch((error: unknown) => {
    console.warn('[typewise]', error);
  }));

function setOpen(open: boolean) {
  panel.hidden = !open;
  document.body.classList.toggle('is-help-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  if (open) {
    if (chat) void resume(chat);
    input.focus();
  }
}

toggle.addEventListener('click', () => setOpen(panel.hidden));
$('.help-close').addEventListener('click', () => setOpen(false));
$('.help-reset').addEventListener('click', () => {
  chat?.startNewConversation().catch(() => undefined);
});
window.addEventListener('keydown', (event) => {
  const typing =
    event.target instanceof HTMLElement &&
    event.target.closest('input, textarea, [contenteditable]');
  if (event.key === '?' && !typing) {
    event.preventDefault();
    setOpen(panel.hidden);
  }
  if (event.key === 'Escape' && !panel.hidden) setOpen(false);
});

function send(text: string) {
  const trimmed = text.trim();
  if (!chat || !trimmed) return;
  // Failed sends stay in the list with status 'failed'; nothing else to handle here.
  chat.sendMessage(trimmed).catch(() => undefined);
}

let typingTimer: ReturnType<typeof setTimeout> | undefined;
input.addEventListener('input', () => {
  input.style.height = 'auto';
  input.style.height = `${Math.min(input.scrollHeight, 140)}px`;
  if (!chat?.getState().conversation) return;
  if (!typingTimer) chat.setTyping(true).catch(() => undefined);
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    typingTimer = undefined;
    chat.setTyping(false).catch(() => undefined);
  }, 2000);
});
input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});
form.addEventListener('submit', (event) => {
  event.preventDefault();
  send(input.value);
  input.value = '';
  input.style.height = 'auto';
});

// Tell the assistant which section the reader is on, as they scroll.
const observer = new IntersectionObserver(
  (entries) => {
    const visible = entries.find((entry) => entry.isIntersecting);
    const next = (visible?.target as HTMLElement | undefined)?.dataset.section;
    if (!next || next === section) return;
    section = next;
    for (const link of document.querySelectorAll<HTMLAnchorElement>('.toc a')) {
      link.classList.toggle(
        'is-active',
        link.hash === `#${visible!.target.id}`,
      );
    }
    chat
      ?.setVariables({ variables: { docsPage: PAGE, docsSection: section } })
      .catch(() => undefined);
    render(chat?.getState() ?? null);
  },
  { rootMargin: '-35% 0px -60% 0px' },
);
for (const element of document.querySelectorAll('[data-section]')) {
  observer.observe(element);
}

const assistantName = (state: ChatState | null) =>
  state?.config?.aiAssistantName ?? 'Northwind AI';

function statusLabel(state: ChatState) {
  if (state.conversation?.isHandledByHuman) return 'A team member joined';
  if (state.activity.kind !== 'idle') return 'Answering…';
  if (state.connection === 'connecting') return 'Connecting…';
  if (state.connection === 'disconnected' || state.connection === 'suspended')
    return 'Reconnecting…';
  return 'Online';
}

function activityLabel(state: ChatState) {
  switch (state.activity.kind) {
    case 'agent_typing':
      return 'Typing…';
    case 'waiting_for_agent':
      return 'Connecting you with the team…';
    case 'ai_thinking':
      return state.activity.text ?? `${assistantName(state)} is thinking…`;
    default:
      return null;
  }
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
) {
  const element = document.createElement(tag);
  element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function chip(label: string, message = label) {
  const button = el('button', 'chip', label);
  button.type = 'button';
  button.addEventListener('click', () => send(message));
  return button;
}

function renderBody(message: Message, client: TypewiseClient) {
  switch (message.kind) {
    case 'error':
      return el(
        'p',
        'bubble is-notice',
        'Something went wrong on our side. Please try again.',
      );
    case 'email_verification_verified':
      return el('p', 'bubble', 'Thanks, your email is verified ✓');
    case 'csat_request': {
      const card = el(
        'div',
        'bubble card',
        'How helpful was this conversation?',
      );
      const stars = el('div', 'stars');
      for (const rating of [1, 2, 3, 4, 5]) {
        const star = el('button', 'star', '★');
        star.type = 'button';
        star.ariaLabel = `${rating} of 5`;
        star.addEventListener('click', () => {
          client.csat.submit({ rating }).then(
            () => card.replaceChildren('Thank you for your feedback!'),
            () => undefined,
          );
        });
        stars.append(star);
      }
      card.append(stars);
      return card;
    }
    case 'email_verification_requested': {
      const card = el(
        'form',
        'bubble card',
        `We sent a code to ${message.email ?? 'your email'}.`,
      );
      const code = el('input', 'code');
      code.inputMode = 'numeric';
      code.placeholder = '123456';
      const submit = el('button', 'chip', 'Verify');
      card.append(code, submit);
      card.addEventListener('submit', (event) => {
        event.preventDefault();
        client.verification.verifyCode(code.value.trim()).then(
          (result) => {
            if (!result.success) code.value = '';
            code.placeholder = result.success ? 'Verified ✓' : 'Try again';
          },
          () => undefined,
        );
      });
      return card;
    }
    default:
      return el('p', 'bubble', message.text);
  }
}

function renderMessage(
  message: Message,
  state: ChatState,
  client: TypewiseClient,
) {
  const item = el('li', `msg is-${message.role}`);
  if (message.status === 'sending') item.classList.add('is-sending');
  if (message.role === 'agent' || message.role === 'assistant') {
    item.append(
      el(
        'span',
        'author',
        message.role === 'agent'
          ? (message.authorName ?? 'Support team')
          : assistantName(state),
      ),
    );
  }
  item.append(renderBody(message, client));
  if (message.status === 'failed') {
    item.append(
      el(
        'span',
        'failed',
        `Not delivered${message.error ? ` · ${message.error.message}` : ''}`,
      ),
    );
  }
  return item;
}

// Reuse nodes for unchanged messages so card inputs keep their value across renders.
const rendered = new Map<string, { key: string; node: HTMLLIElement }>();

function messageNode(
  message: Message,
  state: ChatState,
  client: TypewiseClient,
) {
  const key = `${message.kind}|${message.status}|${message.text}|${assistantName(state)}`;
  const cached = rendered.get(message.id);
  if (cached?.key === key) return cached.node;
  const node = renderMessage(message, state, client);
  rendered.set(message.id, { key, node });
  return node;
}

function render(state: ChatState | null) {
  title.textContent = `Ask ${assistantName(state)}`;
  context.textContent = `Reading: ${section}`;
  input.disabled = !state;

  if (!chat || !state) {
    status.textContent = 'Not connected';
    list.replaceChildren(
      el(
        'li',
        'empty',
        'Connect a Typewise client (bottom left) to try the assistant.',
      ),
    );
    suggestions.replaceChildren();
    return;
  }

  status.textContent = statusLabel(state);
  const nearBottom =
    list.scrollHeight - list.scrollTop - list.clientHeight < 80;
  const items: HTMLLIElement[] = state.messages.map((message) =>
    messageNode(message, state, chat),
  );
  const activity = activityLabel(state);
  if (activity) items.push(el('li', 'msg is-assistant is-typing', activity));
  if (state.conversation?.isClosed) {
    const closed = el('li', 'closed', 'This conversation has ended. ');
    const restart = el('button', 'link', 'Start a new one');
    restart.type = 'button';
    restart.addEventListener('click', () => {
      chat.startNewConversation().catch(() => undefined);
    });
    closed.append(restart);
    items.push(closed);
  }
  list.replaceChildren(...items);
  if (nearBottom) list.scrollTop = list.scrollHeight;

  const last = state.messages.at(-1);
  const actions = last && last.role !== 'user' ? quickActionsOf(last) : [];
  const started = state.messages.some((message) => message.role === 'user');
  suggestions.replaceChildren(
    ...(actions.length
      ? actions.map((action) => chip(action.label, action.message))
      : started
        ? []
        : (SUGGESTIONS[section] ?? []).map((prompt) => chip(prompt))),
  );
}

if (chat) {
  chat.subscribe(render);
  void chat.getConfig().catch(() => undefined);
}
render(chat?.getState() ?? null);
