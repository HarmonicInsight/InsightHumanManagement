import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { YearSelector } from '../components/YearSelector';
import { RankLabels, RankColors } from '../types';
import type { Rank } from '../types';
import './UnitPriceMaster.css';

const RANKS: Rank[] = ['SMGR', 'MGR', 'Scon', 'CONS'];

export function UnitPriceMaster() {
  const {
    currentYear,
    budget,
    initializeBudget,
    updateRankUnitPrices,
  } = useApp();

  useEffect(() => {
    if (!budget) {
      initializeBudget();
    }
  }, [budget, initializeBudget]);

  if (!budget) {
    return <div className="main-content">読み込み中...</div>;
  }

  const rankUnitPrices = budget.rankUnitPrices;

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

  // 年間合計
  const totalAnnual = RANKS.reduce((sum, rank) => sum + getUnitPrice(rank) * 12, 0);

  return (
    <div className="main-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">単価マスタ</h1>
          <p className="page-subtitle">ランク別の標準単価を年度ごとに管理</p>
        </div>
        <YearSelector />
      </div>

      {/* 年度表示 */}
      <div className="year-info-banner">
        <span className="year-badge">FY{String(currentYear).slice(2)}</span>
        <span className="year-info-text">
          {currentYear}年度の単価設定
        </span>
      </div>

      {/* 単価マスタカード */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">ランク別単価（月額）</h3>
          <span className="card-subtitle">※変更は自動保存されます</span>
        </div>
        <div className="unit-price-master-grid">
          {RANKS.map((rank) => {
            const unitPrice = getUnitPrice(rank);
            const annual = unitPrice * 12;
            return (
              <div key={rank} className="unit-price-master-item" style={{ borderLeftColor: RankColors[rank] }}>
                <div className="unit-price-master-header">
                  <span className="rank-badge" style={{ background: `${RankColors[rank]}20`, color: RankColors[rank] }}>
                    {RankLabels[rank]}
                  </span>
                </div>
                <div className="unit-price-master-body">
                  <div className="unit-price-input-group">
                    <label>月額単価</label>
                    <div className="unit-price-input">
                      <input
                        type="number"
                        value={unitPrice || ''}
                        onChange={(e) => handleUnitPriceChange(rank, e.target.value)}
                        placeholder="0"
                      />
                      <span className="unit">万円</span>
                    </div>
                  </div>
                  <div className="unit-price-annual">
                    <span className="annual-label">年間</span>
                    <span className="annual-value">{annual.toLocaleString()}万円</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* サマリー */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">単価サマリー</h3>
        </div>
        <div className="unit-price-summary">
          <table className="summary-table">
            <thead>
              <tr>
                <th>ランク</th>
                <th>月額単価</th>
                <th>年間単価</th>
              </tr>
            </thead>
            <tbody>
              {RANKS.map((rank) => {
                const unitPrice = getUnitPrice(rank);
                return (
                  <tr key={rank}>
                    <td>
                      <span
                        className="rank-badge"
                        style={{ background: `${RankColors[rank]}20`, color: RankColors[rank] }}
                      >
                        {RankLabels[rank]}
                      </span>
                    </td>
                    <td className="price-cell">{unitPrice.toLocaleString()}万円</td>
                    <td className="price-cell">{(unitPrice * 12).toLocaleString()}万円</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td className="footer-label">合計（全ランク）</td>
                <td className="footer-value">
                  {RANKS.reduce((sum, rank) => sum + getUnitPrice(rank), 0).toLocaleString()}万円
                </td>
                <td className="footer-value">{totalAnnual.toLocaleString()}万円</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
