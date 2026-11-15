import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Tabs } from '../../components/ui';
import { AboutYou } from './AboutYou';
import { Sharing } from './Sharing';
import { Reminders } from './Reminders';
import { Helped } from './Helped';

export const PROFILE_TABS = [
  { id: 'about', label: 'About you' },
  { id: 'sharing', label: 'Sharing' },
  { hidden: true, id: 'reminders', label: 'Wrist reminders' },
  { hidden: true, id: 'helped', label: 'What has helped' },
];

export function Profile() {
  const { tab = 'about' } = useParams();
  const nav = useNavigate();
  if (!PROFILE_TABS.some(t => t.id === tab)) return <Navigate to="/profile/about" replace />;
  return (
    <>
      <Tabs label="Profile" tabs={PROFILE_TABS.filter(t => !('hidden' in t))} current={tab} onPick={id => nav(`/profile/${id}`)} />
      {tab === 'about' && <AboutYou />}
      {tab === 'reminders' && <Reminders />}
      {tab === 'sharing' && <Sharing />}
      {tab === 'helped' && <Helped />}
    </>
  );
}

export function LegacyPlan() {
  const { tab = 'about' } = useParams();
  return <Navigate to={`/profile/${tab}`} replace />;
}
