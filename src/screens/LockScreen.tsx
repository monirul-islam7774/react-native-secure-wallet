import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/PrimaryButton';
import { useSecurity } from '../security/SecurityContext';

export function LockScreen() {
  const { unlock, biometricType, error } = useSecurity();

  useEffect(() => {
    unlock(); // prompt immediately on open
  }, [unlock]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.logo}>🔒</Text>
        <Text style={styles.title}>Secure Wallet</Text>
        <Text style={styles.subtitle}>
          {biometricType ? `Unlock with ${biometricType}` : 'Unlock with your device passcode'}
        </Text>
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
      <PrimaryButton title="Unlock" onPress={unlock} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F5F8FF' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#0A1F44' },
  subtitle: { fontSize: 16, color: '#5A6B8C', marginTop: 8 },
  error: { color: '#C62828', marginTop: 16 },
});
