import { Navigate, Route, Routes } from 'react-router-dom';
import { Shell } from './components/shell/Shell';
import { Placeholder } from './screens/Placeholder';
import { Today } from './screens/Today';
import { Journal } from './screens/Journal';
import { Patterns } from './screens/patterns/Patterns';

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/today" element={<Today />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/patterns/:tab" element={<Patterns />} />
        <Route path="/plan/:tab" element={<Placeholder title="My plan" />} />
        <Route path="/about" element={<Placeholder title="About this prototype" />} />
        <Route path="/check" element={<Placeholder title="Scheduled check" />} />
        <Route path="*" element={<Navigate to="/today" replace />} />
      </Routes>
    </Shell>
  );
}
