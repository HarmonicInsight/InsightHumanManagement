import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, DollarSign, Users, UserPlus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { YearSelector } from '../components/YearSelector';
import { RankLabels, RankColors, DefaultAgentFeeRate } from '../types';
import type { Rank, NewHire, MemberSalary } from '../types';
import './Budget.css';

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // 1月〜12月
const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const RANKS: Rank[] = ['SMGR', 'MGR', 'Scon', 'CONS'];

export function Budget() {
  const {
    members,
    budget,
    initializeBudget,
    updateRankUnitPrices,
    updateMemberSalary,
    addNewHire,
    updateNewHire,
    deleteNewHire,
  } = useApp();

  const [editingHire, setEditingHire] = useState<NewHire | null>(null);
  const [isAddingHire, setIsAddingHire] = useState(false);
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

  const handleUnitPriceChange = (rank: Rank, value: string) => {
    const newPrice = Number(value) || 0;
    const updated = rankUnitPrices.map((p) =>
      p.rank === rank ? { ...p, unitPrice: newPrice } : p
    );
    updateRankUnitPrices(updated);
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

  const handleMonthlySalaryChange = (memberId: string, month: number, value: string) => {
    const salary = getMemberSalary(memberId);
    const monthlyValue = value === '' ? null : Number(value);
    updateMemberSalary({
      ...salary,
      monthlySalaries: { ...salary.monthlySalaries, [month]: monthlyValue },
    });
  };

  // 単価の年間合計
  const calculateMemberUnitPriceTotal = (rank: Rank): number => {
    return getUnitPrice(rank) * 12;
  };

  // 給与の年間合計
  const calculateMemberSalaryTotal = (memberId: string, rank: Rank): number => {
    const salary = getMemberSalary(memberId);
    const unitPrice = getUnitPrice(rank);
    let total = 0;
    MONTHS.forEach((month) => {
      const monthSalary = salary.monthlySalaries[month];
      if (monthSalary !== null && monthSalary !== undefined) {
        total += monthSalary;
      } else {
        total += unitPrice;
      }
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

  const totalMemberSalary = members.reduce(
    (sum, m) => sum + calculateMemberSalaryTotal(m.id, m.rank),
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

  const totalLaborCost = totalMemberSalary + totalNewHireSalary + totalAgentFees;

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

  return (
    <div className="main-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">予算管理</h1>
          <p className="page-subtitle">人件費と採用予算の管理</p>
        </div>
        <YearSelector />
      </div>

      {/* サマリーカード */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">標準単価合計</div>
          <div className="stat-value">{totalMemberUnitPrice.toLocaleString()}万円</div>
          <div className="stat-icon">
            <Users size={24} color="#3B82F6" />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">給与実績合計</div>
          <div className="stat-value">{totalMemberSalary.toLocaleString()}万円</div>
          <div className="stat-icon">
            <Users size={24} color="#10B981" />
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">新規採用費用</div>
          <div className="stat-value">{(totalNewHireSalary + totalAgentFees).toLocaleString()}万円</div>
          <div className="stat-icon">
            <UserPlus size={24} color="#F59E0B" />
          </div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-label">トータル人件費</div>
          <div className="stat-value">{totalLaborCost.toLocaleString()}万円</div>
          <div className="stat-icon">
            <DollarSign size={24} color="#8B5CF6" />
          </div>
        </div>
      </div>

      {/* 単価マスタ */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">単価マスタ</h3>
        </div>
        <div className="unit-price-grid">
          {RANKS.map((rank) => {
            const price = rankUnitPrices.find((p) => p.rank === rank);
            return (
              <div key={rank} className="unit-price-item" style={{ borderLeftColor: RankColors[rank] }}>
                <div className="unit-price-label">{RankLabels[rank]}</div>
                <div className="unit-price-input">
                  <input
                    type="number"
                    value={price?.unitPrice || ''}
                    onChange={(e) => handleUnitPriceChange(rank, e.target.value)}
                    placeholder="0"
                  />
                  <span className="unit">万円/月</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* メンバー別単価・給与一覧 */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">メンバー別単価・給与一覧</h3>
        </div>
        <div className="salary-table-container">
          <table className="salary-table dual-row">
            <thead>
              <tr>
                <th className="sticky-col" rowSpan={2}>メンバー</th>
                <th className="sticky-col-2" rowSpan={2}>ランク</th>
                <th className="sticky-col-3" rowSpan={2}>単価</th>
                <th rowSpan={2}>区分</th>
                {MONTH_LABELS.map((label, i) => (
                  <th key={i}>{label}</th>
                ))}
                <th>年間合計</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const salary = getMemberSalary(member.id);
                const unitPrice = getUnitPrice(member.rank);
                const unitPriceTotal = calculateMemberUnitPriceTotal(member.rank);
                const salaryTotal = calculateMemberSalaryTotal(member.id, member.rank);
                return (
                  <>
                    {/* 標準単価行 */}
                    <tr key={`${member.id}-unit`} className="unit-row">
                      <td className="sticky-col" rowSpan={2}>
                        <div className="member-info-cell">
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
                      <td className="row-type unit">標準単価</td>
                      {MONTHS.map((month) => (
                        <td key={month} className="unit-cell">{unitPrice}</td>
                      ))}
                      <td className="total-cell unit">{unitPriceTotal.toLocaleString()}</td>
                    </tr>
                    {/* 給与実績行 */}
                    <tr key={`${member.id}-salary`} className="salary-row">
                      <td className="row-type salary">給与実績</td>
                      {MONTHS.map((month) => (
                        <td key={month}>
                          <input
                            type="number"
                            className="salary-input small"
                            value={salary.monthlySalaries[month] ?? ''}
                            onChange={(e) => handleMonthlySalaryChange(member.id, month, e.target.value)}
                            placeholder={String(unitPrice)}
                          />
                        </td>
                      ))}
                      <td className="total-cell salary">{salaryTotal.toLocaleString()}</td>
                    </tr>
                  </>
                );
              })}
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
