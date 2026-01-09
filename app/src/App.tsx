import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Evaluation } from './pages/Evaluation';
import { SkillMap } from './pages/SkillMap';
import { Organization } from './pages/Organization';
import './index.css';

function App() {
  return (
    <AppProvider>
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
    </AppProvider>
  );
}

export default App;
