import { useEffect, useRef } from 'react';
import { hideMainButton, setMainButton, type MainButtonConfig } from '../lib/telegram';

/**
 * Drives the Telegram native main button. Configures it whenever the
 * visible properties change and automatically hides it when the component
 * unmounts. The `onClick` callback is always up-to-date without re-binding
 * on every render.
 */
export function useTelegramMainButton(config: MainButtonConfig): void {
  const configRef = useRef(config);
  configRef.current = config;

  // Initial setup + cleanup on unmount.
  useEffect(() => {
    setMainButton(configRef.current);
    return () => {
      hideMainButton();
    };
  }, []);

  // Update button properties when they change.
  useEffect(() => {
    setMainButton({
      ...config,
      onClick: () => configRef.current.onClick?.(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    config.text,
    config.visible,
    config.enabled,
    config.isLoaderVisible,
    config.hasShineEffect,
  ]);
}
