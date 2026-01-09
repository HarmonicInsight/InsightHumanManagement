import { useState } from 'react';
import { Plus, Edit2, Trash2, Search, UserCheck, UserX, UserPlus as UserPlusIcon } from 'lucide-react';
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
          <h1 className="page-title">社員マスタ</h1>
          <p className="page-subtitle">{currentYear}年度 社員情報管理</p>
        </div>
        <YearSelector />
      </div>

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

          <button className="btn-primary" style={{ marginLeft: 'auto' }} onClick={openAddModal}>
            <Plus size={16} style={{ marginRight: 4 }} />
            社員追加
          </button>
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
