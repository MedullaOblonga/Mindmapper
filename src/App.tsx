import { Navigate, Route, Routes } from 'react-router-dom';
import { Shell } from './components/shell/Shell';
import { Today } from './screens/Today';
import { Journal } from './screens/Journal';
import { Patterns } from './screens/patterns/Patterns';
import { Plan } from './screens/plan/Plan';
import { About } from './screens/About';
import { Check } from './screens/Check';

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/today" element={<Today />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/patterns/:tab" element={<Patterns />} />
        <Route path="/plan/:tab" element={<Plan />} />
        <Route path="/about" element={<About />} />
        <Route path="/check" element={<Check />} />
        <Route path="*" element={<Navigate to="/today" replace />} />
      </Routes>
    </Shell>
  );
}
