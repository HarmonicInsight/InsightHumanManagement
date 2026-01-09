import { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Plus, Edit2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { YearSelector } from '../components/YearSelector';
import { MemberEditModal } from '../components/MemberEditModal';
import { RankLabels, RankOrder } from '../types';
import type { Rank, Member } from '../types';

type SortKey = 'name' | 'rank' | 'grade' | 'score';
type SortOrder = 'asc' | 'desc';

export function Evaluation() {
  const { members } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [rankFilter, setRankFilter] = useState<Rank | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const filteredMembers = members
    .filter((m) => {
      const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRank = rankFilter === 'all' || m.rank === rankFilter;
      return matchesSearch && matchesRank;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'rank':
          comparison = RankOrder[b.rank] - RankOrder[a.rank];
          break;
        case 'grade':
          const gradeOrder: Record<string, number> = { S: 4, A: 3, B: 2, C: 1 };
          comparison =
            (gradeOrder[b.evaluation.grade || ''] || 0) - (gradeOrder[a.evaluation.grade || ''] || 0);
          break;
        case 'score':
          comparison = (b.evaluation.score || 0) - (a.evaluation.score || 0);
          break;
      }
      return sortOrder === 'asc' ? -comparison : comparison;
    });

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return null;
    return sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <div className="main-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">メンバの能力評価</h1>
          <p className="page-subtitle">スキルとパフォーマンスの評価</p>
        </div>
        <YearSelector />
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="メンバーを検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            className={`filter-btn ${rankFilter === 'all' ? 'active' : ''}`}
            onClick={() => setRankFilter('all')}
          >
            全て
          </button>
          <button
            className={`filter-btn ${rankFilter === 'SMGR' ? 'active' : ''}`}
            onClick={() => setRankFilter('SMGR')}
          >
            シニアマネージャー
          </button>
          <button
            className={`filter-btn ${rankFilter === 'MGR' ? 'active' : ''}`}
            onClick={() => setRankFilter('MGR')}
          >
            マネージャー
          </button>
          <button
            className={`filter-btn ${rankFilter === 'Scon' ? 'active' : ''}`}
            onClick={() => setRankFilter('Scon')}
          >
            シニアコンサルタント
          </button>
          <button
            className={`filter-btn ${rankFilter === 'CONS' ? 'active' : ''}`}
            onClick={() => setRankFilter('CONS')}
          >
            コンサルタント
          </button>

          <button
            className="btn-primary"
            style={{ marginLeft: 'auto' }}
            onClick={() => setIsAddingNew(true)}
          >
            <Plus size={16} style={{ marginRight: 4 }} />
            追加
          </button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  メンバー <SortIcon column="name" />
                </div>
              </th>
              <th onClick={() => handleSort('rank')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ランク <SortIcon column="rank" />
                </div>
              </th>
              <th onClick={() => handleSort('grade')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  グレード <SortIcon column="grade" />
                </div>
              </th>
              <th onClick={() => handleSort('score')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  スコア <SortIcon column="score" />
                </div>
              </th>
              <th style={{ width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((member) => (
              <tr key={member.id}>
                <td>
                  <div className="member-info">
                    <div className="member-avatar">{member.name.charAt(0)}</div>
                    <div>
                      <div className="member-name">{member.name}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge badge-${member.rank.toLowerCase()}`}>
                    {RankLabels[member.rank]}
                  </span>
                </td>
                <td>
                  {member.evaluation.grade ? (
                    <span className={`grade-badge grade-${member.evaluation.grade.toLowerCase()}`}>
                      {member.evaluation.grade}
                    </span>
                  ) : (
                    <span style={{ color: '#9CA3AF' }}>-</span>
                  )}
                </td>
                <td>
                  {member.evaluation.score !== null ? (
                    <span style={{ fontWeight: 600 }}>{member.evaluation.score}</span>
                  ) : (
                    <span style={{ color: '#9CA3AF' }}>-</span>
                  )}
                </td>
                <td>
                  <button
                    onClick={() => setEditingMember(member)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6B7280',
                      padding: 8,
                    }}
                  >
                    <Edit2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(editingMember || isAddingNew) && (
        <MemberEditModal
          member={editingMember}
          isNew={isAddingNew}
          onClose={() => {
            setEditingMember(null);
            setIsAddingNew(false);
          }}
        />
      )}
    </div>
  );
}
