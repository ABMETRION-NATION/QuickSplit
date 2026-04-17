export type Currency = 'USD' | 'EUR' | 'INR';

export type ThemeMode = 'light' | 'dark';

export interface Participant {
  id: string;
  name: string;
  avatar?: string; // remote url or undefined
}

export type SplitType = 'even' | 'custom';

export interface ExpenseShare {
  participantId: string;
  amount: number;
}

export interface Expense {
  id: string;
  groupId: string;
  title: string;
  amount: number;
  currency: Currency;
  date: string; // ISO date
  paidBy: string; // participantId
  participantIds: string[];
  splitType: SplitType;
  shares: ExpenseShare[]; // absolute amounts per participant
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Settlement {
  id: string;
  groupId: string;
  fromId: string;
  toId: string;
  amount: number;
  currency: Currency;
  date: string;
}

export interface Group {
  id: string;
  name: string;
  participants: Participant[];
  currency: Currency;
  createdAt: string;
}

export interface AppState {
  groups: Group[];
  expenses: Expense[];
  settlements: Settlement[];
  currency: Currency;
  theme: ThemeMode;
  meId: string; // the "me" participant id reference (optional use)
  hydrated: boolean;
}
