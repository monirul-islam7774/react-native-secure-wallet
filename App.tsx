import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SecurityProvider, useSecurity } from './src/security/SecurityContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { LockScreen } from './src/screens/LockScreen';
import { TransferScreen } from './src/screens/TransferScreen';

export type RootStackParamList = {
  Home: undefined;
  Transfer: { walletId: string; currency: string; balance: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function Root() {
  const { locked } = useSecurity();
  // When locked, the whole navigation tree is unmounted — no sensitive data stays on screen.
  if (locked) return <LockScreen />;
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerTintColor: '#0B5FFF' }}>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'My Wallet' }} />
        <Stack.Screen name="Transfer" component={TransferScreen} options={{ title: 'Send money' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SecurityProvider>
        <StatusBar style="dark" />
        <Root />
      </SecurityProvider>
    </SafeAreaProvider>
  );
}
