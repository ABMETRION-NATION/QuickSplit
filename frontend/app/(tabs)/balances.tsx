import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Avatar from '../../src/Avatar';
import { useStore } from '../../src/store';
import { getPalette, radius, spacing } from '../../src/theme';
import {
  computeGroupBalances,
  DebtEdge,
  formatAmount,
  simplifyDebts,
} from '../../src/utils';

export default function BalancesScreen() {
  const { state, settleBalance } = useStore();
  const palette = getPalette(state.theme);
  const styles = makeStyles(palette);

  const groupBlocks = useMemo(() => {
    return state.groups.map((g) => {
      const bal = computeGroupBalances(g, state.expenses, state.settlements);
      const debts = simplifyDebts(bal);
      return { group: g, balances: bal, debts };
    });
  }, [state.groups, state.expenses, state.settlements]);

  const nameFor = (groupId: string, pid: string) => {
    const g = state.groups.find((x) => x.id === groupId);
    return g?.participants.find((p) => p.id === pid)?.name ?? '—';
  };

  const avatarFor = (groupId: string, pid: string) => {
    const g = state.groups.find((x) => x.id === groupId);
    return g?.participants.find((p) => p.id === pid)?.avatar;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']} testID="balances-screen">
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.overline}>SETTLEMENTS</Text>
          <Text style={styles.title}>Balances</Text>
        </View>

        {groupBlocks.length === 0 && (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-circle-outline" size={40} color={palette.textMuted} />
            <Text style={styles.emptyTitle}>All clear</Text>
            <Text style={styles.emptyBody}>
              You&apos;ll see who owes who here once you start adding expenses.
            </Text>
          </View>
        )}

        {groupBlocks.map(({ group, debts }) => (
          <View key={group.id} style={styles.block}>
            <View style={styles.blockHeader}>
              <Text style={styles.blockTitle}>{group.name}</Text>
              <Text style={styles.blockMeta}>
                {debts.length} {debts.length === 1 ? 'debt' : 'debts'}
              </Text>
            </View>

            {debts.length === 0 ? (
              <View style={styles.settledRow} testID={`group-settled-${group.id}`}>
                <Ionicons name="checkmark-circle" size={20} color={palette.owesMe} />
                <Text style={[styles.settledText, { color: palette.owesMe }]}>
                  Everyone is settled up
                </Text>
              </View>
            ) : (
              debts.map((d: DebtEdge, idx) => {
                const fromName = nameFor(group.id, d.fromId);
                const toName = nameFor(group.id, d.toId);
                const fromAvatar = avatarFor(group.id, d.fromId);
                return (
                  <View
                    key={`${group.id}-${idx}`}
                    style={styles.debtRow}
                    testID={`debt-${group.id}-${idx}`}
                  >
                    <Avatar
                      name={fromName}
                      avatar={fromAvatar}
                      size={40}
                      theme={state.theme}
                    />
                    <View style={styles.debtMid}>
                      <Text style={styles.debtText}>
                        <Text style={styles.bold}>{fromName}</Text>
                        <Text style={{ color: palette.textMuted }}> owes </Text>
                        <Text style={styles.bold}>{toName}</Text>
                      </Text>
                      <Text style={[styles.debtAmount, { color: palette.iOwe }]}>
                        {formatAmount(d.amount, group.currency)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.settleBtn}
                      onPress={() =>
                        settleBalance(
                          group.id,
                          d.fromId,
                          d.toId,
                          d.amount,
                          group.currency
                        )
                      }
                      testID={`settle-btn-${group.id}-${idx}`}
                    >
                      <Text style={styles.settleBtnText}>Settle</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (p: ReturnType<typeof getPalette>) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: p.background },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
    header: { marginBottom: spacing.lg },
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
    block: {
      borderWidth: 1,
      borderColor: p.border,
      backgroundColor: p.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    blockHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    blockTitle: { color: p.textMain, fontSize: 18, fontWeight: '800' },
    blockMeta: { color: p.textMuted, fontSize: 12, fontWeight: '600' },
    debtRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: p.border,
    },
    debtMid: { flex: 1, marginLeft: spacing.sm },
    debtText: { color: p.textMain, fontSize: 14 },
    bold: { fontWeight: '800', color: p.textMain },
    debtAmount: { fontSize: 15, fontWeight: '900', marginTop: 2 },
    settleBtn: {
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      borderRadius: radius.md,
      backgroundColor: p.primary,
    },
    settleBtnText: { color: p.primaryText, fontWeight: '800', fontSize: 13 },
    settledRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    settledText: { fontWeight: '700' },
    emptyCard: {
      alignItems: 'center',
      padding: spacing.xl,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: p.border,
      backgroundColor: p.surface,
    },
    emptyTitle: {
      color: p.textMain,
      fontSize: 18,
      fontWeight: '800',
      marginTop: spacing.sm,
    },
    emptyBody: {
      color: p.textMuted,
      fontSize: 13,
      textAlign: 'center',
      marginTop: 4,
    },
  });
