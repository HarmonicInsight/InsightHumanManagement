import { useState } from 'react';
import { Calendar, Plus, Copy, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import './YearSelector.css';

export function YearSelector() {
  const { currentYear, setCurrentYear, years, addYear, deleteYear, copyYearData } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [newYear, setNewYear] = useState(new Date().getFullYear());
  const [copyFrom, setCopyFrom] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const handleAddYear = () => {
    if (copyFrom) {
      copyYearData(copyFrom, newYear);
    } else {
      addYear(newYear);
    }
    setShowModal(false);
    setCopyFrom(null);
  };

  const handleDeleteYear = (year: number) => {
    deleteYear(year);
    setShowDeleteConfirm(null);
  };

  return (
    <>
      <div className="year-selector">
        <Calendar size={16} />
        <select
          value={currentYear}
          onChange={(e) => setCurrentYear(Number(e.target.value))}
          className="year-select"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}年度
            </option>
          ))}
        </select>
        <button className="year-add-btn" onClick={() => setShowModal(true)} title="年度を追加">
          <Plus size={16} />
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">年度を追加</h3>

            <div className="form-group">
              <label>年度</label>
              <input
                type="number"
                value={newYear}
                onChange={(e) => setNewYear(Number(e.target.value))}
                min={2000}
                max={2100}
              />
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={copyFrom !== null}
                  onChange={(e) => setCopyFrom(e.target.checked ? currentYear : null)}
                />
                <Copy size={14} style={{ marginLeft: 8, marginRight: 4 }} />
                既存データをコピー
              </label>
              {copyFrom !== null && (
                <select
                  value={copyFrom}
                  onChange={(e) => setCopyFrom(Number(e.target.value))}
                  style={{ marginTop: 8 }}
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}年度からコピー
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>
                キャンセル
              </button>
              <button className="btn-primary" onClick={handleAddYear}>
                追加
              </button>
            </div>

            {/* 年度削除セクション */}
            {years.length > 1 && (
              <div className="year-delete-section">
                <div className="section-divider" />
                <label>年度を削除</label>
                <div className="year-delete-list">
                  {years.map((year) => (
                    <div key={year} className="year-delete-item">
                      <span>{year}年度</span>
                      {showDeleteConfirm === year ? (
                        <div className="delete-confirm">
                          <span>削除しますか？</span>
                          <button className="btn-danger-small" onClick={() => handleDeleteYear(year)}>
                            削除
                          </button>
                          <button className="btn-cancel-small" onClick={() => setShowDeleteConfirm(null)}>
                            取消
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn-delete-year"
                          onClick={() => setShowDeleteConfirm(year)}
                          disabled={years.length <= 1}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
