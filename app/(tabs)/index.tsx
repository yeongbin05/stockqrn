import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  useEffect(() => {
    // 홈 화면에서 바로 검색 화면으로 리다이렉트
    router.replace('/search');
  }, []);

  return null;
}
