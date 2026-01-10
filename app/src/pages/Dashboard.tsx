import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, Award, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, UserCheck, AlertCircle } from 'lucide-react';
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
  AreaChart,
  Area,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { YearSelector } from '../components/YearSelector';
import { RankLabels, RankColors, YearlyGradeColors } from '../types';
import type { Rank } from '../types';
import './Dashboard.css';

export function Dashboard() {
  const { members, teams, budget, currentYear, yearlyEvaluations, getBudgetByYear } = useApp();

  // 前年度データ取得
  const prevYearBudget = getBudgetByYear(currentYear - 1);

  // 基本統計
  const stats = useMemo(() => {
    const totalMembers = members.length;

    // 評価済みメンバー数
    const evaluatedMembers = members.filter((m) => {
      const evalData = yearlyEvaluations.find((e) => e.memberId === m.id);
      return evalData?.evaluations[currentYear] != null;
    }).length;

    // 高評価者数 (S/A)
    const highPerformers = members.filter((m) => {
      const evalData = yearlyEvaluations.find((e) => e.memberId === m.id);
      const grade = evalData?.evaluations[currentYear];
      return grade === 'S' || grade === 'A';
    }).length;

    // 年間総コスト
    const totalAnnualCost = budget
      ? members.reduce((sum, m) => {
          const unitPrice = budget.rankUnitPrices.find((p) => p.rank === m.rank)?.unitPrice || 0;
          return sum + unitPrice * 12;
        }, 0)
      : 0;

    // 前年度コスト (比較用)
    const prevYearCost = prevYearBudget
      ? members.reduce((sum, m) => {
          const unitPrice = prevYearBudget.rankUnitPrices.find((p) => p.rank === m.rank)?.unitPrice || 0;
          return sum + unitPrice * 12;
        }, 0)
      : 0;

    const costChange = prevYearCost > 0 ? ((totalAnnualCost - prevYearCost) / prevYearCost) * 100 : 0;

    return {
      totalMembers,
      evaluatedMembers,
      evaluationRate: totalMembers > 0 ? (evaluatedMembers / totalMembers) * 100 : 0,
      highPerformers,
      totalAnnualCost,
      costChange,
      avgCostPerMember: totalMembers > 0 ? totalAnnualCost / totalMembers : 0,
    };
  }, [members, budget, currentYear, yearlyEvaluations, prevYearBudget]);

  // ランク分布
  const rankDistribution = useMemo(() => {
    const counts: Record<Rank, number> = { CONS: 0, Scon: 0, MGR: 0, SMGR: 0, DIR: 0 };
    members.forEach((m) => counts[m.rank]++);
    return [
      { name: 'DIR', fullName: 'ダイレクター', count: counts.DIR, color: RankColors.DIR },
      { name: 'SMGR', fullName: 'シニアMGR', count: counts.SMGR, color: RankColors.SMGR },
      { name: 'MGR', fullName: 'マネージャー', count: counts.MGR, color: RankColors.MGR },
      { name: 'Scon', fullName: 'シニアコンサル', count: counts.Scon, color: RankColors.Scon },
      { name: 'CONS', fullName: 'コンサルタント', count: counts.CONS, color: RankColors.CONS },
    ].filter((d) => d.count > 0);
  }, [members]);

  // 評価分布
  const gradeDistribution = useMemo(() => {
    const counts: Record<string, number> = { S: 0, A: 0, B: 0, C: 0, D: 0 };
    members.forEach((m) => {
      const evalData = yearlyEvaluations.find((e) => e.memberId === m.id);
      const grade = evalData?.evaluations[currentYear];
      if (grade && counts.hasOwnProperty(grade)) {
        counts[grade]++;
      }
    });
    return [
      { name: 'S', count: counts.S, color: YearlyGradeColors.S },
      { name: 'A', count: counts.A, color: YearlyGradeColors.A },
      { name: 'B', count: counts.B, color: YearlyGradeColors.B },
      { name: 'C', count: counts.C, color: YearlyGradeColors.C },
      { name: 'D', count: counts.D, color: YearlyGradeColors.D },
    ].filter((d) => d.count > 0);
  }, [members, yearlyEvaluations, currentYear]);

  // チーム別コスト
  const teamCostData = useMemo(() => {
    if (!budget) return [];
    return teams.map((team) => {
      const teamMembers = members.filter((m) => m.teamId === team.id);
      const totalCost = teamMembers.reduce((sum, m) => {
        const unitPrice = budget.rankUnitPrices.find((p) => p.rank === m.rank)?.unitPrice || 0;
        return sum + unitPrice * 12;
      }, 0);
      return {
        name: team.name.length > 8 ? team.name.slice(0, 8) + '...' : team.name,
        コスト: totalCost,
        人数: teamMembers.length,
        color: team.color,
      };
    }).filter((d) => d.人数 > 0);
  }, [budget, members, teams]);

  // 未評価メンバー
  const unevaluatedMembers = useMemo(() => {
    return members.filter((m) => {
      const evalData = yearlyEvaluations.find((e) => e.memberId === m.id);
      return !evalData?.evaluations[currentYear];
    }).slice(0, 5);
  }, [members, yearlyEvaluations, currentYear]);

  // クイックアクション
  const quickActions = [
    { label: '社員追加', path: '/employees', icon: Users },
    { label: '予算管理', path: '/budget', icon: Wallet },
    { label: '評価入力', path: '/yearly-evaluation', icon: Award },
    { label: 'レポート', path: '/reports', icon: TrendingUp },
  ];

  return (
    <div className="main-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">ダッシュボード</h1>
          <p className="page-subtitle">FY{currentYear}年度 組織・予算概要</p>
        </div>
        <YearSelector />
      </div>

      {/* メインKPI */}
      <div className="dashboard-kpis">
        <div className="kpi-card primary">
          <div className="kpi-header">
            <div className="kpi-icon">
              <Users size={24} />
            </div>
            <span className="kpi-badge">メンバー</span>
          </div>
          <div className="kpi-value">{stats.totalMembers}</div>
          <div className="kpi-label">総メンバー数</div>
        </div>

        <div className="kpi-card success">
          <div className="kpi-header">
            <div className="kpi-icon">
              <UserCheck size={24} />
            </div>
            <span className="kpi-badge">{stats.evaluationRate.toFixed(0)}%</span>
          </div>
          <div className="kpi-value">{stats.evaluatedMembers}</div>
          <div className="kpi-label">評価完了</div>
        </div>

        <div className="kpi-card warning">
          <div className="kpi-header">
            <div className="kpi-icon">
              <Award size={24} />
            </div>
            <span className="kpi-badge">S/A評価</span>
          </div>
          <div className="kpi-value">{stats.highPerformers}</div>
          <div className="kpi-label">高評価者</div>
        </div>

        <div className="kpi-card purple">
          <div className="kpi-header">
            <div className="kpi-icon">
              <Wallet size={24} />
            </div>
            {stats.costChange !== 0 && (
              <span className={`kpi-trend ${stats.costChange > 0 ? 'up' : 'down'}`}>
                {stats.costChange > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {Math.abs(stats.costChange).toFixed(1)}%
              </span>
            )}
          </div>
          <div className="kpi-value">{stats.totalAnnualCost.toLocaleString()}</div>
          <div className="kpi-label">年間総コスト（万円）</div>
        </div>
      </div>

      {/* クイックアクション */}
      <div className="quick-actions">
        {quickActions.map((action) => (
          <Link to={action.path} key={action.path} className="quick-action-btn">
            <action.icon size={18} />
            {action.label}
          </Link>
        ))}
      </div>

      {/* チャートセクション */}
      <div className="dashboard-charts">
        <div className="chart-card">
          <div className="chart-header">
            <h3>ランク構成</h3>
            <Link to="/employees" className="chart-link">詳細 →</Link>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={rankDistribution}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="count"
              >
                {rankDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}名`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            {rankDistribution.map((item) => (
              <div key={item.name} className="legend-item">
                <span className="legend-dot" style={{ background: item.color }} />
                <span className="legend-label">{item.fullName}</span>
                <span className="legend-value">{item.count}名</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>年度評価分布</h3>
            <Link to="/yearly-evaluation" className="chart-link">詳細 →</Link>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={gradeDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip formatter={(value) => [`${value}名`, '人数']} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {gradeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card wide">
          <div className="chart-header">
            <h3>チーム別コスト</h3>
            <Link to="/reports" className="chart-link">詳細 →</Link>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={teamCostData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#6B7280" fontSize={11} />
              <YAxis stroke="#6B7280" fontSize={11} />
              <Tooltip formatter={(value) => [`${Number(value).toLocaleString()}万円`, 'コスト']} />
              <Area type="monotone" dataKey="コスト" stroke="#8B5CF6" fill="#EDE9FE" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 注意事項セクション */}
      {unevaluatedMembers.length > 0 && (
        <div className="alert-card">
          <div className="alert-header">
            <AlertCircle size={20} />
            <h3>未評価メンバー（{members.length - stats.evaluatedMembers}名）</h3>
          </div>
          <div className="alert-content">
            {unevaluatedMembers.map((m) => (
              <div key={m.id} className="alert-item">
                <div className="alert-avatar">{m.name.charAt(0)}</div>
                <span className="alert-name">{m.name}</span>
                <span className="alert-rank" style={{ color: RankColors[m.rank] }}>
                  {RankLabels[m.rank]}
                </span>
              </div>
            ))}
            {members.length - stats.evaluatedMembers > 5 && (
              <Link to="/yearly-evaluation" className="alert-more">
                他 {members.length - stats.evaluatedMembers - 5}名を表示
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
