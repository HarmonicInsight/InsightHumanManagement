export type Rank = 'MGR' | 'Scon' | 'CONS';

export type Grade = 'S' | 'A' | 'B' | 'C' | null;

export interface Member {
  id: string;
  name: string;
  rank: Rank;
  evaluation: Evaluation;
  skills: Skills;
}

export interface Evaluation {
  grade: Grade;
  score: number | null;
  summary: string;
  comment: string;
}

export interface Skills {
  consulting: number | null;
  construction: number | null;
  it: number | null;
  sales: number | null;
  management: number | null;
  responsibility: number | null;
  independence: number | null;
}

export const RankLabels: Record<Rank, string> = {
  MGR: 'マネージャー',
  Scon: 'シニアコンサルタント',
  CONS: 'コンサルタント',
};

export const RankColors: Record<Rank, string> = {
  MGR: '#8B5CF6',
  Scon: '#3B82F6',
  CONS: '#10B981',
};

export const GradeColors: Record<string, string> = {
  S: '#F59E0B',
  A: '#3B82F6',
  B: '#10B981',
  C: '#6B7280',
};

export const SkillLabels: Record<keyof Skills, string> = {
  consulting: 'コンサルティング・資料作成',
  construction: '建設業',
  it: 'IT',
  sales: '営業力',
  management: '管理能力',
  responsibility: '責任感',
  independence: '自立性',
};

export const SkillCategories = {
  basic: ['consulting', 'construction', 'it'] as (keyof Skills)[],
  managerPlus: ['sales', 'management'] as (keyof Skills)[],
  seniorPlus: ['responsibility', 'independence'] as (keyof Skills)[],
};
