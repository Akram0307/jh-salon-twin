import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, Calendar, Users, Scissors, Settings, FileText, BarChart3, ArrowRight, X } from 'lucide-react';

type SearchResultType = 'client' | 'appointment' | 'service' | 'staff' | 'page' | 'action';

type SearchResult = {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  url?: string;
};

type SearchCategory = {
  id: string;
  label: string;
  icon: React.ElementType;
  items: SearchResult[];
};

const typeIcons: Record<SearchResultType, React.ElementType> = {
  client: Users,
  appointment: Calendar,
  service: Scissors,
  staff: Users,
  page: FileText,
  action: ArrowRight,
};

const typeColors: Record<SearchResultType, string> = {
  client: 'text-blue-400 bg-blue-500/20',
  appointment: 'text-emerald-400 bg-emerald-500/20',
  service: 'text-purple-400 bg-purple-500/20',
  staff: 'text-amber-400 bg-amber-500/20',
  page: 'text-zinc-400 bg-zinc-500/20',
  action: 'text-rose-400 bg-rose-500/20',
};

const sampleData: SearchResult[] = [
  { id: 'c1', type: 'client', title: 'Priya Sharma', subtitle: 'Last visit: 2 days ago', icon: Users, url: '/clients/c1' },
  { id: 'c2', type: 'client', title: 'Ananya Patel', subtitle: 'VIP Client', icon: Users, url: '/clients/c2' },
  { id: 'a1', type: 'appointment', title: 'Haircut - Priya Sharma', subtitle: 'Today, 2:00 PM', icon: Calendar, url: '/schedule/a1' },
  { id: 's1', type: 'service', title: 'Haircut', subtitle: '₹500', icon: Scissors, url: '/services/s1' },
  { id: 's2', type: 'service', title: 'Hair Coloring', subtitle: '₹1,500', icon: Scissors, url: '/services/s2' },
  { id: 'st1', type: 'staff', title: 'Meera Singh', subtitle: 'Senior Stylist', icon: Users, url: '/staff/st1' },
  { id: 'p1', type: 'page', title: 'Dashboard', subtitle: 'Overview & KPIs', icon: BarChart3, url: '/owner/dashboard' },
  { id: 'p2', type: 'page', title: 'Schedule', subtitle: 'Appointments', icon: Calendar, url: '/owner/schedule' },
  { id: 'p3', type: 'page', title: 'Settings', subtitle: 'Configuration', icon: Settings, url: '/owner/settings' },
  { id: 'act1', type: 'action', title: 'New Appointment', subtitle: 'Book appointment', icon: Calendar, url: '/schedule/new' },
  { id: 'act2', type: 'action', title: 'Add Client', subtitle: 'Register client', icon: Users, url: '/clients/new' },
];

function fuzzyMatch(query: string, text: string): boolean {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  if (textLower.includes(queryLower)) return true;
  let queryIdx = 0;
  for (let i = 0; i < textLower.length && queryIdx < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIdx]) queryIdx++;
  }
  return queryIdx === queryLower.length;
}

function SearchResultItem({ result, isSelected, onSelect }: { result: SearchResult; isSelected: boolean; onSelect: () => void }) {
  const Icon = result.icon;
  const colorClass = typeColors[result.type];
  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors
        ${isSelected ? 'bg-emerald-500/20 border border-emerald-500/30' : 'hover:bg-white/[0.04] border border-transparent'}`}
    >
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">{result.title}</div>
        {result.subtitle && <div className="text-xs text-zinc-500 truncate">{result.subtitle}</div>}
      </div>
      <div className="text-xs text-zinc-600 capitalize">{result.type}</div>
    </button>
  );
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setQuery('');
        setSelectedIndex(0);
      }
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  const filteredResults = useMemo(() => {
    if (!query.trim()) return sampleData.slice(0, 8);
    return sampleData.filter((item) => fuzzyMatch(query, item.title) || fuzzyMatch(query, item.subtitle || ''));
  }, [query]);

  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    filteredResults.forEach((result) => {
      const category = result.type;
      if (!groups[category]) groups[category] = [];
      groups[category].push(result);
    });
    return Object.entries(groups).map(([type, items]) => ({
      id: type,
      label: type.charAt(0).toUpperCase() + type.slice(1) + 's',
      icon: typeIcons[type as SearchResultType],
      items,
    }));
  }, [filteredResults]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const totalItems = filteredResults.length;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setSelectedIndex((prev) => (prev + 1) % totalItems); break;
      case 'ArrowUp': e.preventDefault(); setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems); break;
      case 'Enter': e.preventDefault(); if (filteredResults[selectedIndex]?.url) window.location.href = filteredResults[selectedIndex].url!; setIsOpen(false); break;
    }
  }, [filteredResults, selectedIndex]);

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-300 transition-colors">
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:flex items-center gap-0.5 ml-2 text-[10px] text-zinc-500">
          <span className="rounded border border-white/[0.1] bg-white/[0.04] px-1.5 py-0.5">⌘</span>
          <span className="rounded border border-white/[0.1] bg-white/[0.04] px-1.5 py-0.5">K</span>
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      <div className="relative w-full max-w-2xl mx-4">
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-white/[0.06] px-4">
            <Search className="h-5 w-5 text-zinc-500" />
            <input ref={inputRef} type="text" value={query} onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }} onKeyDown={handleKeyDown} placeholder="Search clients, appointments, services..." className="flex-1 bg-transparent py-4 text-sm text-white placeholder-zinc-500 outline-none" />
            <button onClick={() => setIsOpen(false)} className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors"><X className="h-4 w-4" /></button>
          </div>
          <div className="max-h-[400px] overflow-y-auto p-2">
            {groupedResults.length === 0 ? (
              <div className="py-8 text-center"><Search className="h-8 w-8 text-zinc-600 mx-auto mb-3" /><p className="text-sm text-zinc-400">No results found for "{query}"</p></div>
            ) : (
              groupedResults.map((category) => (
                <div key={category.id} className="mb-4 last:mb-0">
                  <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
                    <category.icon className="h-3.5 w-3.5 text-zinc-500" />
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{category.label}</span>
                  </div>
                  {category.items.map((result) => {
                    const globalIndex = filteredResults.indexOf(result);
                    return <SearchResultItem key={result.id} result={result} isSelected={globalIndex === selectedIndex} onSelect={() => { window.location.href = result.url || '#'; setIsOpen(false); }} />;
                  })}
                </div>
              ))
            )}
          </div>
          <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-2.5">
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1"><kbd className="rounded border border-white/[0.1] bg-white/[0.04] px-1.5 py-0.5">↑↓</kbd> Navigate</span>
              <span className="flex items-center gap-1"><kbd className="rounded border border-white/[0.1] bg-white/[0.04] px-1.5 py-0.5">↵</kbd> Select</span>
              <span className="flex items-center gap-1"><kbd className="rounded border border-white/[0.1] bg-white/[0.04] px-1.5 py-0.5">esc</kbd> Close</span>
            </div>
            <span className="text-xs text-zinc-600">{filteredResults.length} results</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  return { isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false), toggle: () => setIsOpen((prev) => !prev) };
}
