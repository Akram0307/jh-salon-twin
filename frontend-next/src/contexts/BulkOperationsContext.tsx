'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// ============================================
// Types
// ============================================

interface BulkAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'danger' | 'outline' | 'secondary' | 'ghost' | 'link';
  requiresConfirmation?: boolean;
  confirmationTitle?: string;
  confirmationMessage?: string;
  disabled?: boolean;
}

interface BulkOperationsContextType {
  selectedIds: Set<string>;
  isSelecting: boolean;
  actions: BulkAction[];
  
  // Selection methods
  toggleSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  
  // Action methods
  setActions: (actions: BulkAction[]) => void;
  executeAction: (actionId: string) => Promise<void>;
  
  // State
  isExecuting: boolean;
  executionProgress: number;
  executionTotal: number;
}

// ============================================
// Context
// ============================================

const BulkOperationsContext = createContext<BulkOperationsContextType | undefined>(undefined);

// ============================================
// Provider
// ============================================

interface BulkOperationsProviderProps {
  children: ReactNode;
  onAction?: (actionId: string, selectedIds: string[]) => Promise<void>;
}

export function BulkOperationsProvider({ children, onAction }: BulkOperationsProviderProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actions, setActions] = useState<BulkAction[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [executionTotal, setExecutionTotal] = useState(0);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  const executeAction = useCallback(async (actionId: string) => {
    if (!onAction || selectedIds.size === 0) return;
    
    setIsExecuting(true);
    setExecutionProgress(0);
    setExecutionTotal(selectedIds.size);
    
    try {
      await onAction(actionId, Array.from(selectedIds));
      clearSelection();
    } catch (error) {
      console.error('Bulk action failed:', error);
      throw error;
    } finally {
      setIsExecuting(false);
      setExecutionProgress(0);
      setExecutionTotal(0);
    }
  }, [onAction, selectedIds, clearSelection]);

  const value: BulkOperationsContextType = {
    selectedIds,
    isSelecting: selectedIds.size > 0,
    actions,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    setActions,
    executeAction,
    isExecuting,
    executionProgress,
    executionTotal,
  };

  return (
    <BulkOperationsContext.Provider value={value}>
      {children}
    </BulkOperationsContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useBulkOperations() {
  const context = useContext(BulkOperationsContext);
  if (context === undefined) {
    throw new Error('useBulkOperations must be used within a BulkOperationsProvider');
  }
  return context;
}

// ============================================
// Export types
// ============================================

export type { BulkAction };
