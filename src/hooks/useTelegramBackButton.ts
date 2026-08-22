import { useEffect, useRef } from 'react';
import { hideBackButton, setBackButton } from '../lib/telegram';

/**
 * Drives the Telegram native back button. Shows/hides it when `visible`
 * changes and keeps the click handler current without re-binding on every
 * render. Hides the button on unmount.
 */
export function useTelegramBackButton(
  visible: boolean,
  onClick?: () => void
): void {
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  useEffect(() => {
    setBackButton({
      visible,
      onClick: () => onClickRef.current?.(),
    });
    return () => {
      hideBackButton();
    };
  }, [visible]);
}
