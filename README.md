# Typewise Chat SDK examples

Live demos of custom chat experiences built with [`@typewise/chat-sdk`](https://www.npmjs.com/package/@typewise/chat-sdk), the headless TypeScript client for Typewise AI conversations.

**Try them:** [typewise.github.io/chat-sdk-examples](https://typewise.github.io/chat-sdk-examples/)
**Read the guide:** [docs.typewise.app/guides/channels/chat-sdk](https://docs.typewise.app/guides/channels/chat-sdk)

| Example                                                | What it shows                                                                                                                                 | Stack                         |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| [Storefront concierge](examples/storefront-concierge/) | The conversation lives in a product page's buy column, knows the selected finish and quantity, and opens as a ⌘K command palette from search. | React, assistant-ui           |
| [Docs sidebar](examples/sidebar/)                      | A docked help panel that tells the assistant which docs section the reader is on and suggests questions for it.                               | TypeScript, no framework      |
| [Proactive prompts](examples/proactive-prompts/)       | A checkout that offers help on dwell time, scroll depth, exit intent and an idle cart, then starts the conversation with the cart as context. | React, `useSyncExternalStore` |
| [Script tag](examples/script-tag/)                     | One HTML file that loads the SDK from the Typewise CDN. No bundler.                                                                           | HTML                          |

## Run locally

Requires Node 20 or later.

```sh
npm install
npm run dev:storefront   # or dev:sidebar, dev:proactive, dev:script-tag
```

Each demo asks for a Typewise client ID on first load, using the "Connect Typewise" pill in the bottom left. Find yours in the Typewise platform under **Channels → Chat → Installation**: it is the `clientId` in the Quick start snippet. You can also pass it in the URL (`?clientId=…&workspaceId=…`), or set it at build time in `.env.local` inside an example:

```sh
VITE_TW_CLIENT_ID=your-client-id
VITE_TW_WORKSPACE_ID=optional-workspace-id
VITE_TW_BASE_URL=optional-api-origin   # defaults to https://platform-api.typewise.app
```

The settings are stored in `localStorage` and shared by every demo on the same origin.

If your chat's **Domain allowlist** is not empty, add the origin you run the demos on (`localhost`, or `typewise.github.io` for the hosted site).

## Build the site

```sh
npm run build    # builds every example into site/
npm run preview  # serves site/ locally
```

Pushes to `main` deploy `site/` to GitHub Pages. The demo client ID comes from the `VITE_TW_CLIENT_ID` (and optional `VITE_TW_WORKSPACE_ID`) repository variables.

## Content Security Policy

If you copy an example into a site with a CSP, allow these in `connect-src`:

```
https://platform-api.typewise.app
https://*.ably.net wss://*.ably.net
https://*.ably-realtime.com wss://*.ably-realtime.com
https://*.ably.io wss://*.ably.io
https://*.amazonaws.com
```

The script-tag example also needs `https://platform.typewise.app` in `script-src`.

## License

[MIT](LICENSE)
