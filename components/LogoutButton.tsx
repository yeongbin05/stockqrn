import React from 'react';
import { TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store';
import { useRouter } from 'expo-router';
import api from '../app/api';

export default function LogoutButton() {
  const { clearToken, refresh } = useAuthStore();
  const router = useRouter();
  
  const handleLogout = async () => {
    try {
      // 백엔드에 로그아웃 요청 (토큰 블랙리스트 처리)
      if (refresh) {
        await api.post('/api/users/auth/logout/', { refresh });
      }
    } catch (error) {
      console.error('로그아웃 API 호출 실패:', error);
    } finally {
      // API 성공 여부와 관계없이 로컬 토큰 삭제
      await clearToken();
      router.replace('/login');
    }
  };
  
  return (
    <TouchableOpacity style={styles.button} onPress={handleLogout}>
      <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFF0F0',
  },
}); 