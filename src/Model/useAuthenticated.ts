import { useSyncExternalStore } from "react";
import { AppState, ToastAndroid } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import * as ScreenCapture from "expo-screen-capture";
import useStore from "./Store";

let authenticated = false;
const listeners = new Set<() => void>();
let appStateSub: { remove: () => void } | null = null;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => authenticated;

// Blanket ban on screenshots and screen recording while authenticated: any screen can
// be showing locked data at that point. Sets FLAG_SECURE on Android, which also blanks
// the app switcher preview.
const setScreenCaptureAllowed = (allowed: boolean) => {
  const call = allowed ? ScreenCapture.allowScreenCaptureAsync() : ScreenCapture.preventScreenCaptureAsync();
  call.catch((error) => console.error("Could not change the screen capture setting", error));
};

const setAuthenticated = (value: boolean) => {
  if (authenticated === value) {
    return;
  }
  authenticated = value;
  setScreenCaptureAllowed(!value);
  if (value) {
    // Re-lock as soon as the app leaves the foreground. Only "background" counts:
    // Android reports it when the app is actually left, while a dialog on top of the
    // app (the OS authentication prompt included) does not.
    appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "background") {
        setAuthenticated(false);
      }
    });
  } else {
    appStateSub?.remove();
    appStateSub = null;
  }
  listeners.forEach((l) => l());
};

// The OS prompt already tells the user about cancellations and mistyped credentials,
// so only the errors it stays silent about get a toast.
const errorMessage = (error: string, forceBiometrics: boolean): string | null => {
  switch (error) {
    case "user_cancel":
    case "system_cancel":
    case "app_cancel":
    case "user_fallback":
    case "authentication_failed":
      return null;
    case "not_enrolled":
    case "no_hardware":
    case "not_available":
    case "passcode_not_set":
      return forceBiometrics
        ? "Set up a fingerprint or face unlock to open locked activities"
        : "Set up a screen lock to open locked activities";
    case "lockout":
    case "lockout_permanent":
      return "Too many failed attempts. Try again later.";
    default:
      return "Authentication failed";
  }
};

/**
 * Prompt for device authentication, unlocking locked activities for every consumer
 * of `useAuthenticated`. Resolves to the resulting authentication state.
 *
 * Honours the "Force biometrics" setting by disabling the pattern/password fallback.
 * A no-op if the user is already authenticated.
 */
export const authenticate = async (): Promise<boolean> => {
  if (authenticated) {
    return true;
  }
  const forceBiometrics = useStore.getState().forceBiometrics;
  await LocalAuthentication.cancelAuthenticate();
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Unlock locked activities",
    biometricsSecurityLevel: "weak",
    disableDeviceFallback: forceBiometrics,
  });
  if (result.success) {
    setAuthenticated(true);
    return true;
  }
  const message = errorMessage(result.error, forceBiometrics);
  if (message !== null) {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  }
  return false;
};

/** Lock the locked activities back up, without going through the OS prompt. */
export const deauthenticate = () => setAuthenticated(false);

/**
 * Whether the user has authenticated in this app session. Locked activities are only
 * reachable while this is true.
 *
 * Backed by a single module-level flag shared across all consumers via
 * useSyncExternalStore, so every screen sees the same state and re-renders when it
 * flips. Deliberately short-lived: authentication is dropped when the app is
 * backgrounded, and never persisted across restarts.
 */
export const useAuthenticated = (): boolean => useSyncExternalStore(subscribe, getSnapshot);
