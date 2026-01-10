import { useState, useRef } from 'react';
import { Download, Upload, Trash2, Database, Shield, Info, AlertTriangle } from 'lucide-react';
import { useToast } from '../components/Toast';
import './Settings.css';

const STORAGE_KEY = 'insight-hrm-data';
const YEARLY_EVAL_KEY = 'insight-hrm-yearly-eval';

export function Settings() {
  const { success, error, warning } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // データエクスポート
  const handleExport = () => {
    try {
      const mainData = localStorage.getItem(STORAGE_KEY);
      const evalData = localStorage.getItem(YEARLY_EVAL_KEY);

      const exportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        appName: 'InsightHRM',
        data: {
          main: mainData ? JSON.parse(mainData) : null,
          yearlyEvaluations: evalData ? JSON.parse(evalData) : null,
        },
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `insight-hrm-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      success('エクスポート完了', 'バックアップファイルをダウンロードしました');
    } catch (e) {
      error('エクスポート失敗', 'データのエクスポートに失敗しました');
    }
  };

  // データインポート
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importData = JSON.parse(event.target?.result as string);

        // バリデーション
        if (!importData.appName || importData.appName !== 'InsightHRM') {
          error('インポート失敗', '無効なバックアップファイルです');
          return;
        }

        if (importData.data?.main) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(importData.data.main));
        }
        if (importData.data?.yearlyEvaluations) {
          localStorage.setItem(YEARLY_EVAL_KEY, JSON.stringify(importData.data.yearlyEvaluations));
        }

        success('インポート完了', 'データを復元しました。ページをリロードしてください。');
        setTimeout(() => window.location.reload(), 1500);
      } catch (e) {
        error('インポート失敗', 'ファイルの読み込みに失敗しました');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // データ削除
  const handleDeleteAll = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(YEARLY_EVAL_KEY);
    warning('データ削除完了', 'すべてのデータを削除しました');
    setShowDeleteConfirm(false);
    setTimeout(() => window.location.reload(), 1500);
  };

  // ストレージ使用量を計算
  const getStorageSize = () => {
    let total = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length * 2; // UTF-16 = 2 bytes per char
      }
    }
    return (total / 1024).toFixed(2);
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">設定</h1>
          <p className="page-subtitle">アプリケーション設定とデータ管理</p>
        </div>
      </div>

      {/* データ管理 */}
      <div className="settings-section">
        <h2 className="settings-section-title">
          <Database size={20} />
          データ管理
        </h2>

        <div className="settings-cards">
          <div className="settings-card">
            <div className="settings-card-icon export">
              <Download size={24} />
            </div>
            <div className="settings-card-content">
              <h3>データエクスポート</h3>
              <p>すべてのデータをJSONファイルとしてダウンロードします。定期的なバックアップに使用してください。</p>
              <button className="btn-primary" onClick={handleExport}>
                <Download size={16} />
                エクスポート
              </button>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-card-icon import">
              <Upload size={24} />
            </div>
            <div className="settings-card-content">
              <h3>データインポート</h3>
              <p>バックアップファイルからデータを復元します。現在のデータは上書きされます。</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
              <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
                <Upload size={16} />
                インポート
              </button>
            </div>
          </div>

          <div className="settings-card danger">
            <div className="settings-card-icon danger">
              <Trash2 size={24} />
            </div>
            <div className="settings-card-content">
              <h3>データ削除</h3>
              <p>すべてのデータを削除します。この操作は取り消せません。</p>
              <button className="btn-danger" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 size={16} />
                すべて削除
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ストレージ情報 */}
      <div className="settings-section">
        <h2 className="settings-section-title">
          <Shield size={20} />
          ストレージ情報
        </h2>

        <div className="storage-info">
          <div className="storage-item">
            <span className="storage-label">使用中のストレージ</span>
            <span className="storage-value">{getStorageSize()} KB</span>
          </div>
          <div className="storage-item">
            <span className="storage-label">データ保存先</span>
            <span className="storage-value">ローカルストレージ (ブラウザ)</span>
          </div>
        </div>

        <div className="info-box">
          <Info size={18} />
          <div>
            <strong>データの保存について</strong>
            <p>データはお使いのブラウザのローカルストレージに保存されます。ブラウザのデータをクリアすると、すべてのデータが失われます。定期的なバックアップをお勧めします。</p>
          </div>
        </div>
      </div>

      {/* アプリ情報 */}
      <div className="settings-section">
        <h2 className="settings-section-title">
          <Info size={20} />
          アプリケーション情報
        </h2>

        <div className="app-info">
          <div className="app-info-row">
            <span>アプリ名</span>
            <span>InsightHRM - メンバ管理・予算管理</span>
          </div>
          <div className="app-info-row">
            <span>バージョン</span>
            <span>1.0.0</span>
          </div>
          <div className="app-info-row">
            <span>ライセンス</span>
            <span>Commercial License</span>
          </div>
        </div>
      </div>

      {/* 削除確認モーダル */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content delete-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm-icon">
              <AlertTriangle size={48} />
            </div>
            <h3>すべてのデータを削除しますか？</h3>
            <p>この操作は取り消せません。すべてのメンバー、チーム、予算データが完全に削除されます。</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                キャンセル
              </button>
              <button className="btn-danger" onClick={handleDeleteAll}>
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
