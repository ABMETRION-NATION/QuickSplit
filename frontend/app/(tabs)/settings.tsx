import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../src/store';
import { getPalette, radius, spacing } from '../../src/theme';
import { Currency } from '../../src/types';

const CURRENCIES: { code: Currency; label: string; symbol: string }[] = [
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'INR', label: 'Indian Rupee', symbol: '₹' },
];

export default function SettingsScreen() {
  const { state, setCurrency, toggleTheme, seedDemoData, clearAllData } =
    useStore();
  const palette = getPalette(state.theme);
  const styles = makeStyles(palette);

  const confirmClear = () => {
    Alert.alert(
      'Clear all data?',
      'This deletes all groups, expenses and settlements from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => clearAllData(),
        },
      ]
    );
  };

  const showAbout = () => {
    Alert.alert(
      'QuickSplit',
      'A fast, local-first expense splitter.\n\nVersion 1.0.0\nAll data is stored on your device.'
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']} testID="settings-screen">
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.overline}>PREFERENCES</Text>
          <Text style={styles.title}>Settings</Text>
        </View>

        <Text style={styles.sectionLabel}>APPEARANCE</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons
              name={state.theme === 'dark' ? 'moon' : 'sunny'}
              size={22}
              color={palette.textMain}
            />
            <Text style={styles.rowLabel}>Dark mode</Text>
            <Switch
              value={state.theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: palette.border, true: palette.primary }}
              thumbColor="#FFFFFF"
              testID="settings-darkmode-switch"
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>DEFAULT CURRENCY</Text>
        <View style={styles.card}>
          {CURRENCIES.map((c, idx) => {
            const selected = state.currency === c.code;
            return (
              <TouchableOpacity
                key={c.code}
                style={[
                  styles.currencyRow,
                  idx !== CURRENCIES.length - 1 && styles.rowDivider,
                ]}
                onPress={() => setCurrency(c.code)}
                testID={`settings-currency-${c.code}`}
              >
                <View style={styles.currencySym}>
                  <Text style={styles.currencySymText}>{c.symbol}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabelPlain}>{c.label}</Text>
                  <Text style={styles.rowSub}>{c.code}</Text>
                </View>
                {selected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={palette.primary}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>ACCOUNT (DEMO)</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={[styles.socialBtn, styles.rowDivider]}
            onPress={() =>
              Alert.alert('Demo', 'Google sign-in is a placeholder.')
            }
            testID="settings-google-btn"
          >
            <Ionicons name="logo-google" size={20} color={palette.textMain} />
            <Text style={styles.socialText}>Continue with Google</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.socialBtn}
            onPress={() =>
              Alert.alert('Demo', 'Facebook sign-in is a placeholder.')
            }
            testID="settings-facebook-btn"
          >
            <Ionicons name="logo-facebook" size={20} color="#1877F2" />
            <Text style={styles.socialText}>Continue with Facebook</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>DATA</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={[styles.simpleRow, styles.rowDivider]}
            onPress={seedDemoData}
            testID="settings-seed-btn"
          >
            <Ionicons name="sparkles-outline" size={20} color={palette.textMain} />
            <Text style={styles.rowLabelPlain}>Load demo data</Text>
            <Ionicons name="chevron-forward" size={18} color={palette.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.simpleRow}
            onPress={confirmClear}
            testID="settings-clear-btn"
          >
            <Ionicons name="trash-outline" size={20} color={palette.iOwe} />
            <Text style={[styles.rowLabelPlain, { color: palette.iOwe }]}>
              Clear all data
            </Text>
            <Ionicons name="chevron-forward" size={18} color={palette.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.simpleRow}
            onPress={showAbout}
            testID="settings-about-btn"
          >
            <Ionicons name="information-circle-outline" size={20} color={palette.textMain} />
            <Text style={styles.rowLabelPlain}>About QuickSplit</Text>
            <Ionicons name="chevron-forward" size={18} color={palette.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Made for fast expense splitting.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (p: ReturnType<typeof getPalette>) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: p.background },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
    header: { marginBottom: spacing.md },
    overline: {
      color: p.textMuted,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 2,
    },
    title: {
      color: p.textMain,
      fontSize: 34,
      fontWeight: '900',
      letterSpacing: -1,
      marginTop: 2,
    },
    sectionLabel: {
      color: p.textMuted,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 2,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    card: {
      borderWidth: 1,
      borderColor: p.border,
      backgroundColor: p.surface,
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    rowLabel: { flex: 1, color: p.textMain, fontSize: 15, fontWeight: '600' },
    rowLabelPlain: { flex: 1, color: p.textMain, fontSize: 15, fontWeight: '600' },
    rowSub: { color: p.textMuted, fontSize: 12, marginTop: 2 },
    rowDivider: { borderBottomWidth: 1, borderBottomColor: p.border },
    currencyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    currencySym: {
      width: 36,
      height: 36,
      borderRadius: radius.pill,
      backgroundColor: p.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    currencySymText: {
      color: p.textMain,
      fontSize: 18,
      fontWeight: '900',
    },
    socialBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    socialText: { color: p.textMain, fontSize: 15, fontWeight: '700' },
    simpleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    footer: {
      color: p.textMuted,
      fontSize: 12,
      textAlign: 'center',
      marginTop: spacing.xl,
    },
  });
