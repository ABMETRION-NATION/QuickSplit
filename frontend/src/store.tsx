import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { buildSeed } from './seed';
import {
  AppState,
  Currency,
  Expense,
  ExpenseShare,
  Group,
  Participant,
  Settlement,
  SplitType,
  ThemeMode,
} from './types';
import { evenSplit, uid } from './utils';

const STORAGE_KEY = 'quicksplit:state:v1';

const defaultState: AppState = {
  groups: [],
  expenses: [],
  settlements: [],
  currency: 'USD',
  theme: 'light',
  meId: '',
  hydrated: false,
};

interface StoreApi {
  state: AppState;
  // Settings
  setCurrency: (c: Currency) => void;
  setTheme: (t: ThemeMode) => void;
  toggleTheme: () => void;
  // Groups
  createGroup: (name: string, participantNames: string[], currency?: Currency) => Group;
  deleteGroup: (groupId: string) => void;
  renameGroup: (groupId: string, name: string) => void;
  addParticipant: (groupId: string, name: string) => void;
  removeParticipant: (groupId: string, participantId: string) => void;
  // Expenses
  addExpense: (input: ExpenseInput) => Expense;
  updateExpense: (id: string, input: ExpenseInput) => void;
  deleteExpense: (id: string) => void;
  // Settlement
  settleBalance: (
    groupId: string,
    fromId: string,
    toId: string,
    amount: number,
    currency: Currency
  ) => void;
  // Data mgmt
  seedDemoData: () => void;
  clearAllData: () => void;
}

