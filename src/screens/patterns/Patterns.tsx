import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Tabs } from '../../components/ui';
import { Mind } from './Mind';
import { Moments } from './Moments';
import { Body } from './Body';

export const PATTERN_TABS = [
  { id: 'mind', label: 'On your mind' },
  { id: 'moments', label: 'High and low' },
  { id: 'body', label: 'Body trends' },
];

export function Patterns() {
  const { tab = 'mind' } = useParams();
  const nav = useNavigate();
  if (!PATTERN_TABS.some(t => t.id === tab)) return <Navigate to="/patterns/mind" replace />;
  return (
    <>
      <Tabs label="Patterns" tabs={PATTERN_TABS} current={tab} onPick={id => nav(`/patterns/${id}`)} />
      {tab === 'mind' && <Mind />}
      {tab === 'moments' && <Moments />}
      {tab === 'body' && <Body />}
    </>
  );
}
