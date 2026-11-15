import { Navigate, Route, Routes } from 'react-router-dom';
import { Shell } from './components/shell/Shell';
import { Placeholder } from './screens/Placeholder';

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/today" element={<Placeholder title="Today" />} />
        <Route path="/journal" element={<Placeholder title="Journal" />} />
        <Route path="/patterns/:tab" element={<Placeholder title="Patterns" />} />
        <Route path="/plan/:tab" element={<Placeholder title="My plan" />} />
        <Route path="/about" element={<Placeholder title="About this prototype" />} />
        <Route path="/check" element={<Placeholder title="Scheduled check" />} />
        <Route path="*" element={<Navigate to="/today" replace />} />
      </Routes>
    </Shell>
  );
}
