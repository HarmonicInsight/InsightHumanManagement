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
import { useApp } from '../context/AppContext';
import { YearSelector } from '../components/YearSelector';
import { RankLabels } from '../types';
import type { Rank } from '../types';

export function Dashboard() {
  const { members } = useApp();

  const totalMembers = members.length;
  const evaluatedMembers = members.filter((m) => m.evaluation.grade !== null).length;
  const avgScore =
    members.filter((m) => m.evaluation.score !== null).reduce((sum, m) => sum + (m.evaluation.score || 0), 0) /
      evaluatedMembers || 0;

  const rankCounts: Record<Rank, number> = {
    CONS: members.filter((m) => m.rank === 'CONS').length,
    Scon: members.filter((m) => m.rank === 'Scon').length,
    MGR: members.filter((m) => m.rank === 'MGR').length,
    SMGR: members.filter((m) => m.rank === 'SMGR').length,
    DIR: members.filter((m) => m.rank === 'DIR').length,
  };

  const gradeData = [
    { name: 'S', count: members.filter((m) => m.evaluation.grade === 'S').length, color: '#F59E0B' },
    { name: 'A', count: members.filter((m) => m.evaluation.grade === 'A').length, color: '#3B82F6' },
    { name: 'B', count: members.filter((m) => m.evaluation.grade === 'B').length, color: '#10B981' },
    { name: 'C', count: members.filter((m) => m.evaluation.grade === 'C').length, color: '#6B7280' },
  ];

  const rankData = [
    { name: 'DIR', count: rankCounts.DIR, color: '#F59E0B' },
    { name: 'SMGR', count: rankCounts.SMGR, color: '#EC4899' },
    { name: 'MGR', count: rankCounts.MGR, color: '#8B5CF6' },
    { name: 'Scon', count: rankCounts.Scon, color: '#3B82F6' },
    { name: 'CONS', count: rankCounts.CONS, color: '#10B981' },
  ].filter((d) => d.count > 0);

  const topPerformers = members
    .filter((m) => m.evaluation.score !== null)
    .sort((a, b) => (b.evaluation.score || 0) - (a.evaluation.score || 0))
    .slice(0, 5);

  return (
    <div className="main-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">チームパフォーマンス概要</p>
        </div>
        <YearSelector />
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">メンバー数</div>
          <div className="stat-value">{totalMembers}</div>
          <div className="stat-icon">
            <Users size={24} color="#3B82F6" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">評価済み</div>
          <div className="stat-value">{evaluatedMembers}</div>
          <div className="stat-icon">
            <UserCheck size={24} color="#10B981" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">平均スコア</div>
          <div className="stat-value">{avgScore.toFixed(1)}</div>
          <div className="stat-icon">
            <TrendingUp size={24} color="#F59E0B" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">高評価者 (S/A)</div>
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
            <h3 className="card-title">グレード分布</h3>
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
            <h3 className="card-title">ランク構成</h3>
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
          <h3 className="card-title">トップパフォーマー</h3>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>メンバー</th>
              <th>ランク</th>
              <th>グレード</th>
              <th>総評</th>
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
