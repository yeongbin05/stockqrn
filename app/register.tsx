import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import api from './api';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { access } = useAuthStore();

  useEffect(() => {
    if (access) router.replace('/search');
  }, [access]);

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('오류', '이메일과 비밀번호를 입력하세요.');
      return;
    }
    setLoading(true);
    try {
      await api.post('api/users/', { email, password });
      Alert.alert('회원가입 성공', '이제 로그인하세요!', [
        { text: '확인', onPress: () => router.replace('/login') },
      ]);
    } catch (error) {
      const err = error as any;
      let msg = '회원가입 실패';
      if (err.response?.data) {
        msg = JSON.stringify(err.response.data);
      }
      Alert.alert('오류', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>회원가입</Text>
      <TextInput
        style={styles.input}
        placeholder="이메일"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title={loading ? '가입 중...' : '회원가입'} onPress={handleRegister} disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  input: {
    width: '100%',
    maxWidth: 320,
    height: 48,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    fontSize: 16,
  },
}); 