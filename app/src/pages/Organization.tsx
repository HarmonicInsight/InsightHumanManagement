import { useState } from 'react';
import { Plus, Edit2, Trash2, Users, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { YearSelector } from '../components/YearSelector';
import { RankLabels, RankOrder, TeamColors } from '../types';
import type { Team } from '../types';
import '../components/YearSelector.css';

export function Organization() {
  const { members, teams, addTeam, updateTeam, deleteTeam, updateMember } = useApp();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: '', leaderId: '', color: TeamColors[0] });

  const seniorManagers = members.filter((m) => m.rank === 'SMGR');
  const managers = members.filter((m) => m.rank === 'MGR');
  const seniorConsultants = members.filter((m) => m.rank === 'Scon');
  const consultants = members.filter((m) => m.rank === 'CONS');

  const unassignedMembers = members.filter((m) => !m.teamId);

  const getTeamMembers = (teamId: string) =>
    members.filter((m) => m.teamId === teamId).sort((a, b) => RankOrder[b.rank] - RankOrder[a.rank]);


  const handleSaveTeam = () => {
    if (!teamForm.name.trim()) return;
    if (editingTeam) {
      updateTeam({ ...editingTeam, name: teamForm.name, leaderId: teamForm.leaderId || null, color: teamForm.color });
    } else {
      addTeam({ name: teamForm.name, leaderId: teamForm.leaderId || null, color: teamForm.color });
    }
    setEditingTeam(null);
    setIsAddingTeam(false);
    setTeamForm({ name: '', leaderId: '', color: TeamColors[0] });
  };

  const handleDeleteTeam = (team: Team) => {
    if (confirm(`チーム「${team.name}」を削除しますか？メンバーは未所属になります。`)) {
      deleteTeam(team.id);
    }
  };

  const handleAssignToTeam = (memberId: string, teamId: string | null) => {
    const member = members.find((m) => m.id === memberId);
    if (member) {
      updateMember({ ...member, teamId });
    }
  };

  const openEditTeam = (team: Team) => {
    setEditingTeam(team);
    setTeamForm({ name: team.name, leaderId: team.leaderId || '', color: team.color });
  };

  return (
    <div className="main-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">組織体制</h1>
          <p className="page-subtitle">チーム構成と階層</p>
        </div>
        <YearSelector />
      </div>

      {/* チーム一覧 */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">チーム</h3>
          <button className="btn-primary" onClick={() => setIsAddingTeam(true)}>
            <Plus size={16} style={{ marginRight: 4 }} />
            チーム追加
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {teams.map((team) => {
            const teamMembers = getTeamMembers(team.id);
            const leader = members.find((m) => m.id === team.leaderId);
            return (
              <div
                key={team.id}
                style={{
                  border: `2px solid ${team.color}`,
                  borderRadius: 12,
                  padding: 16,
                  background: `linear-gradient(135deg, ${team.color}10, white)`,
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedTeam(team)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 16, color: team.color }}>{team.name}</h4>
                    {leader && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6B7280' }}>リーダー: {leader.name}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditTeam(team);
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 4 }}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTeam(team);
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 4 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={14} color="#6B7280" />
                  <span style={{ fontSize: 13, color: '#6B7280' }}>{teamMembers.length}名</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 12 }}>
                  {teamMembers.slice(0, 6).map((m) => (
                    <div
                      key={m.id}
                      className="member-avatar"
                      style={{ width: 32, height: 32, fontSize: 12 }}
                      title={m.name}
                    >
                      {m.name.charAt(0)}
                    </div>
                  ))}
                  {teamMembers.length > 6 && (
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: '#E5E7EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        color: '#6B7280',
                      }}
                    >
                      +{teamMembers.length - 6}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* 未所属 */}
          {unassignedMembers.length > 0 && (
            <div
              style={{
                border: '2px dashed #D1D5DB',
                borderRadius: 12,
                padding: 16,
                background: '#F9FAFB',
              }}
            >
              <h4 style={{ margin: 0, fontSize: 16, color: '#6B7280' }}>未所属</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <Users size={14} color="#6B7280" />
                <span style={{ fontSize: 13, color: '#6B7280' }}>{unassignedMembers.length}名</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 12 }}>
                {unassignedMembers.slice(0, 6).map((m) => (
                  <div
                    key={m.id}
                    className="member-avatar"
                    style={{ width: 32, height: 32, fontSize: 12, background: '#9CA3AF' }}
                    title={m.name}
                  >
                    {m.name.charAt(0)}
                  </div>
                ))}
                {unassignedMembers.length > 6 && (
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: '#E5E7EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      color: '#6B7280',
                    }}
                  >
                    +{unassignedMembers.length - 6}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ランク別サマリー */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">ランク別人数</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          <div style={{ padding: 20, background: '#FDF2F8', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#EC4899' }}>{seniorManagers.length}</div>
            <div style={{ fontSize: 14, color: '#6B7280' }}>シニアマネージャー</div>
          </div>
          <div style={{ padding: 20, background: '#F5F3FF', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#8B5CF6' }}>{managers.length}</div>
            <div style={{ fontSize: 14, color: '#6B7280' }}>マネージャー</div>
          </div>
          <div style={{ padding: 20, background: '#EFF6FF', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#3B82F6' }}>{seniorConsultants.length}</div>
            <div style={{ fontSize: 14, color: '#6B7280' }}>シニアコンサルタント</div>
          </div>
          <div style={{ padding: 20, background: '#ECFDF5', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#10B981' }}>{consultants.length}</div>
            <div style={{ fontSize: 14, color: '#6B7280' }}>コンサルタント</div>
          </div>
        </div>
      </div>

      {/* チーム詳細モーダル */}
      {selectedTeam && (
        <div className="modal-overlay" onClick={() => setSelectedTeam(null)}>
          <div className="modal-content" style={{ width: 600, maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 className="modal-title" style={{ margin: 0, color: selectedTeam.color }}>{selectedTeam.name}</h3>
              <button onClick={() => setSelectedTeam(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#6B7280" />
              </button>
            </div>

            <h4 style={{ fontSize: 14, color: '#6B7280', marginBottom: 12 }}>メンバー</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {getTeamMembers(selectedTeam.id).map((member) => (
                <div
                  key={member.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: '#F9FAFB',
                    borderRadius: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="member-avatar" style={{ width: 36, height: 36, fontSize: 14 }}>
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{member.name}</div>
                      <span className={`badge badge-${member.rank.toLowerCase()}`} style={{ fontSize: 10 }}>
                        {RankLabels[member.rank]}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAssignToTeam(member.id, null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 12 }}
                  >
                    除外
                  </button>
                </div>
              ))}
            </div>

            <h4 style={{ fontSize: 14, color: '#6B7280', margin: '20px 0 12px' }}>メンバーを追加</h4>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleAssignToTeam(e.target.value, selectedTeam.id);
                  e.target.value = '';
                }
              }}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8 }}
            >
              <option value="">メンバーを選択...</option>
              {unassignedMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({RankLabels[m.rank]})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* チーム編集モーダル */}
      {(editingTeam || isAddingTeam) && (
        <div className="modal-overlay" onClick={() => { setEditingTeam(null); setIsAddingTeam(false); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">{editingTeam ? 'チーム編集' : 'チーム追加'}</h3>

            <div className="form-group">
              <label>チーム名 *</label>
              <input
                type="text"
                value={teamForm.name}
                onChange={(e) => setTeamForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="チーム名を入力"
              />
            </div>

            <div className="form-group">
              <label>リーダー</label>
              <select value={teamForm.leaderId} onChange={(e) => setTeamForm((f) => ({ ...f, leaderId: e.target.value }))}>
                <option value="">選択してください</option>
                {members
                  .filter((m) => m.rank === 'MGR' || m.rank === 'SMGR')
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({RankLabels[m.rank]})
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label>カラー</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {TeamColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setTeamForm((f) => ({ ...f, color }))}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: color,
                      border: teamForm.color === color ? '3px solid #1F2937' : '2px solid transparent',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => { setEditingTeam(null); setIsAddingTeam(false); }}>
                キャンセル
              </button>
              <button className="btn-primary" onClick={handleSaveTeam}>
                {editingTeam ? '保存' : '追加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
