import { useSyncExternalStore } from 'react';
import type { ChatState, Message, TypewiseClient } from '@typewise/chat-sdk';

/** The whole React integration: the client is an external store. */
export function useChatState(chat: TypewiseClient): ChatState {
  return useSyncExternalStore(chat.subscribe, chat.getState, chat.getState);
}

export type QuickAction = { label: string; message: string };

const itemPattern = /<QuickActions\.Item((?:\s+[\w-]+="[^"]*")*)\s*\/>/g;
const attributePattern = /([\w-]+)="([^"]+)"/g;

/** Quick actions are MDX tags in `content`; answering one means sending its message as text. */
export function quickActionsOf(message: Message): QuickAction[] {
  return [...(message.content ?? '').matchAll(itemPattern)].flatMap(
    ([, attributes = '']) => {
      const values = new Map(
        [...attributes.matchAll(attributePattern)].map(
          ([, key = '', value = '']) => [key, value],
        ),
      );
      const label = values.get('label');
      return label ? [{ label, message: values.get('message') ?? label }] : [];
    },
  );
}
