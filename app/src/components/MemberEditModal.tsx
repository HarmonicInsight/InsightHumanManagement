import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RankLabels, SkillLabels } from '../types';
import type { Member, Rank, Grade, Skills } from '../types';
import './YearSelector.css';

interface Props {
  member: Member | null;
  isNew?: boolean;
  onClose: () => void;
}

export function MemberEditModal({ member, isNew = false, onClose }: Props) {
  const { updateMember, addMember, deleteMember, teams } = useApp();

  const [formData, setFormData] = useState<Omit<Member, 'id'>>({
    name: '',
    rank: 'CONS',
    teamId: null,
    evaluation: { grade: null, score: null, summary: '', comment: '' },
    skills: {
      consulting: null,
      construction: null,
      it: null,
      sales: null,
      management: null,
      responsibility: null,
      independence: null,
    },
  });

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name,
        rank: member.rank,
        teamId: member.teamId,
        evaluation: { ...member.evaluation },
        skills: { ...member.skills },
      });
    }
  }, [member]);

  const handleSubmit = () => {
    if (!formData.name.trim()) return;

    if (isNew) {
      addMember(formData);
    } else if (member) {
      updateMember({ ...formData, id: member.id });
    }
    onClose();
  };

  const handleDelete = () => {
    if (member && confirm('このメンバーを削除しますか？')) {
      deleteMember(member.id);
      onClose();
    }
  };

  const handleSkillChange = (key: keyof Skills, value: string) => {
    const numValue = value === '' ? null : Number(value);
    setFormData((prev) => ({
      ...prev,
      skills: { ...prev.skills, [key]: numValue },
    }));
  };

  const ranks: Rank[] = ['CONS', 'Scon', 'MGR', 'SMGR'];
  const grades: (Grade | '')[] = ['', 'S', 'A', 'B', 'C'];
  const skillKeys = Object.keys(SkillLabels) as (keyof Skills)[];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ width: '600px', maxHeight: '90vh', overflow: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 className="modal-title" style={{ margin: 0 }}>
            {isNew ? 'メンバー追加' : 'メンバー編集'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} color="#6B7280" />
          </button>
        </div>

        <div className="form-group">
          <label>名前 *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="名前を入力"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label>ランク</label>
            <select
              value={formData.rank}
              onChange={(e) => setFormData((prev) => ({ ...prev, rank: e.target.value as Rank }))}
            >
              {ranks.map((r) => (
                <option key={r} value={r}>
                  {RankLabels[r]}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>チーム</label>
            <select
              value={formData.teamId || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, teamId: e.target.value || null }))}
            >
              <option value="">未所属</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <h4 style={{ fontSize: 14, color: '#6B7280', marginTop: 20, marginBottom: 12 }}>評価</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label>グレード</label>
            <select
              value={formData.evaluation.grade || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  evaluation: { ...prev.evaluation, grade: (e.target.value || null) as Grade },
                }))
              }
            >
              {grades.map((g) => (
                <option key={g || 'none'} value={g || ''}>
                  {g || '未評価'}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>スコア (1-5)</label>
            <input
              type="number"
              min={1}
              max={5}
              value={formData.evaluation.score ?? ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  evaluation: { ...prev.evaluation, score: e.target.value ? Number(e.target.value) : null },
                }))
              }
            />
          </div>
        </div>

        <div className="form-group">
          <label>総評</label>
          <input
            type="text"
            value={formData.evaluation.summary}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                evaluation: { ...prev.evaluation, summary: e.target.value },
              }))
            }
            placeholder="総評を入力"
          />
        </div>

        <div className="form-group">
          <label>コメント</label>
          <textarea
            value={formData.evaluation.comment}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                evaluation: { ...prev.evaluation, comment: e.target.value },
              }))
            }
            placeholder="詳細コメントを入力"
            rows={3}
          />
        </div>

        <h4 style={{ fontSize: 14, color: '#6B7280', marginTop: 20, marginBottom: 12 }}>スキル評価 (1-3)</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {skillKeys.map((key) => (
            <div key={key} className="form-group" style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 12 }}>{SkillLabels[key]}</label>
              <select
                value={formData.skills[key] ?? ''}
                onChange={(e) => handleSkillChange(key, e.target.value)}
              >
                <option value="">-</option>
                <option value="1">1 - まだまだ</option>
                <option value="2">2 - 指示があればできる</option>
                <option value="3">3 - 任せられる</option>
              </select>
            </div>
          ))}
        </div>

        <div className="modal-actions" style={{ marginTop: 24 }}>
          {!isNew && (
            <button className="btn-danger" onClick={handleDelete} style={{ marginRight: 'auto' }}>
              <Trash2 size={16} style={{ marginRight: 4 }} />
              削除
            </button>
          )}
          <button className="btn-secondary" onClick={onClose}>
            キャンセル
          </button>
          <button className="btn-primary" onClick={handleSubmit}>
            {isNew ? '追加' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
