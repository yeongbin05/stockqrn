import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import api from './api';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store';
import { useRouter } from 'expo-router';
import StockListItem from '../components/StockListItem';
import LogoutButton from '../components/LogoutButton';

interface Stock {
  id: number;  // ✅ 추가
  symbol: string;
  name: string;
  is_favorite: boolean;
}

export default function SearchScreen() {
  const { access } = useAuthStore();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!access) router.replace('/login'); }, [access]);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await api.get(`api/stocks/search/?q=${encodeURIComponent(query)}`);
      setResults(res.data);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };
  const toggleFavorite = async (id: number, isFavorite: boolean, symbol: string) => {
    const sym = symbol.toUpperCase(); // 서버는 iexact지만, 클라에선 통일
    try {
      if (isFavorite) {
        // DELETE /api/stocks/favorites/{symbol}/
        await api.delete(`api/stocks/favorites/${encodeURIComponent(sym)}/`);
      } else {
        // POST /api/stocks/favorites/  { symbol }
        await api.post(`api/stocks/favorites/`, { symbol: sym });
      }

      // 결과 리스트에서도 symbol로 동기화 ('.' 등 특수문자 대비 encode 불필요)
      setResults(prev =>
        prev.map(it =>
          it.symbol?.toUpperCase() === sym ? { ...it, is_favorite: !isFavorite } : it
        )
      );

    } catch (e) {
      // 필요하면 여기서 토스트/로그 등 처리
    }
  };


  return (
    <View style={styles.container}>
      <LogoutButton />
      <TextInput
        style={styles.input}
        placeholder="종목명 또는 심볼 입력"
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={handleSearch}
        returnKeyType="search"
      />
      <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
        <Ionicons name="search" size={24} color="#fff" />
      </TouchableOpacity>
      {loading ? <ActivityIndicator style={{ marginTop: 20 }} /> : null}
      <FlatList
        data={results}
        keyExtractor={item => item.symbol}
        renderItem={({ item }) => (
          <StockListItem
            symbol={item.symbol}
            name={item.name}
            isFavorite={item.is_favorite}
            onToggleFavorite={() => toggleFavorite(item.id, item.is_favorite,item.symbol)}
          />
        )}
        style={{ width: '100%' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 8 },
  searchBtn: { backgroundColor: '#007AFF', padding: 10, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  item: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
  symbol: { fontWeight: 'bold', fontSize: 16 },
});
