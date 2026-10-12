import { useState, useSyncExternalStore } from 'react';
import type { TypewiseClient } from '@typewise/chat-sdk';
import { clearSettings, saveSettings, type Settings } from './settings';

export function ConnectPanel({
  chat,
  settings,
}: {
  chat: TypewiseClient | null;
  settings: Settings;
}) {
  const [open, setOpen] = useState(!settings.clientId);

  return (
    <div className={`dev ${open ? 'is-open' : ''}`}>
      <button className="dev-toggle" onClick={() => setOpen(!open)}>
        <span className={`dev-dot ${chat ? 'is-on' : ''}`} />
        {chat ? 'Connected' : 'Connect Typewise'}
      </button>
      {open && (
        <div className="dev-panel">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              saveSettings(
                Object.fromEntries(
                  new FormData(event.currentTarget),
                ) as Settings,
              );
            }}
          >
            <label>
              Client ID
              <input
                name="clientId"
                defaultValue={settings.clientId}
                required
              />
            </label>
            <label>
              Workspace ID
              <input
                name="workspaceId"
                defaultValue={settings.workspaceId}
                placeholder="optional"
              />
            </label>
            <label>
              API base URL
              <input
                name="baseUrl"
                defaultValue={settings.baseUrl}
                placeholder="https://platform-api.typewise.app"
              />
            </label>
            <button type="submit">Save &amp; reload</button>
          </form>
          {chat ? (
            <ConnectionStatus chat={chat} />
          ) : (
            <p>
              Enter your Typewise client ID to talk to your own AI agent. It is
              stored in this browser only.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ConnectionStatus({ chat }: { chat: TypewiseClient }) {
  const state = useSyncExternalStore(chat.subscribe, chat.getState);
  return (
    <>
      <dl>
        <dt>Connection</dt>
        <dd>{state.connection}</dd>
        <dt>Conversation</dt>
        <dd>{state.conversation ? state.conversation.status : 'none'}</dd>
        <dt>Activity</dt>
        <dd>{state.activity.kind}</dd>
        <dt>Messages</dt>
        <dd>{state.messages.length}</dd>
      </dl>
      <div className="dev-actions">
        <button onClick={() => chat.close()}>Close conversation</button>
        <button onClick={() => chat.resetSession()}>Reset visitor</button>
        <button onClick={clearSettings}>Forget settings</button>
      </div>
      <p className="dev-hint">
        The client is available as <code>window.chat</code> in the console.
      </p>
    </>
  );
}
