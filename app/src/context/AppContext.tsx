import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Member, Team, YearData } from '../types';
import { initialYearData } from '../data/initialData';

interface AppContextType {
  currentYear: number;
  setCurrentYear: (year: number) => void;
  years: number[];
  members: Member[];
  teams: Team[];
  updateMember: (member: Member) => void;
  addMember: (member: Omit<Member, 'id'>) => void;
  deleteMember: (id: string) => void;
  addTeam: (team: Omit<Team, 'id'>) => void;
  updateTeam: (team: Team) => void;
  deleteTeam: (id: string) => void;
  addYear: (year: number) => void;
  copyYearData: (fromYear: number, toYear: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'insight-hrm-data';

export function AppProvider({ children }: { children: ReactNode }) {
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
  }, [allData]);

  const years = allData.map((d) => d.year).sort((a, b) => a - b);

  const currentData = allData.find((d) => d.year === currentYear) || initialYearData;
  const members = currentData.members;
  const teams = currentData.teams;

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
      };

      const existingIndex = prev.findIndex((d) => d.year === toYear);
      if (existingIndex >= 0) {
        return prev.map((d, i) => (i === existingIndex ? newData : d));
      }
      return [...prev, newData];
    });
    setCurrentYear(toYear);
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentYear,
        setCurrentYear,
        years,
        members,
        teams,
        updateMember,
        addMember,
        deleteMember,
        addTeam,
        updateTeam,
        deleteTeam,
        addYear,
        copyYearData,
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
