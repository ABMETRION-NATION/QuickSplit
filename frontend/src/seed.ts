import { AppState, Expense, Group, Participant } from './types';
import { evenSplit, uid } from './utils';

const AVATARS = [
  'https://images.unsplash.com/photo-1717196214699-6bb84568ad5b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwyfHxwb3J0cmFpdCUyMGZhY2UlMjBwaG90b3xlbnwwfHx8fDE3NzY0NDQwOTB8MA&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1645388195766-45d19288e2b3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMGZhY2UlMjBwaG90b3xlbnwwfHx8fDE3NzY0NDQwOTB8MA&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1671820052350-038043ab430e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHw0fHxwb3J0cmFpdCUyMGZhY2UlMjBwaG90b3xlbnwwfHx8fDE3NzY0NDQwOTB8MA&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1712599982295-1ecff6059a57?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzN8MHwxfHNlYXJjaHwxfHxtYW4lMjBwb3J0cmFpdCUyMHNtaWxpbmd8ZW58MHx8fHwxNzc2NDQ0MDkzfDA&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1619950514689-96f890058677?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzN8MHwxfHNlYXJjaHwzfHxtYW4lMjBwb3J0cmFpdCUyMHNtaWxpbmd8ZW58MHx8fHwxNzc2NDQ0MDkzfDA&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1622812947502-0a643f17387e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzN8MHwxfHNlYXJjaHwyfHxtYW4lMjBwb3J0cmFpdCUyMHNtaWxpbmd8ZW58MHx8fHwxNzc2NDQ0MDkzfDA&ixlib=rb-4.1.0&q=85',
];

function makeExpense(
  group: Group,
  title: string,
  amount: number,
  paidBy: string,
  participantIds: string[],
  daysAgo: number
): Expense {
  const shares = evenSplit(amount, participantIds);
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const iso = date.toISOString();
  return {
    id: uid(),
    groupId: group.id,
    title,
    amount,
    currency: group.currency,
    date: iso,
    paidBy,
    participantIds,
    splitType: 'even',
    shares: Object.entries(shares).map(([participantId, amt]) => ({
      participantId,
      amount: amt,
    })),
    notes: '',
    createdAt: iso,
    updatedAt: iso,
  };
}

export function buildSeed(): Pick<AppState, 'groups' | 'expenses' | 'settlements' | 'meId'> {
  const me: Participant = { id: uid(), name: 'You', avatar: AVATARS[0] };
  const alex: Participant = { id: uid(), name: 'Alex Chen', avatar: AVATARS[1] };
  const priya: Participant = { id: uid(), name: 'Priya Shah', avatar: AVATARS[2] };
  const marco: Participant = { id: uid(), name: 'Marco Silva', avatar: AVATARS[3] };
  const jamie: Participant = { id: uid(), name: 'Jamie Park', avatar: AVATARS[4] };
  const sam: Participant = { id: uid(), name: 'Sam Rivera', avatar: AVATARS[5] };

  const tripGroup: Group = {
    id: uid(),
    name: 'Weekend Trip',
    participants: [me, alex, priya, marco],
    currency: 'USD',
    createdAt: new Date().toISOString(),
  };

  const roomGroup: Group = {
    id: uid(),
    name: 'Apartment 4B',
    participants: [me, jamie, sam],
    currency: 'USD',
    createdAt: new Date().toISOString(),
  };

  const expenses: Expense[] = [
    makeExpense(
      tripGroup,
      'Airbnb stay',
      480,
      me.id,
      tripGroup.participants.map((p) => p.id),
      6
    ),
    makeExpense(
      tripGroup,
      'Groceries',
      86.4,
      alex.id,
      tripGroup.participants.map((p) => p.id),
      5
    ),
    makeExpense(
      tripGroup,
      'Dinner downtown',
      142.5,
      priya.id,
      [me.id, priya.id, alex.id],
      4
    ),
    makeExpense(
      tripGroup,
      'Gas & tolls',
      64,
      marco.id,
      tripGroup.participants.map((p) => p.id),
      3
    ),
    makeExpense(
      roomGroup,
      'Electricity bill',
      120,
      jamie.id,
      roomGroup.participants.map((p) => p.id),
      10
    ),
    makeExpense(
      roomGroup,
      'Internet',
      60,
      me.id,
      roomGroup.participants.map((p) => p.id),
      7
    ),
    makeExpense(
      roomGroup,
      'Cleaning supplies',
      28.75,
      sam.id,
      roomGroup.participants.map((p) => p.id),
      2
    ),
  ];

  return {
    groups: [tripGroup, roomGroup],
    expenses,
    settlements: [],
    meId: me.id,
  };
}
