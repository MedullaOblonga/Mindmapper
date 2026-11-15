import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Tabs } from '../../components/ui';
import { Signs } from './Signs';
import { Sharing } from './Sharing';
import { Reminders } from './Reminders';
import { Helped } from './Helped';

export const PLAN_TABS = [
  { id: 'signs', label: 'Early signs' },
  { hidden: true, id: 'reminders', label: 'Wrist reminders' },
  { id: 'sharing', label: 'Sharing' },
  { hidden: true, id: 'helped', label: 'What has helped' },
];

export function Plan() {
  const { tab = 'signs' } = useParams();
  const nav = useNavigate();
  if (!PLAN_TABS.some(t => t.id === tab)) return <Navigate to="/plan/signs" replace />;
  return (
    <>
      <Tabs label="My plan" tabs={PLAN_TABS.filter(t => !('hidden' in t))} current={tab} onPick={id => nav(`/plan/${id}`)} />
      {tab === 'signs' && <Signs />}
      {tab === 'reminders' && <Reminders />}
      {tab === 'sharing' && <Sharing />}
      {tab === 'helped' && <Helped />}
    </>
  );
}
