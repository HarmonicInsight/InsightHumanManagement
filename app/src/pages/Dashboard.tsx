import { Users, Award, TrendingUp, UserCheck } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { members } from '../data/members';
import { RankLabels } from '../types';
import type { Rank } from '../types';

export function Dashboard() {
  const totalMembers = members.length;
  const evaluatedMembers = members.filter((m) => m.evaluation.grade !== null).length;
  const avgScore =
    members.filter((m) => m.evaluation.score !== null).reduce((sum, m) => sum + (m.evaluation.score || 0), 0) /
      evaluatedMembers || 0;

  const rankCounts: Record<Rank, number> = {
    MGR: members.filter((m) => m.rank === 'MGR').length,
    Scon: members.filter((m) => m.rank === 'Scon').length,
    CONS: members.filter((m) => m.rank === 'CONS').length,
  };

  const gradeData = [
    { name: 'S', count: members.filter((m) => m.evaluation.grade === 'S').length, color: '#F59E0B' },
    { name: 'A', count: members.filter((m) => m.evaluation.grade === 'A').length, color: '#3B82F6' },
    { name: 'B', count: members.filter((m) => m.evaluation.grade === 'B').length, color: '#10B981' },
    { name: 'C', count: members.filter((m) => m.evaluation.grade === 'C').length, color: '#6B7280' },
  ];

  const rankData = [
    { name: 'MGR', count: rankCounts.MGR, color: '#8B5CF6' },
    { name: 'Scon', count: rankCounts.Scon, color: '#3B82F6' },
    { name: 'CONS', count: rankCounts.CONS, color: '#10B981' },
  ];

  const topPerformers = members
    .filter((m) => m.evaluation.score !== null)
    .sort((a, b) => (b.evaluation.score || 0) - (a.evaluation.score || 0))
    .slice(0, 5);

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Team performance overview</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Members</div>
          <div className="stat-value">{totalMembers}</div>
          <div className="stat-icon">
            <Users size={24} color="#3B82F6" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Evaluated Members</div>
          <div className="stat-value">{evaluatedMembers}</div>
          <div className="stat-icon">
            <UserCheck size={24} color="#10B981" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Average Score</div>
          <div className="stat-value">{avgScore.toFixed(1)}</div>
          <div className="stat-icon">
            <TrendingUp size={24} color="#F59E0B" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Top Performers (S/A)</div>
          <div className="stat-value">
            {members.filter((m) => m.evaluation.grade === 'S' || m.evaluation.grade === 'A').length}
          </div>
          <div className="stat-icon">
            <Award size={24} color="#8B5CF6" />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Grade Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={gradeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {gradeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Rank Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={rankData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="count"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {rankData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Top Performers</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Rank</th>
              <th>Grade</th>
              <th>Summary</th>
            </tr>
          </thead>
          <tbody>
            {topPerformers.map((member) => (
              <tr key={member.id}>
                <td>
                  <div className="member-info">
                    <div className="member-avatar">{member.name.charAt(0)}</div>
                    <div>
                      <div className="member-name">{member.name}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge badge-${member.rank.toLowerCase()}`}>{RankLabels[member.rank]}</span>
                </td>
                <td>
                  <span className={`grade-badge grade-${member.evaluation.grade?.toLowerCase()}`}>
                    {member.evaluation.grade}
                  </span>
                </td>
                <td>{member.evaluation.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
