import { HttpWalletApi } from './httpApi';
import { MockWalletApi } from './mockApi';
import { WalletApi } from './types';

const baseUrl = process.env.EXPO_PUBLIC_API_URL;

export const api: WalletApi = baseUrl ? new HttpWalletApi(baseUrl) : new MockWalletApi();
export const WALLET_ID = process.env.EXPO_PUBLIC_WALLET_ID || 'demo-wallet';
export const USING_MOCK = !baseUrl;
export * from './types';
