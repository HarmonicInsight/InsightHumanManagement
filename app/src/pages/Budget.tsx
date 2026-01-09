import { useState, useEffect, Fragment } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { YearSelector } from '../components/YearSelector';
import { RankLabels, RankColors, DefaultAgentFeeRate, RankOrder } from '../types';
import type { Rank, NewHire, MemberSalary, Team, Member } from '../types';
import './Budget.css';

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // 1月〜12月
const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const RANKS: Rank[] = ['DIR', 'SMGR', 'MGR', 'Scon', 'CONS'];

export function Budget() {
  const {
    members,
    teams,
    budget,
    initializeBudget,
    updateMemberSalary,
    addNewHire,
    updateNewHire,
    deleteNewHire,
  } = useApp();

  const [editingHire, setEditingHire] = useState<NewHire | null>(null);
  const [isAddingHire, setIsAddingHire] = useState(false);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set(['unassigned', ...teams.map(t => t.id)]));
  const [globalMultiplier, setGlobalMultiplier] = useState<number>(1.3); // 一括倍率
  const [memberMultipliers, setMemberMultipliers] = useState<Record<string, number>>({}); // 個別倍率
  const [hireForm, setHireForm] = useState({
    name: '',
    rank: 'CONS' as Rank,
    entryMonth: 4,
    annualSalary: 500,
    agentFeeRate: DefaultAgentFeeRate,
    agentFeeOverride: null as number | null,
  });

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
  const memberSalaries = budget.memberSalaries;
  const newHires = budget.newHires;

  const getUnitPrice = (rank: Rank): number => {
    const price = rankUnitPrices.find((p) => p.rank === rank);
    return price?.unitPrice || 0;
  };

  const getMemberSalary = (memberId: string): MemberSalary => {
    return (
      memberSalaries.find((s) => s.memberId === memberId) || {
        memberId,
        annualSalary: null,
        monthlySalaries: {},
      }
    );
  };

  // 給与列に入力した値を全月に反映
  const handleBaseSalaryChange = (memberId: string, value: string) => {
    const salary = getMemberSalary(memberId);
    const baseSalary = value === '' ? null : Number(value);
    const newMonthlySalaries: Record<number, number | null> = {};
    MONTHS.forEach((month) => {
      newMonthlySalaries[month] = baseSalary;
    });
    updateMemberSalary({
      ...salary,
      monthlySalaries: newMonthlySalaries,
    });
  };

  // メンバーの給与（全月同一なら表示、異なればnull）
  const getMemberBaseSalary = (memberId: string): number | null => {
    const salary = getMemberSalary(memberId);
    const values = MONTHS.map((m) => salary.monthlySalaries[m]);
    const firstValue = values[0];
    if (firstValue === null || firstValue === undefined) return null;
    const allSame = values.every((v) => v === firstValue);
    return allSame ? firstValue : null;
  };

  const getMembersByTeam = (teamId: string | null) => {
    return members
      .filter((m) => m.teamId === teamId)
      .sort((a, b) => RankOrder[b.rank] - RankOrder[a.rank]);
  };

  // 単価の年間合計
  const calculateMemberUnitPriceTotal = (rank: Rank): number => {
    return getUnitPrice(rank) * 12;
  };

  // メンバーの倍率を取得（個別設定があればそれを、なければグローバル値を使用）
  const getMemberMultiplier = (memberId: string): number => {
    return memberMultipliers[memberId] ?? globalMultiplier;
  };

  // 個別倍率を設定
  const setMemberMultiplier = (memberId: string, value: number) => {
    setMemberMultipliers(prev => ({ ...prev, [memberId]: value }));
  };

  // 一括倍率を全員に反映
  const applyGlobalMultiplier = () => {
    const newMultipliers: Record<string, number> = {};
    members.forEach(m => {
      newMultipliers[m.id] = globalMultiplier;
    });
    setMemberMultipliers(newMultipliers);
  };

  // 管理給与の計算 (給与 × 倍率)
  const calculateManagedSalary = (baseSalary: number, memberId: string): number => {
    const mult = getMemberMultiplier(memberId);
    return Math.round(baseSalary * mult * 10) / 10;
  };

  // 管理給与の年間合計
  const calculateMemberManagedSalaryTotal = (memberId: string, rank: Rank): number => {
    const salary = getMemberSalary(memberId);
    const unitPrice = getUnitPrice(rank);
    let total = 0;
    MONTHS.forEach((month) => {
      const monthSalary = salary.monthlySalaries[month];
      const baseSalary = (monthSalary !== null && monthSalary !== undefined) ? monthSalary : unitPrice;
      total += calculateManagedSalary(baseSalary, memberId);
    });
    return total;
  };

  const calculateNewHireSalary = (hire: NewHire): number => {
    const monthsWorked = 12 - hire.entryMonth + 1;
    return (hire.annualSalary / 12) * monthsWorked;
  };

  const calculateAgentFee = (hire: NewHire): number => {
    if (hire.agentFeeOverride !== null) {
      return hire.agentFeeOverride;
    }
    return (hire.annualSalary * hire.agentFeeRate) / 100;
  };

  const totalMemberUnitPrice = members.reduce(
    (sum, m) => sum + calculateMemberUnitPriceTotal(m.rank),
    0
  );

  const totalMemberManagedSalary = members.reduce(
    (sum, m) => sum + calculateMemberManagedSalaryTotal(m.id, m.rank),
    0
  );

  const totalNewHireSalary = newHires.reduce(
    (sum, h) => sum + calculateNewHireSalary(h),
    0
  );

  const totalAgentFees = newHires.reduce(
    (sum, h) => sum + calculateAgentFee(h),
    0
  );

  // チーム別標準原価合計を計算
  const calculateTeamUnitPriceTotal = (teamId: string | null) => {
    return members
      .filter((m) => m.teamId === teamId)
      .reduce((sum, m) => sum + calculateMemberUnitPriceTotal(m.rank), 0);
  };

  // チーム別管理給与合計を計算
  const calculateTeamManagedSalaryTotal = (teamId: string | null) => {
    return members
      .filter((m) => m.teamId === teamId)
      .reduce((sum, m) => sum + calculateMemberManagedSalaryTotal(m.id, m.rank), 0);
  };

  // チーム別メンバー数を計算
  const getTeamMemberCount = (teamId: string | null) => {
    return members.filter((m) => m.teamId === teamId).length;
  };

  const handleSaveHire = () => {
    if (!hireForm.name.trim()) return;
    if (editingHire) {
      updateNewHire({
        ...editingHire,
        name: hireForm.name,
        rank: hireForm.rank,
        entryMonth: hireForm.entryMonth,
        annualSalary: hireForm.annualSalary,
        agentFeeRate: hireForm.agentFeeRate,
        agentFeeOverride: hireForm.agentFeeOverride,
      });
    } else {
      addNewHire({
        name: hireForm.name,
        rank: hireForm.rank,
        entryMonth: hireForm.entryMonth,
        annualSalary: hireForm.annualSalary,
        agentFeeRate: hireForm.agentFeeRate,
        agentFeeOverride: hireForm.agentFeeOverride,
      });
    }
    closeHireModal();
  };

  const openEditHire = (hire: NewHire) => {
    setEditingHire(hire);
    setHireForm({
      name: hire.name,
      rank: hire.rank,
      entryMonth: hire.entryMonth,
      annualSalary: hire.annualSalary,
      agentFeeRate: hire.agentFeeRate,
      agentFeeOverride: hire.agentFeeOverride,
    });
  };

  const closeHireModal = () => {
    setEditingHire(null);
    setIsAddingHire(false);
    setHireForm({
      name: '',
      rank: 'CONS',
      entryMonth: 4,
      annualSalary: 500,
      agentFeeRate: DefaultAgentFeeRate,
      agentFeeOverride: null,
    });
  };

  const handleDeleteHire = (id: string) => {
    if (confirm('この採用予定者を削除しますか？')) {
      deleteNewHire(id);
    }
  };

  const renderMemberRows = (teamMembers: Member[]) => {
    return teamMembers.map((member) => {
      const salary = getMemberSalary(member.id);
      const unitPrice = getUnitPrice(member.rank);
      const unitPriceTotal = calculateMemberUnitPriceTotal(member.rank);
      const managedSalaryTotal = calculateMemberManagedSalaryTotal(member.id, member.rank);
      const baseSalary = getMemberBaseSalary(member.id);
      const memberMult = getMemberMultiplier(member.id);
      const managedBaseSalary = baseSalary !== null ? calculateManagedSalary(baseSalary, member.id) : calculateManagedSalary(unitPrice, member.id);
      return (
        <Fragment key={member.id}>
          {/* 標準単価行 */}
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
                onChange={(e) => handleBaseSalaryChange(member.id, e.target.value)}
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
          {/* 管理給与行 */}
          <tr className="salary-row">
            <td className="row-type managed">管理給与</td>
            {MONTHS.map((month) => {
              const monthSalary = salary.monthlySalaries[month];
              const baseSalaryForMonth = (monthSalary !== null && monthSalary !== undefined) ? monthSalary : unitPrice;
              const managedValue = calculateManagedSalary(baseSalaryForMonth, member.id);
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

    // チーム合計を計算
    const teamUnitPriceTotal = teamMembers.reduce((sum, m) => sum + calculateMemberUnitPriceTotal(m.rank), 0);
    const teamManagedSalaryTotal = teamMembers.reduce((sum, m) => sum + calculateMemberManagedSalaryTotal(m.id, m.rank), 0);

    return (
      <Fragment key={teamId}>
        {/* チームヘッダ - 標準単価行 */}
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
        {/* チームヘッダ - 管理給与行 */}
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
          <h1 className="page-title">予算管理</h1>
          <p className="page-subtitle">人件費と採用予算の管理</p>
        </div>
        <YearSelector />
      </div>

      {/* チーム別サマリーテーブル */}
      <div className="team-summary-grid">
        {/* 合計カード */}
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
        {/* 各チームカード */}
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
          <h3 className="card-title">メンバー別単価・給与一覧</h3>
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

      {/* 採用予定者 */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">採用予定者</h3>
          <button className="btn-primary" onClick={() => setIsAddingHire(true)}>
            <Plus size={16} style={{ marginRight: 4 }} />
            採用予定追加
          </button>
        </div>
        {newHires.length === 0 ? (
          <div className="empty-state">採用予定者がいません</div>
        ) : (
          <div className="hire-table-container">
            <table className="hire-table">
              <thead>
                <tr>
                  <th>名前</th>
                  <th>ランク</th>
                  <th>入社月</th>
                  <th>年収</th>
                  <th>今期給与</th>
                  <th>エージェント率</th>
                  <th>エージェント費用</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {newHires.map((hire) => {
                  const hireSalary = calculateNewHireSalary(hire);
                  const agentFee = calculateAgentFee(hire);
                  return (
                    <tr key={hire.id}>
                      <td>
                        <div className="member-info-cell">
                          <div className="member-avatar new-hire" style={{ width: 28, height: 28, fontSize: 11 }}>
                            {hire.name.charAt(0)}
                          </div>
                          <span>{hire.name}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className="rank-badge"
                          style={{ background: `${RankColors[hire.rank]}20`, color: RankColors[hire.rank] }}
                        >
                          {RankLabels[hire.rank]}
                        </span>
                      </td>
                      <td>{hire.entryMonth}月</td>
                      <td>{hire.annualSalary}万円</td>
                      <td className="highlight-cell">{hireSalary.toFixed(1)}万円</td>
                      <td>{hire.agentFeeRate}%</td>
                      <td className="highlight-cell">
                        {hire.agentFeeOverride !== null ? (
                          <span className="manual-value">{agentFee.toFixed(1)}万円 (手動)</span>
                        ) : (
                          `${agentFee.toFixed(1)}万円`
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button onClick={() => openEditHire(hire)}>
                            <Edit2 size={14} />
                          </button>
                          <button className="delete" onClick={() => handleDeleteHire(hire.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className="footer-label">合計</td>
                  <td className="footer-value">{totalNewHireSalary.toFixed(1)}万円</td>
                  <td></td>
                  <td className="footer-value">{totalAgentFees.toFixed(1)}万円</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* 採用予定者モーダル */}
      {(editingHire || isAddingHire) && (
        <div className="modal-overlay" onClick={closeHireModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">{editingHire ? '採用予定者編集' : '採用予定者追加'}</h3>

            <div className="form-group">
              <label>名前 *</label>
              <input
                type="text"
                value={hireForm.name}
                onChange={(e) => setHireForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="名前を入力"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>ランク</label>
                <select
                  value={hireForm.rank}
                  onChange={(e) => setHireForm((f) => ({ ...f, rank: e.target.value as Rank }))}
                >
                  {RANKS.map((r) => (
                    <option key={r} value={r}>
                      {RankLabels[r]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>入社月</label>
                <select
                  value={hireForm.entryMonth}
                  onChange={(e) => setHireForm((f) => ({ ...f, entryMonth: Number(e.target.value) }))}
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}月
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>年収（万円）</label>
              <input
                type="number"
                value={hireForm.annualSalary}
                onChange={(e) => setHireForm((f) => ({ ...f, annualSalary: Number(e.target.value) }))}
                placeholder="500"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>エージェント費用率（%）</label>
                <input
                  type="number"
                  value={hireForm.agentFeeRate}
                  onChange={(e) => setHireForm((f) => ({ ...f, agentFeeRate: Number(e.target.value) }))}
                  placeholder="35"
                />
                <small className="form-hint">デフォルト: 35%</small>
              </div>

              <div className="form-group">
                <label>エージェント費用手動入力（万円）</label>
                <input
                  type="number"
                  value={hireForm.agentFeeOverride ?? ''}
                  onChange={(e) =>
                    setHireForm((f) => ({
                      ...f,
                      agentFeeOverride: e.target.value === '' ? null : Number(e.target.value),
                    }))
                  }
                  placeholder="空欄で自動計算"
                />
                <small className="form-hint">入力すると率を無視</small>
              </div>
            </div>

            <div className="hire-preview">
              <div className="preview-label">プレビュー</div>
              <div className="preview-row">
                <span>今期給与（入社後）:</span>
                <strong>
                  {((hireForm.annualSalary / 12) * (12 - hireForm.entryMonth + 1)).toFixed(1)}万円
                </strong>
              </div>
              <div className="preview-row">
                <span>エージェント費用:</span>
                <strong>
                  {hireForm.agentFeeOverride !== null
                    ? hireForm.agentFeeOverride.toFixed(1)
                    : ((hireForm.annualSalary * hireForm.agentFeeRate) / 100).toFixed(1)}
                  万円
                </strong>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={closeHireModal}>
                キャンセル
              </button>
              <button className="btn-primary" onClick={handleSaveHire}>
                {editingHire ? '保存' : '追加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
