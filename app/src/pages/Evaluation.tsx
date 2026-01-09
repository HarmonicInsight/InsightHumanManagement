import { useState } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { members } from '../data/members';
import { RankLabels } from '../types';
import type { Rank, Member } from '../types';

type SortKey = 'name' | 'rank' | 'grade' | 'score';
type SortOrder = 'asc' | 'desc';

export function Evaluation() {
  const [searchTerm, setSearchTerm] = useState('');
  const [rankFilter, setRankFilter] = useState<Rank | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

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
          const rankOrder = { MGR: 3, Scon: 2, CONS: 1 };
          comparison = rankOrder[b.rank] - rankOrder[a.rank];
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
      <div className="page-header">
        <h1 className="page-title">Member Evaluation</h1>
        <p className="page-subtitle">Performance evaluation and feedback for team members</p>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search member..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            className={`filter-btn ${rankFilter === 'all' ? 'active' : ''}`}
            onClick={() => setRankFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${rankFilter === 'MGR' ? 'active' : ''}`}
            onClick={() => setRankFilter('MGR')}
          >
            Manager
          </button>
          <button
            className={`filter-btn ${rankFilter === 'Scon' ? 'active' : ''}`}
            onClick={() => setRankFilter('Scon')}
          >
            Senior Consultant
          </button>
          <button
            className={`filter-btn ${rankFilter === 'CONS' ? 'active' : ''}`}
            onClick={() => setRankFilter('CONS')}
          >
            Consultant
          </button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Member <SortIcon column="name" />
                </div>
              </th>
              <th onClick={() => handleSort('rank')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Rank <SortIcon column="rank" />
                </div>
              </th>
              <th onClick={() => handleSort('grade')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Grade <SortIcon column="grade" />
                </div>
              </th>
              <th onClick={() => handleSort('score')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Score <SortIcon column="score" />
                </div>
              </th>
              <th>Summary</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((member) => (
              <tr
                key={member.id}
                onClick={() => setSelectedMember(member)}
                style={{ cursor: 'pointer' }}
              >
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
                <td>{member.evaluation.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedMember && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSelectedMember(null)}
        >
          <div
            className="card"
            style={{ width: '500px', margin: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header">
              <h3 className="card-title">Member Details</h3>
              <button
                onClick={() => setSelectedMember(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#6B7280',
                }}
              >
                x
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div
                className="member-avatar"
                style={{ width: '64px', height: '64px', fontSize: '24px' }}
              >
                {selectedMember.name.charAt(0)}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px' }}>{selectedMember.name}</h2>
                <span className={`badge badge-${selectedMember.rank.toLowerCase()}`}>
                  {RankLabels[selectedMember.rank]}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>Evaluation</h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Grade</div>
                  {selectedMember.evaluation.grade ? (
                    <span
                      className={`grade-badge grade-${selectedMember.evaluation.grade.toLowerCase()}`}
                      style={{ marginTop: '4px' }}
                    >
                      {selectedMember.evaluation.grade}
                    </span>
                  ) : (
                    <span style={{ color: '#9CA3AF' }}>Not evaluated</span>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Score</div>
                  <div style={{ fontSize: '24px', fontWeight: 700 }}>
                    {selectedMember.evaluation.score ?? '-'}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>Comment</h4>
              <p style={{ color: '#374151', lineHeight: 1.6 }}>
                {selectedMember.evaluation.comment || 'No comment available'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
