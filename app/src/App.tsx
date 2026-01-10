import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { EmployeeMaster } from './pages/EmployeeMaster';
import { YearlyEvaluation } from './pages/YearlyEvaluation';
import { SkillMap } from './pages/SkillMap';
import { Organization } from './pages/Organization';
import { Budget } from './pages/Budget';
import { BudgetSimulation } from './pages/BudgetSimulation';
import { UnitPriceMaster } from './pages/UnitPriceMaster';
import { Settings } from './pages/Settings';
import { Reports } from './pages/Reports';
import { ToastProvider } from './components/Toast';
import { HelpButton } from './components/HelpModal';
import './index.css';

function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <Router>
          <div className="app-container">
            <Sidebar />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/employees" element={<EmployeeMaster />} />
              <Route path="/yearly-evaluation" element={<YearlyEvaluation />} />
              <Route path="/skillmap" element={<SkillMap />} />
              <Route path="/organization" element={<Organization />} />
              <Route path="/unit-price" element={<UnitPriceMaster />} />
              <Route path="/budget" element={<Budget />} />
              <Route path="/budget-simulation" element={<BudgetSimulation />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
            <HelpButton />
          </div>
        </Router>
      </ToastProvider>
    </AppProvider>
  );
}

export default App;
