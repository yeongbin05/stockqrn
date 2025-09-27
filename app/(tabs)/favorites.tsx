import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import api from '../api';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store';
import { useRouter } from 'expo-router';
import StockListItem from '../../components/StockListItem';
import LogoutButton from '../../components/LogoutButton';

interface Favorite {
  id: number;
  stock: {
    id: number;
    symbol: string;
    name: string;
    exchange: string;
    currency: string;
  };
  created_at: string;
}

export default function FavoritesScreen() {
  const { access } = useAuthStore();
  const router = useRouter();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFavorites = async () => {
    try {
      const res = await api.get('/api/stocks/favorites/');
      setFavorites(res.data);
    } catch (error) {
      console.error('즐겨찾기 조회 실패:', error);
      setFavorites([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFavorites();
    setRefreshing(false);
  };

  useEffect(() => {
    if (!access) {
      router.replace('/login');
      return;
    }
    fetchFavorites();
  }, [access]);

  const removeFavorite = async (symbol: string) => {
    try {
      await api.delete(`/api/stocks/favorites/${symbol}/`);
      Alert.alert('성공', `${symbol}을(를) 즐겨찾기에서 제거했습니다.`);
      fetchFavorites(); // 목록 새로고침
    } catch (error) {
      Alert.alert('오류', '즐겨찾기 제거에 실패했습니다.');
    }
  };

  const renderFavoriteItem = ({ item }: { item: Favorite }) => (
    <StockListItem
      symbol={item.stock.symbol}
      name={item.stock.name}
      isFavorite={true}
      onToggleFavorite={() => removeFavorite(item.stock.symbol)}
    />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>즐겨찾기를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>즐겨찾기</Text>
        <LogoutButton />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{favorites.length}</Text>
          <Text style={styles.statLabel}>종목</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {favorites.filter(fav => fav.stock.exchange === 'NASDAQ').length}
          </Text>
          <Text style={styles.statLabel}>NASDAQ</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {favorites.filter(fav => fav.stock.exchange === 'NYSE').length}
          </Text>
          <Text style={styles.statLabel}>NYSE</Text>
        </View>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => `${item.id}-${item.stock.symbol}`}
        renderItem={renderFavoriteItem}
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
            <Ionicons name="star-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>즐겨찾기한 종목이 없습니다</Text>
            <Text style={styles.emptySubtext}>
              종목을 검색하여 즐겨찾기에 추가해보세요.
            </Text>
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={() => router.push('/search')}
            >
              <Ionicons name="search" size={20} color="#fff" />
              <Text style={styles.searchButtonText}>종목 검색</Text>
            </TouchableOpacity>
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
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E1E5E9',
    marginHorizontal: 20,
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
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
    marginBottom: 24,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
