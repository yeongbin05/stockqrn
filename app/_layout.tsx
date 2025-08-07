import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store';
import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

export default function RootLayout() {
  const { access, hydrate } = useAuthStore();
  const [hydrating, setHydrating] = useState(true);

  useEffect(() => {
    const init = async () => {
      await hydrate();
      setHydrating(false);
    };
    init();
  }, []);

  if (hydrating) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="search" />
      <Stack.Screen name="favorites" />
      <Stack.Screen name="news" />
    </Stack>
  );
}
