import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { Plus, Edit2, Trash2, GripVertical, ChevronDown, ChevronRight, RotateCcw, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { YearSelector } from '../components/YearSelector';
import { RankLabels, RankColors, TeamColors } from '../types';
import type { Team, Rank } from '../types';
import '../components/YearSelector.css';
import './Organization.css';

const RANKS: Rank[] = ['DIR', 'SMGR', 'MGR', 'Scon', 'CONS'];

export function Organization() {
  const { members, teams, addTeam, updateTeam, deleteTeam, updateMember, currentYear } = useApp();
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: '', leaderId: '', color: TeamColors[0] });
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set(teams.map((t) => t.id)));

  const unassignedMembers = members.filter((m) => !m.teamId);

  // チーム別メンバー数を取得
  const getTeamMemberCount = (teamId: string) => members.filter((m) => m.teamId === teamId).length;
  const maxTeamCount = Math.max(...teams.map((t) => getTeamMemberCount(t.id)), unassignedMembers.length, 1);

  const getTeamMembersByRank = (teamId: string, rank: Rank) =>
    members.filter((m) => m.teamId === teamId && m.rank === rank);

  const toggleTeamExpanded = (teamId: string) => {
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) {
        next.delete(teamId);
      } else {
        next.add(teamId);
      }
      return next;
    });
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, draggableId } = result;
    if (!destination) return;

    const memberId = draggableId;
    const member = members.find((m) => m.id === memberId);
    if (!member) return;

    // Parse destination droppableId: "team-{teamId}-{rank}" or "unassigned"
    if (destination.droppableId === 'unassigned') {
      updateMember({ ...member, teamId: null });
    } else if (destination.droppableId.startsWith('team-')) {
      // Format: team-{teamId}-{rank}
      // teamId can contain hyphens (e.g., team-1234567890), so use lastIndexOf
      const withoutPrefix = destination.droppableId.slice(5); // Remove "team-"
      const lastHyphenIndex = withoutPrefix.lastIndexOf('-');
      const teamId = withoutPrefix.slice(0, lastHyphenIndex);
      const targetRank = withoutPrefix.slice(lastHyphenIndex + 1) as Rank;

      // Update both teamId and rank
      updateMember({ ...member, teamId, rank: targetRank });
    }
  };

  const handleSaveTeam = () => {
    if (!teamForm.name.trim()) return;
    if (editingTeam) {
      updateTeam({ ...editingTeam, name: teamForm.name, leaderId: teamForm.leaderId || null, color: teamForm.color });
    } else {
      const newTeam = { name: teamForm.name, leaderId: teamForm.leaderId || null, color: teamForm.color };
      addTeam(newTeam);
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

  const handleResetAllAssignments = () => {
    if (confirm('すべてのメンバーを未所属に戻しますか？')) {
      members.forEach((member) => {
        if (member.teamId) {
          updateMember({ ...member, teamId: null });
        }
      });
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
          <p className="page-subtitle">ドラッグ&ドロップでメンバーをチームに配置</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="btn-secondary"
            onClick={handleResetAllAssignments}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RotateCcw size={16} />
            全員を未所属に
          </button>
          <YearSelector />
        </div>
      </div>

      {/* チーム別人数サマリー（バーチャート） */}
      <div className="org-summary-card">
        <div className="org-summary-header">
          <h3>FY{String(currentYear).slice(2)}</h3>
          <div className="org-summary-total">
            <Users size={18} />
            <span>{members.length}名</span>
          </div>
        </div>
        <div className="org-summary-bars">
          {teams.map((team) => {
            const count = getTeamMemberCount(team.id);
            const percentage = (count / maxTeamCount) * 100;
            return (
              <div key={team.id} className="org-summary-row">
                <div className="org-summary-label" style={{ color: team.color }}>{team.name}</div>
                <div className="org-summary-bar-container">
                  <div
                    className="org-summary-bar"
                    style={{ width: `${percentage}%`, background: team.color }}
                  />
                </div>
                <div className="org-summary-count">{count}</div>
              </div>
            );
          })}
          {unassignedMembers.length > 0 && (
            <div className="org-summary-row">
              <div className="org-summary-label" style={{ color: '#9CA3AF' }}>未所属</div>
              <div className="org-summary-bar-container">
                <div
                  className="org-summary-bar"
                  style={{ width: `${(unassignedMembers.length / maxTeamCount) * 100}%`, background: '#9CA3AF' }}
                />
              </div>
              <div className="org-summary-count">{unassignedMembers.length}</div>
            </div>
          )}
        </div>
      </div>

      {/* ランク別人数サマリー（テーブル） */}
      <div className="org-summary-tables">
        {/* 全体 */}
        <div className="org-rank-table">
          <div className="org-rank-table-header">全体</div>
          <table>
            <tbody>
              {RANKS.map((rank) => {
                const count = members.filter((m) => m.rank === rank).length;
                return (
                  <tr key={rank}>
                    <td className="rank-name">{RankLabels[rank]}</td>
                    <td className="rank-count">{count}</td>
                  </tr>
                );
              })}
              <tr className="total-row">
                <td className="rank-name">合計</td>
                <td className="rank-count">{members.length}</td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* チーム別 */}
        {teams.map((team) => (
          <div key={team.id} className="org-rank-table">
            <div className="org-rank-table-header" style={{ borderBottomColor: team.color }}>{team.name}</div>
            <table>
              <tbody>
                {RANKS.map((rank) => {
                  const count = members.filter((m) => m.teamId === team.id && m.rank === rank).length;
                  return (
                    <tr key={rank}>
                      <td className="rank-name">{RankLabels[rank]}</td>
                      <td className="rank-count">{count}</td>
                    </tr>
                  );
                })}
                <tr className="total-row">
                  <td className="rank-name">合計</td>
                  <td className="rank-count">{getTeamMemberCount(team.id)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="org-layout">
          {/* 左側: 未所属メンバー一覧 */}
          <div className="org-sidebar">
            <div className="card" style={{ height: '100%' }}>
              <div className="card-header">
                <h3 className="card-title">未所属メンバー</h3>
                <span className="member-count">{unassignedMembers.length}</span>
              </div>

              <Droppable droppableId="unassigned">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`member-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                  >
                    {unassignedMembers.length === 0 ? (
                      <div className="empty-state">全員が所属済みです</div>
                    ) : (
                      unassignedMembers.map((member, index) => (
                        <Draggable key={member.id} draggableId={member.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`member-card ${snapshot.isDragging ? 'dragging' : ''}`}
                              style={{
                                ...provided.draggableProps.style,
                                borderLeftColor: RankColors[member.rank],
                              }}
                            >
                              <GripVertical size={14} className="drag-handle" />
                              <div className="member-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                                {member.name.charAt(0)}
                              </div>
                              <div className="member-details">
                                <div className="member-name">{member.name}</div>
                                <span
                                  className="rank-badge"
                                  style={{ background: `${RankColors[member.rank]}20`, color: RankColors[member.rank] }}
                                >
                                  {RankLabels[member.rank]}
                                </span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>

          {/* 右側: チームツリー */}
          <div className="org-main">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">チーム構成</h3>
                <button className="btn-primary" onClick={() => setIsAddingTeam(true)}>
                  <Plus size={16} style={{ marginRight: 4 }} />
                  チーム追加
                </button>
              </div>

              <div className="team-list">
                {teams.length === 0 ? (
                  <div className="empty-state">チームがありません。追加してください。</div>
                ) : (
                  teams.map((team) => {
                    const isExpanded = expandedTeams.has(team.id);
                    const teamMemberCount = members.filter((m) => m.teamId === team.id).length;

                    return (
                      <div key={team.id} className="team-tree" style={{ '--team-color': team.color } as React.CSSProperties}>
                        <div className="team-header" onClick={() => toggleTeamExpanded(team.id)}>
                          <div className="team-expand">
                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </div>
                          <div className="team-color-bar" style={{ background: team.color }} />
                          <div className="team-info">
                            <h4 className="team-name">{team.name}</h4>
                            <span className="team-count">{teamMemberCount}名</span>
                          </div>
                          <div className="team-actions">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditTeam(team);
                              }}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTeam(team);
                              }}
                              className="delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="team-body">
                            {RANKS.map((rank) => {
                              const rankMembers = getTeamMembersByRank(team.id, rank);
                              return (
                                <div key={rank} className="rank-section">
                                  <div className="rank-header" style={{ color: RankColors[rank] }}>
                                    <div className="rank-indicator" style={{ background: RankColors[rank] }} />
                                    {RankLabels[rank]}
                                    <span className="rank-count">{rankMembers.length}</span>
                                  </div>
                                  <Droppable droppableId={`team-${team.id}-${rank}`}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`rank-dropzone ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                                      >
                                        {rankMembers.length === 0 ? (
                                          <div className="drop-hint">ここにドロップ</div>
                                        ) : (
                                          rankMembers.map((member, index) => (
                                            <Draggable key={member.id} draggableId={member.id} index={index}>
                                              {(provided, snapshot) => (
                                                <div
                                                  ref={provided.innerRef}
                                                  {...provided.draggableProps}
                                                  {...provided.dragHandleProps}
                                                  className={`member-chip ${snapshot.isDragging ? 'dragging' : ''}`}
                                                >
                                                  <GripVertical size={12} className="drag-handle" />
                                                  <div
                                                    className="member-avatar"
                                                    style={{ width: 24, height: 24, fontSize: 10 }}
                                                  >
                                                    {member.name.charAt(0)}
                                                  </div>
                                                  <span>{member.name}</span>
                                                </div>
                                              )}
                                            </Draggable>
                                          ))
                                        )}
                                        {provided.placeholder}
                                      </div>
                                    )}
                                  </Droppable>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </DragDropContext>

      {/* ランク別サマリー */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <h3 className="card-title">ランク別人数</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 20 }}>
          {RANKS.map((rank) => (
            <div
              key={rank}
              style={{
                padding: 20,
                background: `${RankColors[rank]}10`,
                borderRadius: 12,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 36, fontWeight: 700, color: RankColors[rank] }}>
                {members.filter((m) => m.rank === rank).length}
              </div>
              <div style={{ fontSize: 14, color: '#6B7280' }}>{RankLabels[rank]}</div>
            </div>
          ))}
        </div>
      </div>

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
