import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import api from './api';
import { useAuthStore } from '../store';
import { useRouter } from 'expo-router';
import NewsSummaryItem from '../components/NewsSummaryItem';
import LogoutButton from '../components/LogoutButton';

interface NewsItem {
  symbol: string;
  date: string;
  summary: string;
}

export default function NewsScreen() {
  const { access } = useAuthStore();
  const router = useRouter();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await api.get('api/stocks/news/');
      setNews(res.data);
    } catch {
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!access) router.replace('/login');
    fetchNews();
  }, [access]);

  return (
    <View style={styles.container}>
      <LogoutButton />
      {loading ? <ActivityIndicator /> : null}
      <FlatList
        data={news}
        keyExtractor={item => item.symbol + item.date}
        renderItem={({ item }) => (
          <NewsSummaryItem symbol={item.symbol} date={item.date} summary={item.summary} />
        )}
        style={{ width: '100%' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  item: { marginBottom: 20, padding: 12, borderRadius: 8, backgroundColor: '#f9f9f9' },
  symbol: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
}); 