/**
 * GlobalSearchBar Component Tests
 * Tests for search functionality, keyboard navigation, and results display
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GlobalSearchBar } from '@/components/search/GlobalSearchBar';

// Mock fetch for search API
global.fetch = vi.fn();

describe('GlobalSearchBar', () => {
  const defaultProps = {
    onResultSelect: vi.fn(),
    placeholder: 'Search clients, appointments...',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        results: [
          { id: '1', type: 'client', name: 'John Doe', subtitle: 'Regular client' },
          { id: '2', type: 'appointment', name: 'Haircut - 10:00 AM', subtitle: 'Tomorrow' },
        ],
      }),
    });
  });

  it('renders without crashing', () => {
    render(<GlobalSearchBar {...defaultProps} />);
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it('displays custom placeholder', () => {
    render(<GlobalSearchBar {...defaultProps} placeholder="Find anything..." />);
    expect(screen.getByPlaceholderText('Find anything...')).toBeInTheDocument();
  });

  it('shows search input that accepts text', () => {
    render(<GlobalSearchBar {...defaultProps} />);
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: 'John' } });
    expect(input).toHaveValue('John');
  });

  it('triggers search on input change', async () => {
    render(<GlobalSearchBar {...defaultProps} />);
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: 'John' } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('displays search results', async () => {
    render(<GlobalSearchBar {...defaultProps} />);
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: 'John' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Haircut - 10:00 AM')).toBeInTheDocument();
    });
  });

  it('calls onResultSelect when a result is clicked', async () => {
    render(<GlobalSearchBar {...defaultProps} />);
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: 'John' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('John Doe'));
    expect(defaultProps.onResultSelect).toHaveBeenCalled();
  });

  it('shows loading state while searching', async () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves
    render(<GlobalSearchBar {...defaultProps} />);
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: 'John' } });

    await waitFor(() => {
      expect(screen.getByTestId('search-loading') || screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  it('clears search when clear button is clicked', async () => {
    render(<GlobalSearchBar {...defaultProps} />);
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: 'John' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const clearButton = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearButton);
    expect(input).toHaveValue('');
  });

  it('navigates results with keyboard', async () => {
    render(<GlobalSearchBar {...defaultProps} />);
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: 'John' } });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Press arrow down to select first result
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    // Press Enter to select
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(defaultProps.onResultSelect).toHaveBeenCalled();
  });

  it('shows no results message when search returns empty', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: [] }),
    });
    render(<GlobalSearchBar {...defaultProps} />);
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: 'xyz123' } });

    await waitFor(() => {
      expect(screen.getByText(/no results/i)).toBeInTheDocument();
    });
  });
});
