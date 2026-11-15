import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Tabs } from '../../components/ui';
import { Mind } from './Mind';
import { Ledger } from './Ledger';
import { Days } from './Days';

export const PATTERN_TABS = [
  { id: 'mind', label: 'On your mind' },
  { id: 'ledger', label: 'Against your usual' },
  { id: 'days', label: 'Your days' },
];

export function Patterns() {
  const { tab = 'mind' } = useParams();
  const nav = useNavigate();
  if (!PATTERN_TABS.some(t => t.id === tab)) return <Navigate to="/patterns/mind" replace />;
  return (
    <>
      <Tabs label="Patterns" tabs={PATTERN_TABS} current={tab} onPick={id => nav(`/patterns/${id}`)} />
      {tab === 'mind' && <Mind />}
      {tab === 'ledger' && <Ledger />}
      {tab === 'days' && <Days />}
    </>
  );
}
