'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// ============================================
// Types
// ============================================

export interface SearchFilter {
  entity: 'clients' | 'staff' | 'services' | 'appointments' | 'products';
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte' | 'between';
  value: string | number | boolean | string[] | number[];
}

export interface SearchPreset {
  id: string;
  name: string;
  filters: SearchFilter[];
  createdAt: string;
}

export interface SearchState {
  isOpen: boolean;
  query: string;
  filters: SearchFilter[];
  recentSearches: string[];
  savedPresets: SearchPreset[];
  activeEntity: 'clients' | 'staff' | 'services' | 'appointments' | 'products' | 'all';
  activeTab: 'results' | 'filters' | 'presets';
  isLoading: boolean;
  results: unknown[];
  suggestions: string[];
}

export interface SearchContextType extends SearchState {
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
  setQuery: (query: string) => void;
  addFilter: (filter: SearchFilter) => void;
  removeFilter: (index: number) => void;
  clearFilters: () => void;
  setActiveEntity: (entity: SearchState['activeEntity']) => void;
  setActiveTab: (tab: SearchState['activeTab']) => void;
  savePreset: (name: string) => void;
  loadPreset: (presetId: string) => void;
  deletePreset: (presetId: string) => void;
  addToRecentSearches: (query: string) => void;
  clearRecentSearches: () => void;
  search: () => Promise<void>;
  clearResults: () => void;
}

// ============================================
// Context
// ============================================

const SearchContext = createContext<SearchContextType | undefined>(undefined);

// ============================================
// Provider
// ============================================

const RECENT_SEARCHES_KEY = 'salonos_recent_searches';
const SAVED_PRESETS_KEY = 'salonos_saved_presets';
const MAX_RECENT_SEARCHES = 10;

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SearchState>({
    isOpen: false,
    query: '',
    filters: [],
    recentSearches: [],
    savedPresets: [],
    activeEntity: 'all',
    activeTab: 'results',
    isLoading: false,
    results: [],
    suggestions: [],
  });

  // Load saved data from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedRecent = localStorage.getItem(RECENT_SEARCHES_KEY);
      const savedPresets = localStorage.getItem(SAVED_PRESETS_KEY);

      setState(prev => ({
        ...prev,
        recentSearches: savedRecent ? JSON.parse(savedRecent) : [],
        savedPresets: savedPresets ? JSON.parse(savedPresets) : [],
      }));
    } catch (error) {
      console.error('Failed to load search data from localStorage:', error);
    }
  }, []);

  // Save recent searches to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(state.recentSearches));
  }, [state.recentSearches]);

  // Save presets to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SAVED_PRESETS_KEY, JSON.stringify(state.savedPresets));
  }, [state.savedPresets]);

  // ============================================
  // Actions
  // ============================================

  const openSearch = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: true }));
  }, []);

  const closeSearch = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const toggleSearch = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: !prev.isOpen }));
  }, []);

  const setQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, query }));
  }, []);

  const addFilter = useCallback((filter: SearchFilter) => {
    setState(prev => ({
      ...prev,
      filters: [...prev.filters, filter],
    }));
  }, []);

  const removeFilter = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      filters: prev.filters.filter((_, i) => i !== index),
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setState(prev => ({ ...prev, filters: [] }));
  }, []);

  const setActiveEntity = useCallback((entity: SearchState['activeEntity']) => {
    setState(prev => ({ ...prev, activeEntity: entity }));
  }, []);

  const setActiveTab = useCallback((tab: SearchState['activeTab']) => {
    setState(prev => ({ ...prev, activeTab: tab }));
  }, []);

  const savePreset = useCallback((name: string) => {
    const newPreset: SearchPreset = {
      id: `preset_${Date.now()}`,
      name,
      filters: state.filters,
      createdAt: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      savedPresets: [...prev.savedPresets, newPreset],
    }));
  }, [state.filters]);

  const loadPreset = useCallback((presetId: string) => {
    const preset = state.savedPresets.find(p => p.id === presetId);
    if (preset) {
      setState(prev => ({
        ...prev,
        filters: preset.filters,
      }));
    }
  }, [state.savedPresets]);

  const deletePreset = useCallback((presetId: string) => {
    setState(prev => ({
      ...prev,
      savedPresets: prev.savedPresets.filter(p => p.id !== presetId),
    }));
  }, []);

  const addToRecentSearches = useCallback((query: string) => {
    if (!query.trim()) return;

    setState(prev => {
      const filtered = prev.recentSearches.filter(q => q !== query);
      const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      return { ...prev, recentSearches: updated };
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setState(prev => ({ ...prev, recentSearches: [] }));
  }, []);

  const search = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Build search parameters
      const params = new URLSearchParams();
      if (state.query) params.append('q', state.query);
      if (state.activeEntity !== 'all') params.append('entity', state.activeEntity);
      
      // Add filters
      state.filters.forEach((filter, index) => {
        params.append(`filters[${index}][entity]`, filter.entity);
        params.append(`filters[${index}][field]`, filter.field);
        params.append(`filters[${index}][operator]`, filter.operator);
        params.append(`filters[${index}][value]`, String(filter.value));
      });

      // Call search API
      const response = await fetch(`/api/search?${params.toString()}`);
      const data = await response.json();

      setState(prev => ({
        ...prev,
        results: data.results || [],
        suggestions: data.suggestions || [],
        isLoading: false,
      }));

      // Add to recent searches
      if (state.query) {
        addToRecentSearches(state.query);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.query, state.activeEntity, state.filters, addToRecentSearches]);

  const clearResults = useCallback(() => {
    setState(prev => ({ ...prev, results: [], suggestions: [] }));
  }, []);

  // ============================================
  // Keyboard shortcut
  // ============================================

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        toggleSearch();
      }

      // Escape to close search
      if (event.key === 'Escape' && state.isOpen) {
        closeSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSearch, closeSearch, state.isOpen]);

  // ============================================
  // Context value
  // ============================================

  const value: SearchContextType = {
    ...state,
    openSearch,
    closeSearch,
    toggleSearch,
    setQuery,
    addFilter,
    removeFilter,
    clearFilters,
    setActiveEntity,
    setActiveTab,
    savePreset,
    loadPreset,
    deletePreset,
    addToRecentSearches,
    clearRecentSearches,
    search,
    clearResults,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}

export default SearchContext;
