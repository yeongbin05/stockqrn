import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../api';
import { useAuthStore } from '../../store';
import LogoutButton from '../../components/LogoutButton';
import SummaryDetail from '../../components/SummaryDetail';

interface AISummary {
  id: number;
  stock: {
    symbol: string;
    name: string;
  };
  summary: string;
  date: string;
  created_at: string;
}

interface DashboardStats {
  total: number;
  positive: number;
  negative: number;
  neutral: number;
  average_confidence: number;
}

type FilterType = 'all' | 'positive' | 'negative' | 'neutral';
type ConfidenceFilter = 'all' | 'high' | 'medium' | 'low';

export default function HomeScreen() {
  const { access } = useAuthStore();
  const router = useRouter();
  const [summaries, setSummaries] = useState<AISummary[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>('all');
  const [selectedSummary, setSelectedSummary] = useState<AISummary | null>(null);

  useEffect(() => {
    if (!access) {
      router.replace('/login');
      return;
    }
    fetchSummaries();
  }, [access]);

  const fetchSummaries = async () => {
    try {
      // 더미 데이터 사용 (개발/테스트용) - 다종목 시뮬레이션
      const dummySummaries: AISummary[] = [
        {
          id: 1,
          stock: {
            symbol: 'AAPL',
            name: 'Apple Inc.'
          },
          summary: '📊 2025-01-17 AAPL (Apple Inc.) 뉴스 요약\n\n✅ 1. 핵심 요약:\n- iPhone 17 출시로 중국 시장에서 6% 매출 하락을 겪고 있습니다.\n- AI 투자 확대로 새로운 성장 동력을 확보하고 있습니다.\n- 제품 포트폴리오 다각화로 경쟁력을 강화하고 있습니다.\n\n💡 2. 투자 관점 주요 포인트:\n- 긍정: AI 기술 투자 확대, 제품 혁신 지속, 생태계 강화\n- 주의·리스크: 중국 시장 둔화, 경쟁 심화, 공급망 도전\n\n🎯 6. 전체 분위기:\n- 평가: 중립, 기술 투자와 시장 도전 공존\n- confidence: 75/100\n\n📝 7. 200자 내 요약:\n- Apple은 iPhone 17 출시에도 불구하고 중국 시장에서 매출 하락을 겪고 있으나, AI 투자 확대로 새로운 성장 동력을 확보하고 있습니다.',
          date: '2025-01-17',
          created_at: '2025-01-17T09:30:00Z'
        },
        {
          id: 2,
          stock: {
            symbol: 'MSFT',
            name: 'Microsoft Corporation'
          },
          summary: '📊 2025-01-17 MSFT (Microsoft Corporation) 뉴스 요약\n\n✅ 1. 핵심 요약:\n- Microsoft는 AI 투자 확대로 새로운 성장 동력을 확보하고 있습니다.\n- Azure 클라우드 서비스 수요가 지속적으로 증가하고 있습니다.\n- Teams 사용자가 전 세계적으로 3억 명을 돌파했습니다.\n\n💡 2. 투자 관점 주요 포인트:\n- 긍정: AI 기술 투자 확대, 클라우드 수요 증가, Teams 성장\n- 주의·리스크: 경쟁 심화, 규제 우려, 기술 변화 속도\n\n📈 3. 가격/수급 스냅샷:\n- 현재가/등락률/시가/전일종가 요약: 데이터 미제공\n- 특이사항(거래량/프리·애프터마켓 등): 없음\n\n🗓️ 4. 다가오는 일정/촉매:\n- 01-25 실적발표 예정\n- 02-15 AI 서비스 업데이트 발표\n\n🌐 5. 섹터/거시 한 줄 요약:\n- 데이터 미제공\n\n🎯 6. 전체 분위기:\n- 평가: 긍정, AI와 클라우드 분야에서 강력한 경쟁력\n- confidence: 90/100\n\n📝 7. 200자 내 요약:\n- Microsoft는 AI 투자 확대와 Azure 클라우드 성장으로 새로운 성장 동력을 확보하고 있으며, Teams 3억 사용자 돌파로 협업 시장에서의 선도적 위치를 유지하고 있습니다.',
          date: '2025-01-17',
          created_at: '2025-01-17T10:15:00Z'
        },
        {
          id: 3,
          stock: {
            symbol: 'GOOGL',
            name: 'Alphabet Inc.'
          },
          summary: '📊 2025-01-17 GOOGL (Alphabet Inc.) 뉴스 요약\n\n✅ 1. 핵심 요약:\n- Google 검색 수익이 전년 대비 12% 증가했습니다.\n- YouTube 광고 수익이 18% 성장했습니다.\n- Google Cloud 서비스 수요가 지속적으로 증가하고 있습니다.\n\n💡 2. 투자 관점 주요 포인트:\n- 긍정: 검색 수익 성장, YouTube 광고 성장, 클라우드 확장\n- 주의·리스크: AI 경쟁 심화, 규제 우려, 프라이버시 이슈\n\n🎯 6. 전체 분위기:\n- 평가: 긍정, 핵심 사업 성장과 새로운 기회 확장\n- confidence: 85/100\n\n📝 7. 200자 내 요약:\n- Alphabet은 Google 검색과 YouTube 광고 수익이 강세를 보이며 성장하고 있으며, Google Cloud 서비스 확장으로 새로운 수익원을 확보하고 있습니다.',
          date: '2025-01-17',
          created_at: '2025-01-17T11:00:00Z'
        },
        {
          id: 4,
          stock: {
            symbol: 'TSLA',
            name: 'Tesla Inc.'
          },
          summary: '📊 2025-01-17 TSLA (Tesla Inc.) 뉴스 요약\n\n✅ 1. 핵심 요약:\n- Tesla의 중국 시장 매출이 전년 대비 15% 감소했습니다.\n- 자율주행 기술 개발이 지연되고 있습니다.\n- 경쟁사들의 전기차 시장 진입으로 경쟁이 심화되고 있습니다.\n\n💡 2. 투자 관점 주요 포인트:\n- 긍정: 브랜드 파워 유지, 충전 인프라 확장\n- 주의·리스크: 중국 시장 둔화, 자율주행 지연, 경쟁 심화\n\n🎯 6. 전체 분위기:\n- 평가: 부정, 시장 도전과 기술 지연 우려\n- confidence: 65/100\n\n📝 7. 200자 내 요약:\n- Tesla는 중국 시장 매출 감소와 자율주행 기술 개발 지연으로 도전을 받고 있으며, 경쟁사들의 전기차 시장 진입으로 경쟁이 심화되고 있습니다.',
          date: '2025-01-17',
          created_at: '2025-01-17T11:45:00Z'
        },
        {
          id: 5,
          stock: {
            symbol: 'NVDA',
            name: 'NVIDIA Corporation'
          },
          summary: '📊 2025-01-17 NVDA (NVIDIA Corporation) 뉴스 요약\n\n✅ 1. 핵심 요약:\n- AI 칩 수요 급증으로 분기 매출이 40% 증가했습니다.\n- 데이터센터 매출이 전년 대비 50% 성장했습니다.\n- 새로운 AI 프로세서 출시로 경쟁력을 강화했습니다.\n\n💡 2. 투자 관점 주요 포인트:\n- 긍정: AI 칩 수요 급증, 데이터센터 성장, 기술 혁신\n- 주의·리스크: 공급 부족, 경쟁사 대응, 기술 변화\n\n🎯 6. 전체 분위기:\n- 평가: 긍정, AI 시대의 핵심 플레이어로 부상\n- confidence: 95/100\n\n📝 7. 200자 내 요약:\n- NVIDIA는 AI 칩 수요 급증과 데이터센터 매출 성장으로 AI 시대의 핵심 플레이어로 부상하고 있으며, 새로운 AI 프로세서 출시로 기술적 경쟁력을 더욱 강화하고 있습니다.',
          date: '2025-01-17',
          created_at: '2025-01-17T12:30:00Z'
        }
      ];

      setSummaries(dummySummaries);
      
      // 통계 계산
      const total = dummySummaries.length;
      const positive = dummySummaries.filter(s => 
        s.summary.toLowerCase().includes('긍정') || 
        s.summary.toLowerCase().includes('상승') ||
        s.summary.toLowerCase().includes('성장')
      ).length;
      const negative = dummySummaries.filter(s => 
        s.summary.toLowerCase().includes('부정') || 
        s.summary.toLowerCase().includes('하락') ||
        s.summary.toLowerCase().includes('우려')
      ).length;
      const neutral = total - positive - negative;
      
      setStats({
        total,
        positive,
        negative,
        neutral,
        average_confidence: 82 // 더미 데이터 평균 신뢰도
      });
    } catch (error) {
      console.error('AI 요약 조회 실패:', error);
      Alert.alert('오류', 'AI 요약을 가져오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSummaries();
    setRefreshing(false);
  };


  const getSentimentFromSummary = (summary: string) => {
    const lowerSummary = summary.toLowerCase();
    if (lowerSummary.includes('긍정') || lowerSummary.includes('상승') || lowerSummary.includes('성장')) {
      return 'positive';
    } else if (lowerSummary.includes('부정') || lowerSummary.includes('하락') || lowerSummary.includes('우려')) {
      return 'negative';
    }
    return 'neutral';
  };

  const getConfidenceFromSummary = (summary: string) => {
    // 더미 데이터에서 신뢰도 추출
    const confidenceMatch = summary.match(/confidence:\s*(\d+)/);
    if (confidenceMatch) {
      return parseInt(confidenceMatch[1]);
    }
    // 기본값
    return 75;
  };

  const filteredSummaries = summaries.filter(summary => {
    const sentiment = getSentimentFromSummary(summary.summary);
    const confidence = getConfidenceFromSummary(summary.summary);
    
    // 감정 필터
    if (filter !== 'all' && sentiment !== filter) return false;
    
    // 신뢰도 필터
    if (confidenceFilter === 'high' && confidence < 80) return false;
    if (confidenceFilter === 'medium' && (confidence < 60 || confidence >= 80)) return false;
    if (confidenceFilter === 'low' && confidence >= 60) return false;
    
    return true;
  });

  const renderSummaryCard = ({ item }: { item: AISummary }) => {
    const sentiment = getSentimentFromSummary(item.summary);
    const confidence = getConfidenceFromSummary(item.summary);
    
    const getSentimentColor = (sentiment: string) => {
      switch (sentiment) {
        case 'positive': return '#34C759';
        case 'negative': return '#FF3B30';
        default: return '#FF9500';
      }
    };

    const getSentimentIcon = (sentiment: string) => {
      switch (sentiment) {
        case 'positive': return 'trending-up';
        case 'negative': return 'trending-down';
        default: return 'remove';
      }
    };

    const getConfidenceColor = (confidence: number) => {
      if (confidence >= 80) return '#34C759';
      if (confidence >= 60) return '#FF9500';
      return '#FF3B30';
    };

    return (
      <View style={styles.summaryCard}>
        <View style={styles.cardHeader}>
          <View style={styles.stockInfo}>
            <Text style={styles.symbol}>{item.stock.symbol}</Text>
            <Text style={styles.companyName} numberOfLines={1}>{item.stock.name}</Text>
          </View>
          <View style={styles.sentimentContainer}>
            <View style={[styles.sentimentBadge, { backgroundColor: getSentimentColor(sentiment) }]}>
              <Ionicons 
                name={getSentimentIcon(sentiment)} 
                size={12} 
                color="white" 
              />
              <Text style={styles.sentimentText}>
                {sentiment === 'positive' ? '긍정' : sentiment === 'negative' ? '부정' : '중립'}
              </Text>
            </View>
            <View style={styles.confidenceContainer}>
              <Text style={[styles.confidenceText, { color: getConfidenceColor(confidence) }]}>
                {confidence}%
              </Text>
            </View>
          </View>
        </View>
        
        <Text style={styles.summaryText} numberOfLines={3}>
          {item.summary}
        </Text>
        
        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>
            {new Date(item.created_at).toLocaleDateString('ko-KR', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          <TouchableOpacity 
            style={styles.detailButton}
            onPress={() => setSelectedSummary(item)}
          >
            <Text style={styles.detailButtonText}>상세 보기</Text>
            <Ionicons name="chevron-forward" size={14} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>AI 요약을 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 오늘의 AI 요약</Text>
        <LogoutButton />
      </View>

      {stats && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>
            {new Date().toLocaleDateString('ko-KR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>총 종목</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#34C759' }]}>{stats.positive}</Text>
              <Text style={styles.statLabel}>긍정</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#FF3B30' }]}>{stats.negative}</Text>
              <Text style={styles.statLabel}>부정</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#FF9500' }]}>{stats.neutral}</Text>
              <Text style={styles.statLabel}>중립</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.filterContainer}>
        <View style={styles.sentimentFilter}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>전체</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'positive' && styles.activeFilter]}
            onPress={() => setFilter('positive')}
          >
            <Text style={[styles.filterText, filter === 'positive' && styles.activeFilterText]}>📈 긍정</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'negative' && styles.activeFilter]}
            onPress={() => setFilter('negative')}
          >
            <Text style={[styles.filterText, filter === 'negative' && styles.activeFilterText]}>📉 부정</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'neutral' && styles.activeFilter]}
            onPress={() => setFilter('neutral')}
          >
            <Text style={[styles.filterText, filter === 'neutral' && styles.activeFilterText]}>⚪ 중립</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.confidenceFilter}>
          <TouchableOpacity
            style={[styles.filterButton, confidenceFilter === 'all' && styles.activeFilter]}
            onPress={() => setConfidenceFilter('all')}
          >
            <Text style={[styles.filterText, confidenceFilter === 'all' && styles.activeFilterText]}>전체</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, confidenceFilter === 'high' && styles.activeFilter]}
            onPress={() => setConfidenceFilter('high')}
          >
            <Text style={[styles.filterText, confidenceFilter === 'high' && styles.activeFilterText]}>높음 (80%+)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, confidenceFilter === 'medium' && styles.activeFilter]}
            onPress={() => setConfidenceFilter('medium')}
          >
            <Text style={[styles.filterText, confidenceFilter === 'medium' && styles.activeFilterText]}>보통 (60-79%)</Text>
          </TouchableOpacity>
        </View>
      </View>


      <FlatList
        data={filteredSummaries}
        keyExtractor={(item) => `${item.id}-${item.stock.symbol}`}
        renderItem={renderSummaryCard}
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
            <Ionicons name="analytics-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>오늘의 뉴스가 없습니다</Text>
            <Text style={styles.emptySubtext}>
              관심종목에 대한 뉴스가 수집되면 AI 요약이 자동으로 생성됩니다.
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => Alert.alert('알림', 'AI 요약 기능은 준비 중입니다.')}>
              <Text style={styles.emptyButtonText}>AI 요약 준비 중</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* 상세보기 모달 */}
      {selectedSummary && (
        <SummaryDetail 
          summary={selectedSummary}
          onClose={() => setSelectedSummary(null)}
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
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
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
    height: 40,
    backgroundColor: '#E1E5E9',
  },
  filterContainer: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  sentimentFilter: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  confidenceFilter: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  activeFilter: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  summaryCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stockInfo: {
    flex: 1,
    marginRight: 12,
  },
  symbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  sentimentContainer: {
    alignItems: 'flex-end',
  },
  sentimentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  sentimentText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  confidenceContainer: {
    alignItems: 'center',
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  summaryText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginRight: 4,
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
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
