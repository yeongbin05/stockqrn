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

  const toggleFavorite = async (id: number, isFavorite: boolean) => {
    try {
      if (isFavorite) {
        await api.delete(`api/stocks/favorites/${id}/remove/`);
      } else {
        await api.post(`api/stocks/favorites/`, { stock_id: id });
      }
      setResults(results.map(item => item.id === id ? { ...item, is_favorite: !isFavorite } : item));
    } catch {}
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
            onToggleFavorite={() => toggleFavorite(item.id, item.is_favorite)}
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
