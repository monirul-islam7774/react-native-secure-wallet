# Secure Wallet — React Native

![CI](https://github.com/monirul-islam7774/react-native-secure-wallet/actions/workflows/ci.yml/badge.svg)
![Expo](https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

A mobile wallet app built with **React Native (Expo)** and **TypeScript**, using the security patterns banking apps rely on: biometric unlock, auto-lock, step-up authentication for payments, and retry-safe transfers.

It's the mobile client for [digital-wallet-api](https://github.com/monirul-islam7774/digital-wallet-api), and it also runs on its own with a built-in mock backend.

## Features

| Feature | Implementation |
| --- | --- |
| **Biometric unlock** | Face ID / fingerprint via `expo-local-authentication`, device passcode fallback |
| **Auto-lock** | Locks after 30 s in the background (`AppState`). When locked, the navigation tree is unmounted so no data stays on screen |
| **Step-up auth** | Every transfer asks for biometrics again, even when the app is unlocked |
| **Retry-safe transfers** | Each transfer attempt has an `Idempotency-Key` (UUID). Retrying after a network timeout reuses it, so the money is never sent twice |
| **Safe money handling** | Amounts parsed with string maths into integer minor units. No `0.29 * 100 = 28.999…` bugs |
| **Secure storage** | `expo-secure-store` (Keychain / Android Keystore) |
| **Network resilience** | Request timeouts with `AbortController`, user-friendly error messages, pull-to-refresh |
| **Accessibility** | Button roles and busy/disabled states for screen readers |

## Screens

```
LockScreen ──(biometrics)──> HomeScreen ──> TransferScreen
     ^                         │ balance card        │ recipient, amount, note
     └──── auto-lock / Lock ───┘ recent activity     │ step-up auth → POST /transfers
```

## Getting started

```bash
npm install
npx expo start          # press a (Android) or i (iOS), or scan the QR code with Expo Go
```

The app starts in **demo mode** with mock data. To connect it to the real backend:

```bash
# in digital-wallet-api: docker compose up, create a wallet, deposit some money
cp .env.example .env
# EXPO_PUBLIC_API_URL=http://<your-LAN-IP>:3000
# EXPO_PUBLIC_WALLET_ID=<wallet uuid>
npx expo start -c
```

> Biometrics need a real device or an emulator/simulator with enrolled biometrics.

## Project structure

```
App.tsx                      # providers + navigation, lock gate
src/
├── api/                     # WalletApi interface, HTTP client, mock backend
├── security/                # SecurityContext: biometrics, auto-lock
├── screens/                 # Lock, Home, Transfer
├── components/              # PrimaryButton
└── utils/money.ts           # parse/format minor units
```

## Scripts

| Command | Description |
| --- | --- |
| `npm start` | Expo dev server |
| `npm run typecheck` | TypeScript strict check |
| `npm test` | Jest (money parsing, idempotent mock API) |

## Roadmap

- [ ] Login with JWT + refresh token stored in SecureStore
- [ ] Screenshot / screen-recording protection on sensitive screens
- [ ] Root/jailbreak detection
- [ ] SSL certificate pinning
- [ ] QR code payments (scan recipient wallet ID)
- [ ] Push notifications for incoming transfers
- [ ] E2E tests with Maestro

## License

MIT © Md. Monirul Islam
