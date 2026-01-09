import { useState } from 'react';
import { Search } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { members } from '../data/members';
import { RankLabels, SkillLabels } from '../types';
import type { Rank, Skills, Member } from '../types';

export function SkillMap() {
  const [searchTerm, setSearchTerm] = useState('');
  const [rankFilter, setRankFilter] = useState<Rank | 'all'>('all');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const filteredMembers = members.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRank = rankFilter === 'all' || m.rank === rankFilter;
    return matchesSearch && matchesRank;
  });

  const getSkillBarClass = (value: number | null) => {
    if (value === null) return '';
    if (value === 1) return 'level-1';
    if (value === 2) return 'level-2';
    return 'level-3';
  };

  const getRadarData = (member: Member) => {
    return [
      { skill: 'Consulting', value: member.skills.consulting || 0, fullMark: 3 },
      { skill: 'Construction', value: member.skills.construction || 0, fullMark: 3 },
      { skill: 'IT', value: member.skills.it || 0, fullMark: 3 },
      { skill: 'Sales', value: member.skills.sales || 0, fullMark: 3 },
      { skill: 'Management', value: member.skills.management || 0, fullMark: 3 },
      { skill: 'Responsibility', value: member.skills.responsibility || 0, fullMark: 3 },
      { skill: 'Independence', value: member.skills.independence || 0, fullMark: 3 },
    ];
  };

  const skillKeys: (keyof Skills)[] = [
    'consulting',
    'construction',
    'it',
    'sales',
    'management',
    'responsibility',
    'independence',
  ];

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">Skill Map</h1>
        <p className="page-subtitle">Skill evaluation and competency matrix</p>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ fontSize: '14px', color: '#6B7280', marginBottom: '12px' }}>Skill Levels</h4>
          <div style={{ display: 'flex', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '4px',
                  background: '#34D399',
                }}
              ></div>
              <span style={{ fontSize: '13px' }}>3: Can be entrusted</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '4px',
                  background: '#FCD34D',
                }}
              ></div>
              <span style={{ fontSize: '13px' }}>2: Can do with guidance</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '4px',
                  background: '#FCA5A5',
                }}
              ></div>
              <span style={{ fontSize: '13px' }}>1: Needs improvement</span>
            </div>
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

        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ minWidth: '180px' }}>Member</th>
                <th>Rank</th>
                {skillKeys.map((key) => (
                  <th key={key} style={{ minWidth: '100px', fontSize: '11px' }}>
                    {SkillLabels[key]}
                  </th>
                ))}
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
                  {skillKeys.map((key) => (
                    <td key={key}>
                      <div className="skill-bar">
                        <div className="skill-bar-track">
                          <div
                            className={`skill-bar-fill ${getSkillBarClass(member.skills[key])}`}
                          ></div>
                        </div>
                        <span className="skill-value">
                          {member.skills[key] !== null ? member.skills[key] : '-'}
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
            style={{ width: '600px', margin: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header">
              <h3 className="card-title">Skill Profile</h3>
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

            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={getRadarData(selectedMember)}>
                <PolarGrid />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12 }} />
                <Radar
                  name={selectedMember.name}
                  dataKey="value"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.4}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>

            <div style={{ marginTop: '20px' }}>
              <h4 style={{ fontSize: '14px', color: '#6B7280', marginBottom: '12px' }}>
                Skill Details
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {skillKeys.map((key) => (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: '#F9FAFB',
                      borderRadius: '8px',
                    }}
                  >
                    <span style={{ fontSize: '13px', color: '#6B7280' }}>{SkillLabels[key]}</span>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>
                      {selectedMember.skills[key] !== null ? selectedMember.skills[key] : '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
