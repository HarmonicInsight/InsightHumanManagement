import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { RankLabels, DefaultRankUnitPrices } from '../types';
import type { Rank } from '../types';
import './UnitPriceMaster.css';

const RANKS: Rank[] = ['DIR', 'SMGR', 'MGR', 'Scon', 'CONS'];
const RANK_SHORT_LABELS: Record<Rank, string> = {
  'DIR': 'D',
  'SMGR': 'SM',
  'MGR': 'M',
  'Scon': 'SC',
  'CONS': 'C',
};

export function UnitPriceMaster() {
  const {
    years,
    getBudgetByYear,
    updateRankUnitPricesByYear,
    initializeBudget,
    budget,
  } = useApp();

  useEffect(() => {
    if (!budget) {
      initializeBudget();
    }
  }, [budget, initializeBudget]);

  // 年度を降順にソート（新しい年度が左）
  const sortedYears = [...years].sort((a, b) => b - a);

  const getUnitPrice = (year: number, rank: Rank): number => {
    const budgetData = getBudgetByYear(year);
    if (!budgetData) return 0;
    const price = budgetData.rankUnitPrices.find((p) => p.rank === rank);
    return price?.unitPrice || 0;
  };

  const handleUnitPriceChange = (year: number, rank: Rank, value: string) => {
    const budgetData = getBudgetByYear(year);
    const currentPrices = budgetData?.rankUnitPrices || [...DefaultRankUnitPrices];
    const newPrice = Number(value) || 0;
    const updated = currentPrices.map((p) =>
      p.rank === rank ? { ...p, unitPrice: newPrice } : p
    );
    updateRankUnitPricesByYear(year, updated);
  };

  // 年間コスト計算
  const getYearlyTotal = (year: number): number => {
    return RANKS.reduce((sum, rank) => sum + getUnitPrice(year, rank) * 12, 0);
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">単価マスタ</h1>
        <p className="page-subtitle">ランク別の標準単価を年度ごとに管理</p>
      </div>

      {/* 単価テーブル */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">ランク別月額単価（万円）</h3>
        </div>
        <div className="unit-price-table-container">
          <table className="unit-price-table">
            <thead>
              <tr>
                <th className="rank-header">ランク</th>
                {sortedYears.map((year) => (
                  <th key={year} className="year-header">
                    <span className="year-label">FY{String(year).slice(2)}</span>
                    <span className="year-sublabel">月額</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RANKS.map((rank) => (
                <tr key={rank}>
                  <td className="rank-cell">
                    <span className="rank-short">{RANK_SHORT_LABELS[rank]}</span>
                    <span className="rank-full">{RankLabels[rank]}</span>
                  </td>
                  {sortedYears.map((year) => (
                    <td key={year} className="price-cell">
                      <input
                        type="number"
                        className="price-input"
                        value={getUnitPrice(year, rank) || ''}
                        onChange={(e) => handleUnitPriceChange(year, rank, e.target.value)}
                        placeholder="0"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td className="rank-cell">
                  <span className="rank-short">合計</span>
                  <span className="rank-full">年間コスト</span>
                </td>
                {sortedYears.map((year) => (
                  <td key={year} className="total-cell">
                    {getYearlyTotal(year).toLocaleString()}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 説明 */}
      <div className="info-note">
        <p>※ 単価は万円単位で入力してください</p>
        <p>※ 変更は自動保存されます</p>
      </div>
    </div>
  );
}
