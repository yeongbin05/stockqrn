import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useAuthStore } from "../store";
import { useRouter } from "expo-router";
import KakaoLogins from "@react-native-seoul/kakao-login";
import api from "./api";

// 웹용 카카오 SDK 타입 선언
declare global {
  interface Window {
    Kakao: any;
  }
}

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // 서버 주소는 하드코딩되어 있음
  const [loading, setLoading] = useState(false);
  const [hydrating, setHydrating] = useState(true);
  const { access, setToken, hydrate } = useAuthStore();
  const [loggedIn, setLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      await hydrate();
      
      // 웹에서 카카오 SDK 로드
      if (Platform.OS === 'web') {
        const script = document.createElement('script');
        script.src = 'https://developers.kakao.com/sdk/js/kakao.js';
        script.onload = () => {
          console.log('카카오 SDK 로드 완료');
          console.log('window.Kakao:', window.Kakao);
          
          if (window.Kakao) {
            // 환경 변수에서 JavaScript 키 가져오기
            const kakaoKey = process.env.EXPO_PUBLIC_KAKAO_JAVASCRIPT_KEY;
            console.log('환경 변수 kakaoKey:', kakaoKey);
            
            if (kakaoKey) {
              window.Kakao.init(kakaoKey);
              console.log('카카오 SDK 초기화 완료');
            } else {
              console.error('카카오 JavaScript 키가 설정되지 않았습니다.');
            }
          } else {
            console.error('카카오 SDK가 로드되지 않았습니다.');
          }
        };
        document.head.appendChild(script);
      }
      
      setHydrating(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (access) setLoggedIn(true);
  }, [access]);

  useEffect(() => {
    if (access) router.replace("/mypage");
  }, [access]);

  // 서버 주소는 이미 api.ts에서 하드코딩되어 있음

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("오류", "이메일과 비밀번호를 입력하세요.");
      return;
    }
    setLoading(true);
    try {
      const response = await api.post("/api/users/token/", {
        email,
        password,
      });
      const { access, refresh } = response.data;
      await setToken(access, refresh);
      setLoggedIn(true);
      router.replace("/mypage");
      Alert.alert("로그인 성공", "토큰 저장 완료!");
    } catch (error: any) {
      if (error.response) {
        const msg = error.response.data.detail || "로그인 실패";
        Alert.alert("오류", msg);
      } else {
        Alert.alert("오류", "네트워크 오류");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKakaoLogin = async () => {
    try {
      let kakaoAccessToken: string;

      if (Platform.OS === 'web') {
        // 웹용 카카오 로그인
        console.log('웹 플랫폼에서 카카오 로그인 시도');
        console.log('window.Kakao:', window.Kakao);
        
        if (!window.Kakao) {
          Alert.alert("오류", "카카오 SDK가 로드되지 않았습니다.");
          return;
        }

        await new Promise<void>((resolve, reject) => {
          window.Kakao.Auth.login({
            success: (authObj: any) => {
              console.log('카카오 로그인 성공:', authObj);
              kakaoAccessToken = authObj.access_token;
              resolve();
            },
            fail: (err: any) => {
              console.error('카카오 로그인 실패:', err);
              reject(err);
            }
          });
        });
      } else {
        // 모바일용 카카오 로그인
        const kakaoResult = await KakaoLogins.login();
        kakaoAccessToken = kakaoResult.accessToken;
      }

      const response = await api.post("/api/users/social/kakao/", {
        access_token: kakaoAccessToken,
      });

      const { access, refresh } = response.data;
      await setToken(access, refresh);
      router.replace("/mypage");
      Alert.alert("로그인 성공", "카카오 계정으로 로그인되었습니다.");
    } catch (err) {
      console.error(err);
      Alert.alert("오류", "카카오 로그인 실패");
    }
  };

  if (hydrating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>로딩 중...</Text>
      </View>
    );
  }

  if (loggedIn) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>StockQ</Text>
        <Text style={styles.subtitle}>주식 뉴스 분석 서비스</Text>
        <Text style={styles.tokenText}>로그인 완료!</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>StockQ</Text>
          <Text style={styles.subtitle}>주식 뉴스 분석 서비스</Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="이메일"
            placeholderTextColor="#999"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="비밀번호"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>로그인</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.kakaoButton]}
            onPress={handleKakaoLogin}
          >
            <Text style={styles.kakaoButtonText}>카카오로 로그인</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => router.push({ pathname: "/register" } as any)}
          >
            <Text style={styles.registerText}>회원가입</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#007AFF",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  tokenText: {
    fontSize: 18,
    color: "#007AFF",
    fontWeight: "600",
    marginTop: 24,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  input: {
    width: "100%",
    height: 56,
    borderColor: "#E1E5E9",
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#F8F9FA",
    color: "#333",
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#007AFF",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  kakaoButton: {
    backgroundColor: "#FEE500",
    borderWidth: 1,
    borderColor: "#FEE500",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  kakaoButtonText: {
    color: "#3C1E1E",
    fontSize: 16,
    fontWeight: "600",
  },
  registerButton: {
    alignItems: "center",
    paddingVertical: 16,
  },
  registerText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "500",
  },
});

