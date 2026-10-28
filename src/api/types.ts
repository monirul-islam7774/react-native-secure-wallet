export interface Wallet {
  id: string;
  ownerName: string;
  currency: string;
  balance: number; // minor units
}

export interface StatementEntry {
  id: string;
  direction: 'DEBIT' | 'CREDIT';
  amount: number;
  balanceAfter: number;
  createdAt: string;
  reference?: string;
}

export interface TransferRequest {
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  reference?: string;
}

export interface WalletApi {
  getWallet(id: string): Promise<Wallet>;
  getStatement(id: string): Promise<StatementEntry[]>;
  /** idempotencyKey must be reused when retrying the same transfer. */
  transfer(req: TransferRequest, idempotencyKey: string): Promise<void>;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
