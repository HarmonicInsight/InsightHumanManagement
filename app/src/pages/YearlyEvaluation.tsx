import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RankLabels, RankColors, YearlyGradeColors, RankOrder } from '../types';
import type { YearlyGrade, Team, Member } from '../types';
import './YearlyEvaluation.css';

const GRADES: YearlyGrade[] = ['S', 'A', 'B', 'C', 'D'];
const FISCAL_YEARS = [2024, 2025, 2026, 2027, 2028];

export function YearlyEvaluation() {
  const { members, teams, yearlyEvaluations, updateYearlyEvaluation } = useApp();
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set(['unassigned', ...teams.map(t => t.id)]));

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

  const getMemberGrade = (memberId: string, year: number): YearlyGrade => {
    const memberEval = yearlyEvaluations.find((e) => e.memberId === memberId);
    return memberEval?.evaluations[year] || null;
  };

  const handleGradeChange = (memberId: string, year: number, grade: string) => {
    const newGrade = grade === '' ? null : (grade as YearlyGrade);
    updateYearlyEvaluation(memberId, year, newGrade);
  };

  const getMembersByTeam = (teamId: string | null) => {
    return members
      .filter((m) => m.teamId === teamId)
      .sort((a, b) => RankOrder[b.rank] - RankOrder[a.rank]);
  };

  // 年度別の統計
  const getYearStats = (year: number) => {
    const stats: Record<string, number> = { S: 0, A: 0, B: 0, C: 0, D: 0 };
    members.forEach((member) => {
      const grade = getMemberGrade(member.id, year);
      if (grade) {
        stats[grade]++;
      }
    });
    return stats;
  };

  const renderMemberRows = (teamMembers: Member[]) => {
    return teamMembers.map((member) => (
      <tr key={member.id}>
        <td className="sticky-col">
          <div className="member-info-cell" style={{ paddingLeft: 16 }}>
            <div className="member-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
              {member.name.charAt(0)}
            </div>
            <span>{member.name}</span>
          </div>
        </td>
        <td className="sticky-col-2">
          <span
            className="rank-badge"
            style={{ background: `${RankColors[member.rank]}20`, color: RankColors[member.rank] }}
          >
            {RankLabels[member.rank]}
          </span>
        </td>
        {FISCAL_YEARS.map((year) => {
          const grade = getMemberGrade(member.id, year);
          return (
            <td key={year} className="grade-cell">
              <select
                value={grade || ''}
                onChange={(e) => handleGradeChange(member.id, year, e.target.value)}
                className="grade-select"
                style={{
                  color: grade ? YearlyGradeColors[grade] : undefined,
                  fontWeight: grade ? 600 : 400,
                }}
              >
                <option value="">-</option>
                {GRADES.map((g) => (
                  <option key={g} value={g!} style={{ color: YearlyGradeColors[g!] }}>
                    {g}
                  </option>
                ))}
              </select>
            </td>
          );
        })}
      </tr>
    ));
  };

  const renderTeamSection = (team: Team | null, teamId: string, teamName: string, teamColor: string) => {
    const teamMembers = getMembersByTeam(team?.id || null);
    if (teamMembers.length === 0) return null;
    const isExpanded = expandedTeams.has(teamId);

    return (
      <>
        <tr
          className="team-header-row"
          style={{ background: `${teamColor}15`, cursor: 'pointer' }}
          onClick={() => toggleTeamExpanded(teamId)}
        >
          <td colSpan={FISCAL_YEARS.length + 2} style={{ padding: '8px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <div style={{ width: 4, height: 16, background: teamColor, borderRadius: 2 }} />
              <span style={{ fontWeight: 600, color: '#374151' }}>{teamName}</span>
              <span style={{ color: '#6B7280', fontSize: 13 }}>({teamMembers.length}名)</span>
            </div>
          </td>
        </tr>
        {isExpanded && renderMemberRows(teamMembers)}
      </>
    );
  };

  const unassignedMembers = getMembersByTeam(null);

  return (
    <div className="main-content">
      <div className="page-header">
        <h1 className="page-title">メンバ年度評価</h1>
        <p className="page-subtitle">年度別パフォーマンス評価</p>
      </div>

      <div className="card">
        <div className="yearly-eval-table-container">
          <table className="yearly-eval-table">
            <thead>
              <tr>
                <th className="sticky-col">メンバー</th>
                <th className="sticky-col-2">ランク</th>
                {FISCAL_YEARS.map((year) => (
                  <th key={year}>FY{String(year).slice(2)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => renderTeamSection(team, team.id, team.name, team.color))}
              {unassignedMembers.length > 0 && renderTeamSection(null, 'unassigned', '未所属', '#9CA3AF')}
            </tbody>
          </table>
        </div>
      </div>

      {/* 年度別集計 */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">年度別評価分布</h3>
        </div>
        <div className="stats-summary">
          {FISCAL_YEARS.map((year) => {
            const stats = getYearStats(year);
            const total = Object.values(stats).reduce((a, b) => a + b, 0);
            return (
              <div key={year} className="year-stat-card">
                <div className="year-stat-header">FY{String(year).slice(2)}</div>
                <div className="grade-bars">
                  {GRADES.map((grade) => (
                    <div key={grade} className="grade-bar-row">
                      <span
                        className="grade-label"
                        style={{ color: YearlyGradeColors[grade!] }}
                      >
                        {grade}
                      </span>
                      <div className="grade-bar-container">
                        <div
                          className="grade-bar"
                          style={{
                            width: total > 0 ? `${(stats[grade!] / members.length) * 100}%` : '0%',
                            background: YearlyGradeColors[grade!],
                          }}
                        />
                      </div>
                      <span className="grade-count">{stats[grade!]}</span>
                    </div>
                  ))}
                </div>
                <div className="year-stat-footer">
                  評価済: {total}/{members.length}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
