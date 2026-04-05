'use client';

import { useState } from 'react';
import { Trash2, Download, Tag, ToggleLeft, X, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBulkOperations, BulkAction } from '@/contexts/BulkOperationsContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

// ============================================
// BulkActionBar Component
// ============================================

interface BulkActionBarProps {
  className?: string;
  entityName?: string;
}

export function BulkActionBar({ className, entityName = 'items' }: BulkActionBarProps) {
  const {
    selectedIds,
    isSelecting,
    actions,
    clearSelection,
    executeAction,
    isExecuting,
    executionProgress,
    executionTotal,
  } = useBulkOperations();

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<BulkAction | null>(null);

  const handleActionClick = (action: BulkAction) => {
    if (action.requiresConfirmation) {
      setPendingAction(action);
      setShowConfirmDialog(true);
    } else {
      executeAction(action.id);
    }
  };

  const handleConfirmAction = async () => {
    if (pendingAction) {
      await executeAction(pendingAction.id);
      setShowConfirmDialog(false);
      setPendingAction(null);
    }
  };

  const handleCancelAction = () => {
    setShowConfirmDialog(false);
    setPendingAction(null);
  };

  if (!isSelecting) {
    return null;
  }

  const selectedCount = selectedIds.size;
  const progressPercentage = executionTotal > 0 ? (executionProgress / executionTotal) * 100 : 0;

  return (
    <>
      <div className={cn(
        'fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-700 p-4',
        'transform transition-transform duration-300',
        isSelecting ? 'translate-y-0' : 'translate-y-full',
        className
      )}>
        <div className="max-w-screen-2xl mx-auto">
          {isExecuting ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                  <span className="text-sm text-white">
                    Processing {executionProgress} of {executionTotal} {entityName}...
                  </span>
                </div>
                <span className="text-sm text-slate-400">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Check className="h-4 w-4 text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-white">
                    {selectedCount} {entityName} selected
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear selection
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {actions.map((action) => (
                  <Button
                    key={action.id}
                    variant={action.variant || 'outline'}
                    size="sm"
                    onClick={() => handleActionClick(action)}
                    disabled={action.disabled || isExecuting}
                    className={cn(
                      'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white',
                      action.variant === 'danger' && 'border-red-700 text-red-400 hover:bg-red-900/50 hover:text-red-300'
                    )}
                  >
                    {action.icon && <span className="mr-2">{action.icon}</span>}
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              {pendingAction?.confirmationTitle || 'Confirm Action'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {pendingAction?.confirmationMessage || 
                `Are you sure you want to perform this action on ${selectedCount} ${entityName}?`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleCancelAction}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              className={cn(
                pendingAction?.variant === 'danger' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              )}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
