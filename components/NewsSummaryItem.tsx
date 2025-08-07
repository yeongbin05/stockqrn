import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  symbol: string;
  date: string;
  summary: string;
}

export default function NewsSummaryItem({ symbol, date, summary }: Props) {
  return (
    <View style={styles.item}>
      <Text style={styles.symbol}>{symbol} ({date})</Text>
      <Text>{summary}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  item: { marginBottom: 20, padding: 12, borderRadius: 8, backgroundColor: '#f9f9f9' },
  symbol: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
}); 