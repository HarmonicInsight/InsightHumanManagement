import { useState } from 'react';
import { members } from '../data/members';
import { RankLabels } from '../types';
import type { Member } from '../types';

export function Organization() {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const managers = members.filter((m) => m.rank === 'MGR');
  const seniorConsultants = members.filter((m) => m.rank === 'Scon');
  const consultants = members.filter((m) => m.rank === 'CONS');

  const getAverageSkill = (member: Member) => {
    const skills = Object.values(member.skills).filter((v) => v !== null) as number[];
    if (skills.length === 0) return 0;
    return (skills.reduce((a, b) => a + b, 0) / skills.length).toFixed(1);
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">Organization</h1>
        <p className="page-subtitle">Team structure and hierarchy</p>
      </div>

      <div className="card">
        <div className="org-chart">
          <div>
            <h3
              style={{
                textAlign: 'center',
                fontSize: '14px',
                color: '#8B5CF6',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Manager
            </h3>
            <div className="org-level">
              {managers.map((member) => (
                <div
                  key={member.id}
                  className="org-card mgr"
                  onClick={() => setSelectedMember(member)}
                >
                  <div
                    className="member-avatar"
                    style={{
                      width: '48px',
                      height: '48px',
                      margin: '0 auto 8px',
                      background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
                    }}
                  >
                    {member.name.charAt(0)}
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>{member.name}</div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>
                    Avg Skill: {getAverageSkill(member)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="org-connector"></div>

          <div>
            <h3
              style={{
                textAlign: 'center',
                fontSize: '14px',
                color: '#3B82F6',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Senior Consultant
            </h3>
            <div className="org-level">
              {seniorConsultants.map((member) => (
                <div
                  key={member.id}
                  className="org-card scon"
                  onClick={() => setSelectedMember(member)}
                >
                  <div
                    className="member-avatar"
                    style={{
                      width: '48px',
                      height: '48px',
                      margin: '0 auto 8px',
                      background: 'linear-gradient(135deg, #3B82F6, #60A5FA)',
                    }}
                  >
                    {member.name.charAt(0)}
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>{member.name}</div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>
                    Avg Skill: {getAverageSkill(member)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="org-connector"></div>

          <div>
            <h3
              style={{
                textAlign: 'center',
                fontSize: '14px',
                color: '#10B981',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Consultant
            </h3>
            <div className="org-level">
              {consultants.map((member) => (
                <div
                  key={member.id}
                  className="org-card cons"
                  onClick={() => setSelectedMember(member)}
                >
                  <div
                    className="member-avatar"
                    style={{
                      width: '48px',
                      height: '48px',
                      margin: '0 auto 8px',
                      background: 'linear-gradient(135deg, #10B981, #34D399)',
                    }}
                  >
                    {member.name.charAt(0)}
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>{member.name}</div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>
                    Avg Skill: {getAverageSkill(member)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Team Summary</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          <div
            style={{
              padding: '20px',
              background: '#F5F3FF',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '36px', fontWeight: 700, color: '#8B5CF6' }}>
              {managers.length}
            </div>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>Managers</div>
          </div>
          <div
            style={{
              padding: '20px',
              background: '#EFF6FF',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '36px', fontWeight: 700, color: '#3B82F6' }}>
              {seniorConsultants.length}
            </div>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>Senior Consultants</div>
          </div>
          <div
            style={{
              padding: '20px',
              background: '#ECFDF5',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '36px', fontWeight: 700, color: '#10B981' }}>
              {consultants.length}
            </div>
            <div style={{ fontSize: '14px', color: '#6B7280' }}>Consultants</div>
          </div>
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
            style={{ width: '400px', margin: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header">
              <h3 className="card-title">Member Info</h3>
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

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                className="member-avatar"
                style={{
                  width: '80px',
                  height: '80px',
                  margin: '0 auto 12px',
                  fontSize: '32px',
                }}
              >
                {selectedMember.name.charAt(0)}
              </div>
              <h2 style={{ margin: 0, fontSize: '22px' }}>{selectedMember.name}</h2>
              <span className={`badge badge-${selectedMember.rank.toLowerCase()}`}>
                {RankLabels[selectedMember.rank]}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                textAlign: 'center',
              }}
            >
              <div style={{ padding: '16px', background: '#F9FAFB', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Grade</div>
                {selectedMember.evaluation.grade ? (
                  <span
                    className={`grade-badge grade-${selectedMember.evaluation.grade.toLowerCase()}`}
                    style={{ marginTop: '4px' }}
                  >
                    {selectedMember.evaluation.grade}
                  </span>
                ) : (
                  <span style={{ color: '#9CA3AF' }}>-</span>
                )}
              </div>
              <div style={{ padding: '16px', background: '#F9FAFB', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Avg Skill</div>
                <div style={{ fontSize: '24px', fontWeight: 700 }}>
                  {getAverageSkill(selectedMember)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
