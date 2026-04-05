'use client';

import { useState } from 'react';
import { User, Users, Scissors, Calendar, Package, ExternalLink, ChevronRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearch } from '@/contexts/SearchContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// ============================================
// Types
// ============================================

interface SearchResult {
  id: string;
  type: 'client' | 'staff' | 'service' | 'appointment' | 'product';
  title: string;
  subtitle?: string;
  description?: string;
  metadata?: Record<string, any>;
  url?: string;
}

// ============================================
// SearchResults Component
// ============================================

interface SearchResultsProps {
  className?: string;
}

export function SearchResults({ className }: SearchResultsProps) {
  const {
    results,
    isLoading,
    query,
    activeEntity,
    suggestions,
  } = useSearch();

  const [selectedResult, setSelectedResult] = useState<string | null>(null);

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'client':
        return <User className="h-4 w-4 text-blue-400" />;
      case 'staff':
        return <Users className="h-4 w-4 text-green-400" />;
      case 'service':
        return <Scissors className="h-4 w-4 text-purple-400" />;
      case 'appointment':
        return <Calendar className="h-4 w-4 text-orange-400" />;
      case 'product':
        return <Package className="h-4 w-4 text-pink-400" />;
      default:
        return <User className="h-4 w-4 text-slate-400" />;
    }
  };

  const getEntityLabel = (type: string) => {
    const labels: Record<string, string> = {
      client: 'Client',
      staff: 'Staff',
      service: 'Service',
      appointment: 'Appointment',
      product: 'Product',
    };
    return labels[type] || type;
  };

  const getEntityColor = (type: string) => {
    const colors: Record<string, string> = {
      client: 'bg-blue-500/20 text-blue-400',
      staff: 'bg-green-500/20 text-green-400',
      service: 'bg-purple-500/20 text-purple-400',
      appointment: 'bg-orange-500/20 text-orange-400',
      product: 'bg-pink-500/20 text-pink-400',
    };
    return colors[type] || 'bg-slate-500/20 text-slate-400';
  };

  const handleResultClick = (result: SearchResult) => {
    setSelectedResult(result.id);
    // Navigate to result URL if available
    if (result.url) {
      window.location.href = result.url;
    }
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <p className="text-sm text-slate-400">Searching...</p>
        </div>
      </div>
    );
  }

  if (!query && results.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center">
            <Search className="h-6 w-6 text-slate-500" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white">Search SalonOS</h3>
            <p className="text-sm text-slate-400 mt-1">
              Search for clients, staff, services, appointments, and products
            </p>
          </div>
          <div className="mt-4 text-xs text-slate-500">
            <p>Try searching for:</p>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              <span className="px-2 py-1 rounded bg-slate-800">client:john</span>
              <span className="px-2 py-1 rounded bg-slate-800">staff:stylist</span>
              <span className="px-2 py-1 rounded bg-slate-800">service:haircut</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (query && results.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center">
            <Search className="h-6 w-6 text-slate-500" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-white">No results found</h3>
            <p className="text-sm text-slate-400 mt-1">
              No results found for "{query}"
            </p>
          </div>
          {suggestions.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-slate-400 mb-2">Did you mean:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Results header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-white">
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </h3>
          {activeEntity !== 'all' && (
            <p className="text-xs text-slate-400 mt-1">
              Filtered by: {getEntityLabel(activeEntity)}
            </p>
          )}
        </div>
        <div className="text-xs text-slate-500">
          Showing {Math.min(results.length, 10)} of {results.length}
        </div>
      </div>

      {/* Results list */}
      <div className="space-y-2">
        {results.slice(0, 10).map((result) => {
          const typedResult = result as SearchResult;
          return (
            <div
              key={typedResult.id}
              onClick={() => handleResultClick(typedResult)}
              className={cn(
                'p-3 rounded-lg border transition-colors cursor-pointer',
                selectedResult === typedResult.id
                  ? 'bg-slate-800 border-blue-500/50'
                  : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getEntityIcon(typedResult.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-white truncate">
                      {typedResult.title}
                    </h4>
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded text-xs',
                      getEntityColor(typedResult.type)
                    )}>
                      {getEntityLabel(typedResult.type)}
                    </span>
                  </div>
                  {typedResult.subtitle && (
                    <p className="text-sm text-slate-400 mt-1 truncate">
                      {typedResult.subtitle}
                    </p>
                  )}
                  {typedResult.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {typedResult.description}
                    </p>
                  )}
                  {typedResult.metadata && Object.keys(typedResult.metadata).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Object.entries(typedResult.metadata).slice(0, 3).map(([key, value]) => (
                        <span
                          key={key}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-300"
                        >
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load more */}
      {results.length > 10 && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Load more results
          </Button>
        </div>
      )}

      {/* Quick actions */}
      {results.length > 0 && (
        <div className="pt-4 border-t border-slate-700">
          <h4 className="text-xs font-medium text-slate-400 mb-2">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="justify-start text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <ExternalLink className="h-3 w-3 mr-2" />
              Export results
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="justify-start text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <Calendar className="h-3 w-3 mr-2" />
              Schedule from results
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
