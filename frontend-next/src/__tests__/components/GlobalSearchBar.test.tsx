/**
 * GlobalSearchBar Component Tests
 * Tests for global search functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GlobalSearchBar } from '@/components/search/GlobalSearchBar';
import { SearchProvider } from '@/contexts/SearchContext';

// Mock the SearchContext
const mockOpenSearch = vi.fn();
const mockCloseSearch = vi.fn();
const mockSetQuery = vi.fn();
const mockSearch = vi.fn();
const mockSetActiveTab = vi.fn();
const mockAddToRecentSearches = vi.fn();

interface MockSearchContext {
  isOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  query: string;
  setQuery: (q: string) => void;
  search: () => void;
  isLoading: boolean;
  suggestions: Array<{ id: string; title: string; type: string }>;
  recentSearches: string[];
  addToRecentSearches: (q: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

let mockSearchContext: MockSearchContext = {
  isOpen: true,
  openSearch: mockOpenSearch,
  closeSearch: mockCloseSearch,
  query: '',
  setQuery: mockSetQuery,
  search: mockSearch,
  isLoading: false,
  suggestions: [],
  recentSearches: [],
  addToRecentSearches: mockAddToRecentSearches,
  activeTab: 'all',
  setActiveTab: mockSetActiveTab,
};

// Mock the useSearch hook
vi.mock('@/contexts/SearchContext', () => ({
  useSearch: () => mockSearchContext,
  SearchProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('GlobalSearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock context to default values
    mockSearchContext = {
      isOpen: true,
      openSearch: mockOpenSearch,
      closeSearch: mockCloseSearch,
      query: '',
      setQuery: mockSetQuery,
      search: mockSearch,
      isLoading: false,
      suggestions: [],
      recentSearches: [],
      addToRecentSearches: mockAddToRecentSearches,
      activeTab: 'all',
      setActiveTab: mockSetActiveTab,
    };
  });

  it('renders without crashing', () => {
    render(
      <SearchProvider>
        <GlobalSearchBar />
      </SearchProvider>
    );
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it('displays search input', () => {
    render(
      <SearchProvider>
        <GlobalSearchBar />
      </SearchProvider>
    );
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('calls setQuery when typing', () => {
    render(
      <SearchProvider>
        <GlobalSearchBar />
      </SearchProvider>
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(mockSetQuery).toHaveBeenCalledWith('test');
  });

  it('calls search when pressing enter', () => {
    render(
      <SearchProvider>
        <GlobalSearchBar />
      </SearchProvider>
    );
    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(mockSearch).toHaveBeenCalled();
  });

  it('shows loading state when isLoading is true', () => {
    mockSearchContext.isLoading = true;
    render(
      <SearchProvider>
        <GlobalSearchBar />
      </SearchProvider>
    );
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('displays suggestions when available', () => {
    mockSearchContext.suggestions = [
      { id: '1', title: 'Suggestion 1', type: 'client' },
      { id: '2', title: 'Suggestion 2', type: 'appointment' },
    ];
    render(
      <SearchProvider>
        <GlobalSearchBar />
      </SearchProvider>
    );
    expect(screen.getByText('Suggestion 1')).toBeInTheDocument();
    expect(screen.getByText('Suggestion 2')).toBeInTheDocument();
  });

  it('displays recent searches when available', () => {
    mockSearchContext.recentSearches = ['recent1', 'recent2'];
    render(
      <SearchProvider>
        <GlobalSearchBar />
      </SearchProvider>
    );
    expect(screen.getByText('recent1')).toBeInTheDocument();
    expect(screen.getByText('recent2')).toBeInTheDocument();
  });

  it('calls closeSearch when close button is clicked', () => {
    render(
      <SearchProvider>
        <GlobalSearchBar />
      </SearchProvider>
    );
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    expect(mockCloseSearch).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const { container } = render(
      <SearchProvider>
        <GlobalSearchBar className="custom-class" />
      </SearchProvider>
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
