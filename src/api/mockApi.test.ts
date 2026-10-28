import { MockWalletApi } from './mockApi';

describe('MockWalletApi', () => {
  it('does not apply the same transfer twice for one idempotency key', async () => {
    const api = new MockWalletApi();
    const before = (await api.getWallet()).balance;
    const req = { fromWalletId: 'demo-wallet', toWalletId: 'friend', amount: 1000 };
    await api.transfer(req, 'key-1');
    await api.transfer(req, 'key-1'); // retry
    expect((await api.getWallet()).balance).toBe(before - 1000);
  });

  it('rejects overdrafts', async () => {
    const api = new MockWalletApi();
    await expect(
      api.transfer({ fromWalletId: 'demo-wallet', toWalletId: 'x', amount: 10 ** 12 }, 'k'),
    ).rejects.toThrow('Insufficient funds');
  });
});
