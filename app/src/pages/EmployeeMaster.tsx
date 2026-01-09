import { useState, useRef } from 'react';
import { Plus, Edit2, Trash2, Search, UserCheck, UserX, UserPlus as UserPlusIcon, Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { YearSelector } from '../components/YearSelector';
import { RankLabels, RankColors } from '../types';
import type { Rank, Member, EmployeeStatus, Evaluation, Skills } from '../types';
import './EmployeeMaster.css';

const RANKS: Rank[] = ['SMGR', 'MGR', 'Scon', 'CONS'];
const STATUS_OPTIONS: { value: EmployeeStatus; label: string }[] = [
  { value: 'active', label: '在籍' },
  { value: 'inactive', label: '退職' },
  { value: 'planned', label: '入社予定' },
];

// JOBRANKの変換マップ
const JOBRANK_MAP: Record<string, Rank> = {
  'シニアマネージャー': 'SMGR',
  'SMGR': 'SMGR',
  'マネージャー': 'MGR',
  'MGR': 'MGR',
  'シニアコンサルタント': 'Scon',
  'Scon': 'Scon',
  'コンサルタント': 'CONS',
  'CONS': 'CONS',
};

const REVERSE_JOBRANK_MAP: Record<Rank, string> = {
  'SMGR': 'シニアマネージャー',
  'MGR': 'マネージャー',
  'Scon': 'シニアコンサルタント',
  'CONS': 'コンサルタント',
};

const STATUS_MAP: Record<string, EmployeeStatus> = {
  '在籍': 'active',
  '退職': 'inactive',
  '入社予定': 'planned',
  'active': 'active',
  'inactive': 'inactive',
  'planned': 'planned',
};

const REVERSE_STATUS_MAP: Record<EmployeeStatus, string> = {
  'active': '在籍',
  'inactive': '退職',
  'planned': '入社予定',
};

const emptyEvaluation: Evaluation = {
  grade: null,
  score: null,
  summary: '',
  comment: '',
};

const emptySkills: Skills = {
  consulting: null,
  construction: null,
  it: null,
  sales: null,
  management: null,
  responsibility: null,
  independence: null,
};

export function EmployeeMaster() {
  const { members, addMember, updateMember, deleteMember, currentYear } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | 'all'>('all');
  const [rankFilter, setRankFilter] = useState<Rank | 'all'>('all');
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<Member>>({
    name: '',
    rank: 'CONS',
    status: 'active',
    joinDate: '',
    leaveDate: '',
    email: '',
    department: '',
  });

  const filteredMembers = members.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || (m.status || 'active') === statusFilter;
    const matchesRank = rankFilter === 'all' || m.rank === rankFilter;
    return matchesSearch && matchesStatus && matchesRank;
  });

  const statusCounts = {
    all: members.length,
    active: members.filter((m) => (m.status || 'active') === 'active').length,
    inactive: members.filter((m) => m.status === 'inactive').length,
    planned: members.filter((m) => m.status === 'planned').length,
  };

  const openAddModal = () => {
    setFormData({
      name: '',
      rank: 'CONS',
      status: 'active',
      joinDate: '',
      leaveDate: '',
      email: '',
      department: '',
    });
    setIsAddingNew(true);
  };

  const openEditModal = (member: Member) => {
    setFormData({
      name: member.name,
      rank: member.rank,
      status: member.status || 'active',
      joinDate: member.joinDate || '',
      leaveDate: member.leaveDate || '',
      email: member.email || '',
      department: member.department || '',
    });
    setEditingMember(member);
  };

  const closeModal = () => {
    setEditingMember(null);
    setIsAddingNew(false);
    setFormData({
      name: '',
      rank: 'CONS',
      status: 'active',
      joinDate: '',
      leaveDate: '',
      email: '',
      department: '',
    });
  };

  const handleSave = () => {
    if (!formData.name?.trim()) return;

    if (editingMember) {
      updateMember({
        ...editingMember,
        name: formData.name!,
        rank: formData.rank as Rank,
        status: formData.status as EmployeeStatus,
        joinDate: formData.joinDate || undefined,
        leaveDate: formData.leaveDate || undefined,
        email: formData.email || undefined,
        department: formData.department || undefined,
      });
    } else {
      addMember({
        name: formData.name!,
        rank: formData.rank as Rank,
        teamId: null,
        evaluation: emptyEvaluation,
        skills: emptySkills,
        status: formData.status as EmployeeStatus,
        joinDate: formData.joinDate || undefined,
        leaveDate: formData.leaveDate || undefined,
        email: formData.email || undefined,
        department: formData.department || undefined,
      });
    }
    closeModal();
  };

  const handleDelete = (member: Member) => {
    if (confirm(`${member.name}さんを削除しますか？\n関連するすべてのデータ（評価、スキル、予算）も削除されます。`)) {
      deleteMember(member.id);
    }
  };

  // インポート処理
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];

        let successCount = 0;
        const errors: string[] = [];

        jsonData.forEach((row, index) => {
          const rowNum = index + 2; // ヘッダー行を考慮
          const name = String(row['氏名'] || row['名前'] || row['社員名'] || '').trim();

          if (!name) {
            errors.push(`行${rowNum}: 氏名が空です`);
            return;
          }

          // JOBRANK変換
          const jobrankRaw = String(row['JOBRANK'] || row['ランク'] || row['役職'] || 'CONS').trim();
          const rank = JOBRANK_MAP[jobrankRaw] || 'CONS';

          // ステータス変換
          const statusRaw = String(row['ステータス'] || row['status'] || '在籍').trim();
          const status = STATUS_MAP[statusRaw] || 'active';

          // 日付処理
          let joinDate = '';
          let leaveDate = '';

          const joinDateRaw = row['入社日'] || row['入社年月日'];
          if (joinDateRaw) {
            if (typeof joinDateRaw === 'number') {
              // Excel serial date
              const date = XLSX.SSF.parse_date_code(joinDateRaw);
              joinDate = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
            } else {
              joinDate = String(joinDateRaw);
            }
          }

          const leaveDateRaw = row['退社日'] || row['退職日'];
          if (leaveDateRaw) {
            if (typeof leaveDateRaw === 'number') {
              const date = XLSX.SSF.parse_date_code(leaveDateRaw);
              leaveDate = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
            } else {
              leaveDate = String(leaveDateRaw);
            }
          }

          const email = String(row['メール'] || row['メールアドレス'] || row['email'] || '').trim();
          const department = String(row['部署'] || row['所属'] || '').trim();

          // 既存社員との重複チェック（名前で判定）
          const existingMember = members.find((m) => m.name === name);

          if (existingMember) {
            // 既存社員を更新
            updateMember({
              ...existingMember,
              rank,
              status,
              joinDate: joinDate || existingMember.joinDate,
              leaveDate: leaveDate || existingMember.leaveDate,
              email: email || existingMember.email,
              department: department || existingMember.department,
            });
          } else {
            // 新規社員を追加
            addMember({
              name,
              rank,
              teamId: null,
              evaluation: emptyEvaluation,
              skills: emptySkills,
              status,
              joinDate: joinDate || undefined,
              leaveDate: leaveDate || undefined,
              email: email || undefined,
              department: department || undefined,
            });
          }
          successCount++;
        });

        setImportResult({ success: successCount, errors });
        setTimeout(() => setImportResult(null), 5000);
      } catch (error) {
        console.error('Import error:', error);
        setImportResult({ success: 0, errors: ['ファイルの読み込みに失敗しました'] });
        setTimeout(() => setImportResult(null), 5000);
      }
    };
    reader.readAsArrayBuffer(file);

    // ファイル入力をリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // エクスポート処理
  const handleExport = () => {
    const exportData = members.map((member) => ({
      '氏名': member.name,
      'JOBRANK': REVERSE_JOBRANK_MAP[member.rank] || member.rank,
      'ステータス': REVERSE_STATUS_MAP[member.status || 'active'],
      '入社日': member.joinDate || '',
      '退社日': member.leaveDate || '',
      'メール': member.email || '',
      '部署': member.department || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // 列幅を設定
    worksheet['!cols'] = [
      { wch: 15 }, // 氏名
      { wch: 18 }, // JOBRANK
      { wch: 10 }, // ステータス
      { wch: 12 }, // 入社日
      { wch: 12 }, // 退社日
      { wch: 25 }, // メール
      { wch: 20 }, // 部署
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '社員マスタ');

    // ファイル名に年度を含める
    const fileName = `社員マスタ_${currentYear}年度_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const getStatusIcon = (status: EmployeeStatus | undefined) => {
    switch (status) {
      case 'inactive':
        return <UserX size={14} className="status-icon inactive" />;
      case 'planned':
        return <UserPlusIcon size={14} className="status-icon planned" />;
      default:
        return <UserCheck size={14} className="status-icon active" />;
    }
  };

  const getStatusLabel = (status: EmployeeStatus | undefined) => {
    switch (status) {
      case 'inactive':
        return '退職';
      case 'planned':
        return '入社予定';
      default:
        return '在籍';
    }
  };

  return (
    <div className="main-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">社員マスタ（{currentYear}年度）</h1>
          <p className="page-subtitle">この年度の社員一覧です。年度を切り替えると別のデータになります。</p>
        </div>
        <YearSelector />
      </div>

      {/* 年度別データの説明 */}
      <div className="year-info-banner">
        <span className="year-badge">{currentYear}年度</span>
        <span className="year-info-text">
          社員の追加・削除はこの年度のみに反映されます。他の年度には影響しません。
        </span>
      </div>

      {/* インポート結果の通知 */}
      {importResult && (
        <div className={`import-result ${importResult.errors.length > 0 ? 'has-errors' : 'success'}`}>
          <div className="import-result-content">
            <strong>{importResult.success}件</strong>のデータをインポートしました。
            {importResult.errors.length > 0 && (
              <div className="import-errors">
                {importResult.errors.slice(0, 3).map((err, i) => (
                  <div key={i}>{err}</div>
                ))}
                {importResult.errors.length > 3 && (
                  <div>他 {importResult.errors.length - 3} 件のエラー</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 統計カード */}
      <div className="stats-grid">
        <div
          className={`stat-card clickable ${statusFilter === 'all' ? 'selected' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          <div className="stat-label">全社員</div>
          <div className="stat-value">{statusCounts.all}名</div>
        </div>
        <div
          className={`stat-card clickable ${statusFilter === 'active' ? 'selected' : ''}`}
          onClick={() => setStatusFilter('active')}
        >
          <div className="stat-label">在籍</div>
          <div className="stat-value">{statusCounts.active}名</div>
          <div className="stat-icon">
            <UserCheck size={24} color="#10B981" />
          </div>
        </div>
        <div
          className={`stat-card clickable ${statusFilter === 'planned' ? 'selected' : ''}`}
          onClick={() => setStatusFilter('planned')}
        >
          <div className="stat-label">入社予定</div>
          <div className="stat-value">{statusCounts.planned}名</div>
          <div className="stat-icon">
            <UserPlusIcon size={24} color="#3B82F6" />
          </div>
        </div>
        <div
          className={`stat-card clickable ${statusFilter === 'inactive' ? 'selected' : ''}`}
          onClick={() => setStatusFilter('inactive')}
        >
          <div className="stat-label">退職</div>
          <div className="stat-value">{statusCounts.inactive}名</div>
          <div className="stat-icon">
            <UserX size={24} color="#6B7280" />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="名前・メールで検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={rankFilter}
            onChange={(e) => setRankFilter(e.target.value as Rank | 'all')}
          >
            <option value="all">全ランク</option>
            {RANKS.map((r) => (
              <option key={r} value={r}>{RankLabels[r]}</option>
            ))}
          </select>

          <div className="action-group" style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
            <button
              className="btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              title="Excelファイルをインポート"
            >
              <Upload size={16} style={{ marginRight: 4 }} />
              インポート
            </button>
            <button
              className="btn-secondary"
              onClick={handleExport}
              title="Excelファイルにエクスポート"
            >
              <Download size={16} style={{ marginRight: 4 }} />
              エクスポート
            </button>
            <button className="btn-primary" onClick={openAddModal}>
              <Plus size={16} style={{ marginRight: 4 }} />
              社員追加
            </button>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>社員名</th>
              <th>ランク</th>
              <th>ステータス</th>
              <th>入社日</th>
              <th>メール</th>
              <th>部署</th>
              <th style={{ width: 80 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-row">
                  該当する社員がいません
                </td>
              </tr>
            ) : (
              filteredMembers.map((member) => (
                <tr key={member.id} className={(member.status || 'active') === 'inactive' ? 'inactive-row' : ''}>
                  <td>
                    <div className="member-info">
                      <div className="member-avatar">{member.name.charAt(0)}</div>
                      <div className="member-name">{member.name}</div>
                    </div>
                  </td>
                  <td>
                    <span
                      className="rank-badge"
                      style={{ background: `${RankColors[member.rank]}20`, color: RankColors[member.rank] }}
                    >
                      {RankLabels[member.rank]}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${member.status || 'active'}`}>
                      {getStatusIcon(member.status)}
                      {getStatusLabel(member.status)}
                    </span>
                  </td>
                  <td>{member.joinDate || '-'}</td>
                  <td>{member.email || '-'}</td>
                  <td>{member.department || '-'}</td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => openEditModal(member)} title="編集">
                        <Edit2 size={14} />
                      </button>
                      <button className="delete" onClick={() => handleDelete(member)} title="削除">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 追加・編集モーダル */}
      {(editingMember || isAddingNew) && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">{editingMember ? '社員編集' : '社員追加'}</h3>

            <div className="form-group">
              <label>名前 *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                placeholder="氏名を入力"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>ランク</label>
                <select
                  value={formData.rank}
                  onChange={(e) => setFormData((f) => ({ ...f, rank: e.target.value as Rank }))}
                >
                  {RANKS.map((r) => (
                    <option key={r} value={r}>{RankLabels[r]}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>ステータス</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData((f) => ({ ...f, status: e.target.value as EmployeeStatus }))}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>入社日</label>
                <input
                  type="date"
                  value={formData.joinDate || ''}
                  onChange={(e) => setFormData((f) => ({ ...f, joinDate: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>退社日</label>
                <input
                  type="date"
                  value={formData.leaveDate || ''}
                  onChange={(e) => setFormData((f) => ({ ...f, leaveDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group">
              <label>メールアドレス</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                placeholder="example@company.com"
              />
            </div>

            <div className="form-group">
              <label>部署</label>
              <input
                type="text"
                value={formData.department || ''}
                onChange={(e) => setFormData((f) => ({ ...f, department: e.target.value }))}
                placeholder="例: コンサルティング部"
              />
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={closeModal}>
                キャンセル
              </button>
              <button className="btn-primary" onClick={handleSave}>
                {editingMember ? '保存' : '追加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
