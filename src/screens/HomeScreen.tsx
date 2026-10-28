import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { RootStackParamList } from '../../App';
import { api, StatementEntry, USING_MOCK, Wallet, WALLET_ID } from '../api';
import { PrimaryButton } from '../components/PrimaryButton';
import { useSecurity } from '../security/SecurityContext';
import { formatMoney } from '../utils/money';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { lock } = useSecurity();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [entries, setEntries] = useState<StatementEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [w, s] = await Promise.all([api.getWallet(WALLET_ID), api.getStatement(WALLET_ID)]);
      setWallet(w);
      setEntries(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load wallet');
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload whenever the screen comes back into focus (e.g. after a transfer).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <FlatList
      style={styles.list}
      data={entries}
      keyExtractor={(e) => e.id}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      ListHeaderComponent={
        <View>
          {USING_MOCK && <Text style={styles.mock}>Demo mode — using mock data</Text>}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Available balance</Text>
            <Text style={styles.balance}>
              {wallet ? formatMoney(wallet.balance, wallet.currency) : '—'}
            </Text>
            <Text style={styles.cardOwner}>{wallet?.ownerName}</Text>
          </View>
          {error && <Text style={styles.error}>{error}</Text>}
          <PrimaryButton
            title="Send money"
            disabled={!wallet}
            onPress={() =>
              wallet &&
              navigation.navigate('Transfer', {
                walletId: wallet.id,
                currency: wallet.currency,
                balance: wallet.balance,
              })
            }
          />
          <View style={styles.row}>
            <Text style={styles.section}>Recent activity</Text>
            <Pressable onPress={lock} accessibilityRole="button">
              <Text style={styles.lock}>Lock</Text>
            </Pressable>
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.entry}>
          <View>
            <Text style={styles.entryRef}>{item.reference ?? item.direction}</Text>
            <Text style={styles.entryDate}>{new Date(item.createdAt).toLocaleString()}</Text>
          </View>
          <Text style={[styles.amount, item.direction === 'CREDIT' ? styles.credit : styles.debit]}>
            {item.direction === 'CREDIT' ? '+' : '−'}
            {formatMoney(item.amount, wallet?.currency ?? 'BDT')}
          </Text>
        </View>
      )}
      ListEmptyComponent={!loading ? <Text style={styles.empty}>No transactions yet</Text> : null}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#F5F8FF', padding: 16 },
  mock: { textAlign: 'center', color: '#8A6D00', marginBottom: 8 },
  card: { backgroundColor: '#0A1F44', borderRadius: 16, padding: 24, marginBottom: 16 },
  cardLabel: { color: '#AFC3E8', fontSize: 14 },
  balance: { color: '#fff', fontSize: 34, fontWeight: '700', marginVertical: 8 },
  cardOwner: { color: '#AFC3E8' },
  error: { color: '#C62828', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, marginBottom: 8 },
  section: { fontSize: 18, fontWeight: '600', color: '#0A1F44' },
  lock: { color: '#0B5FFF', fontWeight: '600' },
  entry: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryRef: { fontWeight: '600', color: '#0A1F44' },
  entryDate: { color: '#5A6B8C', fontSize: 12, marginTop: 2 },
  amount: { fontWeight: '700' },
  credit: { color: '#1B7F3B' },
  debit: { color: '#0A1F44' },
  empty: { textAlign: 'center', color: '#5A6B8C', marginTop: 24 },
});
