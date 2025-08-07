import React from 'react';
import { Button } from 'react-native';
import { useAuthStore } from '../store';
import { useRouter } from 'expo-router';

export default function LogoutButton() {
  const { clearToken } = useAuthStore();
  const router = useRouter();
  const handleLogout = async () => {
    await clearToken();
    router.replace('/login');
  };
  return <Button title="로그아웃" onPress={handleLogout} />;
} 