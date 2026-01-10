import { useMemo } from 'react';
import { Download, TrendingUp, Users, Wallet, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
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
  Legend,
} from 'recharts';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { YearSelector } from '../components/YearSelector';
import { useToast } from '../components/Toast';
import { RankLabels, RankColors, YearlyGradeColors } from '../types';
import type { Rank } from '../types';
import './Reports.css';

export function Reports() {
  const { members, teams, budget, currentYear, yearlyEvaluations } = useApp();
  const { success } = useToast();

  // ランク別人数
  const rankDistribution = useMemo(() => {
    const counts: Record<Rank, number> = { CONS: 0, Scon: 0, MGR: 0, SMGR: 0, DIR: 0 };
    members.forEach((m) => {
      counts[m.rank]++;
    });
    return [
      { name: 'ダイレクター', value: counts.DIR, color: RankColors.DIR },
      { name: 'シニアMGR', value: counts.SMGR, color: RankColors.SMGR },
      { name: 'マネージャー', value: counts.MGR, color: RankColors.MGR },
      { name: 'シニアコンサル', value: counts.Scon, color: RankColors.Scon },
      { name: 'コンサルタント', value: counts.CONS, color: RankColors.CONS },
    ].filter((d) => d.value > 0);
  }, [members]);

  // チーム別人数
  const teamDistribution = useMemo(() => {
    const teamCounts = teams.map((team) => ({
      name: team.name,
      value: members.filter((m) => m.teamId === team.id).length,
      color: team.color,
    }));
    const unassigned = members.filter((m) => !m.teamId).length;
    if (unassigned > 0) {
      teamCounts.push({ name: '未所属', value: unassigned, color: '#9CA3AF' });
    }
    return teamCounts.filter((d) => d.value > 0);
  }, [members, teams]);

  // 年度評価分布
  const evaluationDistribution = useMemo(() => {
    const counts: Record<string, number> = { S: 0, A: 0, B: 0, C: 0, D: 0, 未評価: 0 };
    members.forEach((m) => {
      const evalData = yearlyEvaluations.find((e) => e.memberId === m.id);
      const grade = evalData?.evaluations[currentYear];
      if (grade) {
        counts[grade]++;
      } else {
        counts['未評価']++;
      }
    });
    return [
      { name: 'S', value: counts.S, color: YearlyGradeColors.S },
      { name: 'A', value: counts.A, color: YearlyGradeColors.A },
      { name: 'B', value: counts.B, color: YearlyGradeColors.B },
      { name: 'C', value: counts.C, color: YearlyGradeColors.C },
      { name: 'D', value: counts.D, color: YearlyGradeColors.D },
      { name: '未評価', value: counts['未評価'], color: '#D1D5DB' },
    ].filter((d) => d.value > 0);
  }, [members, yearlyEvaluations, currentYear]);

  // ランク別コスト
  const rankCostData = useMemo(() => {
    if (!budget) return [];
    return budget.rankUnitPrices.map((rp) => {
      const count = members.filter((m) => m.rank === rp.rank).length;
      return {
        name: RankLabels[rp.rank],
        人数: count,
        年間コスト: rp.unitPrice * 12 * count,
        単価: rp.unitPrice,
      };
    }).reverse();
  }, [budget, members]);

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
        name: team.name,
        人数: teamMembers.length,
        年間コスト: totalCost,
      };
    }).filter((d) => d.人数 > 0);
  }, [budget, members, teams]);

  // 全体統計
  const totalStats = useMemo(() => {
    const totalMembers = members.length;
    const totalAnnualCost = budget
      ? members.reduce((sum, m) => {
          const unitPrice = budget.rankUnitPrices.find((p) => p.rank === m.rank)?.unitPrice || 0;
          return sum + unitPrice * 12;
        }, 0)
      : 0;
    const avgCostPerMember = totalMembers > 0 ? totalAnnualCost / totalMembers : 0;

    return {
      totalMembers,
      totalAnnualCost,
      avgCostPerMember,
      teamsCount: teams.length,
    };
  }, [members, budget, teams]);

  // Excelエクスポート
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // サマリーシート
    const summaryData = [
      ['InsightHRM レポート', '', ''],
      [`FY${currentYear}年度`, '', ''],
      ['', '', ''],
      ['基本統計', '', ''],
      ['総メンバー数', totalStats.totalMembers, '名'],
      ['チーム数', totalStats.teamsCount, ''],
      ['年間総コスト', totalStats.totalAnnualCost, '万円'],
      ['平均コスト/人', Math.round(totalStats.avgCostPerMember), '万円'],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'サマリー');

    // メンバー一覧
    const memberData = [
      ['No', '名前', 'ランク', 'チーム', '年度評価', '年間コスト（万円）'],
    ];
    members.forEach((m, i) => {
      const team = teams.find((t) => t.id === m.teamId);
      const evalData = yearlyEvaluations.find((e) => e.memberId === m.id);
      const grade = evalData?.evaluations[currentYear] || '未評価';
      const unitPrice = budget?.rankUnitPrices.find((p) => p.rank === m.rank)?.unitPrice || 0;
      memberData.push([
        String(i + 1),
        m.name,
        RankLabels[m.rank],
        team?.name || '未所属',
        grade,
        String(unitPrice * 12),
      ]);
    });
    const wsMembers = XLSX.utils.aoa_to_sheet(memberData);
    wsMembers['!cols'] = [{ wch: 5 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsMembers, 'メンバー一覧');

    // ランク別分析
    const rankData = [['ランク', '人数', '単価（万円/月）', '年間コスト（万円）']];
    rankCostData.forEach((d) => {
      rankData.push([d.name, String(d.人数), String(d.単価), String(d.年間コスト)]);
    });
    const wsRank = XLSX.utils.aoa_to_sheet(rankData);
    XLSX.utils.book_append_sheet(wb, wsRank, 'ランク別分析');

    // チーム別分析
    const teamData = [['チーム', '人数', '年間コスト（万円）']];
    teamCostData.forEach((d) => {
      teamData.push([d.name, String(d.人数), String(d.年間コスト)]);
    });
    const wsTeam = XLSX.utils.aoa_to_sheet(teamData);
    XLSX.utils.book_append_sheet(wb, wsTeam, 'チーム別分析');

    XLSX.writeFile(wb, `InsightHRM_レポート_FY${currentYear}.xlsx`);
    success('エクスポート完了', 'レポートをダウンロードしました');
  };

  return (
    <div className="main-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">レポート</h1>
          <p className="page-subtitle">組織分析とコストレポート</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="btn-export" onClick={exportToExcel}>
            <Download size={16} />
            Excelエクスポート
          </button>
          <YearSelector />
        </div>
      </div>

      {/* KPIカード */}
      <div className="report-kpis">
        <div className="kpi-card">
          <div className="kpi-icon blue">
            <Users size={24} />
          </div>
          <div className="kpi-content">
            <div className="kpi-value">{totalStats.totalMembers}</div>
            <div className="kpi-label">総メンバー数</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon purple">
            <BarChart3 size={24} />
          </div>
          <div className="kpi-content">
            <div className="kpi-value">{totalStats.teamsCount}</div>
            <div className="kpi-label">チーム数</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon green">
            <Wallet size={24} />
          </div>
          <div className="kpi-content">
            <div className="kpi-value">{totalStats.totalAnnualCost.toLocaleString()}</div>
            <div className="kpi-label">年間総コスト（万円）</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon orange">
            <TrendingUp size={24} />
          </div>
          <div className="kpi-content">
            <div className="kpi-value">{Math.round(totalStats.avgCostPerMember).toLocaleString()}</div>
            <div className="kpi-label">平均コスト/人（万円）</div>
          </div>
        </div>
      </div>

      {/* チャートグリッド */}
      <div className="report-charts-grid">
        <div className="report-card">
          <div className="report-card-header">
            <h3>
              <PieChartIcon size={18} />
              ランク構成
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={rankDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}名`}
                labelLine={false}
              >
                {rankDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="report-card">
          <div className="report-card-header">
            <h3>
              <BarChart3 size={18} />
              年度評価分布
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={evaluationDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip />
              <Bar dataKey="value" name="人数" radius={[4, 4, 0, 0]}>
                {evaluationDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="report-card">
          <div className="report-card-header">
            <h3>
              <PieChartIcon size={18} />
              チーム別人数
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={teamDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}名`}
                labelLine={false}
              >
                {teamDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="report-card">
          <div className="report-card-header">
            <h3>
              <Wallet size={18} />
              ランク別コスト
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={rankCostData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" stroke="#6B7280" fontSize={12} />
              <YAxis dataKey="name" type="category" stroke="#6B7280" fontSize={11} width={100} />
              <Tooltip formatter={(value) => `${Number(value).toLocaleString()}万円`} />
              <Legend />
              <Bar dataKey="年間コスト" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* チーム別コスト詳細 */}
      <div className="report-card full-width">
        <div className="report-card-header">
          <h3>
            <BarChart3 size={18} />
            チーム別コスト分析
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={teamCostData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
            <YAxis yAxisId="left" stroke="#6B7280" fontSize={12} />
            <YAxis yAxisId="right" orientation="right" stroke="#6B7280" fontSize={12} />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="人数" fill="#3B82F6" name="人数" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="年間コスト" fill="#10B981" name="年間コスト（万円）" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
