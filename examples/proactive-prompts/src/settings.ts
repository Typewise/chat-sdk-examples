/// <reference types="vite/client" />

export type Settings = {
  clientId: string;
  workspaceId: string;
  baseUrl: string;
};

const SETTINGS_KEY = 'tw-chat-sdk-examples:settings';

export function loadSettings(): Settings {
  const params = new URLSearchParams(location.search);
  const saved = JSON.parse(
    localStorage.getItem(SETTINGS_KEY) ?? '{}',
  ) as Partial<Settings>;
  const pick = (key: keyof Settings, env: string | undefined) =>
    params.get(key) ?? saved[key] ?? env ?? '';
  return {
    clientId: pick('clientId', import.meta.env.VITE_TW_CLIENT_ID),
    workspaceId: pick('workspaceId', import.meta.env.VITE_TW_WORKSPACE_ID),
    baseUrl: pick('baseUrl', import.meta.env.VITE_TW_BASE_URL),
  };
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  location.search = '';
}

export function clearSettings(): void {
  localStorage.removeItem(SETTINGS_KEY);
  location.search = '';
}
