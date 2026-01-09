import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Evaluation } from './pages/Evaluation';
import { SkillMap } from './pages/SkillMap';
import { Organization } from './pages/Organization';
import './index.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/evaluation" element={<Evaluation />} />
          <Route path="/skillmap" element={<SkillMap />} />
          <Route path="/organization" element={<Organization />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
