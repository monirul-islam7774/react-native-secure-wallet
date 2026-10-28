import { formatMoney, parseAmount } from './money';

describe('parseAmount', () => {
  it.each([
    ['1500', 'BDT', 150000],
    ['1,500.5', 'BDT', 150050],
    ['0.01', 'BDT', 1],
    ['0.29', 'USD', 29], // 0.29 * 100 = 28.999999999999996 with floats
    ['1500', 'JPY', 1500],
  ])('parses %s %s -> %d', (input, currency, expected) => {
    expect(parseAmount(input, currency)).toBe(expected);
  });

  it.each(['', 'abc', '-5', '0', '0.00', '1.234', '1.5e3', '10.5 JPY'])('rejects %p', (input) => {
    expect(parseAmount(input, 'BDT')).toBeNull();
  });

  it('rejects decimals for zero-decimal currencies', () => {
    expect(parseAmount('10.5', 'JPY')).toBeNull();
  });
});

describe('formatMoney', () => {
  it('formats minor units', () => {
    expect(formatMoney(150050, 'USD')).toBe('$1,500.50');
    expect(formatMoney(1500, 'JPY')).toBe('¥1,500');
  });
});
