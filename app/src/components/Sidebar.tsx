import { NavLink } from 'react-router-dom';
import { Users, BarChart3, Network, Home, Settings } from 'lucide-react';
import './Sidebar.css';

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">I</div>
          <span className="logo-text">Insight HRM</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
          <Home size={20} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/evaluation" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <BarChart3 size={20} />
          <span>Member Evaluation</span>
        </NavLink>

        <NavLink to="/skillmap" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Users size={20} />
          <span>Skill Map</span>
        </NavLink>

        <NavLink to="/organization" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Network size={20} />
          <span>Organization</span>
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
