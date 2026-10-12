import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';

export type TriggerId = 'exit-intent' | 'scroll-depth' | 'dwell' | 'idle-cart';

export type TriggerStatus = 'armed' | 'fired' | 'suppressed';

export const TRIGGERS: Record<TriggerId, { label: string; rule: string }> = {
  dwell: {
    label: 'Dwell time',
    rule: '12 s on delivery options without choosing',
  },
  'scroll-depth': {
    label: 'Scroll depth',
    rule: 'Scrolled past 70% of the page',
  },
  'exit-intent': {
    label: 'Exit intent',
    rule: 'Pointer leaves through the top of the window',
  },
  'idle-cart': { label: 'Idle cart', rule: '30 s without any interaction' },
};

const FIRED_KEY = 'tw-chat-sdk-examples:fired-triggers';
const DWELL_MS = 12_000;
const IDLE_MS = 30_000;

const loadFired = () =>
  new Set<TriggerId>(
    JSON.parse(sessionStorage.getItem(FIRED_KEY) ?? '[]') as TriggerId[],
  );

/**
 * Watches the page for moments where a visitor may need help. Each trigger fires
 * at most once per browser session, and never while `paused` (chat open, a
 * conversation already started, or another nudge on screen).
 */
export function useProactiveTriggers({
  paused,
  dwellTarget,
  onFire,
}: {
  paused: boolean;
  dwellTarget: RefObject<HTMLElement | null>;
  onFire: (id: TriggerId) => void;
}) {
  const [fired, setFired] = useState(loadFired);
  const latest = useRef({ paused, fired, onFire });
  latest.current = { paused, fired, onFire };

  const fire = useCallback((id: TriggerId, force = false) => {
    const { paused, fired, onFire } = latest.current;
    if (!force && (paused || fired.has(id))) return;
    const next = new Set(fired).add(id);
    sessionStorage.setItem(FIRED_KEY, JSON.stringify([...next]));
    setFired(next);
    onFire(id);
  }, []);

  const reset = useCallback(() => {
    sessionStorage.removeItem(FIRED_KEY);
    setFired(new Set());
  }, []);

  useEffect(() => {
    const onMouseOut = (event: MouseEvent) => {
      if (!event.relatedTarget && event.clientY <= 0) fire('exit-intent');
    };
    const onScroll = () => {
      const { scrollY, innerHeight } = window;
      const depth = (scrollY + innerHeight) / document.body.scrollHeight;
      if (depth > 0.7) fire('scroll-depth');
    };

    let idleTimer: ReturnType<typeof setTimeout>;
    const resetIdle = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => fire('idle-cart'), IDLE_MS);
    };
    const activity = ['pointermove', 'keydown', 'scroll', 'click'] as const;

    document.addEventListener('mouseout', onMouseOut);
    window.addEventListener('scroll', onScroll, { passive: true });
    for (const type of activity) {
      window.addEventListener(type, resetIdle, { passive: true });
    }
    resetIdle();

    let dwellTimer: ReturnType<typeof setTimeout> | undefined;
    const stopDwell = () => {
      clearTimeout(dwellTimer);
      dwellTimer = undefined;
    };
    const target = dwellTarget.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          dwellTimer ??= setTimeout(() => fire('dwell'), DWELL_MS);
        } else {
          stopDwell();
        }
      },
      { threshold: 0.6 },
    );
    // Choosing an option is the opposite of hesitating.
    target?.addEventListener('change', stopDwell);
    if (target) observer.observe(target);

    return () => {
      document.removeEventListener('mouseout', onMouseOut);
      window.removeEventListener('scroll', onScroll);
      for (const type of activity) {
        window.removeEventListener(type, resetIdle);
      }
      clearTimeout(idleTimer);
      stopDwell();
      target?.removeEventListener('change', stopDwell);
      observer.disconnect();
    };
  }, [dwellTarget, fire]);

  const statusOf = (id: TriggerId): TriggerStatus =>
    fired.has(id) ? 'fired' : paused ? 'suppressed' : 'armed';

  return { statusOf, fire, reset };
}
