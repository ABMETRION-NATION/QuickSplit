import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
import { useStore } from '../../src/store';
import { getPalette, radius, spacing } from '../../src/theme';
import { computeGroupBalances, formatAmount } from '../../src/utils';

export default function GroupsScreen() {
  const { state, createGroup, deleteGroup } = useStore();
  const router = useRouter();
  const palette = getPalette(state.theme);
  const styles = makeStyles(palette);

  const [modalOpen, setModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [memberInput, setMemberInput] = useState('');
  const [members, setMembers] = useState<string[]>(['You']);

  const openCreate = () => {
    setGroupName('');
    setMemberInput('');
    setMembers(['You']);
    setModalOpen(true);
  };

  const addMember = () => {
    const m = memberInput.trim();
    if (!m) return;
    if (members.some((x) => x.toLowerCase() === m.toLowerCase())) {
      setMemberInput('');
      return;
    }
    setMembers((prev) => [...prev, m]);
    setMemberInput('');
  };

  const removeMember = (name: string) => {
    setMembers((prev) => prev.filter((m) => m !== name));
  };

  const submit = () => {
    if (!groupName.trim()) {
      Alert.alert('Name required', 'Please enter a group name.');
      return;
    }
    if (members.length < 2) {
      Alert.alert('Add people', 'A group needs at least 2 participants.');
      return;
    }
    const g = createGroup(groupName, members);
    setModalOpen(false);
    if (g?.id) router.push(`/group/${g.id}`);
  };

  const confirmDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete group?',
      `This removes "${name}" and all its expenses.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteGroup(id),
        },
      ]
    );
  };

  const groupSummaries = useMemo(() => {
    return state.groups.map((g) => {
      const bal = computeGroupBalances(g, state.expenses, state.settlements);
      const meBal = state.meId ? bal[state.meId] ?? 0 : 0;
      const total = state.expenses
        .filter((e) => e.groupId === g.id)
        .reduce((acc, e) => acc + e.amount, 0);
      return { group: g, meBal, total };
    });
  }, [state.groups, state.expenses, state.settlements, state.meId]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']} testID="groups-screen">
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.overline}>GROUPS</Text>
          <Text style={styles.title}>Your groups</Text>
        </View>
        <TouchableOpacity
          style={styles.addIcon}
          onPress={openCreate}
          testID="groups-new-btn"
        >
          <Ionicons name="add" size={22} color={palette.primaryText} />
        </TouchableOpacity>
      </View>

      {state.groups.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="people-outline" size={40} color={palette.textMuted} />
          <Text style={styles.emptyTitle}>No groups yet</Text>
          <Text style={styles.emptyBody}>
            Create your first group to split expenses with friends.
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={openCreate}
            testID="groups-empty-create-btn"
          >
            <Text style={styles.emptyBtnText}>Create group</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={groupSummaries}
          keyExtractor={(s) => s.group.id}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.xxl,
          }}
          renderItem={({ item }) => {
            const { group, meBal, total } = item;
            const meTone =
              meBal > 0.005
                ? palette.owesMe
                : meBal < -0.005
                ? palette.iOwe
                : palette.textMuted;
            const meLabel =
              meBal > 0.005
                ? 'You are owed'
                : meBal < -0.005
                ? 'You owe'
                : 'Settled up';
            return (
              <Pressable
                style={styles.groupCard}
                onPress={() => router.push(`/group/${group.id}`)}
                onLongPress={() => confirmDelete(group.id, group.name)}
                testID={`groups-card-${group.id}`}
              >
                <View style={styles.groupCardTop}>
                  <Text style={styles.overlineSmall}>
                    {group.participants.length} MEMBERS
                  </Text>
                  <Text style={styles.totalSmall}>
                    {formatAmount(total, group.currency)} total
                  </Text>
                </View>
                <Text style={styles.groupName} numberOfLines={2}>
                  {group.name}
                </Text>
                <View style={styles.balanceRow}>
                  <Text style={styles.balanceLabel}>{meLabel}</Text>
                  <Text style={[styles.balanceValue, { color: meTone }]}>
                    {formatAmount(Math.abs(meBal), group.currency)}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      {/* Create group modal */}
      <Modal
        visible={modalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>New group</Text>

            <Text style={styles.fieldLabel}>Group name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Weekend Trip"
              placeholderTextColor={palette.textMuted}
              value={groupName}
              onChangeText={setGroupName}
              testID="group-modal-name-input"
            />

            <Text style={styles.fieldLabel}>Add people</Text>
            <View style={styles.memberRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Add a name"
                placeholderTextColor={palette.textMuted}
                value={memberInput}
                onChangeText={setMemberInput}
                onSubmitEditing={addMember}
                returnKeyType="done"
                testID="group-modal-member-input"
              />
              <TouchableOpacity
                onPress={addMember}
                style={styles.memberAddBtn}
                testID="group-modal-add-member-btn"
              >
                <Ionicons name="add" size={22} color={palette.primaryText} />
              </TouchableOpacity>
            </View>

            <View style={styles.chipWrap}>
              {members.map((m) => (
                <Pressable
                  key={m}
                  style={styles.chip}
                  onPress={() => removeMember(m)}
                >
                  <Text style={styles.chipText}>{m}</Text>
                  <Ionicons
                    name="close"
                    size={14}
                    color={palette.textMuted}
                    style={{ marginLeft: 4 }}
                  />
                </Pressable>
              ))}
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalOpen(false)}
                testID="group-modal-cancel-btn"
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={submit}
                testID="group-modal-submit-btn"
              >
                <Text style={styles.submitBtnText}>Create group</Text>
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
    },
    overline: {
      color: p.textMuted,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 2,
    },
    overlineSmall: {
      color: p.textMuted,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1.5,
    },
    title: {
      color: p.textMain,
      fontSize: 34,
      fontWeight: '900',
      letterSpacing: -1,
      marginTop: 2,
    },
    addIcon: {
      height: 44,
      width: 44,
      borderRadius: radius.pill,
      backgroundColor: p.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyCard: {
      margin: spacing.lg,
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
    emptyBtn: {
      marginTop: spacing.md,
      backgroundColor: p.primary,
      paddingHorizontal: spacing.lg,
      paddingVertical: 12,
      borderRadius: radius.md,
    },
    emptyBtnText: { color: p.primaryText, fontWeight: '800' },
    groupCard: {
      borderWidth: 1,
      borderColor: p.border,
      backgroundColor: p.surface,
      padding: spacing.lg,
      borderRadius: radius.lg,
      marginBottom: spacing.md,
    },
    groupCardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    totalSmall: { color: p.textMuted, fontSize: 12, fontWeight: '600' },
    groupName: {
      color: p.textMain,
      fontSize: 22,
      fontWeight: '900',
      letterSpacing: -0.5,
    },
    balanceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.md,
    },
    balanceLabel: { color: p.textMuted, fontSize: 13 },
    balanceValue: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
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
      fontSize: 22,
      fontWeight: '900',
      marginBottom: spacing.md,
    },
    fieldLabel: {
      color: p.textMuted,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.5,
      marginBottom: 6,
      marginTop: spacing.sm,
    },
    input: {
      height: 50,
      backgroundColor: p.surfaceAlt,
      borderWidth: 1,
      borderColor: p.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      color: p.textMain,
      fontSize: 15,
    },
    memberRow: { flexDirection: 'row', gap: spacing.sm },
    memberAddBtn: {
      height: 50,
      width: 50,
      borderRadius: radius.md,
      backgroundColor: p.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: spacing.sm,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: p.surfaceAlt,
      borderWidth: 1,
      borderColor: p.border,
      borderRadius: radius.pill,
    },
    chipText: { color: p.textMain, fontSize: 13, fontWeight: '600' },
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
