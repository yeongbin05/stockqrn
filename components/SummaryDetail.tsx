import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

interface SummaryDetailProps {
  summary: AISummary;
  onClose: () => void;
}

export default function SummaryDetail({ summary, onClose }: SummaryDetailProps) {

  const getSentimentFromSummary = (summary: string) => {
    if (summary.includes('평가: 긍정')) return 'positive';
    if (summary.includes('평가: 부정')) return 'negative';
    if (summary.includes('평가: 중립')) return 'neutral';
    if (summary.includes('평가: 혼합')) return 'mixed';
    return 'neutral';
  };

  const getConfidenceFromSummary = (summary: string) => {
    const confidenceMatch = summary.match(/confidence:\s*(\d+)/);
    return confidenceMatch ? parseInt(confidenceMatch[1]) : 0;
  };

  const sentiment = getSentimentFromSummary(summary.summary);
  const confidence = getConfidenceFromSummary(summary.summary);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '📈';
      case 'negative': return '📉';
      case 'neutral': return '⚪';
      case 'mixed': return '🔄';
      default: return '⚪';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '#10B981';
      case 'negative': return '#EF4444';
      case 'neutral': return '#6B7280';
      case 'mixed': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return '#10B981';
    if (confidence >= 60) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>AI 요약 상세</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* 종목 정보 */}
        <View style={styles.stockInfo}>
          <View style={styles.stockHeader}>
            <Text style={styles.stockSymbol}>{summary.stock.symbol}</Text>
            <View style={styles.sentimentBadge}>
              <Text style={styles.sentimentIcon}>
                {getSentimentIcon(sentiment)}
              </Text>
              <Text style={[styles.sentimentText, { color: getSentimentColor(sentiment) }]}>
                {sentiment === 'positive' ? '긍정' : 
                 sentiment === 'negative' ? '부정' : 
                 sentiment === 'neutral' ? '중립' : '혼합'}
              </Text>
            </View>
          </View>
          <Text style={styles.stockName}>{summary.stock.name}</Text>
          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceLabel}>신뢰도</Text>
            <Text style={[styles.confidenceValue, { color: getConfidenceColor(confidence) }]}>
              {confidence}%
            </Text>
          </View>
        </View>

        {/* 요약 내용 */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryText}>{summary.summary}</Text>
          </View>
        </ScrollView>

        {/* 하단 정보 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            생성일: {new Date(summary.created_at).toLocaleString('ko-KR')}
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  stockInfo: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  stockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stockSymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  sentimentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  sentimentIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  sentimentText: {
    fontSize: 14,
    fontWeight: '600',
  },
  stockName: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  confidenceValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 28,
    color: '#1F2937',
    fontFamily: 'monospace',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});
