'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, Command, Filter, Bookmark, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearch } from '@/contexts/SearchContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchResults } from './SearchResults';
import { FilterPanel } from './FilterPanel';
import { SavedPresets } from './SavedPresets';

interface GlobalSearchBarProps {
  className?: string;
}

export function GlobalSearchBar({ className }: GlobalSearchBarProps) {
  const {
    isOpen,
    openSearch,
    closeSearch,
    query,
    setQuery,
    search,
    isLoading,
    suggestions,
    recentSearches,
    addToRecentSearches,
    activeTab,
    setActiveTab,
  } = useSearch();

  const [localQuery, setLocalQuery] = useState(query);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalQuery(value);
    setQuery(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (localQuery.trim()) {
        addToRecentSearches(localQuery.trim());
        search();
      }
    }
  };

  const handleClear = () => {
    setLocalQuery('');
    setQuery('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setLocalQuery(suggestion);
    setQuery(suggestion);
    addToRecentSearches(suggestion);
    search();
  };

  const handleRecentClick = (recent: string) => {
    setLocalQuery(recent);
    setQuery(recent);
    search();
  };

  const tabs = [
    { id: 'results', label: 'Results', icon: List },
    { id: 'filters', label: 'Filters', icon: Filter },
    { id: 'presets', label: 'Presets', icon: Bookmark },
  ];

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="outline"
        className="w-full justify-start text-muted-foreground bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 hover:text-white"
        onClick={openSearch}
      >
        <Search className="mr-2 h-4 w-4" />
        <span>Search...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-slate-700 bg-slate-800 px-1.5 font-mono text-[10px] font-medium text-slate-400">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
              <div className="flex items-center border-b border-slate-700 px-4">
                <Search className="h-5 w-5 text-slate-400" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Search clients, staff, services..."
                  value={localQuery}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="flex-1 border-0 bg-transparent text-white placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 h-14 px-4 text-lg"
                />
                {localQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClear}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeSearch}
                  className="ml-2 text-slate-400 hover:text-white"
                >
                  ESC
                </Button>
              </div>

              {/* Tab bar */}
              <div className="flex border-b border-slate-700">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
                        activeTab === tab.id
                          ? 'text-white border-b-2 border-blue-500'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab content */}
              <div className="max-h-96 overflow-y-auto p-4">
                {activeTab === 'results' && (
                  <div>
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                      </div>
                    ) : suggestions.length > 0 ? (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-slate-400">Suggestions</h3>
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-white transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    ) : localQuery ? (
                      <SearchResults />
                    ) : (
                      <div className="space-y-4">
                        {recentSearches.length > 0 && (
                          <div className="space-y-2">
                            <h3 className="text-sm font-medium text-slate-400">Recent Searches</h3>
                            {recentSearches.map((recent, index) => (
                              <button
                                key={index}
                                onClick={() => handleRecentClick(recent)}
                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-white transition-colors flex items-center"
                              >
                                <Search className="h-4 w-4 mr-2 text-slate-400" />
                                {recent}
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="space-y-2">
                          <h3 className="text-sm font-medium text-slate-400">Quick Actions</h3>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => {
                                setLocalQuery('client:');
                                setQuery('client:');
                              }}
                              className="px-3 py-2 rounded-lg hover:bg-slate-800 text-white transition-colors text-left"
                            >
                              <div className="font-medium">Search Clients</div>
                              <div className="text-sm text-slate-400">client:name</div>
                            </button>
                            <button
                              onClick={() => {
                                setLocalQuery('staff:');
                                setQuery('staff:');
                              }}
                              className="px-3 py-2 rounded-lg hover:bg-slate-800 text-white transition-colors text-left"
                            >
                              <div className="font-medium">Search Staff</div>
                              <div className="text-sm text-slate-400">staff:name</div>
                            </button>
                            <button
                              onClick={() => {
                                setLocalQuery('service:');
                                setQuery('service:');
                              }}
                              className="px-3 py-2 rounded-lg hover:bg-slate-800 text-white transition-colors text-left"
                            >
                              <div className="font-medium">Search Services</div>
                              <div className="text-sm text-slate-400">service:name</div>
                            </button>
                            <button
                              onClick={() => {
                                setLocalQuery('appointment:');
                                setQuery('appointment:');
                              }}
                              className="px-3 py-2 rounded-lg hover:bg-slate-800 text-white transition-colors text-left"
                            >
                              <div className="font-medium">Search Appointments</div>
                              <div className="text-sm text-slate-400">appointment:date</div>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'filters' && (
                  <FilterPanel />
                )}

                {activeTab === 'presets' && (
                  <SavedPresets />
                )}
              </div>

              <div className="border-t border-slate-700 px-4 py-3 flex items-center justify-between text-sm text-slate-400">
                <div className="flex items-center">
                  <Command className="h-4 w-4 mr-1" />
                  <span>Press</span>
                  <kbd className="mx-1 px-1.5 py-0.5 rounded bg-slate-800 text-xs">⌘K</kbd>
                  <span>to open search</span>
                </div>
                <div>
                  <span>Press</span>
                  <kbd className="mx-1 px-1.5 py-0.5 rounded bg-slate-800 text-xs">ESC</kbd>
                  <span>to close</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
