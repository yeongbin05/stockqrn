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
  ScrollView,
} from 'react-native';
import api from '../api';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store';
import { useRouter } from 'expo-router';
import StockListItem from '../../components/StockListItem';

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

interface UserInfo {
  id: number;
  email: string;
}

export default function FavoritesScreen() {
  const { access, clearToken, refresh } = useAuthStore();
  const router = useRouter();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFavorites = async () => {
    try {
      const res = await api.get('/api/stocks/favorites/');
      setFavorites(res.data);
    } catch (error) {
      console.error('즐겨찾기 조회 실패:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
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
    fetchUserInfo();
    fetchFavorites();
  }, [access]);

  const fetchUserInfo = async () => {
    try {
      const res = await api.get('/api/users/me/');
      setUserInfo(res.data);
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
    }
  };

  const removeFavorite = async (symbol: string) => {
    try {
      await api.delete(`/api/stocks/favorites/${symbol}/`);
      Alert.alert('성공', `${symbol}을(를) 즐겨찾기에서 제거했습니다.`);
      fetchFavorites(); // 목록 새로고침
    } catch (error) {
      Alert.alert('오류', '즐겨찾기 제거에 실패했습니다.');
    }
  };

  const handleLogout = async () => {
    try {
      if (refresh) {
        await api.post('/api/users/auth/logout/', { refresh });
      }
    } catch (error) {
      console.error('로그아웃 API 호출 실패:', error);
    } finally {
      await clearToken();
      router.replace('/login');
    }
  };

  const handleSignout = () => {
    Alert.alert(
      '회원 탈퇴',
      '정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '탈퇴',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/api/users/auth/signout/');
              Alert.alert('탈퇴 완료', '회원 탈퇴가 완료되었습니다.');
              await clearToken();
              router.replace('/login');
            } catch (error: any) {
              console.error('회원 탈퇴 실패:', error);
              Alert.alert('오류', '회원 탈퇴에 실패했습니다.');
            }
          },
        },
      ]
    );
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
        <Text style={styles.title}>마이페이지</Text>
      </View>

      {/* 프로필 정보 */}
      <View style={styles.profileSection}>
        <View style={styles.profileCard}>
          <View style={styles.userIconContainer}>
            <Ionicons name="person" size={40} color="#007AFF" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userEmail}>{userInfo?.email}</Text>
            <Text style={styles.userId}>ID: {userInfo?.id}</Text>
          </View>
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
      </View>

      {/* 즐겨찾기 목록 */}
      <View style={styles.favoritesSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>즐겨찾기</Text>
          <TouchableOpacity 
            style={styles.searchButtonSmall}
            onPress={() => router.push('/search')}
          >
            <Ionicons name="add" size={20} color="#007AFF" />
            <Text style={styles.searchButtonTextSmall}>추가</Text>
          </TouchableOpacity>
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

      {/* 로그아웃/탈퇴 버튼 */}
      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#007AFF" />
          <Text style={styles.logoutButtonText}>로그아웃</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.signoutButton} onPress={handleSignout}>
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          <Text style={styles.signoutButtonText}>회원 탈퇴</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  userIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userEmail: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userId: {
    fontSize: 14,
    color: '#999',
  },
  favoritesSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  searchButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F0F8FF',
  },
  searchButtonTextSmall: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  actionsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E1E5E9',
  },
  logoutButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F0F8FF',
    marginRight: 8,
  },
  logoutButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  signoutButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FFF0F0',
    marginLeft: 8,
  },
  signoutButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
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
