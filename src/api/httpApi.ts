import { ApiError, StatementEntry, TransferRequest, Wallet, WalletApi } from './types';

/** Client for https://github.com/monirul-islam7774/digital-wallet-api */
export class HttpWalletApi implements WalletApi {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs = 10_000,
  ) {}

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json', ...init.headers },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = Array.isArray(body.message) ? body.message.join(', ') : body.message;
        throw new ApiError(msg ?? `Request failed (${res.status})`, res.status);
      }
      return body as T;
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw new ApiError('Network problem — please try again', 0);
    } finally {
      clearTimeout(timer);
    }
  }

  async getWallet(id: string): Promise<Wallet> {
    const w = await this.request<Wallet & { balance: string }>(`/wallets/${id}`);
    return { ...w, balance: Number(w.balance) }; // BIGINT arrives as string
  }

  async getStatement(id: string): Promise<StatementEntry[]> {
    const rows = await this.request<(StatementEntry & { amount: string; balanceAfter: string })[]>(
      `/wallets/${id}/statement?limit=20`,
    );
    return rows.map((r) => ({ ...r, amount: Number(r.amount), balanceAfter: Number(r.balanceAfter) }));
  }

  async transfer(req: TransferRequest, idempotencyKey: string): Promise<void> {
    await this.request('/transfers', {
      method: 'POST',
      body: JSON.stringify(req),
      headers: { 'Idempotency-Key': idempotencyKey },
    });
  }
}
