import { useMemo } from 'react';
import { useSignal } from '@tma.js/sdk-react';
import {
  initData,
  isTMA,
  themeParams,
  viewport,
  type User,
  type ViewportState,
} from '@tma.js/sdk';
import type { ThemeParams as ThemeParamsType } from '@tma.js/types';

function useOptionalSignal<T>(signal: { (): T; sub(fn: () => void): () => void }): T | undefined {
  try {
    return useSignal(signal);
  } catch {
    return undefined;
  }
}

export interface UseTelegramResult {
  /** True when running inside the Telegram client. */
  isInTelegram: boolean;
  /** Telegram user from initData, if the client provided it. */
  telegramUser: User | undefined;
  /** Current Telegram theme parameters. */
  themeParams: ThemeParamsType | undefined;
  /** Current Telegram viewport state. */
  viewport: ViewportState | undefined;
}

/**
 * React hook that returns Telegram Mini Apps state.
 * Safe to use outside Telegram — all values will be undefined/false.
 */
export function useTelegram(): UseTelegramResult {
  const isInTelegram = useMemo(() => {
    try {
      return isTMA();
    } catch {
      return false;
    }
  }, []);

  const telegramUser = useOptionalSignal<User | undefined>(initData.user);
  const themeParamsState = useOptionalSignal<ThemeParamsType>(themeParams.state as unknown as { (): ThemeParamsType; sub(fn: () => void): () => void });
  const viewportState = useOptionalSignal<ViewportState>(viewport.state);

  return {
    isInTelegram,
    telegramUser,
    themeParams: themeParamsState,
    viewport: viewportState,
  };
}
