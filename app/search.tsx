import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Alert,
} from 'react-native';
import api from './api';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store';
import { useRouter } from 'expo-router';
import StockListItem from '../components/StockListItem';
import LogoutButton from '../components/LogoutButton';

interface Stock {
  id: number;
  symbol: string;
  name: string;
  exchange?: string;
  currency?: string;
  is_favorite: boolean;
}

export default function SearchScreen() {
  const { access } = useAuthStore();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<Stock[]>([]);
  const [showFavorites, setShowFavorites] = useState(true);

  useEffect(() => { 
    if (!access) router.replace('/login'); 
    else fetchFavorites();
  }, [access]);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/stocks/favorites/');
      setFavorites(res.data);
    } catch (e) {
      console.error('즐겨찾기 조회 실패:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      setShowFavorites(true);
      return;
    }
    
    setLoading(true);
    setShowFavorites(false);
    try {
      const res = await api.get(`/api/stocks/search/?q=${encodeURIComponent(query)}`);
      setResults(res.data);
    } catch (e) {
      console.error('검색 실패:', e);
      Alert.alert('오류', '종목 검색에 실패했습니다.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (id: number, isFavorite: boolean, symbol: string) => {
    const sym = symbol.toUpperCase();
    try {
      if (isFavorite) {
        await api.delete(`/api/stocks/favorites/${encodeURIComponent(sym)}/`);
        Alert.alert('성공', `${sym}을(를) 즐겨찾기에서 제거했습니다.`);
      } else {
        await api.post(`/api/stocks/favorites/`, { symbol: sym });
        Alert.alert('성공', `${sym}을(를) 즐겨찾기에 추가했습니다.`);
      }

      // 결과 리스트에서도 symbol로 동기화
      setResults(prev =>
        prev.map(it =>
          it.symbol?.toUpperCase() === sym ? { ...it, is_favorite: !isFavorite } : it
        )
      );

      // 즐겨찾기 목록도 새로고침
      fetchFavorites();

    } catch (e: any) {
      if (e.response?.status === 409) {
        Alert.alert('알림', '이미 즐겨찾기에 등록된 종목입니다.');
      } else {
        Alert.alert('오류', '즐겨찾기 변경에 실패했습니다.');
      }
    }
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (!text.trim()) {
      setShowFavorites(true);
      setResults([]);
    }
  };


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>StockQ</Text>
        <LogoutButton />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="종목명 또는 심볼 검색..."
            placeholderTextColor="#999"
            value={query}
            onChangeText={handleQueryChange}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => handleQueryChange('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, showFavorites && styles.activeTab]}
          onPress={() => {
            setShowFavorites(true);
            setQuery('');
            setResults([]);
          }}
        >
          <Text style={[styles.tabText, showFavorites && styles.activeTabText]}>
            즐겨찾기 ({favorites.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, !showFavorites && styles.activeTab]}
          onPress={() => {
            if (query.trim()) {
              setShowFavorites(false);
            }
          }}
        >
          <Text style={[styles.tabText, !showFavorites && styles.activeTabText]}>
            검색 결과 ({results.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>로딩 중...</Text>
        </View>
      ) : (
        <FlatList
          data={showFavorites ? favorites : results}
          keyExtractor={item => `${item.id}-${item.symbol}`}
          renderItem={({ item }) => (
            <StockListItem
              symbol={item.symbol}
              name={item.name}
              isFavorite={item.is_favorite}
              onToggleFavorite={() => toggleFavorite(item.id, item.is_favorite, item.symbol)}
            />
          )}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons 
                name={showFavorites ? "star-outline" : "search-outline"} 
                size={48} 
                color="#ccc" 
              />
              <Text style={styles.emptyText}>
                {showFavorites 
                  ? '즐겨찾기한 종목이 없습니다.' 
                  : '검색 결과가 없습니다.'
                }
              </Text>
              <Text style={styles.emptySubtext}>
                {showFavorites 
                  ? '종목을 검색하여 즐겨찾기에 추가해보세요.' 
                  : '다른 키워드로 검색해보세요.'
                }
              </Text>
            </View>
          }
        />
      )}
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#333',
  },
  searchButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#007AFF',
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
  },
});
