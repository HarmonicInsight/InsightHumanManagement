import { NavLink } from 'react-router-dom';
import { Network, Settings, Wallet, Award, UserCog, Radar, Calculator, TrendingUp, LayoutDashboard, FileBarChart } from 'lucide-react';
import { GlobalSearch } from './GlobalSearch';
import './Sidebar.css';

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">I</div>
          <span className="logo-text">InsightHRM</span>
        </div>
        <GlobalSearch />
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
          <LayoutDashboard size={20} />
          <span>ダッシュボード</span>
        </NavLink>

        <div className="nav-section">マスタ管理</div>

        <NavLink to="/employees" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <UserCog size={20} />
          <span>社員マスタ</span>
        </NavLink>

        <NavLink to="/organization" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Network size={20} />
          <span>組織・チーム</span>
        </NavLink>

        <NavLink to="/unit-price" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Calculator size={20} />
          <span>単価マスタ</span>
        </NavLink>

        <div className="nav-section">予算管理</div>

        <NavLink to="/budget" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Wallet size={20} />
          <span>予算管理</span>
        </NavLink>

        <NavLink to="/budget-simulation" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <TrendingUp size={20} />
          <span>予算シミュレーション</span>
        </NavLink>

        <div className="nav-section">評価・分析</div>

        <NavLink to="/skillmap" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Radar size={20} />
          <span>スキルマップ</span>
        </NavLink>

        <NavLink to="/yearly-evaluation" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Award size={20} />
          <span>年度評価</span>
        </NavLink>

        <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <FileBarChart size={20} />
          <span>レポート</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Settings size={20} />
          <span>設定</span>
        </NavLink>
      </div>
    </aside>
  );
}
