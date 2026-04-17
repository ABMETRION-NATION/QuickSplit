import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Avatar from '../src/Avatar';
import { useStore } from '../src/store';
import { getPalette, radius, spacing } from '../src/theme';
import { Currency, SplitType } from '../src/types';
import { CURRENCY_SYMBOLS, evenSplit, formatDate } from '../src/utils';

export default function ExpenseScreen() {
  const { id, groupId: presetGroupId } = useLocalSearchParams<{
    id?: string;
    groupId?: string;
  }>();
  const router = useRouter();
  const {
    state,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useStore();
  const palette = getPalette(state.theme);
  const styles = makeStyles(palette);

  const existing = useMemo(
    () => (id ? state.expenses.find((e) => e.id === id) : undefined),
    [id, state.expenses]
  );
  const isEdit = !!existing;

  const [groupId, setGroupId] = useState<string>(
    existing?.groupId || presetGroupId || state.groups[0]?.id || ''
  );
  const group = useMemo(
    () => state.groups.find((g) => g.id === groupId),
    [groupId, state.groups]
  );

  const [title, setTitle] = useState(existing?.title || '');
  const [amountStr, setAmountStr] = useState(
    existing ? existing.amount.toFixed(2) : ''
  );
  const [currency, setCurrency] = useState<Currency>(
    existing?.currency || group?.currency || state.currency
  );
  const [date, setDate] = useState<string>(
    existing?.date || new Date().toISOString()
  );
  const [paidBy, setPaidBy] = useState<string>(
    existing?.paidBy || group?.participants[0]?.id || ''
  );
  const [participantIds, setParticipantIds] = useState<string[]>(
    existing?.participantIds || group?.participants.map((p) => p.id) || []
  );
  const [splitType, setSplitType] = useState<SplitType>(
    existing?.splitType || 'even'
  );
  const [customShares, setCustomShares] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    if (existing && existing.splitType === 'custom') {
      existing.shares.forEach((s) => {
        init[s.participantId] = s.amount.toFixed(2);
      });
    }
    return init;
  });
  const [notes, setNotes] = useState(existing?.notes || '');

  // When the group changes, reset group-dependent fields
  useEffect(() => {
    if (!group) return;
    if (!existing) {
      setCurrency(group.currency);
      setPaidBy((prev) =>
        group.participants.some((p) => p.id === prev)
          ? prev
          : group.participants[0]?.id || ''
      );
      setParticipantIds((prev) => {
        const filtered = prev.filter((pid) =>
          group.participants.some((p) => p.id === pid)
        );
        return filtered.length > 0
          ? filtered
          : group.participants.map((p) => p.id);
      });
    }
  }, [group?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const amount = parseFloat(amountStr.replace(',', '.')) || 0;

  const evenMap = useMemo(
    () => evenSplit(amount, participantIds),
    [amount, participantIds]
  );

  const customTotal = useMemo(() => {
    return participantIds.reduce((acc, pid) => {
      const v = parseFloat(customShares[pid] ?? '0') || 0;
      return acc + v;
    }, 0);
  }, [customShares, participantIds]);

  const toggleParticipant = (pid: string) => {
    setParticipantIds((prev) =>
      prev.includes(pid) ? prev.filter((x) => x !== pid) : [...prev, pid]
    );
  };

  const handleSave = () => {
    if (!group) {
      Alert.alert('Select group', 'Please choose a group.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Title required', 'Give this expense a title.');
      return;
    }
    if (!(amount > 0)) {
      Alert.alert('Amount required', 'Enter an amount greater than 0.');
      return;
    }
    if (participantIds.length === 0) {
      Alert.alert('Pick participants', 'Select at least one person.');
      return;
    }
    if (!paidBy || !group.participants.some((p) => p.id === paidBy)) {
      Alert.alert('Who paid?', 'Select who paid for this.');
      return;
    }

    let customMap: Record<string, number> | undefined;
    if (splitType === 'custom') {
      customMap = {};
      participantIds.forEach((pid) => {
        customMap![pid] = parseFloat(customShares[pid] ?? '0') || 0;
      });
      const sum = Object.values(customMap).reduce((a, b) => a + b, 0);
      if (Math.abs(sum - amount) > 0.01) {
        Alert.alert(
          'Shares don\u2019t add up',
          `Custom shares total ${sum.toFixed(2)} but expense is ${amount.toFixed(2)}.`
        );
        return;
      }
    }

    const payload = {
      groupId: group.id,
      title,
      amount,
      currency,
      date,
      paidBy,
      participantIds,
      splitType,
      customShares: customMap,
      notes,
    };

    if (isEdit && existing) {
      updateExpense(existing.id, payload);
    } else {
      addExpense(payload);
    }
    router.back();
  };

  const handleDelete = () => {
    if (!existing) return;
    Alert.alert('Delete expense?', `Remove "${existing.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteExpense(existing.id);
          router.back();
        },
      },
    ]);
  };

  if (state.groups.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconBtn}
            testID="expense-back-btn"
          >
            <Ionicons name="close" size={24} color={palette.textMain} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Add expense</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyWrap}>
          <Ionicons name="people-outline" size={44} color={palette.textMuted} />
          <Text style={styles.emptyTitle}>Create a group first</Text>
          <Text style={styles.emptyBody}>
            You need a group with at least 2 people to track an expense.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              router.back();
              router.push('/(tabs)/groups');
            }}
            testID="expense-goto-groups-btn"
          >
            <Text style={styles.primaryBtnText}>Go to Groups</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} testID="add-expense-screen">
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconBtn}
          testID="expense-back-btn"
        >
          <Ionicons name="close" size={24} color={palette.textMain} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>{isEdit ? 'Edit expense' : 'Add expense'}</Text>
        {isEdit ? (
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.iconBtn}
            testID="expense-delete-btn"
          >
            <Ionicons name="trash-outline" size={22} color={palette.iOwe} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Amount input */}
          <View style={styles.amountWrap}>
            <Text style={styles.currencySymbol}>
              {CURRENCY_SYMBOLS[currency]}
            </Text>
            <TextInput
              value={amountStr}
              onChangeText={setAmountStr}
              placeholder="0.00"
              placeholderTextColor={palette.textMuted}
              keyboardType="decimal-pad"
              style={styles.amountInput}
              testID="expense-amount-input"
            />
          </View>

          {/* Currency picker */}
          <View style={styles.segmentRow}>
            {(['USD', 'EUR', 'INR'] as Currency[]).map((c) => {
              const active = currency === c;
              return (
                <TouchableOpacity
                  key={c}
                  style={[styles.segment, active && styles.segmentActive]}
                  onPress={() => setCurrency(c)}
                  testID={`expense-currency-${c}`}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      active && styles.segmentTextActive,
                    ]}
                  >
                    {CURRENCY_SYMBOLS[c]} {c}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Title */}
          <Text style={styles.fieldLabel}>TITLE</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Dinner, Uber, Groceries"
            placeholderTextColor={palette.textMuted}
            style={styles.input}
            testID="expense-title-input"
          />

          {/* Group */}
          <Text style={styles.fieldLabel}>GROUP</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            {state.groups.map((g) => {
              const active = groupId === g.id;
              return (
                <TouchableOpacity
                  key={g.id}
                  onPress={() => setGroupId(g.id)}
                  style={[styles.pill, active && styles.pillActive]}
                  testID={`expense-group-${g.id}`}
                >
                  <Text
                    style={[
                      styles.pillText,
                      active && styles.pillTextActive,
                    ]}
                  >
                    {g.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Paid by */}
          <Text style={styles.fieldLabel}>PAID BY</Text>
          <View style={styles.paidByWrap}>
            {group?.participants.map((p) => {
              const active = paidBy === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setPaidBy(p.id)}
                  style={[styles.payer, active && styles.payerActive]}
                  testID={`expense-paidby-${p.id}`}
                >
                  <Avatar
                    name={p.name}
                    avatar={p.avatar}
                    size={36}
                    theme={state.theme}
                  />
                  <Text
                    style={[
                      styles.payerName,
                      active && { color: palette.textMain, fontWeight: '800' },
                    ]}
                    numberOfLines={1}
                  >
                    {p.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Split type */}
          <Text style={styles.fieldLabel}>SPLIT</Text>
          <View style={styles.segmentRow}>
            {(['even', 'custom'] as SplitType[]).map((t) => {
              const active = splitType === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.segment, active && styles.segmentActive]}
                  onPress={() => setSplitType(t)}
                  testID={`expense-split-${t}`}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      active && styles.segmentTextActive,
                    ]}
                  >
                    {t === 'even' ? 'Split evenly' : 'Custom amounts'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Participants */}
          <Text style={styles.fieldLabel}>INCLUDED</Text>
          {group?.participants.map((p) => {
            const selected = participantIds.includes(p.id);
            const share =
              splitType === 'even'
                ? evenMap[p.id] ?? 0
                : parseFloat(customShares[p.id] ?? '0') || 0;
            return (
              <View
                key={p.id}
                style={styles.participantRow}
                testID={`expense-participant-row-${p.id}`}
              >
                <TouchableOpacity
                  onPress={() => toggleParticipant(p.id)}
                  style={styles.participantLeft}
                  testID={`expense-participant-toggle-${p.id}`}
                >
                  <View
                    style={[
                      styles.checkbox,
                      selected && {
                        backgroundColor: palette.primary,
                        borderColor: palette.primary,
                      },
                    ]}
                  >
                    {selected && (
                      <Ionicons name="checkmark" size={16} color="#FFF" />
                    )}
                  </View>
                  <Avatar
                    name={p.name}
                    avatar={p.avatar}
                    size={36}
                    theme={state.theme}
                  />
                  <Text style={styles.participantName}>{p.name}</Text>
                </TouchableOpacity>
                {splitType === 'even' ? (
                  <Text style={styles.shareText}>
                    {selected
                      ? `${CURRENCY_SYMBOLS[currency]}${share.toFixed(2)}`
                      : '—'}
                  </Text>
                ) : (
                  <TextInput
                    editable={selected}
                    value={customShares[p.id] ?? ''}
                    onChangeText={(v) =>
                      setCustomShares((prev) => ({ ...prev, [p.id]: v }))
                    }
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={palette.textMuted}
                    style={[
                      styles.shareInput,
                      !selected && { opacity: 0.35 },
                    ]}
                    testID={`expense-customshare-${p.id}`}
                  />
                )}
              </View>
            );
          })}

          {splitType === 'custom' && (
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>
                Shares total
              </Text>
              <Text
                style={[
                  styles.sumVal,
                  Math.abs(customTotal - amount) > 0.01
                    ? { color: palette.iOwe }
                    : { color: palette.owesMe },
                ]}
              >
                {CURRENCY_SYMBOLS[currency]}
                {customTotal.toFixed(2)} / {CURRENCY_SYMBOLS[currency]}
                {amount.toFixed(2)}
              </Text>
            </View>
          )}

          {/* Date */}
          <Text style={styles.fieldLabel}>DATE</Text>
          <View style={styles.dateRow}>
            <Text style={styles.dateText}>{formatDate(date)}</Text>
            <View style={styles.dateBtnRow}>
              <TouchableOpacity
                style={styles.dateBtn}
                onPress={() => setDate(new Date().toISOString())}
                testID="expense-date-today"
              >
                <Text style={styles.dateBtnText}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateBtn}
                onPress={() => {
                  const d = new Date(date);
                  d.setDate(d.getDate() - 1);
                  setDate(d.toISOString());
                }}
                testID="expense-date-prev"
              >
                <Ionicons name="chevron-back" size={16} color={palette.textMain} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateBtn}
                onPress={() => {
                  const d = new Date(date);
                  d.setDate(d.getDate() + 1);
                  if (d > new Date()) return;
                  setDate(d.toISOString());
                }}
                testID="expense-date-next"
              >
                <Ionicons name="chevron-forward" size={16} color={palette.textMain} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Notes */}
          <Text style={styles.fieldLabel}>NOTES (OPTIONAL)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Anything to remember..."
            placeholderTextColor={palette.textMuted}
            style={[styles.input, { height: 88, paddingTop: 12 }]}
            multiline
            testID="expense-notes-input"
          />

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            testID="expense-save-btn"
          >
            <Text style={styles.saveBtnText}>
              {isEdit ? 'Save changes' : 'Save expense'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (p: ReturnType<typeof getPalette>) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: p.background },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: p.border,
    },
    topTitle: { color: p.textMain, fontSize: 16, fontWeight: '800' },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
    amountWrap: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'center',
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    currencySymbol: {
      color: p.textMuted,
      fontSize: 28,
      fontWeight: '900',
      marginRight: 6,
      marginBottom: 10,
    },
    amountInput: {
      color: p.textMain,
      fontSize: 56,
      fontWeight: '900',
      letterSpacing: -2,
      minWidth: 120,
      textAlign: 'center',
      padding: 0,
    },
    fieldLabel: {
      color: p.textMuted,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 2,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    input: {
      height: 50,
      backgroundColor: p.surface,
      borderWidth: 1,
      borderColor: p.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      color: p.textMain,
      fontSize: 15,
    },
    segmentRow: {
      flexDirection: 'row',
      gap: 6,
      backgroundColor: p.surfaceAlt,
      borderRadius: radius.md,
      padding: 4,
      borderWidth: 1,
      borderColor: p.border,
    },
    segment: {
      flex: 1,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.sm,
    },
    segmentActive: { backgroundColor: p.surface, borderWidth: 1, borderColor: p.border },
    segmentText: { color: p.textMuted, fontSize: 13, fontWeight: '700' },
    segmentTextActive: { color: p.textMain },
    pill: {
      paddingHorizontal: spacing.md,
      height: 40,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: p.border,
      backgroundColor: p.surface,
    },
    pillActive: { backgroundColor: p.primary, borderColor: p.primary },
    pillText: { color: p.textMain, fontWeight: '700' },
    pillTextActive: { color: p.primaryText },
    paidByWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    payer: {
      alignItems: 'center',
      width: 72,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    payerActive: { borderColor: p.primary, backgroundColor: p.surface },
    payerName: {
      color: p.textMuted,
      fontSize: 12,
      marginTop: 6,
      maxWidth: 70,
      textAlign: 'center',
    },
    participantRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: p.border,
    },
    participantLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: p.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    participantName: {
      color: p.textMain,
      fontSize: 14,
      fontWeight: '700',
    },
    shareText: { color: p.textMain, fontWeight: '700' },
    shareInput: {
      width: 100,
      height: 40,
      borderWidth: 1,
      borderColor: p.border,
      borderRadius: radius.sm,
      paddingHorizontal: 10,
      color: p.textMain,
      textAlign: 'right',
      fontWeight: '700',
    },
    sumRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: spacing.sm,
    },
    sumLabel: { color: p.textMuted, fontWeight: '600' },
    sumVal: { fontWeight: '800' },
    dateRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: p.surface,
      borderWidth: 1,
      borderColor: p.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    dateText: { color: p.textMain, fontSize: 15, fontWeight: '700' },
    dateBtnRow: { flexDirection: 'row', gap: 6 },
    dateBtn: {
      height: 34,
      paddingHorizontal: 10,
      minWidth: 34,
      borderRadius: radius.sm,
      backgroundColor: p.surfaceAlt,
      borderWidth: 1,
      borderColor: p.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dateBtnText: { color: p.textMain, fontWeight: '700', fontSize: 12 },
    saveBtn: {
      marginTop: spacing.xl,
      height: 54,
      backgroundColor: p.primary,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveBtnText: { color: p.primaryText, fontSize: 16, fontWeight: '800' },
    emptyWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
    },
    emptyTitle: {
      color: p.textMain,
      fontSize: 18,
      fontWeight: '800',
      marginTop: spacing.md,
    },
    emptyBody: {
      color: p.textMuted,
      fontSize: 13,
      textAlign: 'center',
      marginTop: 4,
      marginBottom: spacing.md,
    },
    primaryBtn: {
      backgroundColor: p.primary,
      paddingHorizontal: spacing.lg,
      paddingVertical: 12,
      borderRadius: radius.md,
    },
    primaryBtnText: { color: p.primaryText, fontWeight: '800' },
  });
