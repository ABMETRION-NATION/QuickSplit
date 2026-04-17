import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  FlatList,
  Pressable,
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
import { formatAmount, shortDate, totalUnsettled } from '../../src/utils';

export default function HomeScreen() {
  const { state } = useStore();
  const router = useRouter();
  const palette = getPalette(state.theme);

  const total = useMemo(
    () => totalUnsettled(state.groups, state.expenses, state.settlements),
    [state.groups, state.expenses, state.settlements]
  );

  const recent = useMemo(
    () =>
      [...state.expenses]
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, 10),
    [state.expenses]
  );

  const participantsById = useMemo(() => {
    const m: Record<string, { name: string; avatar?: string }> = {};
    state.groups.forEach((g) =>
      g.participants.forEach((p) => (m[p.id] = { name: p.name, avatar: p.avatar }))
    );
    return m;
  }, [state.groups]);

  const groupsById = useMemo(() => {
    const m: Record<string, string> = {};
    state.groups.forEach((g) => (m[g.id] = g.name));
    return m;
  }, [state.groups]);

  const styles = makeStyles(palette);

  const hasData = state.groups.length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']} testID="home-screen">
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.overline}>QUICKSPLIT</Text>
          <Text style={styles.title}>Home</Text>
        </View>

        <View style={styles.balanceCard} testID="home-total-card">
          <Text style={styles.overline}>TOTAL UNSETTLED</Text>
          <Text style={styles.balanceAmount} testID="home-total-amount">
            {formatAmount(total, state.currency)}
          </Text>
          <Text style={styles.balanceSub}>
            Across {state.groups.length} {state.groups.length === 1 ? 'group' : 'groups'}
          </Text>
        </View>

        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push('/expense')}
            testID="home-add-expense-btn"
          >
            <Ionicons name="add" size={20} color={palette.primaryText} />
            <Text style={styles.primaryBtnText}>Add expense</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.push('/(tabs)/balances')}
            testID="home-view-balances-btn"
          >
            <Ionicons name="swap-horizontal" size={18} color={palette.textMain} />
            <Text style={styles.secondaryBtnText}>Balances</Text>
          </TouchableOpacity>
        </View>

        {hasData && (
          <>
            <Text style={styles.sectionLabel}>YOUR GROUPS</Text>
            <FlatList
              horizontal
              data={state.groups}
              keyExtractor={(g) => g.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: spacing.lg }}
              renderItem={({ item }) => {
                const groupExpenseTotal = state.expenses
                  .filter((e) => e.groupId === item.id)
                  .reduce((acc, e) => acc + e.amount, 0);
                return (
                  <Pressable
                    onPress={() => router.push(`/group/${item.id}`)}
                    style={styles.groupCard}
                    testID={`home-group-card-${item.id}`}
                  >
                    <Text style={styles.groupName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.groupMeta}>
                      {item.participants.length} people
                    </Text>
                    <Text style={styles.groupTotal}>
                      {formatAmount(groupExpenseTotal, item.currency)}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </>
        )}

        <Text style={styles.sectionLabel}>RECENT EXPENSES</Text>
        {recent.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="receipt-outline"
              size={36}
              color={palette.textMuted}
            />
            <Text style={styles.emptyTitle}>No expenses yet</Text>
            <Text style={styles.emptyBody}>
              Create a group, then tap Add expense to start tracking.
            </Text>
          </View>
        ) : (
          recent.map((e) => {
            const payer = participantsById[e.paidBy];
            return (
              <Pressable
                key={e.id}
                style={styles.expenseRow}
                onPress={() => router.push(`/expense?id=${e.id}`)}
                testID={`home-expense-row-${e.id}`}
              >
                <Avatar
                  name={payer?.name ?? '?'}
                  avatar={payer?.avatar}
                  size={44}
                  theme={state.theme}
                />
                <View style={styles.expenseMid}>
                  <Text style={styles.expenseTitle} numberOfLines={1}>
                    {e.title}
                  </Text>
                  <Text style={styles.expenseSub}>
                    {groupsById[e.groupId] ?? '—'} · {shortDate(e.date)} · {payer?.name ?? '—'}
                  </Text>
                </View>
                <Text style={styles.expenseAmount}>
                  {formatAmount(e.amount, e.currency)}
                </Text>
              </Pressable>
            );
          })
        )}
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
      marginTop: 4,
    },
    balanceCard: {
      borderWidth: 1,
      borderColor: p.border,
      backgroundColor: p.surface,
      padding: spacing.lg,
      borderRadius: radius.lg,
      marginBottom: spacing.md,
    },
    balanceAmount: {
      color: p.textMain,
      fontSize: 44,
      fontWeight: '900',
      letterSpacing: -1.5,
      marginTop: spacing.xs,
    },
    balanceSub: { color: p.textMuted, fontSize: 13, marginTop: 4 },
    quickRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    primaryBtn: {
      flex: 1,
      height: 52,
      backgroundColor: p.primary,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    primaryBtnText: { color: p.primaryText, fontWeight: '800', fontSize: 15 },
    secondaryBtn: {
      flex: 1,
      height: 52,
      borderWidth: 1,
      borderColor: p.border,
      backgroundColor: p.surface,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    secondaryBtnText: { color: p.textMain, fontWeight: '700', fontSize: 15 },
    sectionLabel: {
      color: p.textMuted,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 2,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    groupCard: {
      width: 180,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: p.border,
      backgroundColor: p.surface,
      marginRight: spacing.sm,
    },
    groupName: {
      color: p.textMain,
      fontSize: 16,
      fontWeight: '800',
      marginBottom: 2,
    },
    groupMeta: { color: p.textMuted, fontSize: 12, marginBottom: spacing.sm },
    groupTotal: { color: p.primary, fontSize: 20, fontWeight: '900' },
    expenseRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: p.border,
    },
    expenseMid: {
      flex: 1,
      marginLeft: spacing.sm,
      marginRight: spacing.sm,
    },
    expenseTitle: { color: p.textMain, fontSize: 15, fontWeight: '700' },
    expenseSub: { color: p.textMuted, fontSize: 12, marginTop: 2 },
    expenseAmount: {
      color: p.textMain,
      fontSize: 16,
      fontWeight: '800',
    },
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
      fontSize: 16,
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
