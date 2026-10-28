import { ApiError, StatementEntry, TransferRequest, Wallet, WalletApi } from './types';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** In-memory backend so the app runs with zero setup. Mirrors the real API's rules. */
export class MockWalletApi implements WalletApi {
  private wallet: Wallet = { id: 'demo-wallet', ownerName: 'Demo User', currency: 'BDT', balance: 2_500_000 };
  private entries: StatementEntry[] = [
    {
      id: 'e1',
      direction: 'CREDIT',
      amount: 2_500_000,
      balanceAfter: 2_500_000,
      createdAt: new Date(Date.now() - 86_400_000).toISOString(),
      reference: 'Salary',
    },
  ];
  private seenKeys = new Set<string>();

  async getWallet(): Promise<Wallet> {
    await delay(300);
    return { ...this.wallet };
  }

  async getStatement(): Promise<StatementEntry[]> {
    await delay(300);
    return [...this.entries];
  }

  async transfer(req: TransferRequest, key: string): Promise<void> {
    await delay(600);
    if (this.seenKeys.has(key)) return; // idempotent replay
    if (req.amount > this.wallet.balance) throw new ApiError('Insufficient funds', 422);
    this.seenKeys.add(key);
    this.wallet.balance -= req.amount;
    this.entries.unshift({
      id: key,
      direction: 'DEBIT',
      amount: req.amount,
      balanceAfter: this.wallet.balance,
      createdAt: new Date().toISOString(),
      reference: req.reference ?? `To ${req.toWalletId.slice(0, 8)}`,
    });
  }
}