export interface ExpenseInput {
  groupId: string;
  title: string;
  amount: number;
  currency: Currency;
  date: string;
  paidBy: string;
  participantIds: string[];
  splitType: SplitType;
  customShares?: Record<string, number>;
  notes?: string;
}

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const hydratedRef = useRef(false);

  // Hydrate
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<AppState>;
          setState({
            ...defaultState,
            ...parsed,
            hydrated: true,
          });
        } else {
          // First launch: seed demo data
          const seeded = buildSeed();
          setState({
            ...defaultState,
            ...seeded,
            currency: 'USD',
            theme: 'light',
            hydrated: true,
          });
        }
      } catch {
        setState({ ...defaultState, hydrated: true });
      } finally {
        hydratedRef.current = true;
      }
    })();
  }, []);

  // Persist on change
  useEffect(() => {
    if (!state.hydrated) return;
    const { hydrated, ...toSave } = state;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)).catch(() => {});
  }, [state]);

  const setCurrency = useCallback((c: Currency) => {
    setState((s) => ({ ...s, currency: c }));
  }, []);

  const setTheme = useCallback((t: ThemeMode) => {
    setState((s) => ({ ...s, theme: t }));
  }, []);

  const toggleTheme = useCallback(() => {
    setState((s) => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' }));
  }, []);

  const createGroup = useCallback(
    (name: string, participantNames: string[], currency?: Currency): Group => {
      let created: Group | null = null;
      setState((s) => {
        const participants: Participant[] = participantNames
          .map((n) => n.trim())
          .filter(Boolean)
          .map((n) => ({ id: uid(), name: n }));
        const group: Group = {
          id: uid(),
          name: name.trim() || 'Untitled Group',
          participants,
          currency: currency ?? s.currency,
          createdAt: new Date().toISOString(),
        };
        created = group;
        return { ...s, groups: [...s.groups, group] };
      });
      return created as unknown as Group;
    },
    []
  );

  const deleteGroup = useCallback((groupId: string) => {
    setState((s) => ({
      ...s,
      groups: s.groups.filter((g) => g.id !== groupId),
      expenses: s.expenses.filter((e) => e.groupId !== groupId),
      settlements: s.settlements.filter((x) => x.groupId !== groupId),
    }));
  }, []);

  const renameGroup = useCallback((groupId: string, name: string) => {
    setState((s) => ({
      ...s,
      groups: s.groups.map((g) =>
        g.id === groupId ? { ...g, name: name.trim() || g.name } : g
      ),
    }));
  }, []);

  const addParticipant = useCallback((groupId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setState((s) => ({
      ...s,
      groups: s.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              participants: [
                ...g.participants,
                { id: uid(), name: trimmed },
              ],
            }
          : g
      ),
    }));
  }, []);

  const removeParticipant = useCallback(
    (groupId: string, participantId: string) => {
      setState((s) => {
        // Only remove if participant is not referenced in any expense
        const referenced = s.expenses.some(
          (e) =>
            e.groupId === groupId &&
            (e.paidBy === participantId ||
              e.participantIds.includes(participantId))
        );
        if (referenced) return s;
        return {
          ...s,
          groups: s.groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  participants: g.participants.filter(
                    (p) => p.id !== participantId
                  ),
                }
              : g
          ),
        };
      });
    },
    []
  );

  const buildShares = (
    amount: number,
    participantIds: string[],
    splitType: SplitType,
    customShares?: Record<string, number>
  ): ExpenseShare[] => {
    if (splitType === 'even') {
      const m = evenSplit(amount, participantIds);
      return participantIds.map((pid) => ({
        participantId: pid,
        amount: m[pid] ?? 0,
      }));
    }
    return participantIds.map((pid) => ({
      participantId: pid,
      amount: Math.round(((customShares?.[pid] ?? 0) + Number.EPSILON) * 100) / 100,
    }));
  };

  const addExpense = useCallback((input: ExpenseInput): Expense => {
    const now = new Date().toISOString();
    const shares = buildShares(
      input.amount,
      input.participantIds,
      input.splitType,
      input.customShares
    );
    const expense: Expense = {
      id: uid(),
      groupId: input.groupId,
      title: input.title.trim() || 'Expense',
      amount: Math.round((input.amount + Number.EPSILON) * 100) / 100,
      currency: input.currency,
      date: input.date || now,
      paidBy: input.paidBy,
      participantIds: input.participantIds,
      splitType: input.splitType,
      shares,
      notes: input.notes?.trim() || '',
      createdAt: now,
      updatedAt: now,
    };
    setState((s) => ({ ...s, expenses: [expense, ...s.expenses] }));
    return expense;
  }, []);

  const updateExpense = useCallback(
    (id: string, input: ExpenseInput) => {
      setState((s) => {
        const now = new Date().toISOString();
        const shares = buildShares(
          input.amount,
          input.participantIds,
          input.splitType,
          input.customShares
        );
        return {
          ...s,
          expenses: s.expenses.map((e) =>
            e.id === id
              ? {
                  ...e,
                  groupId: input.groupId,
                  title: input.title.trim() || e.title,
                  amount: Math.round((input.amount + Number.EPSILON) * 100) / 100,
                  currency: input.currency,
                  date: input.date || e.date,
                  paidBy: input.paidBy,
                  participantIds: input.participantIds,
                  splitType: input.splitType,
                  shares,
                  notes: input.notes?.trim() || '',
                  updatedAt: now,
                }
              : e
          ),
        };
      });
    },
    []
  );

  const deleteExpense = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      expenses: s.expenses.filter((e) => e.id !== id),
    }));
  }, []);

  const settleBalance = useCallback(
    (
      groupId: string,
      fromId: string,
      toId: string,
      amount: number,
      currency: Currency
    ) => {
      const now = new Date().toISOString();
      const settlement: Settlement = {
        id: uid(),
        groupId,
        fromId,
        toId,
        amount: Math.round((amount + Number.EPSILON) * 100) / 100,
        currency,
        date: now,
      };
      setState((s) => ({
        ...s,
        settlements: [...s.settlements, settlement],
      }));
    },
    []
  );

  const seedDemoData = useCallback(() => {
    const seeded = buildSeed();
    setState((s) => ({
      ...s,
      groups: [...s.groups, ...seeded.groups],
      expenses: [...s.expenses, ...seeded.expenses],
    }));
  }, []);

  const clearAllData = useCallback(() => {
    setState((s) => ({
      ...s,
      groups: [],
      expenses: [],
      settlements: [],
      meId: '',
    }));
  }, []);

  const api = useMemo<StoreApi>(
    () => ({
      state,
      setCurrency,
      setTheme,
      toggleTheme,
      createGroup,
      deleteGroup,
      renameGroup,
      addParticipant,
      removeParticipant,
      addExpense,
      updateExpense,
      deleteExpense,
      settleBalance,
      seedDemoData,
      clearAllData,
    }),
    [
      state,
      setCurrency,
      setTheme,
      toggleTheme,
      createGroup,
      deleteGroup,
      renameGroup,
      addParticipant,
      removeParticipant,
      addExpense,
      updateExpense,
      deleteExpense,
      settleBalance,
      seedDemoData,
      clearAllData,
    ]
  );

  return (
    <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
  );
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export function useTheme() {
  const { state } = useStore();
  return state.theme;
}
