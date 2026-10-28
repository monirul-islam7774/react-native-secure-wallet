import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import type { RootStackParamList } from '../../App';
import { api, ApiError } from '../api';
import { PrimaryButton } from '../components/PrimaryButton';
import { formatMoney, parseAmount } from '../utils/money';

type Props = NativeStackScreenProps<RootStackParamList, 'Transfer'>;

export function TransferScreen({ route, navigation }: Props) {
  const { walletId, currency, balance } = route.params;
  const [toWalletId, setTo] = useState('');
  const [amountText, setAmountText] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // One key per transfer attempt. It is reused on retry (e.g. after a timeout) so the server
  // can't execute the same transfer twice, and only rotated once the form changes.
  const idempotencyKey = useRef(Crypto.randomUUID());
  const resetKey = () => (idempotencyKey.current = Crypto.randomUUID());

  const amount = parseAmount(amountText, currency);
  const validationError =
    amountText && amount === null
      ? 'Enter a valid amount'
      : amount !== null && amount > balance
        ? 'Amount exceeds available balance'
        : null;

  const submit = async () => {
    if (!amount || !toWalletId.trim()) return;
    setError(null);

    // Step-up authentication for money movement, even though the app is already unlocked.
    const auth = await LocalAuthentication.authenticateAsync({
      promptMessage: `Confirm sending ${formatMoney(amount, currency)}`,
    });
    if (!auth.success) return;

    setSubmitting(true);
    try {
      await api.transfer(
        { fromWalletId: walletId, toWalletId: toWalletId.trim(), amount, reference: note || undefined },
        idempotencyKey.current,
      );
      Alert.alert('Sent', `${formatMoney(amount, currency)} sent successfully.`);
      navigation.goBack();
    } catch (e) {
      // Network errors keep the same key so "Try again" is safe; business errors need a new attempt.
      if (e instanceof ApiError && e.status !== 0) resetKey();
      setError(e instanceof Error ? e.message : 'Transfer failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.form}>
        <Text style={styles.available}>Available: {formatMoney(balance, currency)}</Text>

        <Text style={styles.label}>Recipient wallet ID</Text>
        <TextInput
          style={styles.input}
          value={toWalletId}
          onChangeText={(v) => {
            setTo(v);
            resetKey();
          }}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="e.g. 4a1a1174-09b3-..."
        />

        <Text style={styles.label}>Amount ({currency})</Text>
        <TextInput
          style={styles.input}
          value={amountText}
          onChangeText={(v) => {
            setAmountText(v);
            resetKey();
          }}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />
        {validationError && <Text style={styles.error}>{validationError}</Text>}

        <Text style={styles.label}>Note (optional)</Text>
        <TextInput style={styles.input} value={note} onChangeText={setNote} maxLength={64} />

        {error && <Text style={styles.error}>{error}</Text>}
      </View>

      <PrimaryButton
        title={error ? 'Try again' : 'Send'}
        onPress={submit}
        loading={submitting}
        disabled={!amount || !!validationError || !toWalletId.trim()}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F5F8FF' },
  form: { flex: 1 },
  available: { color: '#5A6B8C', marginBottom: 16 },
  label: { fontWeight: '600', color: '#0A1F44', marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#D5DEEF',
  },
  error: { color: '#C62828', marginTop: 8 },
});
