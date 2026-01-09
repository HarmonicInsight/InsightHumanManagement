import { useState, useMemo } from 'react';
import { Plus, Trash2, Calculator } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { YearSelector } from '../components/YearSelector';
import { RankLabels, RankColors, RankOrder, YearlyGradeColors } from '../types';
import type { Rank, Member, YearlyGrade } from '../types';
import './BudgetSimulation.css';

// 評価別デフォルト昇給率
const DEFAULT_RAISE_RATES: Record<string, number> = {
  S: 10,
  A: 6,
  B: 4,
  C: 0,
};

interface RaisePattern {
  id: string;
  name: string;
  rates: Record<string, number>; // S, A, B, C の昇給率
}

interface MemberSimulation {
  member: Member;
  currentSalary: number;
  evaluation: YearlyGrade;
  raiseRate: number;
  nextYearSalary: number;
}

export function BudgetSimulation() {
  const { members, teams, budget, currentYear, yearlyEvaluations } = useApp();

  // シミュレーション用の給与データ（ローカル）
  const [simulationSalaries, setSimulationSalaries] = useState<Record<string, number>>({});

  // シミュレーション用の評価データ（ローカル）
  const [simulationEvaluations, setSimulationEvaluations] = useState<Record<string, YearlyGrade>>({});

  // 昇給率パターン
  const [patterns, setPatterns] = useState<RaisePattern[]>([
    { id: '1', name: 'パターン1', rates: { S: 10, A: 6, B: 4, C: 0 } },
    { id: '2', name: 'パターン2', rates: { S: 10, A: 5, B: 3, C: 0 } },
    { id: '3', name: 'パターン3', rates: { S: 8, A: 4, B: 2, C: 0 } },
  ]);

  // 標準給与合計（予算）を計算
  const standardSalaryTotal = useMemo(() => {
    if (!budget) return 0;
    return budget.rankUnitPrices.reduce((sum, rp) => {
      const count = members.filter(m => m.rank === rp.rank).length;
      return sum + rp.unitPrice * 12 * count;
    }, 0);
  }, [budget, members]);

  // メンバーの現在給与を取得
  const getMemberSalary = (memberId: string, rank: Rank): number => {
    if (simulationSalaries[memberId] !== undefined) {
      return simulationSalaries[memberId];
    }
    // 予算データから取得
    if (budget) {
      const memberSalary = budget.memberSalaries.find(s => s.memberId === memberId);
      if (memberSalary) {
        const firstMonth = memberSalary.monthlySalaries[1];
        if (firstMonth !== null && firstMonth !== undefined) {
          return firstMonth;
        }
      }
      // 標準単価を使用
      const unitPrice = budget.rankUnitPrices.find(p => p.rank === rank);
      return unitPrice?.unitPrice || 100;
    }
    return 100;
  };

  // メンバーの年度評価を取得
  const getMemberEvaluation = (memberId: string): YearlyGrade => {
    if (simulationEvaluations[memberId] !== undefined) {
      return simulationEvaluations[memberId];
    }
    // 年度評価データから取得
    const evalData = yearlyEvaluations.find(e => e.memberId === memberId);
    if (evalData && evalData.evaluations[currentYear]) {
      return evalData.evaluations[currentYear];
    }
    return 'B'; // デフォルト
  };

  // 評価に応じた昇給率を取得
  const getRaiseRate = (evaluation: YearlyGrade, patternRates: Record<string, number>): number => {
    if (!evaluation) return patternRates['B'] || 4;
    return patternRates[evaluation] ?? DEFAULT_RAISE_RATES[evaluation] ?? 4;
  };

  // 翌年給与を計算
  const calculateNextYearSalary = (currentSalary: number, raiseRate: number): number => {
    return Math.round(currentSalary * (1 + raiseRate / 100) * 10) / 10;
  };

  // メンバーをランク・チーム順でソート
  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      const rankDiff = RankOrder[b.rank] - RankOrder[a.rank];
      if (rankDiff !== 0) return rankDiff;
      return (a.teamId || '').localeCompare(b.teamId || '');
    });
  }, [members]);

  // パターン追加
  const addPattern = () => {
    const newId = String(Date.now());
    setPatterns(prev => [
      ...prev,
      { id: newId, name: `パターン${prev.length + 1}`, rates: { S: 10, A: 6, B: 4, C: 0 } }
    ]);
  };

  // パターン削除
  const removePattern = (id: string) => {
    if (patterns.length <= 1) return;
    setPatterns(prev => prev.filter(p => p.id !== id));
  };

  // パターンの昇給率を更新
  const updatePatternRate = (patternId: string, grade: string, value: number) => {
    setPatterns(prev => prev.map(p => {
      if (p.id === patternId) {
        return { ...p, rates: { ...p.rates, [grade]: value } };
      }
      return p;
    }));
  };

  // パターン名を更新
  const updatePatternName = (patternId: string, name: string) => {
    setPatterns(prev => prev.map(p => {
      if (p.id === patternId) {
        return { ...p, name };
      }
      return p;
    }));
  };

  // 各パターンのシミュレーション結果を計算
  const simulationResults = useMemo(() => {
    return patterns.map(pattern => {
      let totalCurrentSalary = 0;
      let totalNextYearSalary = 0;
      const memberResults: MemberSimulation[] = [];

      sortedMembers.forEach(member => {
        const currentSalary = getMemberSalary(member.id, member.rank);
        const evaluation = getMemberEvaluation(member.id);
        const raiseRate = getRaiseRate(evaluation, pattern.rates);
        const nextYearSalary = calculateNextYearSalary(currentSalary, raiseRate);

        totalCurrentSalary += currentSalary * 12;
        totalNextYearSalary += nextYearSalary * 12;

        memberResults.push({
          member,
          currentSalary,
          evaluation,
          raiseRate,
          nextYearSalary,
        });
      });

      const difference = totalNextYearSalary - standardSalaryTotal;
      const isWithinBudget = totalNextYearSalary <= standardSalaryTotal;

      return {
        pattern,
        memberResults,
        totalCurrentSalary,
        totalNextYearSalary,
        difference,
        isWithinBudget,
      };
    });
  }, [patterns, sortedMembers, simulationSalaries, simulationEvaluations, standardSalaryTotal]);

  // 評価別人数を計算
  const evaluationCounts = useMemo(() => {
    const counts: Record<string, number> = { S: 0, A: 0, B: 0, C: 0 };
    sortedMembers.forEach(member => {
      const eval_ = getMemberEvaluation(member.id);
      if (eval_) counts[eval_] = (counts[eval_] || 0) + 1;
    });
    return counts;
  }, [sortedMembers, simulationEvaluations]);

  const getTeamName = (teamId: string | null): string => {
    if (!teamId) return '未所属';
    const team = teams.find(t => t.id === teamId);
    return team?.name || '未所属';
  };

  return (
    <div className="main-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">予算シミュレーション</h1>
          <p className="page-subtitle">評価に応じた昇給率で翌年給与を試算（変更は保存されません）</p>
        </div>
        <YearSelector />
      </div>

      {/* サマリーカード */}
      <div className="sim-summary-cards">
        <div className="sim-summary-card">
          <div className="sim-summary-label">メンバー数</div>
          <div className="sim-summary-value">{members.length}名</div>
        </div>
        <div className="sim-summary-card">
          <div className="sim-summary-label">標準給与予算（年間）</div>
          <div className="sim-summary-value">{standardSalaryTotal.toLocaleString()}万円</div>
        </div>
        <div className="sim-summary-card evaluation-counts">
          <div className="sim-summary-label">評価分布</div>
          <div className="eval-distribution">
            {['S', 'A', 'B', 'C'].map(grade => (
              <span key={grade} className="eval-count" style={{ color: YearlyGradeColors[grade] }}>
                {grade}: {evaluationCounts[grade]}名
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 昇給率パターン設定 */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Calculator size={18} />
            昇給率パターン設定
          </h3>
          <button className="btn-add-pattern" onClick={addPattern}>
            <Plus size={16} />
            パターン追加
          </button>
        </div>
        <div className="pattern-settings">
          <table className="pattern-table">
            <thead>
              <tr>
                <th>パターン名</th>
                <th style={{ color: YearlyGradeColors['S'] }}>S評価 (%)</th>
                <th style={{ color: YearlyGradeColors['A'] }}>A評価 (%)</th>
                <th style={{ color: YearlyGradeColors['B'] }}>B評価 (%)</th>
                <th style={{ color: YearlyGradeColors['C'] }}>C評価 (%)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {patterns.map(pattern => (
                <tr key={pattern.id}>
                  <td>
                    <input
                      type="text"
                      className="pattern-name-input"
                      value={pattern.name}
                      onChange={(e) => updatePatternName(pattern.id, e.target.value)}
                    />
                  </td>
                  {['S', 'A', 'B', 'C'].map(grade => (
                    <td key={grade}>
                      <input
                        type="number"
                        className="rate-input"
                        value={pattern.rates[grade]}
                        onChange={(e) => updatePatternRate(pattern.id, grade, Number(e.target.value))}
                        min={0}
                        max={50}
                        step={1}
                      />
                    </td>
                  ))}
                  <td>
                    <button
                      className="btn-remove-pattern"
                      onClick={() => removePattern(pattern.id)}
                      disabled={patterns.length <= 1}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* シミュレーション結果比較 */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">シミュレーション結果比較</h3>
        </div>
        <div className="simulation-comparison">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>パターン</th>
                <th>S昇給率</th>
                <th>A昇給率</th>
                <th>B昇給率</th>
                <th>C昇給率</th>
                <th>現在給与合計</th>
                <th>翌年給与合計</th>
                <th>予算差額</th>
                <th>判定</th>
              </tr>
            </thead>
            <tbody>
              {simulationResults.map(result => (
                <tr key={result.pattern.id} className={result.isWithinBudget ? 'within-budget' : 'over-budget'}>
                  <td className="pattern-name">{result.pattern.name}</td>
                  <td>{result.pattern.rates['S']}%</td>
                  <td>{result.pattern.rates['A']}%</td>
                  <td>{result.pattern.rates['B']}%</td>
                  <td>{result.pattern.rates['C']}%</td>
                  <td className="amount">{result.totalCurrentSalary.toLocaleString()}</td>
                  <td className="amount">{result.totalNextYearSalary.toLocaleString()}</td>
                  <td className={`amount ${result.difference > 0 ? 'negative' : 'positive'}`}>
                    {result.difference > 0 ? '+' : ''}{result.difference.toLocaleString()}
                  </td>
                  <td>
                    <span className={`budget-badge ${result.isWithinBudget ? 'ok' : 'ng'}`}>
                      {result.isWithinBudget ? '予算内' : '予算超過'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* メンバー別詳細（最初のパターン） */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">メンバー別詳細（{patterns[0]?.name}）</h3>
        </div>
        <div className="member-detail-table-container">
          <table className="member-detail-table">
            <thead>
              <tr>
                <th>メンバー</th>
                <th>チーム</th>
                <th>ランク</th>
                <th>現在給与</th>
                <th>年度評価</th>
                <th>昇給率</th>
                <th>翌年給与</th>
                <th>年間増加額</th>
              </tr>
            </thead>
            <tbody>
              {simulationResults[0]?.memberResults.map(result => {
                const annualIncrease = (result.nextYearSalary - result.currentSalary) * 12;
                return (
                  <tr key={result.member.id}>
                    <td>
                      <div className="member-info-cell">
                        <div className="member-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                          {result.member.name.charAt(0)}
                        </div>
                        <span>{result.member.name}</span>
                      </div>
                    </td>
                    <td>{getTeamName(result.member.teamId)}</td>
                    <td>
                      <span
                        className="rank-badge"
                        style={{ background: `${RankColors[result.member.rank]}20`, color: RankColors[result.member.rank] }}
                      >
                        {RankLabels[result.member.rank]}
                      </span>
                    </td>
                    <td className="amount-cell">
                      <input
                        type="number"
                        className="salary-input-sim"
                        value={simulationSalaries[result.member.id] ?? result.currentSalary}
                        onChange={(e) => setSimulationSalaries(prev => ({
                          ...prev,
                          [result.member.id]: Number(e.target.value) || 0
                        }))}
                      />
                      <span className="unit">万円</span>
                    </td>
                    <td>
                      <select
                        className="eval-select"
                        value={getMemberEvaluation(result.member.id) || 'B'}
                        onChange={(e) => setSimulationEvaluations(prev => ({
                          ...prev,
                          [result.member.id]: e.target.value as YearlyGrade
                        }))}
                        style={{ color: YearlyGradeColors[result.evaluation || 'B'] }}
                      >
                        <option value="S">S</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                      </select>
                    </td>
                    <td className="rate-cell">
                      <span className="raise-rate">{result.raiseRate}%</span>
                    </td>
                    <td className="amount-cell next-year">
                      {result.nextYearSalary.toLocaleString()}万円
                    </td>
                    <td className={`amount-cell ${annualIncrease > 0 ? 'positive' : ''}`}>
                      {annualIncrease > 0 ? '+' : ''}{annualIncrease.toLocaleString()}万円
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td colSpan={3}>合計</td>
                <td className="amount-cell">
                  {simulationResults[0]?.totalCurrentSalary.toLocaleString()}万円
                </td>
                <td colSpan={2}></td>
                <td className="amount-cell next-year">
                  {simulationResults[0]?.totalNextYearSalary.toLocaleString()}万円
                </td>
                <td className={`amount-cell ${(simulationResults[0]?.totalNextYearSalary - simulationResults[0]?.totalCurrentSalary) > 0 ? 'positive' : ''}`}>
                  {(simulationResults[0]?.totalNextYearSalary - simulationResults[0]?.totalCurrentSalary) > 0 ? '+' : ''}
                  {((simulationResults[0]?.totalNextYearSalary || 0) - (simulationResults[0]?.totalCurrentSalary || 0)).toLocaleString()}万円
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
