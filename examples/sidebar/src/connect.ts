import type { TypewiseClient } from '@typewise/chat-sdk';
import { clearSettings, saveSettings, type Settings } from './settings';
import './connect.css';

export function mountConnectPanel(
  settings: Settings,
  chat: TypewiseClient | null,
): void {
  const root = document.createElement('div');
  root.className = 'dev';
  root.innerHTML = `
    <button class="dev-toggle" type="button">
      <span class="dev-dot ${chat ? 'is-on' : ''}"></span>
      ${chat ? 'Connected' : 'Connect Typewise'}
    </button>
    <div class="dev-panel" hidden>
      <form>
        <label>Client ID <input name="clientId" required /></label>
        <label>Workspace ID <input name="workspaceId" placeholder="optional" /></label>
        <label>API base URL <input name="baseUrl" placeholder="https://platform-api.typewise.app" /></label>
        <button type="submit">Save &amp; reload</button>
      </form>
      <dl></dl>
      <div class="dev-actions"></div>
      <p class="dev-hint"></p>
    </div>`;
  document.body.append(root);

  const panel = root.querySelector<HTMLElement>('.dev-panel')!;
  const form = root.querySelector('form')!;
  for (const [key, value] of Object.entries(settings)) {
    form.querySelector<HTMLInputElement>(`[name="${key}"]`)!.value = value;
  }
  const setOpen = (open: boolean) => {
    panel.hidden = !open;
    root.classList.toggle('is-open', open);
  };
  setOpen(!chat);
  root
    .querySelector('.dev-toggle')!
    .addEventListener('click', () => setOpen(panel.hidden));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    saveSettings(Object.fromEntries(new FormData(form)) as Settings);
  });

  const hint = root.querySelector<HTMLElement>('.dev-hint')!;
  if (!chat) {
    root.querySelector('dl')!.remove();
    root.querySelector('.dev-actions')!.remove();
    hint.textContent =
      'Enter your Typewise client ID to talk to your own AI agent. It is stored in this browser only.';
    return;
  }

  hint.innerHTML =
    'The client is available as <code>window.chat</code> in the console.';
  root.querySelector('.dev-actions')!.append(
    actionButton('Close conversation', () => chat.close()),
    actionButton('Reset visitor', () => chat.resetSession()),
    actionButton('Forget settings', clearSettings),
  );
  const status = root.querySelector('dl')!;
  const renderStatus = () => {
    const state = chat.getState();
    status.replaceChildren(
      ...[
        ['Connection', state.connection],
        ['Conversation', state.conversation?.status ?? 'none'],
        ['Activity', state.activity.kind],
        ['Messages', String(state.messages.length)],
      ].flatMap(([term, value]) => [
        Object.assign(document.createElement('dt'), { textContent: term }),
        Object.assign(document.createElement('dd'), { textContent: value }),
      ]),
    );
  };
  chat.subscribe(renderStatus);
  renderStatus();
}

function actionButton(label: string, onClick: () => unknown) {
  const button = Object.assign(document.createElement('button'), {
    type: 'button',
    textContent: label,
  });
  button.addEventListener('click', () => void onClick());
  return button;
}
