import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { EmployeeMaster } from './pages/EmployeeMaster';
import { YearlyEvaluation } from './pages/YearlyEvaluation';
import { SkillMap } from './pages/SkillMap';
import { Organization } from './pages/Organization';
import { Budget } from './pages/Budget';
import { UnitPriceMaster } from './pages/UnitPriceMaster';
import './index.css';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="app-container">
          <Sidebar />
          <Routes>
            <Route path="/" element={<EmployeeMaster />} />
            <Route path="/yearly-evaluation" element={<YearlyEvaluation />} />
            <Route path="/skillmap" element={<SkillMap />} />
            <Route path="/organization" element={<Organization />} />
            <Route path="/unit-price" element={<UnitPriceMaster />} />
            <Route path="/budget" element={<Budget />} />
          </Routes>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;
