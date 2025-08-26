import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import api from './api';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store';
import { useRouter } from 'expo-router';
import StockListItem from '../components/StockListItem';
import LogoutButton from '../components/LogoutButton';

interface Favorite {
  id: number;
  stock: number;
  symbol: string;
}


export default function FavoritesScreen() {
  const { access } = useAuthStore();  // Zustand에서 access 토큰 가져오기
  const router = useRouter();
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      
      const res = await api.get('api/stocks/favorites/');  // api 요청
      setFavorites(res.data);
    } catch {
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!access) {
      router.replace('/login');  // 로그인 페이지로 리다이렉트
    } else {
      fetchFavorites();  // 로그인 된 경우 즐겨찾기 목록 불러오기
    }
  }, [access]);

  const removeFavorite = async (symbol: string) => {
    try {
      await api.delete(`api/stocks/favorites/${symbol}/`);  // 즐겨찾기 제거 요청
      setFavorites(favorites.filter(item => item.symbol !== symbol));  // 로컬에서 목록 업데이트
    } catch {}
  };

  return (
    <View style={styles.container}>
      <LogoutButton />
      {loading ? <ActivityIndicator /> : null}
      <FlatList
        data={favorites}
        keyExtractor={item => item.symbol}
        renderItem={({ item }) => (
          <StockListItem
            symbol={item.symbol}
            name={item.symbol}  // ✅ name 대신 symbol 넣기
            isFavorite={true}
            onToggleFavorite={() => removeFavorite(item.symbol)}
          />
        )}
        style={{ width: '100%' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  item: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
  symbol: { fontWeight: 'bold', fontSize: 16 },
});
