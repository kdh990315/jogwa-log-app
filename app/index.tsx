import React from 'react';
import { SafeAreaView, StyleSheet, Text, useColorScheme, View } from 'react-native';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.content}>
        <Text style={[styles.title, isDark && styles.titleDark]}>조과로그</Text>
        <Text style={[styles.description, isDark && styles.descriptionDark]}>
          초기 세팅이 완료된 기본 화면입니다.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7faf8',
  },
  containerDark: {
    backgroundColor: '#101412',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: '#17211b',
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 42,
  },
  titleDark: {
    color: '#f3f7f4',
  },
  description: {
    marginTop: 12,
    color: '#5d6b63',
    fontSize: 16,
    lineHeight: 24,
  },
  descriptionDark: {
    color: '#bbc7bf',
  },
});
