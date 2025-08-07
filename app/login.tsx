import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { useAuthStore } from '../store';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [hydrating, setHydrating] = useState(true);
  const { access, setToken, hydrate } = useAuthStore();
  const [loggedIn, setLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // 앱 시작 시 AsyncStorage에서 토큰 불러오기
    const init = async () => {
      await hydrate();
      setHydrating(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (access) setLoggedIn(true);
  }, [access]);

  useEffect(() => {
    if (access) router.replace('/search');
  }, [access]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('오류', '이메일과 비밀번호를 입력하세요.');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post('http://192.168.84.226:8000/api/users/token/', {
        email,
        password,
      });
      const { access, refresh } = response.data;
      await setToken(access, refresh);
      setLoggedIn(true);
      router.replace('/search');
      Alert.alert('로그인 성공', '토큰 저장 완료!');
    } catch (error) {
      const err = error as any;
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.detail || '로그인 실패';
        Alert.alert('오류', msg);
      } else {
        Alert.alert('오류', '네트워크 오류');
      }
    } finally {
      setLoading(false);
    }
  };

  if (hydrating) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (loggedIn) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>메인화면 (로그인됨)</Text>
        <Text>Access Token: {access}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>로그인</Text>
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
      <Button title={loading ? '로그인 중...' : '로그인'} onPress={handleLogin} disabled={loading} />
      <View style={{ height: 16 }} />
      <Button title="회원가입" onPress={() => router.push({ pathname: '/register' } as any)} />
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