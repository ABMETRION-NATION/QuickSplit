import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { getPalette, radius } from './theme';
import { ThemeMode } from './types';
import { initials } from './utils';

interface Props {
  name: string;
  avatar?: string;
  size?: number;
  theme: ThemeMode;
}

const COLORS = [
  '#F59E0B',
  '#3B82F6',
  '#10B981',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#F97316',
];

function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function Avatar({ name, avatar, size = 40, theme }: Props) {
  const palette = getPalette(theme);
  const styles = StyleSheet.create({
    container: {
      width: size,
      height: size,
      borderRadius: radius.pill,
      backgroundColor: colorFor(name),
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: palette.border,
    },
    image: {
      width: size,
      height: size,
    },
    text: {
      color: '#FFFFFF',
      fontSize: size * 0.4,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
  });

  return (
    <View style={styles.container}>
      {avatar ? (
        <Image source={{ uri: avatar }} style={styles.image} />
      ) : (
        <Text style={styles.text}>{initials(name)}</Text>
      )}
    </View>
  );
}
