import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store';
import { useRouter } from 'expo-router';
import api from '../api';

interface UserInfo {
  id: number;
  email: string;
}

interface Subscription {
  id: number;
  plan: string;
  start_date: string;
  end_date: string | null;
  active: boolean;
}

export default function ProfileScreen() {
  const { access, clearToken, refresh } = useAuthStore();
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!access) {
      router.replace('/login');
      return;
    }
    fetchUserInfo();
    fetchSubscriptions();
  }, [access]);

  const fetchUserInfo = async () => {
    try {
      const res = await api.get('/api/users/me/');
      setUserInfo(res.data);
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const res = await api.get('/api/subscriptions/subscriptions/');
      setSubscriptions(res.data);
    } catch (error) {
      console.error('구독 정보 조회 실패:', error);
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

  const getCurrentPlan = () => {
    const activeSub = subscriptions.find(s => s.active);
    return activeSub?.plan || 'FREE';
  };

  const getPlanLimits = (plan: string) => {
    switch (plan) {
      case 'FREE':
        return '최대 3종목';
      case 'PREMIUM':
        return '최대 50종목';
      case 'PRO':
        return '무제한';
      default:
        return '알 수 없음';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>프로필을 불러오는 중...</Text>
      </View>
    );
  }

  const currentPlan = getCurrentPlan();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>프로필</Text>
      </View>

      {/* 사용자 정보 */}
      <View style={styles.section}>
        <View style={styles.userCard}>
          <View style={styles.userIconContainer}>
            <Ionicons name="person" size={40} color="#007AFF" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userEmail}>{userInfo?.email}</Text>
            <Text style={styles.userId}>ID: {userInfo?.id}</Text>
          </View>
        </View>
      </View>

      {/* 구독 정보 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>구독 정보</Text>
        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <Text style={styles.planName}>{currentPlan}</Text>
            <View style={[
              styles.planBadge,
              currentPlan === 'FREE' ? styles.planBadgeFree : 
              currentPlan === 'PREMIUM' ? styles.planBadgePremium : 
              styles.planBadgePro
            ]}>
              <Text style={styles.planBadgeText}>
                {currentPlan === 'FREE' ? '무료' : currentPlan}
              </Text>
            </View>
          </View>
          <Text style={styles.planLimits}>{getPlanLimits(currentPlan)}</Text>
          
          {subscriptions.length > 0 && (
            <View style={styles.subscriptionList}>
              {subscriptions.map((sub) => (
                <View key={sub.id} style={styles.subscriptionItem}>
                  <View style={styles.subscriptionInfo}>
                    <Text style={styles.subscriptionPlan}>{sub.plan}</Text>
                    <Text style={styles.subscriptionDate}>
                      {new Date(sub.start_date).toLocaleDateString('ko-KR')} ~ 
                      {sub.end_date ? new Date(sub.end_date).toLocaleDateString('ko-KR') : '진행 중'}
                    </Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    sub.active ? styles.statusActive : styles.statusInactive
                  ]}>
                    <Text style={styles.statusText}>
                      {sub.active ? '활성' : '만료'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* 설정 옵션 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>설정</Text>
        
        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <View style={styles.menuLeft}>
            <Ionicons name="log-out-outline" size={24} color="#007AFF" />
            <Text style={styles.menuText}>로그아웃</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleSignout}>
          <View style={styles.menuLeft}>
            <Ionicons name="trash-outline" size={24} color="#FF3B30" />
            <Text style={[styles.menuText, styles.menuTextDanger]}>회원 탈퇴</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>StockQ v1.0.0</Text>
        <Text style={styles.footerText}>© 2025 StockQ. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#007AFF',
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
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
  planCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  planBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  planBadgeFree: {
    backgroundColor: '#E8F4F8',
  },
  planBadgePremium: {
    backgroundColor: '#FFF3E0',
  },
  planBadgePro: {
    backgroundColor: '#F3E5F5',
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  planLimits: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  subscriptionList: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E1E5E9',
  },
  subscriptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionPlan: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  subscriptionDate: {
    fontSize: 12,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: '#E8F5E9',
  },
  statusInactive: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 12,
  },
  menuTextDanger: {
    color: '#FF3B30',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
});

