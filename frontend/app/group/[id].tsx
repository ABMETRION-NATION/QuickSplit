import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Avatar from '../../src/Avatar';
import { useStore } from '../../src/store';
import { getPalette, radius, spacing } from '../../src/theme';
import {
  computeGroupBalances,
  formatAmount,
  shortDate,
} from '../../src/utils';

export default function GroupDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    state,
    addParticipant,
    removeParticipant,
    deleteGroup,
    renameGroup,
  } = useStore();
  const palette = getPalette(state.theme);
  const styles = makeStyles(palette);

  const group = state.groups.find((g) => g.id === id);
  const [addOpen, setAddOpen] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [newName, setNewName] = useState(group?.name || '');

  const expenses = useMemo(
    () =>
      state.expenses
        .filter((e) => e.groupId === id)
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [state.expenses, id]
  );

  const balances = useMemo(() => {
    if (!group) return {};
    return computeGroupBalances(group, state.expenses, state.settlements);
  }, [group, state.expenses, state.settlements]);

  if (!group) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={22} color={palette.textMain} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Group</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: palette.textMuted }}>Group not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const submitAdd = () => {
    const n = memberName.trim();
    if (!n) return;
    addParticipant(group.id, n);
    setMemberName('');
    setAddOpen(false);
  };

  const handleRemove = (pid: string, name: string) => {
    const referenced = state.expenses.some(
      (e) =>
        e.groupId === group.id &&
        (e.paidBy === pid || e.participantIds.includes(pid))
    );
    if (referenced) {
      Alert.alert(
        'Cannot remove',
        `${name} is part of an existing expense. Delete those expenses first.`
      );
      return;
    }
    Alert.alert('Remove participant?', `Remove ${name} from ${group.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeParticipant(group.id, pid),
      },
    ]);
  };

  const confirmDeleteGroup = () => {
    Alert.alert(
      'Delete group?',
      `This deletes ${group.name} and all its expenses.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteGroup(group.id);
            router.back();
          },
        },
      ]
    );
  };

  const saveName = () => {
    const n = newName.trim();
    if (!n) return;
    renameGroup(group.id, n);
    setEditNameOpen(false);
  };

  return (
    <SafeAreaView style={styles.safe} testID={`group-detail-${group.id}`}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconBtn}
          testID="group-back-btn"
        >
          <Ionicons name="arrow-back" size={22} color={palette.textMain} />
        </TouchableOpacity>
        <Pressable
          onPress={() => {
            setNewName(group.name);
            setEditNameOpen(true);
          }}
          style={{ flex: 1, alignItems: 'center' }}
          testID="group-title-edit"
        >
          <Text style={styles.topTitle} numberOfLines={1}>
            {group.name}
          </Text>
        </Pressable>
        <TouchableOpacity
          onPress={confirmDeleteGroup}
          style={styles.iconBtn}
          testID="group-delete-btn"
        >
          <Ionicons name="trash-outline" size={20} color={palette.iOwe} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={expenses}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.scroll}
        ListHeaderComponent={
          <View>
            <View style={styles.hero}>
              <Text style={styles.overline}>
                {group.participants.length} PEOPLE · {group.currency}
              </Text>
              <Text style={styles.heroTotal}>
                {formatAmount(
                  expenses.reduce((a, e) => a + e.amount, 0),
                  group.currency
                )}
              </Text>
              <Text style={styles.heroSub}>Total spent in this group</Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => router.push(`/expense?groupId=${group.id}`)}
                testID="group-add-expense-btn"
              >
                <Ionicons name="add" size={18} color={palette.primaryText} />
                <Text style={styles.primaryBtnText}>Add expense</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => setAddOpen(true)}
                testID="group-add-participant-btn"
              >
                <Ionicons name="person-add" size={18} color={palette.textMain} />
                <Text style={styles.secondaryBtnText}>Add person</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionLabel}>PEOPLE</Text>
            <View style={styles.peopleWrap}>
              {group.participants.map((p) => {
                const bal = balances[p.id] ?? 0;
                const tone =
                  bal > 0.005
                    ? palette.owesMe
                    : bal < -0.005
                    ? palette.iOwe
                    : palette.textMuted;
                return (
                  <Pressable
                    key={p.id}
                    style={styles.personRow}
                    onLongPress={() => handleRemove(p.id, p.name)}
                    testID={`group-person-${p.id}`}
                  >
                    <Avatar
                      name={p.name}
                      avatar={p.avatar}
                      size={40}
                      theme={state.theme}
                    />
                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                      <Text style={styles.personName}>{p.name}</Text>
                      <Text style={styles.personMeta}>
                        {bal > 0.005
                          ? 'is owed'
                          : bal < -0.005
                          ? 'owes'
                          : 'settled'}
                      </Text>
                    </View>
                    <Text style={[styles.personBal, { color: tone }]}>
                      {formatAmount(Math.abs(bal), group.currency)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>EXPENSES</Text>
            {expenses.length === 0 && (
              <View style={styles.emptyCard}>
                <Ionicons
                  name="receipt-outline"
                  size={32}
                  color={palette.textMuted}
                />
                <Text style={styles.emptyTitle}>No expenses yet</Text>
                <Text style={styles.emptyBody}>
                  Tap &quot;Add expense&quot; to log your first one.
                </Text>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const payer = group.participants.find((p) => p.id === item.paidBy);
          return (
            <Pressable
              style={styles.expenseRow}
              onPress={() => router.push(`/expense?id=${item.id}`)}
              testID={`group-expense-${item.id}`}
            >
              <Avatar
                name={payer?.name ?? '?'}
                avatar={payer?.avatar}
                size={40}
                theme={state.theme}
              />
              <View style={styles.expenseMid}>
                <Text style={styles.expenseTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.expenseSub}>
                  {payer?.name ?? '—'} · {shortDate(item.date)} ·{' '}
                  {item.splitType === 'even' ? 'Even split' : 'Custom'}
                </Text>
              </View>
              <Text style={styles.expenseAmount}>
                {formatAmount(item.amount, item.currency)}
              </Text>
            </Pressable>
          );
        }}
      />

      {/* Add participant modal */}
      <Modal
        visible={addOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setAddOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add person</Text>
            <TextInput
              value={memberName}
              onChangeText={setMemberName}
              placeholder="Name"
              placeholderTextColor={palette.textMuted}
              style={styles.modalInput}
              autoFocus
              onSubmitEditing={submitAdd}
              testID="group-add-person-input"
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setAddOpen(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={submitAdd}
                testID="group-add-person-submit"
              >
                <Text style={styles.submitBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit name modal */}
      <Modal
        visible={editNameOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setEditNameOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Rename group</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              style={styles.modalInput}
              autoFocus
              onSubmitEditing={saveName}
              testID="group-rename-input"
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditNameOpen(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={saveName}
                testID="group-rename-submit"
              >
                <Text style={styles.submitBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (p: ReturnType<typeof getPalette>) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: p.background },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: p.border,
    },
    topTitle: { color: p.textMain, fontSize: 17, fontWeight: '800' },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
    hero: {
      borderWidth: 1,
      borderColor: p.border,
      backgroundColor: p.surface,
      padding: spacing.lg,
      borderRadius: radius.lg,
      marginBottom: spacing.md,
    },
    overline: {
      color: p.textMuted,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 2,
    },
    heroTotal: {
      color: p.textMain,
      fontSize: 38,
      fontWeight: '900',
      letterSpacing: -1.2,
      marginTop: 4,
    },
    heroSub: { color: p.textMuted, fontSize: 13, marginTop: 2 },
    actionRow: { flexDirection: 'row', gap: spacing.sm },
    primaryBtn: {
      flex: 1,
      height: 50,
      backgroundColor: p.primary,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    primaryBtnText: { color: p.primaryText, fontWeight: '800' },
    secondaryBtn: {
      flex: 1,
      height: 50,
      borderWidth: 1,
      borderColor: p.border,
      backgroundColor: p.surface,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    secondaryBtnText: { color: p.textMain, fontWeight: '700' },
    sectionLabel: {
      color: p.textMuted,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 2,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    peopleWrap: {
      borderWidth: 1,
      borderColor: p.border,
      borderRadius: radius.lg,
      backgroundColor: p.surface,
      overflow: 'hidden',
    },
    personRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: p.border,
    },
    personName: { color: p.textMain, fontSize: 15, fontWeight: '700' },
    personMeta: { color: p.textMuted, fontSize: 12, marginTop: 2 },
    personBal: { fontSize: 15, fontWeight: '900' },
    expenseRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: p.border,
    },
    expenseMid: { flex: 1, marginHorizontal: spacing.sm },
    expenseTitle: { color: p.textMain, fontSize: 15, fontWeight: '700' },
    expenseSub: { color: p.textMuted, fontSize: 12, marginTop: 2 },
    expenseAmount: { color: p.textMain, fontSize: 15, fontWeight: '800' },
    emptyCard: {
      alignItems: 'center',
      padding: spacing.lg,
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
    modalBackdrop: {
      flex: 1,
      backgroundColor: p.overlay,
      justifyContent: 'flex-end',
    },
    modalCard: {
      backgroundColor: p.surface,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xl,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },
    modalHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: p.border,
      alignSelf: 'center',
      marginBottom: spacing.md,
    },
    modalTitle: {
      color: p.textMain,
      fontSize: 20,
      fontWeight: '900',
      marginBottom: spacing.md,
    },
    modalInput: {
      height: 50,
      backgroundColor: p.surfaceAlt,
      borderWidth: 1,
      borderColor: p.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      color: p.textMain,
      fontSize: 15,
    },
    modalBtnRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    cancelBtn: {
      flex: 1,
      height: 50,
      borderWidth: 1,
      borderColor: p.border,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelBtnText: { color: p.textMain, fontWeight: '700' },
    submitBtn: {
      flex: 1.5,
      height: 50,
      backgroundColor: p.primary,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitBtnText: { color: p.primaryText, fontWeight: '800' },
  });
