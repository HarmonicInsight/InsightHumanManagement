import { useState, useRef } from 'react';
import { Plus, Edit2, Trash2, Search, UserCheck, UserX, UserPlus as UserPlusIcon, Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { YearSelector } from '../components/YearSelector';
import { RankLabels, RankColors } from '../types';
import type { Rank, Member, EmployeeStatus, Evaluation, Skills, Gender } from '../types';
import './EmployeeMaster.css';

const RANKS: Rank[] = ['DIR', 'SMGR', 'MGR', 'Scon', 'CONS'];
const STATUS_OPTIONS: { value: EmployeeStatus; label: string }[] = [
  { value: 'active', label: '在籍' },
  { value: 'inactive', label: '退職' },
  { value: 'planned', label: '入社予定' },
];

// JOBRANKの変換マップ (BCON形式も対応)
const JOBRANK_MAP: Record<string, Rank> = {
  // ダイレクター
  'ダイレクター': 'DIR',
  'DIR': 'DIR',
  'BCON07': 'DIR',
  'BCON08': 'DIR',
  'BCON09': 'DIR',
  // シニアマネージャー
  'シニアマネージャー': 'SMGR',
  'SMGR': 'SMGR',
  'BCON06': 'SMGR',
  // マネージャー
  'マネージャー': 'MGR',
  'MGR': 'MGR',
  'BCON05': 'MGR',
  // シニアコンサルタント
  'シニアコンサルタント': 'Scon',
  'Scon': 'Scon',
  'BCON04': 'Scon',
  // コンサルタント
  'コンサルタント': 'CONS',
  'CONS': 'CONS',
  'BCON03': 'CONS',
  'BCON02': 'CONS',
  'BCON01': 'CONS',
};

// BCONコードへの逆変換
const REVERSE_JOBRANK_MAP: Record<Rank, string> = {
  'DIR': 'BCON07',
  'SMGR': 'BCON06',
  'MGR': 'BCON05',
  'Scon': 'BCON04',
  'CONS': 'BCON03',
};

const STATUS_MAP: Record<string, EmployeeStatus> = {
  '在籍': 'active',
  '退職': 'inactive',
  '入社予定': 'planned',
  'active': 'active',
  'inactive': 'inactive',
  'planned': 'planned',
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
  const { members, teams, addMember, updateMember, deleteMember, currentYear } = useApp();
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
    employeeCode: '',
    account: '',
    nameJp: '',
    nameEn: '',
    gender: null,
    birthYear: undefined,
    joinDate: '',
    leaveDate: '',
    email: '',
    department: '',
  });

  const filteredMembers = members.filter((m) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      m.name.toLowerCase().includes(searchLower) ||
      (m.nameJp?.toLowerCase().includes(searchLower)) ||
      (m.nameEn?.toLowerCase().includes(searchLower)) ||
      (m.employeeCode?.toLowerCase().includes(searchLower)) ||
      (m.account?.toLowerCase().includes(searchLower)) ||
      (m.email?.toLowerCase().includes(searchLower));
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
      employeeCode: '',
      account: '',
      nameJp: '',
      nameEn: '',
      gender: null,
      birthYear: undefined,
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
      employeeCode: member.employeeCode || '',
      account: member.account || '',
      nameJp: member.nameJp || '',
      nameEn: member.nameEn || '',
      gender: member.gender || null,
      birthYear: member.birthYear,
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
      employeeCode: '',
      account: '',
      nameJp: '',
      nameEn: '',
      gender: null,
      birthYear: undefined,
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
        employeeCode: formData.employeeCode || undefined,
        account: formData.account || undefined,
        nameJp: formData.nameJp || undefined,
        nameEn: formData.nameEn || undefined,
        gender: formData.gender || undefined,
        birthYear: formData.birthYear || undefined,
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
        employeeCode: formData.employeeCode || undefined,
        account: formData.account || undefined,
        nameJp: formData.nameJp || undefined,
        nameEn: formData.nameEn || undefined,
        gender: formData.gender || undefined,
        birthYear: formData.birthYear || undefined,
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

  // インポート処理 (新Excelフォーマット対応)
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
        // 同一インポート内での重複を防ぐためのSet
        const processedCodes = new Set<string>();
        const processedNames = new Set<string>();

        jsonData.forEach((row, index) => {
          const rowNum = index + 2; // ヘッダー行を考慮

          // 新フォーマット: Fullname_VN を主な名前として使用
          const nameVn = String(row['Fullname_VN'] || '').trim();
          const nameJp = String(row['Fullname_JP'] || row['氏名'] || row['名前'] || row['社員名'] || '').trim();
          const nameEn = String(row['Fullname'] || row['英語名'] || '').trim();

          // 名前はベトナム語名を優先
          const name = nameVn || nameJp || nameEn;

          if (!name) {
            errors.push(`行${rowNum}: 氏名が空です`);
            return;
          }

          // 社員コードとアカウント
          const employeeCode = String(row['EmployeeCode'] || row['社員コード'] || '').trim();

          // 同一インポート内での重複チェック
          if (employeeCode && processedCodes.has(employeeCode)) {
            // 既にこのインポートで処理済み、スキップ
            return;
          }
          if (!employeeCode && processedNames.has(name)) {
            // 社員コードがなく、同名が既に処理済み、スキップ
            return;
          }

          const account = String(row['Account'] || row['アカウント'] || '').trim();

          // JOBRANK変換 (BCON形式対応)
          const jobrankRaw = String(row['JobRank'] || row['JOBRANK'] || row['ランク'] || row['役職'] || 'BCON04').trim();
          const rank = JOBRANK_MAP[jobrankRaw] || 'CONS';

          // 性別
          const sexRaw = String(row['Sex'] || row['性別'] || '').trim().toUpperCase();
          const gender: Gender = sexRaw === 'M' ? 'M' : sexRaw === 'F' ? 'F' : null;

          // 生年
          const birthdayRaw = row['Birthday'] || row['生年'];
          let birthYear: number | undefined;
          if (birthdayRaw) {
            const parsed = Number(birthdayRaw);
            if (!isNaN(parsed) && parsed > 1900 && parsed < 2100) {
              birthYear = parsed;
            }
          }

          // ステータス変換
          const statusRaw = String(row['ステータス'] || row['status'] || '在籍').trim();
          const status = STATUS_MAP[statusRaw] || 'active';

          // 日付処理 (FJPJoinedDate対応)
          let joinDate = '';
          let leaveDate = '';

          const joinDateRaw = row['FJPJoinedDate'] || row['入社日'] || row['入社年月日'];
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

          // チーム紐づけ（Team列からチーム名を取得してマッチング）
          const teamNameRaw = String(row['Team'] || row['チーム'] || '').trim();
          // 全角・半角を正規化して比較
          const normalizeStr = (s: string) => s
            .replace(/[Ａ-Ｚａ-ｚ０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
            .replace(/　/g, ' ')
            .toLowerCase()
            .trim();
          const teamNameNorm = normalizeStr(teamNameRaw);
          let teamId: string | null = null;
          if (teamNameNorm) {
            const matchedTeam = teams.find(t => {
              const tNameNorm = normalizeStr(t.name);
              return tNameNorm === teamNameNorm ||
                     tNameNorm.includes(teamNameNorm) ||
                     teamNameNorm.includes(tNameNorm);
            });
            if (matchedTeam) {
              teamId = matchedTeam.id;
            }
          }

          // 既存社員との重複チェック（社員コードまたは名前で判定）
          const existingMember = employeeCode
            ? members.find((m) => m.employeeCode === employeeCode)
            : members.find((m) => m.name === name || m.nameJp === name);

          if (existingMember) {
            // 既存社員を更新
            updateMember({
              ...existingMember,
              name,
              rank,
              status,
              teamId: teamId ?? existingMember.teamId,
              employeeCode: employeeCode || existingMember.employeeCode,
              account: account || existingMember.account,
              nameJp: nameJp || existingMember.nameJp,
              nameEn: nameEn || existingMember.nameEn,
              gender: gender ?? existingMember.gender,
              birthYear: birthYear || existingMember.birthYear,
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
              teamId,
              evaluation: emptyEvaluation,
              skills: emptySkills,
              status,
              employeeCode: employeeCode || undefined,
              account: account || undefined,
              nameJp: nameJp || undefined,
              nameEn: nameEn || undefined,
              gender: gender || undefined,
              birthYear: birthYear || undefined,
              joinDate: joinDate || undefined,
              leaveDate: leaveDate || undefined,
              email: email || undefined,
              department: department || undefined,
            });
          }

          // 処理済みとしてマーク（同一インポート内での重複防止）
          if (employeeCode) {
            processedCodes.add(employeeCode);
          }
          processedNames.add(name);

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

  // エクスポート処理 (新フォーマット対応)
  const handleExport = () => {
    const exportData = members.map((member, index) => {
      // チーム名を取得
      const team = teams.find(t => t.id === member.teamId);
      const teamName = team?.name || '';
      return {
        'No': index + 1,
        'EmployeeCode': member.employeeCode || '',
        'Fullname': member.nameEn || '',
        'Account': member.account || '',
        'Fullname_JP': member.nameJp || '',
        'Fullname_VN': member.name || '',
        'JobRank': REVERSE_JOBRANK_MAP[member.rank] || member.rank,
        'Sex': member.gender || '',
        'Birthday': member.birthYear || '',
        'FJPJoinedDate': member.joinDate || '',
        'Team': teamName,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // 列幅を設定
    worksheet['!cols'] = [
      { wch: 5 },  // No
      { wch: 14 }, // EmployeeCode
      { wch: 25 }, // Fullname
      { wch: 15 }, // Account
      { wch: 15 }, // Fullname_JP
      { wch: 20 }, // Fullname_VN
      { wch: 10 }, // JobRank
      { wch: 5 },  // Sex
      { wch: 8 },  // Birthday
      { wch: 12 }, // FJPJoinedDate
      { wch: 15 }, // Team
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'EmployeeList');

    // ファイル名に日時を含める
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const fileName = `EmployeeList_${timestamp}.xlsx`;
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

        <table className="table" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th style={{ width: 85 }}>社員コード</th>
              <th style={{ width: 160 }}>氏名</th>
              <th style={{ width: 100 }}>Account</th>
              <th style={{ width: 110 }}>ランク</th>
              <th style={{ width: 45 }}>性別</th>
              <th style={{ width: 55 }}>生年</th>
              <th style={{ width: 95 }}>入社日</th>
              <th style={{ width: 80 }}>ステータス</th>
              <th style={{ width: 65 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={9} className="empty-row">
                  該当する社員がいません
                </td>
              </tr>
            ) : (
              filteredMembers.map((member) => (
                <tr key={member.id} className={(member.status || 'active') === 'inactive' ? 'inactive-row' : ''}>
                  <td className="code-cell">{member.employeeCode || '-'}</td>
                  <td>
                    <div className="member-info">
                      <div className="member-avatar">{member.name.charAt(0)}</div>
                      <div className="member-name-cell">
                        <div className="member-name">{member.name}</div>
                        {member.nameEn && member.nameEn !== member.name && (
                          <div className="member-name-en">{member.nameEn}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="account-cell">{member.account || '-'}</td>
                  <td>
                    <span
                      className="rank-badge"
                      style={{ background: `${RankColors[member.rank]}20`, color: RankColors[member.rank] }}
                    >
                      {RankLabels[member.rank]}
                    </span>
                  </td>
                  <td className="center-cell">{member.gender || '-'}</td>
                  <td className="center-cell">{member.birthYear || '-'}</td>
                  <td>{member.joinDate || '-'}</td>
                  <td>
                    <span className={`status-badge ${member.status || 'active'}`}>
                      {getStatusIcon(member.status)}
                      {getStatusLabel(member.status)}
                    </span>
                  </td>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>社員コード</label>
                <input
                  type="text"
                  value={formData.employeeCode || ''}
                  onChange={(e) => setFormData((f) => ({ ...f, employeeCode: e.target.value }))}
                  placeholder="例: EMP001"
                />
              </div>
              <div className="form-group">
                <label>Account</label>
                <input
                  type="text"
                  value={formData.account || ''}
                  onChange={(e) => setFormData((f) => ({ ...f, account: e.target.value }))}
                  placeholder="例: yamada.taro"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>名前（日本語）*</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                  placeholder="山田 太郎"
                />
              </div>
              <div className="form-group">
                <label>名前（英語）</label>
                <input
                  type="text"
                  value={formData.nameEn || ''}
                  onChange={(e) => setFormData((f) => ({ ...f, nameEn: e.target.value }))}
                  placeholder="Taro Yamada"
                />
              </div>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>性別</label>
                <select
                  value={formData.gender || ''}
                  onChange={(e) => setFormData((f) => ({ ...f, gender: (e.target.value || null) as Gender }))}
                >
                  <option value="">-</option>
                  <option value="M">M</option>
                  <option value="F">F</option>
                </select>
              </div>
              <div className="form-group">
                <label>生年</label>
                <input
                  type="number"
                  value={formData.birthYear || ''}
                  onChange={(e) => setFormData((f) => ({ ...f, birthYear: e.target.value ? Number(e.target.value) : undefined }))}
                  placeholder="1990"
                  min={1950}
                  max={2010}
                />
              </div>
              <div className="form-group">
                <label>入社日</label>
                <input
                  type="date"
                  value={formData.joinDate || ''}
                  onChange={(e) => setFormData((f) => ({ ...f, joinDate: e.target.value }))}
                />
              </div>
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
