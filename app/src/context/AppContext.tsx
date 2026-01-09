import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Member, Team, YearData, BudgetData, MemberSalary, NewHire, RankUnitPrice, MemberYearlyEvaluation, YearlyGrade } from '../types';
import { DefaultRankUnitPrices } from '../types';
import { initialYearData } from '../data/initialData';

interface AppContextType {
  currentYear: number;
  setCurrentYear: (year: number) => void;
  years: number[];
  members: Member[];
  teams: Team[];
  budget: BudgetData | null;
  yearlyEvaluations: MemberYearlyEvaluation[];
  updateMember: (member: Member) => void;
  addMember: (member: Omit<Member, 'id'>) => void;
  deleteMember: (id: string) => void;
  addTeam: (team: Omit<Team, 'id'>) => void;
  updateTeam: (team: Team) => void;
  deleteTeam: (id: string) => void;
  addYear: (year: number) => void;
  copyYearData: (fromYear: number, toYear: number) => void;
  // 予算管理
  updateRankUnitPrices: (prices: RankUnitPrice[]) => void;
  updateMemberSalary: (salary: MemberSalary) => void;
  addNewHire: (hire: Omit<NewHire, 'id'>) => void;
  updateNewHire: (hire: NewHire) => void;
  deleteNewHire: (id: string) => void;
  initializeBudget: () => void;
  getBudgetByYear: (year: number) => BudgetData | null;
  updateRankUnitPricesByYear: (year: number, prices: RankUnitPrice[]) => void;
  // 年度評価
  updateYearlyEvaluation: (memberId: string, year: number, grade: YearlyGrade) => void;
  // データクリーンアップ
  cleanupDuplicateMembers: () => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'insight-hrm-data';
const YEARLY_EVAL_KEY = 'insight-hrm-yearly-eval';

export function AppProvider({ children }: { children: ReactNode }) {
  const [yearlyEvaluations, setYearlyEvaluations] = useState<MemberYearlyEvaluation[]>(() => {
    const saved = localStorage.getItem(YEARLY_EVAL_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [allData, setAllData] = useState<YearData[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [initialYearData];
      }
    }
    return [initialYearData];
  });

  const [currentYear, setCurrentYear] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved) as YearData[];
        return data.length > 0 ? data[data.length - 1].year : 2024;
      } catch {
        return 2024;
      }
    }
    return 2024;
  });

  // 初期ロード時に重複メンバーをクリーンアップ
  useEffect(() => {
    setAllData((prev) => {
      let hasChanges = false;
      const cleaned = prev.map((yearData) => {
        const seenIds = new Set<string>();
        const uniqueMembers = yearData.members.filter((member) => {
          if (seenIds.has(member.id)) {
            hasChanges = true;
            return false;
          }
          seenIds.add(member.id);
          return true;
        });
        return hasChanges ? { ...yearData, members: uniqueMembers } : yearData;
      });
      return hasChanges ? cleaned : prev;
    });
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
  }, [allData]);

  useEffect(() => {
    localStorage.setItem(YEARLY_EVAL_KEY, JSON.stringify(yearlyEvaluations));
  }, [yearlyEvaluations]);

  const years = allData.map((d) => d.year).sort((a, b) => a - b);

  const currentData = allData.find((d) => d.year === currentYear) || initialYearData;
  const members = currentData.members;
  const teams = currentData.teams;
  const budget = currentData.budget || null;

  const updateYearData = useCallback(
    (updater: (data: YearData) => YearData) => {
      setAllData((prev) =>
        prev.map((d) => (d.year === currentYear ? updater(d) : d))
      );
    },
    [currentYear]
  );

  const updateMember = useCallback(
    (member: Member) => {
      updateYearData((data) => ({
        ...data,
        members: data.members.map((m) => (m.id === member.id ? member : m)),
      }));
    },
    [updateYearData]
  );

  const addMember = useCallback(
    (member: Omit<Member, 'id'>) => {
      const id = `member-${Date.now()}`;
      updateYearData((data) => ({
        ...data,
        members: [...data.members, { ...member, id }],
      }));
    },
    [updateYearData]
  );

  const deleteMember = useCallback(
    (id: string) => {
      updateYearData((data) => ({
        ...data,
        members: data.members.filter((m) => m.id !== id),
      }));
    },
    [updateYearData]
  );

  const addTeam = useCallback(
    (team: Omit<Team, 'id'>) => {
      const id = `team-${Date.now()}`;
      updateYearData((data) => ({
        ...data,
        teams: [...data.teams, { ...team, id }],
      }));
    },
    [updateYearData]
  );

  const updateTeam = useCallback(
    (team: Team) => {
      updateYearData((data) => ({
        ...data,
        teams: data.teams.map((t) => (t.id === team.id ? team : t)),
      }));
    },
    [updateYearData]
  );

  const deleteTeam = useCallback(
    (id: string) => {
      updateYearData((data) => ({
        ...data,
        teams: data.teams.filter((t) => t.id !== id),
        members: data.members.map((m) => (m.teamId === id ? { ...m, teamId: null } : m)),
      }));
    },
    [updateYearData]
  );

  const addYear = useCallback((year: number) => {
    setAllData((prev) => {
      if (prev.some((d) => d.year === year)) return prev;
      return [...prev, { year, members: [], teams: [] }];
    });
    setCurrentYear(year);
  }, []);

  const copyYearData = useCallback((fromYear: number, toYear: number) => {
    setAllData((prev) => {
      const sourceData = prev.find((d) => d.year === fromYear);
      if (!sourceData) return prev;

      const newData: YearData = {
        year: toYear,
        members: sourceData.members.map((m) => ({ ...m })),
        teams: sourceData.teams.map((t) => ({ ...t })),
        budget: sourceData.budget
          ? {
              ...sourceData.budget,
              year: toYear,
              memberSalaries: sourceData.budget.memberSalaries.map((s) => ({ ...s })),
              newHires: sourceData.budget.newHires.map((h) => ({ ...h })),
              rankUnitPrices: sourceData.budget.rankUnitPrices.map((p) => ({ ...p })),
            }
          : undefined,
      };

      const existingIndex = prev.findIndex((d) => d.year === toYear);
      if (existingIndex >= 0) {
        return prev.map((d, i) => (i === existingIndex ? newData : d));
      }
      return [...prev, newData];
    });
    setCurrentYear(toYear);
  }, []);

  // 予算管理機能
  const initializeBudget = useCallback(() => {
    updateYearData((data) => {
      if (data.budget) return data;
      return {
        ...data,
        budget: {
          year: currentYear,
          rankUnitPrices: [...DefaultRankUnitPrices],
          memberSalaries: data.members.map((m) => ({
            memberId: m.id,
            annualSalary: null,
            monthlySalaries: {},
          })),
          newHires: [],
        },
      };
    });
  }, [updateYearData, currentYear]);

  const updateRankUnitPrices = useCallback(
    (prices: RankUnitPrice[]) => {
      updateYearData((data) => ({
        ...data,
        budget: data.budget
          ? { ...data.budget, rankUnitPrices: prices }
          : {
              year: currentYear,
              rankUnitPrices: prices,
              memberSalaries: [],
              newHires: [],
            },
      }));
    },
    [updateYearData, currentYear]
  );

  const updateMemberSalary = useCallback(
    (salary: MemberSalary) => {
      updateYearData((data) => {
        if (!data.budget) return data;
        const existingIndex = data.budget.memberSalaries.findIndex(
          (s) => s.memberId === salary.memberId
        );
        let newSalaries: MemberSalary[];
        if (existingIndex >= 0) {
          newSalaries = data.budget.memberSalaries.map((s, i) =>
            i === existingIndex ? salary : s
          );
        } else {
          newSalaries = [...data.budget.memberSalaries, salary];
        }
        return {
          ...data,
          budget: { ...data.budget, memberSalaries: newSalaries },
        };
      });
    },
    [updateYearData]
  );

  const addNewHire = useCallback(
    (hire: Omit<NewHire, 'id'>) => {
      const id = `hire-${Date.now()}`;
      updateYearData((data) => ({
        ...data,
        budget: data.budget
          ? { ...data.budget, newHires: [...data.budget.newHires, { ...hire, id }] }
          : {
              year: currentYear,
              rankUnitPrices: [...DefaultRankUnitPrices],
              memberSalaries: [],
              newHires: [{ ...hire, id }],
            },
      }));
    },
    [updateYearData, currentYear]
  );

  const updateNewHire = useCallback(
    (hire: NewHire) => {
      updateYearData((data) => {
        if (!data.budget) return data;
        return {
          ...data,
          budget: {
            ...data.budget,
            newHires: data.budget.newHires.map((h) => (h.id === hire.id ? hire : h)),
          },
        };
      });
    },
    [updateYearData]
  );

  const deleteNewHire = useCallback(
    (id: string) => {
      updateYearData((data) => {
        if (!data.budget) return data;
        return {
          ...data,
          budget: {
            ...data.budget,
            newHires: data.budget.newHires.filter((h) => h.id !== id),
          },
        };
      });
    },
    [updateYearData]
  );

  const updateYearlyEvaluation = useCallback(
    (memberId: string, year: number, grade: YearlyGrade) => {
      setYearlyEvaluations((prev) => {
        const existingIndex = prev.findIndex((e) => e.memberId === memberId);
        if (existingIndex >= 0) {
          return prev.map((e, i) =>
            i === existingIndex
              ? { ...e, evaluations: { ...e.evaluations, [year]: grade } }
              : e
          );
        } else {
          return [...prev, { memberId, evaluations: { [year]: grade } }];
        }
      });
    },
    []
  );

  // 重複メンバーを削除する
  const cleanupDuplicateMembers = useCallback(() => {
    let totalRemoved = 0;
    setAllData((prev) =>
      prev.map((yearData) => {
        const seenIds = new Set<string>();
        const uniqueMembers = yearData.members.filter((member) => {
          if (seenIds.has(member.id)) {
            totalRemoved++;
            return false;
          }
          seenIds.add(member.id);
          return true;
        });
        return { ...yearData, members: uniqueMembers };
      })
    );
    return totalRemoved;
  }, []);

  const getBudgetByYear = useCallback(
    (year: number): BudgetData | null => {
      const yearData = allData.find((d) => d.year === year);
      return yearData?.budget || null;
    },
    [allData]
  );

  const updateRankUnitPricesByYear = useCallback(
    (year: number, prices: RankUnitPrice[]) => {
      setAllData((prev) =>
        prev.map((d) => {
          if (d.year !== year) return d;
          return {
            ...d,
            budget: d.budget
              ? { ...d.budget, rankUnitPrices: prices }
              : {
                  year,
                  rankUnitPrices: prices,
                  memberSalaries: [],
                  newHires: [],
                },
          };
        })
      );
    },
    []
  );

  return (
    <AppContext.Provider
      value={{
        currentYear,
        setCurrentYear,
        years,
        members,
        teams,
        budget,
        yearlyEvaluations,
        updateMember,
        addMember,
        deleteMember,
        addTeam,
        updateTeam,
        deleteTeam,
        addYear,
        copyYearData,
        updateRankUnitPrices,
        updateMemberSalary,
        addNewHire,
        updateNewHire,
        deleteNewHire,
        initializeBudget,
        getBudgetByYear,
        updateRankUnitPricesByYear,
        updateYearlyEvaluation,
        cleanupDuplicateMembers,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
