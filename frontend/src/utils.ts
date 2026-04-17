import { Currency, Expense, Group, Settlement } from './types';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  INR: '₹',
};

export const CURRENCY_LOCALES: Record<Currency, string> = {
  USD: 'en-US',
  EUR: 'de-DE',
  INR: 'en-IN',
};

export function formatAmount(amount: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString(CURRENCY_LOCALES[currency], {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const sign = amount < 0 ? '-' : '';
  return `${sign}${symbol}${formatted}`;
}

export function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function shortDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

export function uid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  );
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function evenSplit(
  amount: number,
  participantIds: string[]
): Record<string, number> {
  const n = participantIds.length;
  if (n === 0) return {};
  const cents = Math.round(amount * 100);
  const base = Math.floor(cents / n);
  const remainder = cents - base * n;
  const result: Record<string, number> = {};
  participantIds.forEach((id, idx) => {
    result[id] = (base + (idx < remainder ? 1 : 0)) / 100;
  });
  return result;
}

// For a given group: returns net balance per participant id.
// positive = participant is owed money; negative = participant owes money.
export function computeGroupBalances(
  group: Group,
  expenses: Expense[],
  settlements: Settlement[]
): Record<string, number> {
  const balances: Record<string, number> = {};
  group.participants.forEach((p) => {
    balances[p.id] = 0;
  });

  expenses
    .filter((e) => e.groupId === group.id)
    .forEach((e) => {
      // paid by gets + amount
      balances[e.paidBy] = (balances[e.paidBy] ?? 0) + e.amount;
      // each share subtracts from the participant
      e.shares.forEach((s) => {
        balances[s.participantId] =
          (balances[s.participantId] ?? 0) - s.amount;
      });
    });

  settlements
    .filter((s) => s.groupId === group.id)
    .forEach((s) => {
      // from pays to: from's debt decreases (balance += amount), to's credit decreases (balance -= amount)
      balances[s.fromId] = (balances[s.fromId] ?? 0) + s.amount;
      balances[s.toId] = (balances[s.toId] ?? 0) - s.amount;
    });

  // Round to 2dp
  Object.keys(balances).forEach((k) => {
    balances[k] = Math.round(balances[k] * 100) / 100;
  });

  return balances;
}

export interface DebtEdge {
  fromId: string;
  toId: string;
  amount: number;
}

// Greedy minimum-cash-flow simplification
export function simplifyDebts(
  balances: Record<string, number>
): DebtEdge[] {
  const creditors: { id: string; amt: number }[] = [];
  const debtors: { id: string; amt: number }[] = [];

  Object.entries(balances).forEach(([id, amt]) => {
    if (amt > 0.005) creditors.push({ id, amt });
    else if (amt < -0.005) debtors.push({ id, amt: -amt });
  });

  creditors.sort((a, b) => b.amt - a.amt);
  debtors.sort((a, b) => b.amt - a.amt);

  const edges: DebtEdge[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i];
    const c = creditors[j];
    const pay = Math.min(d.amt, c.amt);
    edges.push({
      fromId: d.id,
      toId: c.id,
      amount: Math.round(pay * 100) / 100,
    });
    d.amt -= pay;
    c.amt -= pay;
    if (d.amt < 0.005) i++;
    if (c.amt < 0.005) j++;
  }
  return edges;
}

export function totalUnsettled(
  groups: Group[],
  expenses: Expense[],
  settlements: Settlement[]
): number {
  let total = 0;
  groups.forEach((g) => {
    const bal = computeGroupBalances(g, expenses, settlements);
    Object.values(bal).forEach((v) => {
      if (v > 0) total += v;
    });
  });
  return Math.round(total * 100) / 100;
}
