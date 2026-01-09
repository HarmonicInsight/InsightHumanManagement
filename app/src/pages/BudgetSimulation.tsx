import { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Calculator, Download, ChevronDown, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { YearSelector } from '../components/YearSelector';
import { RankLabels, RankColors, RankOrder, YearlyGradeColors } from '../types';
import type { Rank, Member, YearlyGrade, RaisePattern } from '../types';
import './BudgetSimulation.css';

// 評価別デフォルト昇給率
const DEFAULT_RAISE_RATES: Record<string, number> = {
  S: 10,
  A: 6,
  B: 4,
  C: 0,
};

// デフォルトパターン（保存データがない場合に使用）
const DEFAULT_PATTERNS: RaisePattern[] = [
  { id: '1', name: 'パターン1', rates: { S: 10, A: 6, B: 4, C: 0 }, comment: '' },
  { id: '2', name: 'パターン2', rates: { S: 10, A: 5, B: 3, C: 0 }, comment: '' },
  { id: '3', name: 'パターン3', rates: { S: 8, A: 4, B: 2, C: 0 }, comment: '' },
  { id: '4', name: 'パターン4', rates: { S: 6, A: 3, B: 2, C: 0 }, comment: '' },
  { id: '5', name: 'パターン5', rates: { S: 5, A: 3, B: 1, C: 0 }, comment: '' },
];

interface MemberSimulation {
  member: Member;
  currentSalary: number;
  evaluation: YearlyGrade;
  raiseRate: number;
  nextYearSalary: number;
}

export function BudgetSimulation() {
  const { members, teams, budget, currentYear, yearlyEvaluations, getBudgetByYear, getSimulationPatterns, updateSimulationPatterns } = useApp();

  // シミュレーション用の給与データ（ローカル）
  const [simulationSalaries, setSimulationSalaries] = useState<Record<string, number>>({});

  // シミュレーション用の評価データ（ローカル）
  const [simulationEvaluations, setSimulationEvaluations] = useState<Record<string, YearlyGrade>>({});

  // メンバー別詳細の展開状態（パターンIDをキーに）
  const [expandedPatterns, setExpandedPatterns] = useState<Record<string, boolean>>({});

  // 昇給率パターン - 保存データから読み込み
  const savedPatterns = getSimulationPatterns();
  const [patterns, setPatterns] = useState<RaisePattern[]>(
    savedPatterns.length > 0 ? savedPatterns : DEFAULT_PATTERNS
  );

  // パターンが変更されたら自動保存
  useEffect(() => {
    // 初回読み込み時との比較を避けるため、空チェック
    if (patterns.length > 0) {
      updateSimulationPatterns(patterns);
    }
  }, [patterns, updateSimulationPatterns]);

  // 翌年度の予算データを取得
  const nextYearBudget = useMemo(() => {
    return getBudgetByYear(currentYear + 1);
  }, [currentYear, getBudgetByYear]);

  // 標準給与合計（予算）を計算 - 当年度
  const standardSalaryTotal = useMemo(() => {
    if (!budget) return 0;
    return budget.rankUnitPrices.reduce((sum, rp) => {
      const count = members.filter(m => m.rank === rp.rank).length;
      return sum + rp.unitPrice * 12 * count;
    }, 0);
  }, [budget, members]);

  // 標準給与合計（予算）を計算 - 翌年度
  const nextYearStandardSalaryTotal = useMemo(() => {
    if (!nextYearBudget) return 0;
    return nextYearBudget.rankUnitPrices.reduce((sum, rp) => {
      const count = members.filter(m => m.rank === rp.rank).length;
      return sum + rp.unitPrice * 12 * count;
    }, 0);
  }, [nextYearBudget, members]);

  // メンバーの標準給与年額を取得（ランク別単価ベース）- 当年度
  const getMemberStandardAnnualSalary = (rank: Rank): number => {
    if (!budget) return 0;
    const unitPrice = budget.rankUnitPrices.find(p => p.rank === rank);
    return (unitPrice?.unitPrice || 0) * 12;
  };

  // メンバーの標準給与年額を取得（ランク別単価ベース）- 翌年度
  const getMemberNextYearStandardAnnualSalary = (rank: Rank): number => {
    if (!nextYearBudget) return 0;
    const unitPrice = nextYearBudget.rankUnitPrices.find(p => p.rank === rank);
    return (unitPrice?.unitPrice || 0) * 12;
  };

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

  // パターン追加（最大5つまで）
  const addPattern = () => {
    if (patterns.length >= 5) return;
    const newId = String(Date.now());
    setPatterns(prev => [
      ...prev,
      { id: newId, name: `パターン${prev.length + 1}`, rates: { S: 10, A: 6, B: 4, C: 0 }, comment: '' }
    ]);
  };

  // パターンのコメントを更新
  const updatePatternComment = (patternId: string, comment: string) => {
    setPatterns(prev => prev.map(p => {
      if (p.id === patternId) {
        return { ...p, comment };
      }
      return p;
    }));
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

      // 翌年給与合計 vs 翌年度標準給与年額（予算）で比較
      const difference = totalNextYearSalary - nextYearStandardSalaryTotal;
      const isWithinBudget = totalNextYearSalary <= nextYearStandardSalaryTotal;

      return {
        pattern,
        memberResults,
        totalCurrentSalary,
        totalNextYearSalary,
        difference,
        isWithinBudget,
      };
    });
  }, [patterns, sortedMembers, simulationSalaries, simulationEvaluations, nextYearStandardSalaryTotal]);

  // パターン展開/折りたたみの切り替え
  const togglePatternExpand = (patternId: string) => {
    setExpandedPatterns(prev => ({
      ...prev,
      [patternId]: !prev[patternId]
    }));
  };

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

  // Excel出力
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // シート1: サマリー
    const summaryData = [
      ['予算シミュレーション結果', '', '', '', '', '', '', '', '', ''],
      [`FY${currentYear}年度`, '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', ''],
      ['■ 基本情報', '', '', '', '', '', '', '', '', ''],
      ['メンバー数', `${members.length}名`, '', '', '', '', '', '', '', ''],
      [`FY${String(currentYear).slice(2)}標準給与年額（予算）`, `${standardSalaryTotal.toLocaleString()}万円`, '', '', '', '', '', '', '', ''],
      [`FY${String(currentYear + 1).slice(2)}標準給与年額（予算）`, `${nextYearStandardSalaryTotal.toLocaleString()}万円`, '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', ''],
      ['■ 評価分布', '', '', '', '', '', '', '', '', ''],
      ['S評価', `${evaluationCounts['S']}名`, 'A評価', `${evaluationCounts['A']}名`, 'B評価', `${evaluationCounts['B']}名`, 'C評価', `${evaluationCounts['C']}名`, '', ''],
      ['', '', '', '', '', '', '', '', '', ''],
      ['■ パターン比較（翌年給与合計 vs FY' + String(currentYear + 1).slice(2) + '標準給与）', '', '', '', '', '', '', '', '', ''],
      ['パターン名', 'S昇給率', 'A昇給率', 'B昇給率', 'C昇給率', '現在給与合計', '翌年給与合計', `FY${String(currentYear + 1).slice(2)}標準給与（予算）`, '差額', '判定'],
    ];

    simulationResults.forEach(result => {
      summaryData.push([
        result.pattern.name,
        `${result.pattern.rates['S']}%`,
        `${result.pattern.rates['A']}%`,
        `${result.pattern.rates['B']}%`,
        `${result.pattern.rates['C']}%`,
        `${result.totalCurrentSalary.toLocaleString()}万円`,
        `${result.totalNextYearSalary.toLocaleString()}万円`,
        `${nextYearStandardSalaryTotal.toLocaleString()}万円`,
        `${result.difference > 0 ? '+' : ''}${result.difference.toLocaleString()}万円`,
        result.isWithinBudget ? '予算内' : '予算超過',
      ]);
    });

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [
      { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 18 }, { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'サマリー');

    // シート2以降: 各パターンの詳細
    simulationResults.forEach((result) => {
      const detailData = [
        [`${result.pattern.name} - メンバー別詳細`, '', '', '', '', '', '', '', '', '', '', ''],
        [`昇給率設定: S=${result.pattern.rates['S']}%, A=${result.pattern.rates['A']}%, B=${result.pattern.rates['B']}%, C=${result.pattern.rates['C']}%`, '', '', '', '', '', '', '', '', '', '', ''],
        [result.pattern.comment ? `コメント: ${result.pattern.comment}` : '', '', '', '', '', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '', '', '', '', ''],
        ['No', 'メンバー', 'チーム', 'ランク', `FY${String(currentYear).slice(2)}標準給与（予算）`, '現在給与(月)', '年度評価', '昇給率', '翌年給与(月)', '翌年給与年額', `FY${String(currentYear + 1).slice(2)}標準給与（予算）`, '差額'],
      ];

      result.memberResults.forEach((mr, i) => {
        const nextYearAnnualSalary = mr.nextYearSalary * 12;
        const nextYearStandardSalary = getMemberNextYearStandardAnnualSalary(mr.member.rank);
        const salaryDiff = nextYearAnnualSalary - nextYearStandardSalary;
        detailData.push([
          String(i + 1),
          mr.member.name,
          getTeamName(mr.member.teamId),
          RankLabels[mr.member.rank],
          `${getMemberStandardAnnualSalary(mr.member.rank).toLocaleString()}万円`,
          `${mr.currentSalary}万円`,
          mr.evaluation || 'B',
          `${mr.raiseRate}%`,
          `${mr.nextYearSalary}万円`,
          `${nextYearAnnualSalary.toLocaleString()}万円`,
          `${nextYearStandardSalary.toLocaleString()}万円`,
          `${salaryDiff > 0 ? '+' : ''}${salaryDiff.toLocaleString()}万円`,
        ]);
      });

      // 合計行
      detailData.push(['', '', '', '', '', '', '', '', '', '', '', '']);
      detailData.push([
        '',
        '合計',
        '',
        '',
        `${standardSalaryTotal.toLocaleString()}万円`,
        `${result.totalCurrentSalary.toLocaleString()}万円`,
        '',
        '',
        '',
        `${result.totalNextYearSalary.toLocaleString()}万円`,
        `${nextYearStandardSalaryTotal.toLocaleString()}万円`,
        `${result.difference > 0 ? '+' : ''}${result.difference.toLocaleString()}万円`,
      ]);

      const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
      wsDetail['!cols'] = [
        { wch: 5 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 22 },
        { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 18 }, { wch: 22 }, { wch: 15 },
      ];
      XLSX.utils.book_append_sheet(wb, wsDetail, result.pattern.name.slice(0, 31));
    });

    // ダウンロード
    XLSX.writeFile(wb, `予算シミュレーション_FY${currentYear}.xlsx`);
  };

  return (
    <div className="main-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">予算シミュレーション</h1>
          <p className="page-subtitle">評価に応じた昇給率で翌年給与を試算（変更は保存されません）</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="btn-export-excel" onClick={exportToExcel}>
            <Download size={16} />
            Excel出力
          </button>
          <YearSelector />
        </div>
      </div>

      {/* サマリーカード */}
      <div className="sim-summary-cards">
        <div className="sim-summary-card">
          <div className="sim-summary-label">メンバー数</div>
          <div className="sim-summary-value">{members.length}名</div>
        </div>
        <div className="sim-summary-card">
          <div className="sim-summary-label">FY{String(currentYear).slice(2)}標準給与年額（予算）</div>
          <div className="sim-summary-value">{standardSalaryTotal.toLocaleString()}万円</div>
        </div>
        <div className="sim-summary-card">
          <div className="sim-summary-label">FY{String(currentYear + 1).slice(2)}標準給与年額（予算）</div>
          <div className="sim-summary-value highlight">{nextYearStandardSalaryTotal.toLocaleString()}万円</div>
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
          <button className="btn-add-pattern" onClick={addPattern} disabled={patterns.length >= 5}>
            <Plus size={16} />
            パターン追加 ({patterns.length}/5)
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
                <th>コメント</th>
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
                    <input
                      type="text"
                      className="pattern-comment-input"
                      value={pattern.comment}
                      onChange={(e) => updatePatternComment(pattern.id, e.target.value)}
                      placeholder="メモ..."
                    />
                  </td>
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
          <span className="comparison-description">翌年給与合計（シミュレーション） vs FY{String(currentYear + 1).slice(2)}標準給与年額（予算）</span>
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
                <th>翌年給与合計<br/><small>（シミュレーション）</small></th>
                <th>FY{String(currentYear + 1).slice(2)}標準給与<br/><small>（予算）</small></th>
                <th>差額</th>
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
                  <td className="amount highlight-sim">{result.totalNextYearSalary.toLocaleString()}</td>
                  <td className="amount highlight-budget">{nextYearStandardSalaryTotal.toLocaleString()}</td>
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

      {/* メンバー別詳細（全パターン） - 折りたたみ式 */}
      {simulationResults.map((result, patternIndex) => {
        const isExpanded = expandedPatterns[result.pattern.id] || false;
        return (
          <div key={result.pattern.id} className="card member-detail-card">
            <div
              className="card-header collapsible-header"
              onClick={() => togglePatternExpand(result.pattern.id)}
            >
              <h3 className="card-title">
                {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                メンバー別詳細（{result.pattern.name}）
                <span className="pattern-rates-badge">
                  S:{result.pattern.rates['S']}% A:{result.pattern.rates['A']}% B:{result.pattern.rates['B']}% C:{result.pattern.rates['C']}%
                </span>
              </h3>
              <span className={`summary-badge ${result.isWithinBudget ? 'ok' : 'ng'}`}>
                翌年給与: {result.totalNextYearSalary.toLocaleString()}万円 /
                予算: {nextYearStandardSalaryTotal.toLocaleString()}万円
                （{result.difference > 0 ? '+' : ''}{result.difference.toLocaleString()}万円）
              </span>
            </div>
            {isExpanded && (
              <div className="member-detail-table-container">
                <table className="member-detail-table">
                  <thead>
                    <tr>
                      <th>メンバー</th>
                      <th>チーム</th>
                      <th>ランク</th>
                      <th>FY{String(currentYear).slice(2)}標準給与<br/><small>（予算）</small></th>
                      <th>現在給与<br/><small>（月額）</small></th>
                      <th>年度評価</th>
                      <th>昇給率</th>
                      <th>翌年給与<br/><small>（月額）</small></th>
                      <th>翌年給与年額<br/><small>（シミュレーション）</small></th>
                      <th>FY{String(currentYear + 1).slice(2)}標準給与<br/><small>（予算）</small></th>
                      <th>差額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.memberResults.map(mr => {
                      const nextYearAnnualSalary = mr.nextYearSalary * 12;
                      const nextYearStandardSalary = getMemberNextYearStandardAnnualSalary(mr.member.rank);
                      const salaryDiff = nextYearAnnualSalary - nextYearStandardSalary;
                      return (
                        <tr key={mr.member.id}>
                          <td>
                            <div className="member-info-cell">
                              <div className="member-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                                {mr.member.name.charAt(0)}
                              </div>
                              <span>{mr.member.name}</span>
                            </div>
                          </td>
                          <td>{getTeamName(mr.member.teamId)}</td>
                          <td>
                            <span
                              className="rank-badge"
                              style={{ background: `${RankColors[mr.member.rank]}20`, color: RankColors[mr.member.rank] }}
                            >
                              {RankLabels[mr.member.rank]}
                            </span>
                          </td>
                          <td className="amount-cell">
                            {getMemberStandardAnnualSalary(mr.member.rank).toLocaleString()}万円
                          </td>
                          <td className="amount-cell">
                            {patternIndex === 0 ? (
                              <>
                                <input
                                  type="number"
                                  className="salary-input-sim"
                                  value={simulationSalaries[mr.member.id] ?? mr.currentSalary}
                                  onChange={(e) => setSimulationSalaries(prev => ({
                                    ...prev,
                                    [mr.member.id]: Number(e.target.value) || 0
                                  }))}
                                />
                                <span className="unit">万円</span>
                              </>
                            ) : (
                              <>{mr.currentSalary.toLocaleString()}万円</>
                            )}
                          </td>
                          <td>
                            {patternIndex === 0 ? (
                              <select
                                className="eval-select"
                                value={getMemberEvaluation(mr.member.id) || 'B'}
                                onChange={(e) => setSimulationEvaluations(prev => ({
                                  ...prev,
                                  [mr.member.id]: e.target.value as YearlyGrade
                                }))}
                                style={{ color: YearlyGradeColors[mr.evaluation || 'B'] }}
                              >
                                <option value="S">S</option>
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                              </select>
                            ) : (
                              <span style={{ color: YearlyGradeColors[mr.evaluation || 'B'], fontWeight: 600 }}>
                                {mr.evaluation || 'B'}
                              </span>
                            )}
                          </td>
                          <td className="rate-cell">
                            <span className="raise-rate">{mr.raiseRate}%</span>
                          </td>
                          <td className="amount-cell">
                            {mr.nextYearSalary.toLocaleString()}万円
                          </td>
                          <td className="amount-cell highlight-sim">
                            {nextYearAnnualSalary.toLocaleString()}万円
                          </td>
                          <td className="amount-cell highlight-budget">
                            {nextYearStandardSalary.toLocaleString()}万円
                          </td>
                          <td className={`amount-cell ${salaryDiff > 0 ? 'negative' : 'positive'}`}>
                            {salaryDiff > 0 ? '+' : ''}{salaryDiff.toLocaleString()}万円
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="total-row">
                      <td colSpan={3}>合計</td>
                      <td className="amount-cell">
                        {standardSalaryTotal.toLocaleString()}万円
                      </td>
                      <td className="amount-cell">
                        {result.totalCurrentSalary.toLocaleString()}万円
                      </td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td className="amount-cell highlight-sim">
                        {result.totalNextYearSalary.toLocaleString()}万円
                      </td>
                      <td className="amount-cell highlight-budget">
                        {nextYearStandardSalaryTotal.toLocaleString()}万円
                      </td>
                      <td className={`amount-cell ${result.difference > 0 ? 'negative' : 'positive'}`}>
                        {result.difference > 0 ? '+' : ''}{result.difference.toLocaleString()}万円
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
