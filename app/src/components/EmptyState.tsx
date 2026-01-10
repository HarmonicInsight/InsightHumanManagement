import type { ReactNode } from 'react';
import { Inbox, Users, Building2, FileBarChart, Award, Wallet } from 'lucide-react';
import './EmptyState.css';

interface EmptyStateProps {
  icon?: ReactNode;
  type?: 'members' | 'teams' | 'budget' | 'evaluation' | 'reports' | 'default';
  title: string;
  description?: string;
  action?: ReactNode;
}

const defaultIcons = {
  members: <Users size={48} />,
  teams: <Building2 size={48} />,
  budget: <Wallet size={48} />,
  evaluation: <Award size={48} />,
  reports: <FileBarChart size={48} />,
  default: <Inbox size={48} />,
};

export function EmptyState({ icon, type = 'default', title, description, action }: EmptyStateProps) {
  const displayIcon = icon || defaultIcons[type];

  return (
    <div className="empty-state">
      <div className="empty-state-icon">{displayIcon}</div>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
