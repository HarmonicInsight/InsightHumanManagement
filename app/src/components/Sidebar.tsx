import { NavLink } from 'react-router-dom';
import { Network, Settings, Wallet, Award, UserCog, Radar, Calculator, TrendingUp } from 'lucide-react';
import './Sidebar.css';

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">M</div>
          <span className="logo-text">メンバ管理・予算管理</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">マスタ管理</div>

        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
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

        <div className="nav-section">評価・スキル</div>

        <NavLink to="/skillmap" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Radar size={20} />
          <span>スキルマップ</span>
        </NavLink>

        <NavLink to="/yearly-evaluation" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Award size={20} />
          <span>年度評価</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/settings" className="nav-item">
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}
