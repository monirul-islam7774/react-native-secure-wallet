import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';

/** Lock again if the app was in the background longer than this. */
export const AUTO_LOCK_MS = 30_000;
const LAST_UNLOCK_KEY = 'lastUnlockAt';

interface SecurityState {
  locked: boolean;
  biometricType: string | null;
  error: string | null;
  unlock: () => Promise<void>;
  lock: () => void;
}

const SecurityContext = createContext<SecurityState | null>(null);

async function describeBiometrics(): Promise<string | null> {
  const [hasHardware, enrolled, types] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
  ]);
  if (!hasHardware || !enrolled) return null;
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'Face ID';
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'Fingerprint';
  return 'Biometrics';
}

export function SecurityProvider({ children }: PropsWithChildren) {
  const [locked, setLocked] = useState(true);
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const backgroundedAt = useRef<number | null>(null);

  const lock = useCallback(() => setLocked(true), []);

  const unlock = useCallback(async () => {
    setError(null);
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Secure Wallet',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false, // allow device PIN/passcode when biometrics fail
    });
    if (result.success) {
      await SecureStore.setItemAsync(LAST_UNLOCK_KEY, String(Date.now()));
      setLocked(false);
    } else if (result.error !== 'user_cancel' && result.error !== 'system_cancel') {
      setError('Authentication failed. Please try again.');
    }
  }, []);

  useEffect(() => {
    describeBiometrics().then(setBiometricType);
  }, []);

  // Auto-lock: remember when the app went to background; lock on return if too long.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') backgroundedAt.current = Date.now();
      if (state === 'active' && backgroundedAt.current) {
        if (Date.now() - backgroundedAt.current > AUTO_LOCK_MS) setLocked(true);
        backgroundedAt.current = null;
      }
    });
    return () => sub.remove();
  }, []);

  const value = useMemo(
    () => ({ locked, biometricType, error, unlock, lock }),
    [locked, biometricType, error, unlock, lock],
  );
  return <SecurityContext.Provider value={value}>{children}</SecurityContext.Provider>;
}

export function useSecurity(): SecurityState {
  const ctx = useContext(SecurityContext);
  if (!ctx) throw new Error('useSecurity must be used inside SecurityProvider');
  return ctx;
}
