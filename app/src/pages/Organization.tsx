import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { Plus, Edit2, Trash2, GripVertical, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { YearSelector } from '../components/YearSelector';
import { RankLabels, RankColors, TeamColors } from '../types';
import type { Team, Rank } from '../types';
import '../components/YearSelector.css';
import './Organization.css';

const RANKS: Rank[] = ['DIR', 'SMGR', 'MGR', 'Scon', 'CONS'];

export function Organization() {
  const { members, teams, addTeam, updateTeam, deleteTeam, updateMember } = useApp();
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: '', leaderId: '', color: TeamColors[0] });

  const getTeamMemberCount = (teamId: string | null) =>
    members.filter((m) => m.teamId === teamId).length;

  const getTeamMembersByRank = (teamId: string | null, rank: Rank) =>
    members.filter((m) => m.teamId === teamId && m.rank === rank);

  const handleDragEnd = (result: DropResult) => {
    const { destination, draggableId } = result;
    if (!destination) return;

    const memberId = draggableId;
    const member = members.find((m) => m.id === memberId);
    if (!member) return;

    if (destination.droppableId.startsWith('unassigned-')) {
      const targetRank = destination.droppableId.slice('unassigned-'.length) as Rank;
      updateMember({ ...member, teamId: null, rank: targetRank });
    } else if (destination.droppableId.startsWith('team-')) {
      const withoutPrefix = destination.droppableId.slice(5);
      const lastHyphenIndex = withoutPrefix.lastIndexOf('-');
      const teamId = withoutPrefix.slice(0, lastHyphenIndex);
      const targetRank = withoutPrefix.slice(lastHyphenIndex + 1) as Rank;
      updateMember({ ...member, teamId, rank: targetRank });
    }
  };

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

  // チームカラム用のコンポーネント
  const renderTeamColumn = (team: Team | null, teamId: string | null, teamName: string, teamColor: string) => {

    return (
      <div className="team-column" key={teamId || 'unassigned'}>
        <div className="team-column-header" style={{ borderBottomColor: teamColor }}>
          <div className="team-column-title">
            <div className="team-color-dot" style={{ background: teamColor }} />
            <span>{teamName}</span>
            <span className="team-column-count">{getTeamMemberCount(teamId)}名</span>
          </div>
          {team && (
            <div className="team-column-actions">
              <button onClick={() => openEditTeam(team)}><Edit2 size={14} /></button>
              <button className="delete" onClick={() => handleDeleteTeam(team)}><Trash2 size={14} /></button>
            </div>
          )}
        </div>

        <div className="team-column-body">
          {RANKS.map((rank) => {
            const rankMembers = getTeamMembersByRank(teamId, rank);
            return (
              <div key={rank} className="rank-row">
                <div className="rank-row-header" style={{ color: RankColors[rank] }}>
                  <span className="rank-dot" style={{ background: RankColors[rank] }} />
                  <span className="rank-label">{RankLabels[rank]}</span>
                  <span className="rank-row-count">{rankMembers.length}</span>
                </div>
                <Droppable droppableId={teamId ? `team-${teamId}-${rank}` : `unassigned-${rank}`}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`rank-dropzone-compact ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                    >
                      {rankMembers.map((member, index) => (
                        <Draggable key={member.id} draggableId={member.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`member-chip-compact ${snapshot.isDragging ? 'dragging' : ''}`}
                            >
                              <GripVertical size={10} className="drag-handle" />
                              <div className="member-avatar-small">{member.name.charAt(0)}</div>
                              <span className="member-name-compact">{member.name}</span>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </div>
    );
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
          <button className="btn-primary" onClick={() => setIsAddingTeam(true)}>
            <Plus size={16} style={{ marginRight: 4 }} />
            チーム追加
          </button>
          <YearSelector />
        </div>
      </div>

      {/* ランク別人数サマリー（テーブル） */}
      <div className="org-summary-tables-large">
        <div className="org-rank-table-large">
          <div className="org-rank-table-header-large">全体</div>
          <table>
            <tbody>
              {RANKS.map((rank) => (
                <tr key={rank}>
                  <td className="rank-name-large">{RankLabels[rank]}</td>
                  <td className="rank-count-large">{members.filter((m) => m.rank === rank).length}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td className="rank-name-large">合計</td>
                <td className="rank-count-large">{members.length}</td>
              </tr>
            </tbody>
          </table>
        </div>
        {teams.map((team) => (
          <div key={team.id} className="org-rank-table-large">
            <div className="org-rank-table-header-large" style={{ borderBottomColor: team.color }}>{team.name}</div>
            <table>
              <tbody>
                {RANKS.map((rank) => (
                  <tr key={rank}>
                    <td className="rank-name-large">{RankLabels[rank]}</td>
                    <td className="rank-count-large">{members.filter((m) => m.teamId === team.id && m.rank === rank).length}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td className="rank-name-large">合計</td>
                  <td className="rank-count-large">{getTeamMemberCount(team.id)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* アサイン管理セクション */}
      <div className="assign-section-divider">
        <div className="assign-section-line" />
        <h2 className="assign-section-title">アサイン管理</h2>
      </div>

      {/* チーム構成 - 4列レイアウト */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="team-columns-grid">
          {renderTeamColumn(null, null, '未所属', '#9CA3AF')}
          {teams.map((team) => renderTeamColumn(team, team.id, team.name, team.color))}
        </div>
      </DragDropContext>

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
