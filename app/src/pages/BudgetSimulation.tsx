import { useState, useEffect, Fragment } from 'react';
import { ChevronDown, ChevronRight, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { YearSelector } from '../components/YearSelector';
import { RankLabels, RankColors, RankOrder } from '../types';
import type { Rank, Team, Member } from '../types';
import './Budget.css';

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

export function BudgetSimulation() {
  const {
    members,
    teams,
    budget,
    initializeBudget,
  } = useApp();

  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set(['unassigned', ...teams.map(t => t.id)]));
  const [globalMultiplier, setGlobalMultiplier] = useState<number>(1.4);
  const [memberMultipliers, setMemberMultipliers] = useState<Record<string, number>>({});
  // シミュレーション用のローカル給与データ
  const [simulationSalaries, setSimulationSalaries] = useState<Record<string, number | null>>({});

  useEffect(() => {
    if (!budget) {
      initializeBudget();
    }
  }, [budget, initializeBudget]);

  const toggleTeamExpanded = (teamId: string) => {
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) {
        next.delete(teamId);
      } else {
        next.add(teamId);
      }
      return next;
    });
  };

  if (!budget) {
    return <div className="main-content">読み込み中...</div>;
  }

  const rankUnitPrices = budget.rankUnitPrices;

  const getUnitPrice = (rank: Rank): number => {
    const price = rankUnitPrices.find((p) => p.rank === rank);
    return price?.unitPrice || 0;
  };

  // シミュレーション用の給与を取得
  const getSimulationSalary = (memberId: string): number | null => {
    if (simulationSalaries[memberId] !== undefined) {
      return simulationSalaries[memberId];
    }
    // 予算データから初期値を取得
    const memberSalary = budget.memberSalaries.find(s => s.memberId === memberId);
    if (memberSalary) {
      const values = MONTHS.map((m) => memberSalary.monthlySalaries[m]);
      const firstValue = values[0];
      if (firstValue !== null && firstValue !== undefined) {
        const allSame = values.every((v) => v === firstValue);
        if (allSame) return firstValue;
      }
    }
    return null;
  };

  // シミュレーション用の給与を設定
  const setSimulationSalary = (memberId: string, value: string) => {
    const salary = value === '' ? null : Number(value);
    setSimulationSalaries(prev => ({ ...prev, [memberId]: salary }));
  };

  const getMembersByTeam = (teamId: string | null) => {
    return members
      .filter((m) => m.teamId === teamId)
      .sort((a, b) => RankOrder[b.rank] - RankOrder[a.rank]);
  };

  const calculateMemberUnitPriceTotal = (rank: Rank): number => {
    return getUnitPrice(rank) * 12;
  };

  const getMemberMultiplier = (memberId: string): number => {
    return memberMultipliers[memberId] ?? globalMultiplier;
  };

  const setMemberMultiplier = (memberId: string, value: number) => {
    setMemberMultipliers(prev => ({ ...prev, [memberId]: value }));
  };

  const applyGlobalMultiplier = () => {
    const newMultipliers: Record<string, number> = {};
    members.forEach(m => {
      newMultipliers[m.id] = globalMultiplier;
    });
    setMemberMultipliers(newMultipliers);
  };

  const calculateManagedSalary = (baseSalary: number, memberId: string): number => {
    const mult = getMemberMultiplier(memberId);
    return Math.round(baseSalary * mult * 10) / 10;
  };

  const calculateMemberManagedSalaryTotal = (memberId: string, rank: Rank): number => {
    const baseSalary = getSimulationSalary(memberId);
    const unitPrice = getUnitPrice(rank);
    const salaryValue = baseSalary !== null ? baseSalary : unitPrice;
    let total = 0;
    MONTHS.forEach(() => {
      total += calculateManagedSalary(salaryValue, memberId);
    });
    return total;
  };

  const totalMemberUnitPrice = members.reduce(
    (sum, m) => sum + calculateMemberUnitPriceTotal(m.rank),
    0
  );

  const totalMemberManagedSalary = members.reduce(
    (sum, m) => sum + calculateMemberManagedSalaryTotal(m.id, m.rank),
    0
  );

  const calculateTeamUnitPriceTotal = (teamId: string | null) => {
    return members
      .filter((m) => m.teamId === teamId)
      .reduce((sum, m) => sum + calculateMemberUnitPriceTotal(m.rank), 0);
  };

  const calculateTeamManagedSalaryTotal = (teamId: string | null) => {
    return members
      .filter((m) => m.teamId === teamId)
      .reduce((sum, m) => sum + calculateMemberManagedSalaryTotal(m.id, m.rank), 0);
  };

  const getTeamMemberCount = (teamId: string | null) => {
    return members.filter((m) => m.teamId === teamId).length;
  };

  const renderMemberRows = (teamMembers: Member[]) => {
    return teamMembers.map((member) => {
      const unitPrice = getUnitPrice(member.rank);
      const unitPriceTotal = calculateMemberUnitPriceTotal(member.rank);
      const managedSalaryTotal = calculateMemberManagedSalaryTotal(member.id, member.rank);
      const baseSalary = getSimulationSalary(member.id);
      const memberMult = getMemberMultiplier(member.id);
      const managedBaseSalary = baseSalary !== null ? calculateManagedSalary(baseSalary, member.id) : calculateManagedSalary(unitPrice, member.id);
      const salaryForMonth = baseSalary !== null ? baseSalary : unitPrice;

      return (
        <Fragment key={member.id}>
          <tr className="unit-row">
            <td className="sticky-col" rowSpan={2}>
              <div className="member-info-cell" style={{ paddingLeft: 16 }}>
                <div className="member-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                  {member.name.charAt(0)}
                </div>
                <span>{member.name}</span>
              </div>
            </td>
            <td className="sticky-col-2" rowSpan={2}>
              <span
                className="rank-badge"
                style={{ background: `${RankColors[member.rank]}20`, color: RankColors[member.rank] }}
              >
                {RankLabels[member.rank]}
              </span>
            </td>
            <td className="sticky-col-3" rowSpan={2}>
              <span className="unit-price-display">{unitPrice}万円</span>
            </td>
            <td className="sticky-col-4" rowSpan={2}>
              <input
                type="number"
                className="salary-input"
                value={baseSalary ?? ''}
                onChange={(e) => setSimulationSalary(member.id, e.target.value)}
                placeholder={String(unitPrice)}
                style={{ width: 70 }}
              />
            </td>
            <td className="sticky-col-5" rowSpan={2}>
              <input
                type="number"
                className="multiplier-input-small"
                value={memberMult}
                onChange={(e) => setMemberMultiplier(member.id, Number(e.target.value) || 1)}
                step={0.1}
                min={1}
                max={3}
              />
            </td>
            <td className="sticky-col-6" rowSpan={2}>
              <span className="managed-salary-display">{managedBaseSalary}</span>
            </td>
            <td className="row-type unit">標準単価</td>
            {MONTHS.map((month) => (
              <td key={month} className="unit-cell">{unitPrice}</td>
            ))}
            <td className="total-cell unit">{unitPriceTotal.toLocaleString()}</td>
          </tr>
          <tr className="salary-row">
            <td className="row-type managed">管理給与</td>
            {MONTHS.map((month) => {
              const managedValue = calculateManagedSalary(salaryForMonth, member.id);
              return (
                <td key={month} className="managed-cell">{managedValue}</td>
              );
            })}
            <td className="total-cell managed">{managedSalaryTotal.toLocaleString()}</td>
          </tr>
        </Fragment>
      );
    });
  };

  const renderTeamSection = (team: Team | null, teamId: string, teamName: string, teamColor: string) => {
    const teamMembers = getMembersByTeam(team?.id || null);
    if (teamMembers.length === 0) return null;
    const isExpanded = expandedTeams.has(teamId);

    const teamUnitPriceTotal = teamMembers.reduce((sum, m) => sum + calculateMemberUnitPriceTotal(m.rank), 0);
    const teamManagedSalaryTotal = teamMembers.reduce((sum, m) => sum + calculateMemberManagedSalaryTotal(m.id, m.rank), 0);

    return (
      <Fragment key={teamId}>
        <tr
          className="team-header-row"
          style={{ background: `${teamColor}15`, cursor: 'pointer' }}
          onClick={() => toggleTeamExpanded(teamId)}
        >
          <td rowSpan={2} style={{ padding: '8px 12px', verticalAlign: 'middle' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <div style={{ width: 4, height: 24, background: teamColor, borderRadius: 2 }} />
              <span style={{ fontWeight: 600, color: '#374151' }}>{teamName}</span>
              <span style={{ color: '#6B7280', fontSize: 13 }}>({teamMembers.length}名)</span>
            </div>
          </td>
          <td rowSpan={2} style={{ background: `${teamColor}10` }}></td>
          <td rowSpan={2} style={{ background: `${teamColor}10` }}></td>
          <td rowSpan={2} style={{ background: `${teamColor}10` }}></td>
          <td rowSpan={2} style={{ background: `${teamColor}10` }}></td>
          <td rowSpan={2} style={{ background: `${teamColor}10` }}></td>
          <td className="row-type unit" style={{ fontSize: 11 }}>標準単価</td>
          {MONTHS.map((month) => (
            <td key={month} style={{ background: `${teamColor}10` }}></td>
          ))}
          <td style={{ background: '#EFF6FF', fontWeight: 600, fontSize: 12, textAlign: 'right', paddingRight: 8, color: '#3B82F6' }}>
            {teamUnitPriceTotal.toLocaleString()}
          </td>
        </tr>
        <tr
          className="team-header-row"
          style={{ background: `${teamColor}15`, cursor: 'pointer' }}
          onClick={() => toggleTeamExpanded(teamId)}
        >
          <td className="row-type managed" style={{ fontSize: 11 }}>管理給与</td>
          {MONTHS.map((month) => (
            <td key={`managed-${month}`} style={{ background: `${teamColor}10` }}></td>
          ))}
          <td style={{ background: '#FDF2F8', fontWeight: 600, fontSize: 12, textAlign: 'right', paddingRight: 8, color: '#DB2777' }}>
            {teamManagedSalaryTotal.toLocaleString()}
          </td>
        </tr>
        {isExpanded && renderMemberRows(teamMembers)}
      </Fragment>
    );
  };

  const unassignedMembers = getMembersByTeam(null);

  return (
    <div className="main-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">予算シミュレーション</h1>
          <p className="page-subtitle">人件費のシミュレーション（変更は保存されません）</p>
        </div>
        <YearSelector />
      </div>

      {/* チーム別サマリーテーブル */}
      <div className="team-summary-grid">
        <div className="team-summary-card total">
          <div className="team-summary-header">
            <span className="team-summary-title">合計</span>
          </div>
          <div className="team-summary-row">
            <span className="team-summary-label">人数</span>
            <span className="team-summary-value">{members.length}名</span>
          </div>
          <div className="team-summary-row">
            <span className="team-summary-label">標準単価</span>
            <span className="team-summary-value">{totalMemberUnitPrice.toLocaleString()}</span>
          </div>
          <div className="team-summary-row highlight">
            <span className="team-summary-label">管理給与</span>
            <span className="team-summary-value">{totalMemberManagedSalary.toLocaleString()}</span>
          </div>
        </div>
        {teams.map((team) => (
          <div key={team.id} className="team-summary-card" style={{ borderTopColor: team.color }}>
            <div className="team-summary-header">
              <span className="team-summary-title" style={{ color: team.color }}>{team.name}</span>
            </div>
            <div className="team-summary-row">
              <span className="team-summary-label">人数</span>
              <span className="team-summary-value">{getTeamMemberCount(team.id)}名</span>
            </div>
            <div className="team-summary-row">
              <span className="team-summary-label">標準単価</span>
              <span className="team-summary-value">{calculateTeamUnitPriceTotal(team.id).toLocaleString()}</span>
            </div>
            <div className="team-summary-row highlight">
              <span className="team-summary-label">管理給与</span>
              <span className="team-summary-value">{calculateTeamManagedSalaryTotal(team.id).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* メンバー別単価・給与一覧 */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">メンバー別単価・給与シミュレーション</h3>
          <div className="multiplier-control">
            <Settings size={16} />
            <span>一括倍率:</span>
            <input
              type="number"
              className="multiplier-input"
              value={globalMultiplier}
              onChange={(e) => setGlobalMultiplier(Number(e.target.value) || 1)}
              step={0.1}
              min={1}
              max={3}
            />
            <button className="btn-apply" onClick={applyGlobalMultiplier}>
              全員に反映
            </button>
          </div>
        </div>
        <div className="salary-table-container">
          <table className="salary-table dual-row">
            <thead>
              <tr>
                <th className="sticky-col" rowSpan={2}>メンバー</th>
                <th className="sticky-col-2" rowSpan={2}>ランク</th>
                <th className="sticky-col-3" rowSpan={2}>単価</th>
                <th className="sticky-col-4" rowSpan={2}>給与</th>
                <th className="sticky-col-5" rowSpan={2}>倍率</th>
                <th className="sticky-col-6" rowSpan={2}>管理給与</th>
                <th rowSpan={2}>区分</th>
                {MONTH_LABELS.map((label, i) => (
                  <th key={i}>{label}</th>
                ))}
                <th>年間合計</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => renderTeamSection(team, team.id, team.name, team.color))}
              {unassignedMembers.length > 0 && renderTeamSection(null, 'unassigned', '未所属', '#9CA3AF')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
