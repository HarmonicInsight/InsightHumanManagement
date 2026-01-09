export type Rank = 'CONS' | 'Scon' | 'MGR' | 'SMGR';

export type Grade = 'S' | 'A' | 'B' | 'C' | null;

export interface Member {
  id: string;
  name: string;
  rank: Rank;
  teamId: string | null;
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

export interface Team {
  id: string;
  name: string;
  leaderId: string | null;
  color: string;
}

export interface YearData {
  year: number;
  members: Member[];
  teams: Team[];
  budget?: BudgetData;
}

export const RankLabels: Record<Rank, string> = {
  CONS: 'コンサルタント',
  Scon: 'シニアコンサルタント',
  MGR: 'マネージャー',
  SMGR: 'シニアマネージャー',
};

export const RankOrder: Record<Rank, number> = {
  CONS: 1,
  Scon: 2,
  MGR: 3,
  SMGR: 4,
};

export const RankColors: Record<Rank, string> = {
  CONS: '#10B981',
  Scon: '#3B82F6',
  MGR: '#8B5CF6',
  SMGR: '#EC4899',
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

export const TeamColors = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
];

// 予算管理関連の型定義
export interface MonthlySalary {
  [month: number]: number | null; // 1-12月の給与（万円）
}

export interface MemberSalary {
  memberId: string;
  annualSalary: number | null; // 年収（万円）
  monthlySalaries: MonthlySalary; // 月別給与
}

export interface NewHire {
  id: string;
  name: string;
  rank: Rank;
  entryMonth: number; // 入社月 (1-12)
  annualSalary: number; // 年収（万円）
  agentFeeRate: number; // エージェント費用率（%）デフォルト35
  agentFeeOverride: number | null; // 手動入力されたエージェント費用（万円）
}

export interface RankUnitPrice {
  rank: Rank;
  unitPrice: number; // 標準単価（万円/月）
}

export interface BudgetData {
  year: number;
  rankUnitPrices: RankUnitPrice[];
  memberSalaries: MemberSalary[];
  newHires: NewHire[];
}

export const DefaultRankUnitPrices: RankUnitPrice[] = [
  { rank: 'CONS', unitPrice: 80 },
  { rank: 'Scon', unitPrice: 100 },
  { rank: 'MGR', unitPrice: 130 },
  { rank: 'SMGR', unitPrice: 160 },
];

export const DefaultAgentFeeRate = 35; // デフォルトエージェント費用率 35%
