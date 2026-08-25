import { Linking } from 'react-native';
import {
  backButton,
  hapticFeedback,
  init,
  initData,
  isTMA,
  mainButton,
  miniApp,
  openTelegramLink,
  popup,
  themeParams,
  viewport,
  type ImpactHapticFeedbackStyle,
  type NotificationHapticFeedbackType,
  type PopupButton,
  type User,
} from '@tma.js/sdk';

let initialized = false;
let mainButtonClickCleanup: (() => void) | undefined;
let backButtonClickCleanup: (() => void) | undefined;

/**
 * Initializes the Telegram Mini Apps SDK and mounts the components we use.
 * Safe to call outside Telegram; it becomes a no-op.
 * Returns a cleanup function.
 */
export function initTelegram(): () => void {
  if (!isTMA() || initialized) {
    return () => {};
  }

  initialized = true;
  let cleanup: () => void;

  try {
    cleanup = init();
  } catch (error) {
    console.error('Failed to initialize Telegram SDK:', error);
    initialized = false;
    return () => {};
  }

  try {
    miniApp.mount();
    viewport.mount();
    themeParams.mount();
    mainButton.mount();
    backButton.mount();
    initData.restore();

    // Bind CSS variables so the UI can read Telegram theme and safe-area values.
    miniApp.bindCssVars();
    viewport.bindCssVars();
    themeParams.bindCssVars();

    // Expand to full height and notify Telegram the app is ready.
    viewport.expand();
    miniApp.ready();
  } catch {
    // SDK methods throw if the current Telegram client doesn't support a
    // feature. We degrade gracefully.
  }

  return () => {
    try {
      mainButtonClickCleanup?.();
      backButtonClickCleanup?.();
      miniApp.unmount();
      themeParams.unmount();
      mainButton.unmount();
      backButton.unmount();
    } catch {
      // ignore
    }
    cleanup();
    initialized = false;
  };
}

/** Returns true when running inside Telegram. */
export function isTelegram(): boolean {
  try {
    return isTMA();
  } catch {
    return false;
  }
}

/** Returns the Telegram user from initData, if available. */
export function getTelegramUser(): User | undefined {
  if (!isTelegram()) return undefined;
  try {
    return initData.user();
  } catch {
    return undefined;
  }
}

export interface MainButtonConfig {
  text: string;
  onClick?: () => void;
  visible?: boolean;
  enabled?: boolean;
  isLoaderVisible?: boolean;
  hasShineEffect?: boolean;
}

/**
 * Configures Telegram's native main button.
 * If `visible` is omitted, the button is shown whenever text is provided.
 */
export function setMainButton(config: MainButtonConfig): void {
  if (!isTelegram()) return;

  try {
    const visible = config.visible ?? true;

    mainButton.setParams({
      text: config.text,
      isEnabled: config.enabled ?? true,
      isLoaderVisible: config.isLoaderVisible ?? false,
      hasShineEffect: config.hasShineEffect ?? false,
      isVisible: visible,
    });

    mainButtonClickCleanup?.();
    if (config.onClick) {
      mainButtonClickCleanup = mainButton.onClick(config.onClick);
    }

    if (visible) {
      mainButton.show();
    } else {
      mainButton.hide();
    }
  } catch {
    // ignore unsupported clients
  }
}

/** Hides the Telegram main button and removes its click handler. */
export function hideMainButton(): void {
  if (!isTelegram()) return;
  try {
    mainButtonClickCleanup?.();
    mainButtonClickCleanup = undefined;
    mainButton.hide();
  } catch {
    // ignore
  }
}

export interface BackButtonConfig {
  visible: boolean;
  onClick?: () => void;
}

/** Configures Telegram's native back button. */
export function setBackButton(config: BackButtonConfig): void {
  if (!isTelegram()) return;

  try {
    backButtonClickCleanup?.();
    if (config.onClick) {
      backButtonClickCleanup = backButton.onClick(config.onClick);
    }

    if (config.visible) {
      backButton.show();
    } else {
      backButton.hide();
    }
  } catch {
    // ignore
  }
}

/** Hides the Telegram back button and removes its click handler. */
export function hideBackButton(): void {
  if (!isTelegram()) return;
  try {
    backButtonClickCleanup?.();
    backButtonClickCleanup = undefined;
    backButton.hide();
  } catch {
    // ignore
  }
}

/** Triggers a Telegram notification haptic (success/error/warning). */
export function hapticNotification(type: NotificationHapticFeedbackType): void {
  if (!isTelegram()) return;
  try {
    hapticFeedback.notificationOccurred(type);
  } catch {
    // ignore
  }
}

/** Triggers a Telegram impact haptic. */
export function hapticImpact(style: ImpactHapticFeedbackStyle): void {
  if (!isTelegram()) return;
  try {
    hapticFeedback.impactOccurred(style);
  } catch {
    // ignore
  }
}

export interface AlertButton {
  id: string;
  text: string;
  type?: 'default' | 'destructive';
  onPress?: () => void;
}

function toPopupButtons(buttons: AlertButton[] | undefined): PopupButton[] {
  if (!buttons || buttons.length === 0) {
    return [{ id: 'ok', type: 'default', text: 'OK' }];
  }
  return buttons.map((b) => ({
    id: b.id,
    text: b.text,
    type: b.type ?? 'default',
  }));
}

/**
 * Shows a Telegram native popup when inside Telegram, otherwise falls back
 * to `window.alert`. Returns the id of the button that was pressed, or
 * undefined if dismissed.
 */
export async function showAlert(
  title: string,
  message: string,
  buttons?: AlertButton[]
): Promise<string | undefined> {
  if (isTelegram()) {
    try {
      const buttonId = await popup.show({
        title,
        message,
        buttons: toPopupButtons(buttons),
      });
      const pressed = buttons?.find((b) => b.id === buttonId);
      pressed?.onPress?.();
      return buttonId;
    } catch {
      // fall through to browser fallback
    }
  }

  if (typeof window !== 'undefined') {
    window.alert(`${title}\n\n${message}`);
    buttons?.[0]?.onPress?.();
    return buttons?.[0]?.id;
  }

  return undefined;
}

/**
 * Shows a confirmation dialog and resolves with the clicked button id, or
 * null if dismissed. Falls back to `window.confirm` outside Telegram.
 */
export async function showConfirm(
  title: string,
  message: string,
  confirmText = 'Yes',
  cancelText = 'No'
): Promise<string | null> {
  if (isTelegram()) {
    try {
      const buttonId = await popup.show({
        title,
        message,
        buttons: [
          { id: 'cancel', type: 'default', text: cancelText },
          { id: 'confirm', type: 'default', text: confirmText },
        ],
      });
      return buttonId ?? null;
    } catch {
      // fall through
    }
  }

  if (typeof window !== 'undefined') {
    return window.confirm(message) ? 'confirm' : 'cancel';
  }

  return null;
}

/** Opens a Telegram user/channel chat. Inside Telegram this closes the Mini App and opens the chat natively. */
export async function openTelegramChat(username: string): Promise<void> {
  const url = `https://t.me/${username.replace(/^@/, '')}`;

  if (isTelegram()) {
    try {
      openTelegramLink(url);
      return;
    } catch {
      // fall through to browser fallback
    }
  }

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      window.open(url, '_blank');
    }
  } catch {
    window.open(url, '_blank');
  }
}
