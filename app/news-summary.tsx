import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from './api';
import { useAuthStore } from '../store';
import { useRouter } from 'expo-router';
import LogoutButton from '../components/LogoutButton';

interface NewsSummaryResponse {
  symbol: string;
  from: string;
  to: string;
  source: string;
  count: number;
  items: Array<{
    headline: string;
    summary: string;
    url: string;
    source: string;
    datetime: number;
  }>;
  yesterday_change_percent?: string;
  close?: string;
  prev_close?: string;
  eod_date_utc?: string;
  cached: boolean;
}

export default function NewsSummaryScreen() {
  const { access } = useAuthStore();
  const router = useRouter();
  const [symbol, setSymbol] = useState('AAPL');
  const [days, setDays] = useState('1');
  const [summary, setSummary] = useState<NewsSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!access) {
      router.replace('/login');
      return;
    }
  }, [access]);

  const fetchNewsSummary = async () => {
    if (!symbol.trim()) {
      Alert.alert('오류', '종목 심볼을 입력하세요.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(
        `/api/news/summary/?symbol=${encodeURIComponent(symbol.toUpperCase())}&days=${days}`
      );
      setSummary(response.data);
    } catch (error: any) {
      console.error('뉴스 요약 조회 실패:', error);
      if (error.response?.status === 400) {
        Alert.alert('오류', '잘못된 종목 심볼입니다.');
      } else {
        Alert.alert('오류', '뉴스 요약을 가져오는데 실패했습니다.');
      }
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const renderSummaryItem = (item: NewsSummaryResponse['items'][0], index: number) => (
    <View key={index} style={styles.summaryItem}>
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryIndex}>#{index + 1}</Text>
        <Text style={styles.summarySource}>{item.source}</Text>
        <Text style={styles.summaryDate}>
          {new Date(item.datetime * 1000).toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
      
      <Text style={styles.summaryHeadline}>{item.headline}</Text>
      
      {item.summary && (
        <Text style={styles.summaryText}>{item.summary}</Text>
      )}
      
      {item.url && (
        <TouchableOpacity 
          style={styles.linkButton}
          onPress={() => {
            console.log('링크 열기:', item.url);
          }}
        >
          <Ionicons name="open-outline" size={16} color="#007AFF" />
          <Text style={styles.linkText}>기사 보기</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>뉴스 요약</Text>
        <LogoutButton />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>종목 심볼</Text>
          <TextInput
            style={styles.symbolInput}
            placeholder="예: AAPL, MSFT, GOOGL"
            placeholderTextColor="#999"
            value={symbol}
            onChangeText={setSymbol}
            autoCapitalize="characters"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>기간 (일)</Text>
          <TextInput
            style={styles.daysInput}
            placeholder="1"
            placeholderTextColor="#999"
            value={days}
            onChangeText={setDays}
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity
          style={styles.searchButton}
          onPress={fetchNewsSummary}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="search" size={20} color="#fff" />
              <Text style={styles.searchButtonText}>요약 조회</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {summary && (
        <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryHeader}>
            <View style={styles.symbolContainer}>
              <Text style={styles.symbolText}>{summary.symbol}</Text>
              <Text style={styles.periodText}>
                {summary.from} ~ {summary.to}
              </Text>
            </View>
            
            {summary.yesterday_change_percent && (
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>전일 등락률</Text>
                <Text style={[
                  styles.priceValue,
                  parseFloat(summary.yesterday_change_percent) >= 0 
                    ? styles.pricePositive 
                    : styles.priceNegative
                ]}>
                  {summary.yesterday_change_percent}%
                </Text>
              </View>
            )}
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{summary.count}</Text>
              <Text style={styles.statLabel}>뉴스</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{summary.source}</Text>
              <Text style={styles.statLabel}>소스</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {summary.cached ? '캐시됨' : '실시간'}
              </Text>
              <Text style={styles.statLabel}>상태</Text>
            </View>
          </View>

          <View style={styles.summaryList}>
            {summary.items.map(renderSummaryItem)}
          </View>
        </ScrollView>
      )}

      {!summary && !loading && (
        <View style={styles.emptyContainer}>
          <Ionicons name="newspaper-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>뉴스 요약을 조회해보세요</Text>
          <Text style={styles.emptySubtext}>
            종목 심볼을 입력하고 요약을 조회해보세요.
          </Text>
        </View>
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
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  symbolInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E5E9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  daysInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E5E9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    width: 80,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
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
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  symbolContainer: {
    flex: 1,
  },
  symbolText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  periodText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
  },
  pricePositive: {
    color: '#34C759',
  },
  priceNegative: {
    color: '#FF3B30',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 16,
    marginVertical: 16,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
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
  },
  summaryList: {
    paddingBottom: 20,
  },
  summaryItem: {
    backgroundColor: '#FFFFFF',
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryIndex: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#007AFF',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  summarySource: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  summaryDate: {
    fontSize: 12,
    color: '#999',
  },
  summaryHeadline: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    lineHeight: 22,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
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
