import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, User, Building2, FileBarChart, Settings, LayoutDashboard, Wallet, Award, X, Calculator } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RankLabels } from '../types';
import './GlobalSearch.css';

interface SearchResult {
  id: string;
  type: 'member' | 'team' | 'page';
  title: string;
  subtitle?: string;
  path: string;
  icon: React.ReactNode;
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { members, teams } = useApp();

  // Static pages for navigation
  const pages: SearchResult[] = [
    { id: 'dashboard', type: 'page', title: 'ダッシュボード', path: '/', icon: <LayoutDashboard size={18} /> },
    { id: 'employees', type: 'page', title: '社員マスタ', subtitle: 'メンバー管理', path: '/employees', icon: <Users size={18} /> },
    { id: 'teams', type: 'page', title: 'チームマスタ', subtitle: 'チーム管理', path: '/teams', icon: <Building2 size={18} /> },
    { id: 'budget', type: 'page', title: '予算管理', subtitle: '単価・給与設定', path: '/budget', icon: <Wallet size={18} /> },
    { id: 'simulation', type: 'page', title: '昇給シミュレーション', subtitle: '翌年度予算計画', path: '/budget-simulation', icon: <Calculator size={18} /> },
    { id: 'evaluation', type: 'page', title: '年度評価', subtitle: '評価入力・管理', path: '/yearly-evaluation', icon: <Award size={18} /> },
    { id: 'reports', type: 'page', title: 'レポート', subtitle: '分析・エクスポート', path: '/reports', icon: <FileBarChart size={18} /> },
    { id: 'settings', type: 'page', title: '設定', subtitle: 'データ管理', path: '/settings', icon: <Settings size={18} /> },
  ];

  // Search results
  const results = useMemo(() => {
    if (!query.trim()) {
      return pages;
    }

    const lowerQuery = query.toLowerCase();
    const matchedResults: SearchResult[] = [];

    // Search pages
    pages.forEach((page) => {
      if (
        page.title.toLowerCase().includes(lowerQuery) ||
        page.subtitle?.toLowerCase().includes(lowerQuery)
      ) {
        matchedResults.push(page);
      }
    });

    // Search members
    members.forEach((member) => {
      if (member.name.toLowerCase().includes(lowerQuery)) {
        const team = teams.find((t) => t.id === member.teamId);
        matchedResults.push({
          id: `member-${member.id}`,
          type: 'member',
          title: member.name,
          subtitle: `${RankLabels[member.rank]}${team ? ` / ${team.name}` : ''}`,
          path: `/employees?highlight=${member.id}`,
          icon: <User size={18} />,
        });
      }
    });

    // Search teams
    teams.forEach((team) => {
      if (team.name.toLowerCase().includes(lowerQuery)) {
        const memberCount = members.filter((m) => m.teamId === team.id).length;
        matchedResults.push({
          id: `team-${team.id}`,
          type: 'team',
          title: team.name,
          subtitle: `${memberCount}名所属`,
          path: `/teams?highlight=${team.id}`,
          icon: <Building2 size={18} />,
        });
      }
    });

    return matchedResults.slice(0, 10);
  }, [query, members, teams, pages]);

  // Keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  const handleSelect = (result: SearchResult) => {
    navigate(result.path);
    setIsOpen(false);
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'member': return 'メンバー';
      case 'team': return 'チーム';
      case 'page': return 'ページ';
    }
  };

  if (!isOpen) {
    return (
      <button className="global-search-trigger" onClick={() => setIsOpen(true)}>
        <Search size={16} />
        <span>検索...</span>
        <kbd>⌘K</kbd>
      </button>
    );
  }

  return (
    <div className="global-search-overlay" onClick={() => setIsOpen(false)}>
      <div className="global-search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="global-search-header">
          <Search size={20} className="search-icon" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="ページ、メンバー、チームを検索..."
            className="global-search-input"
          />
          <button className="global-search-close" onClick={() => setIsOpen(false)}>
            <X size={18} />
          </button>
        </div>
        <div className="global-search-results">
          {results.length === 0 ? (
            <div className="global-search-empty">
              <p>「{query}」に一致する結果がありません</p>
            </div>
          ) : (
            results.map((result, index) => (
              <button
                key={result.id}
                className={`global-search-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className="search-item-icon">{result.icon}</span>
                <div className="search-item-content">
                  <span className="search-item-title">{result.title}</span>
                  {result.subtitle && (
                    <span className="search-item-subtitle">{result.subtitle}</span>
                  )}
                </div>
                <span className="search-item-type">{getTypeLabel(result.type)}</span>
              </button>
            ))
          )}
        </div>
        <div className="global-search-footer">
          <span><kbd>↑↓</kbd> で移動</span>
          <span><kbd>Enter</kbd> で選択</span>
          <span><kbd>Esc</kbd> で閉じる</span>
        </div>
      </div>
    </div>
  );
}
