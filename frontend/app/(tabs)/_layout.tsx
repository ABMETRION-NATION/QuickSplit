import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useTheme } from '../../src/store';
import { getPalette } from '../../src/theme';

const HomeIcon = ({ color, size }: { color: string; size: number }) => (
  <Ionicons name="home-outline" size={size} color={color} />
);
const GroupsIcon = ({ color, size }: { color: string; size: number }) => (
  <Ionicons name="people-outline" size={size} color={color} />
);
const BalancesIcon = ({ color, size }: { color: string; size: number }) => (
  <Ionicons name="swap-horizontal-outline" size={size} color={color} />
);
const SettingsIcon = ({ color, size }: { color: string; size: number }) => (
  <Ionicons name="settings-outline" size={size} color={color} />
);

export default function TabsLayout() {
  const theme = useTheme();
  const p = getPalette(theme);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: p.primary,
        tabBarInactiveTintColor: p.textMuted,
        tabBarStyle: {
          backgroundColor: p.surface,
          borderTopColor: p.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: HomeIcon,
          tabBarButtonTestID: 'tab-home',
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Groups',
          tabBarIcon: GroupsIcon,
          tabBarButtonTestID: 'tab-groups',
        }}
      />
      <Tabs.Screen
        name="balances"
        options={{
          title: 'Balances',
          tabBarIcon: BalancesIcon,
          tabBarButtonTestID: 'tab-balances',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: SettingsIcon,
          tabBarButtonTestID: 'tab-settings',
        }}
      />
    </Tabs>
  );
}
