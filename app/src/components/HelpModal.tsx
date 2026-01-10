import { useState, useEffect } from 'react';
import { X, HelpCircle, Users, Building2, Wallet, Award, FileBarChart, Settings, LayoutDashboard, Calculator, ChevronRight } from 'lucide-react';
import './HelpModal.css';

interface HelpSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const helpSections: HelpSection[] = [
  {
    id: 'dashboard',
    title: 'ダッシュボード',
    icon: <LayoutDashboard size={20} />,
    content: (
      <>
        <p>組織全体のKPI（主要業績指標）を一覧で確認できます。</p>
        <ul>
          <li><strong>総メンバー数:</strong> 登録されている全社員数</li>
          <li><strong>評価完了:</strong> 年度評価が完了した社員数と完了率</li>
          <li><strong>高評価者:</strong> S/A評価を獲得した社員数</li>
          <li><strong>年間総コスト:</strong> 現在の人件費総額（前年比較付き）</li>
        </ul>
        <p>チャートでランク構成、評価分布、チーム別コストを視覚的に把握できます。</p>
      </>
    ),
  },
  {
    id: 'employees',
    title: '社員マスタ',
    icon: <Users size={20} />,
    content: (
      <>
        <p>社員情報の登録・編集・削除を行います。</p>
        <h4>操作方法</h4>
        <ul>
          <li><strong>社員追加:</strong> 「社員追加」ボタンから新規登録</li>
          <li><strong>編集:</strong> 行の編集アイコンをクリック</li>
          <li><strong>削除:</strong> 行の削除アイコンをクリック（確認あり）</li>
          <li><strong>検索:</strong> 検索バーで名前・ランク・チームで絞り込み</li>
        </ul>
        <p>ランクはCONS（コンサルタント）からDIR（ダイレクター）まで5段階です。</p>
      </>
    ),
  },
  {
    id: 'teams',
    title: '組織・チーム',
    icon: <Building2 size={20} />,
    content: (
      <>
        <p>チームの作成と管理を行います。</p>
        <ul>
          <li><strong>チーム作成:</strong> チーム名とカラーを設定して追加</li>
          <li><strong>メンバー割り当て:</strong> 社員マスタから各社員をチームに配置</li>
          <li><strong>チーム編集:</strong> 名前やカラーの変更が可能</li>
        </ul>
        <p>チームカラーはダッシュボードやレポートのグラフに反映されます。</p>
      </>
    ),
  },
  {
    id: 'budget',
    title: '予算管理',
    icon: <Wallet size={20} />,
    content: (
      <>
        <p>社員ごとの単価・給与を管理し、予算を計算します。</p>
        <h4>列の説明</h4>
        <ul>
          <li><strong>単価:</strong> ランク別の月額単価（単価マスタで設定）</li>
          <li><strong>年収:</strong> 年間給与額（入力すると月給を自動計算）</li>
          <li><strong>給与:</strong> 月額給与（直接編集も可能）</li>
          <li><strong>粗利:</strong> 単価 - 給与 の差額</li>
        </ul>
        <p>バッチ倍率を設定すると、給与に乗数を掛けた総コストを算出できます。</p>
      </>
    ),
  },
  {
    id: 'simulation',
    title: '昇給シミュレーション',
    icon: <Calculator size={20} />,
    content: (
      <>
        <p>翌年度の人件費を評価に基づいてシミュレーションします。</p>
        <h4>使い方</h4>
        <ol>
          <li>パターン名を入力（例：標準昇給案）</li>
          <li>各評価（S/A/B/C/D）の昇給率を設定</li>
          <li>「追加」で新パターンを作成</li>
          <li>複数パターンを比較検討</li>
        </ol>
        <p>Excelエクスポートで詳細レポートを出力できます。</p>
      </>
    ),
  },
  {
    id: 'evaluation',
    title: '年度評価',
    icon: <Award size={20} />,
    content: (
      <>
        <p>年度ごとの社員評価を記録します。</p>
        <h4>評価ランク</h4>
        <ul>
          <li><strong>S:</strong> 最高評価（期待を大きく上回る）</li>
          <li><strong>A:</strong> 高評価（期待を上回る）</li>
          <li><strong>B:</strong> 標準（期待通り）</li>
          <li><strong>C:</strong> 要改善（期待を下回る）</li>
          <li><strong>D:</strong> 不可（大幅な改善が必要）</li>
        </ul>
        <p>年度セレクターで過去の評価履歴も確認できます。</p>
      </>
    ),
  },
  {
    id: 'reports',
    title: 'レポート',
    icon: <FileBarChart size={20} />,
    content: (
      <>
        <p>組織データを様々な角度から分析・可視化します。</p>
        <h4>提供レポート</h4>
        <ul>
          <li>ランク構成分布</li>
          <li>年度評価分布</li>
          <li>チーム別人数・コスト</li>
          <li>ランク別コスト分析</li>
        </ul>
        <p>「Excelエクスポート」で全データを一括ダウンロードできます。</p>
      </>
    ),
  },
  {
    id: 'settings',
    title: '設定',
    icon: <Settings size={20} />,
    content: (
      <>
        <p>アプリケーションのデータ管理を行います。</p>
        <h4>機能</h4>
        <ul>
          <li><strong>データエクスポート:</strong> 全データをJSONファイルでバックアップ</li>
          <li><strong>データインポート:</strong> バックアップファイルから復元</li>
          <li><strong>データ削除:</strong> 全データを初期化（復元不可）</li>
        </ul>
        <p className="warning">データ削除は元に戻せません。必ずバックアップを取ってから実行してください。</p>
      </>
    ),
  },
];

export function HelpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [selectedSection, setSelectedSection] = useState<string>('dashboard');

  if (!isOpen) return null;

  const activeSection = helpSections.find((s) => s.id === selectedSection) || helpSections[0];

  return (
    <div className="help-modal-overlay" onClick={onClose}>
      <div className="help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="help-modal-header">
          <div className="help-modal-title">
            <HelpCircle size={24} />
            <h2>ヘルプガイド</h2>
          </div>
          <button className="help-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="help-modal-body">
          <nav className="help-nav">
            {helpSections.map((section) => (
              <button
                key={section.id}
                className={`help-nav-item ${selectedSection === section.id ? 'active' : ''}`}
                onClick={() => setSelectedSection(section.id)}
              >
                {section.icon}
                <span>{section.title}</span>
                <ChevronRight size={16} className="help-nav-arrow" />
              </button>
            ))}
          </nav>

          <div className="help-content">
            <div className="help-content-header">
              {activeSection.icon}
              <h3>{activeSection.title}</h3>
            </div>
            <div className="help-content-body">
              {activeSection.content}
            </div>
          </div>
        </div>

        <div className="help-modal-footer">
          <p>InsightHRM v1.0 - 人材管理システム</p>
          <p>ショートカット: <kbd>⌘K</kbd> で検索、<kbd>?</kbd> でヘルプ</p>
        </div>
      </div>
    </div>
  );
}

export function HelpButton() {
  const [isOpen, setIsOpen] = useState(false);

  // Keyboard shortcut to open help
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <button className="help-button" onClick={() => setIsOpen(true)} title="ヘルプ (?)">
        <HelpCircle size={20} />
      </button>
      <HelpModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
