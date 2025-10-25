import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  RefreshControl,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../api';
import { useAuthStore } from '../../store';
import NewsSummaryItem from '../../components/NewsSummaryItem';
import LogoutButton from '../../components/LogoutButton';

interface NewsItem {
  id: number;
  headline: string;
  url?: string;
  canonical_url?: string;
  source?: string;
  published_at: string;
  stocks: Array<{
    id: number;
    symbol: string;
    name: string;
  }>;
}

export default function NewsScreen() {
  const { access } = useAuthStore();
  const router = useRouter();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNews = async () => {
    try {
      const res = await api.get('/api/news/?favorites=1');
      setNews(res.data.results || res.data);
    } catch (error) {
      console.error('뉴스 조회 실패:', error);
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNews();
    setRefreshing(false);
  };

  useEffect(() => {
    if (!access) {
      router.replace('/login');
      return;
    }
    fetchNews();
  }, [access]);

  const renderNewsItem = ({ item }: { item: NewsItem }) => (
    <View style={styles.newsItem}>
      <View style={styles.newsHeader}>
        <View style={styles.stockTags}>
          {item.stocks.map((stock) => (
            <View key={stock.id} style={styles.stockTag}>
              <Text style={styles.stockTagText}>{stock.symbol}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.publishedAt}>
          {new Date(item.published_at).toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
      
      <Text style={styles.headline} numberOfLines={3}>
        {item.headline}
      </Text>
      
      {item.source && (
        <Text style={styles.source}>{item.source}</Text>
      )}
      
      {item.url && (
        <TouchableOpacity 
          style={styles.linkButton}
          onPress={async () => {
            try {
              const url = item.canonical_url || item.url;
              const canOpen = await Linking.canOpenURL(url);
              if (canOpen) {
                await Linking.openURL(url);
              } else {
                Alert.alert('오류', '링크를 열 수 없습니다.');
              }
            } catch (error) {
              console.error('링크 열기 실패:', error);
              Alert.alert('오류', '링크를 여는 중 오류가 발생했습니다.');
            }
          }}
        >
          <Ionicons name="open-outline" size={16} color="#007AFF" />
          <Text style={styles.linkText}>기사 보기</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>뉴스를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>뉴스 피드</Text>
        <LogoutButton />
      </View>

      <FlatList
        data={news}
        keyExtractor={(item) => `${item.id}-${item.published_at}`}
        renderItem={renderNewsItem}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="newspaper-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>뉴스가 없습니다</Text>
            <Text style={styles.emptySubtext}>
              즐겨찾기한 종목의 뉴스를 가져오는 중입니다.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#007AFF',
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  newsItem: {
    backgroundColor: '#FFFFFF',
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stockTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  stockTag: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  stockTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  publishedAt: {
    fontSize: 12,
    color: '#999',
  },
  headline: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    lineHeight: 22,
    marginBottom: 8,
  },
  source: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  linkText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
}); 