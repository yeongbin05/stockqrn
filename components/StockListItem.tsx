import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  symbol: string;
  name: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export default function StockListItem({ symbol, name, isFavorite, onToggleFavorite }: Props) {
  return (
    <View style={styles.item}>
      <View style={{ flex: 1 }}>
        <Text style={styles.symbol}>{symbol}</Text>
        <Text>{name}</Text>
      </View>
      <TouchableOpacity
        onPress={() => {
          console.log('toggleFavorite 호출');  // 로그는 여기서 찍기
          onToggleFavorite();
        }}>
        <Ionicons name={isFavorite ? 'star' : 'star-outline'} size={28} color={isFavorite ? '#FFD700' : '#888'} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: '#eee' },
  symbol: { fontWeight: 'bold', fontSize: 16 },
}); 