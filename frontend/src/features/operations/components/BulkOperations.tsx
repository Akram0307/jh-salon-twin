import { useState, useCallback } from 'react';
import { 
  CheckSquare, 
  Square, 
  MinusSquare,
  Trash2,
  Download,
  UserCheck,
  UserX,
  MoreHorizontal,
  X
} from 'lucide-react';

type BulkEntityType = 'clients' | 'staff' | 'services';
type BulkAction = 'delete' | 'export' | 'activate' | 'deactivate' | 'archive';

type Entity = {
  id: string;
  name: string;
  status?: string;
  [key: string]: unknown;
};

type BulkOperationsProps = {
  entityType: BulkEntityType;
  entities: Entity[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onBulkAction: (action: BulkAction, ids: string[]) => Promise<void>;
  onExport?: (ids: string[]) => void;
};

const actionConfig: Record<BulkAction, { 
  label: string; 
  icon: React.ElementType; 
  variant: 'danger' | 'primary' | 'secondary';
  requiresConfirmation: boolean;
}> = {
  delete: { label: 'Delete', icon: Trash2, variant: 'danger', requiresConfirmation: true },
  export: { label: 'Export', icon: Download, variant: 'secondary', requiresConfirmation: false },
  activate: { label: 'Activate', icon: UserCheck, variant: 'primary', requiresConfirmation: false },
  deactivate: { label: 'Deactivate', icon: UserX, variant: 'secondary', requiresConfirmation: true },
  archive: { label: 'Archive', icon: MinusSquare, variant: 'secondary', requiresConfirmation: true },
};

const entityActions: Record<BulkEntityType, BulkAction[]> = {
  clients: ['export', 'delete', 'archive'],
  staff: ['export', 'activate', 'deactivate', 'delete'],
  services: ['export', 'activate', 'deactivate', 'delete'],
};

function ConfirmationModal({ 
  action, 
  count, 
  onConfirm, 
  onCancel 
}: { 
  action: BulkAction; 
  count: number; 
  onConfirm: () => void; 
  onCancel: () => void;
}) {
  const config = actionConfig[action];
  const Icon = config.icon;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-zinc-900 p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full 
            ${config.variant === 'danger' ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}
          >
            <Icon className={`h-6 w-6 
              ${config.variant === 'danger' ? 'text-red-400' : 'text-emerald-400'}`}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">Confirm {config.label}</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Are you sure you want to {config.label.toLowerCase()} {count} item{count !== 1 ? 's' : ''}?
              {config.variant === 'danger' && ' This action cannot be undone.'}
            </p>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2 
              text-sm text-zinc-300 hover:bg-white/[0.08] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors
              ${config.variant === 'danger'
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-emerald-500 text-white hover:bg-emerald-600'
              }`}
          >
            {config.label} {count} item{count !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BulkOperations({
  entityType,
  entities,
  selectedIds,
  onSelectionChange,
  onBulkAction,
  onExport,
}: BulkOperationsProps) {
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<BulkAction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const availableActions = entityActions[entityType];
  const selectedCount = selectedIds.size;
  const totalCount = entities.length;

  const isAllSelected = selectedCount === totalCount && totalCount > 0;
  const isIndeterminate = selectedCount > 0 && selectedCount < totalCount;

  const handleToggleAll = useCallback(() => {
    if (isAllSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(entities.map(e => e.id)));
    }
  }, [isAllSelected, entities, onSelectionChange]);

  const handleToggleOne = useCallback((id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    onSelectionChange(newSelection);
  }, [selectedIds, onSelectionChange]);

  const handleActionClick = useCallback((action: BulkAction) => {
    setIsActionMenuOpen(false);
    const config = actionConfig[action];
    
    if (config.requiresConfirmation) {
      setPendingAction(action);
    } else {
      executeAction(action);
    }
  }, [selectedCount]);

  const executeAction = useCallback(async (action: BulkAction) => {
    setIsProcessing(true);
    try {
      if (action === 'export' && onExport) {
        onExport(Array.from(selectedIds));
      } else {
        await onBulkAction(action, Array.from(selectedIds));
      }
      onSelectionChange(new Set());
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setIsProcessing(false);
      setPendingAction(null);
    }
  }, [selectedIds, onBulkAction, onExport, onSelectionChange]);

  const SelectionIcon = isAllSelected ? CheckSquare : isIndeterminate ? MinusSquare : Square;

  if (totalCount === 0) return null;

  return (
    <>
      <div className={`
        flex items-center justify-between rounded-xl border p-4 transition-all
        ${selectedCount > 0 
          ? 'border-emerald-500/30 bg-emerald-500/10' 
          : 'border-white/[0.06] bg-white/[0.02]'
        }
      `}>
        <div className="flex items-center gap-4">
          <button
            onClick={handleToggleAll}
            className="flex h-5 w-5 items-center justify-center text-zinc-400 hover:text-white transition-colors"
            aria-label={isAllSelected ? 'Deselect all' : 'Select all'}
          >
            <SelectionIcon className="h-5 w-5" />
          </button>

          <span className="text-sm text-zinc-400">
            {selectedCount > 0 ? (
              <>
                <span className="font-medium text-white">{selectedCount}</span>
                {' of '} {totalCount} selected
              </>
            ) : (
              `Select ${entityType}`
            )}
          </span>
        </div>

        {selectedCount > 0 && (
          <div className="flex items-center gap-2">
            {availableActions.includes('export') && (
              <button
                onClick={() => handleActionClick('export')}
                disabled={isProcessing}
                className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] 
                  px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/[0.08] transition-colors disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                disabled={isProcessing}
                className="flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-1.5 
                  text-sm font-medium text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                <MoreHorizontal className="h-4 w-4" />
                Actions
              </button>

              {isActionMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border 
                  border-white/[0.08] bg-zinc-900 py-2 shadow-xl z-10">
                  {availableActions.filter(a => a !== 'export').map((action) => {
                    const config = actionConfig[action];
                    const Icon = config.icon;
                    return (
                      <button
                        key={action}
                        onClick={() => handleActionClick(action)}
                        className={`flex w-full items-center gap-2 px-4 py-2 text-sm 
                          transition-colors hover:bg-white/[0.04]
                          ${config.variant === 'danger' ? 'text-red-400' : 'text-zinc-300'}`}
                      >
                        <Icon className="h-4 w-4" />
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={() => onSelectionChange(new Set())}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 
                hover:text-white hover:bg-white/[0.04] transition-colors"
              aria-label="Clear selection"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {pendingAction && (
        <ConfirmationModal
          action={pendingAction}
          count={selectedCount}
          onConfirm={() => executeAction(pendingAction)}
          onCancel={() => setPendingAction(null)}
        />
      )}

      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="rounded-xl border border-white/[0.08] bg-zinc-900 p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              <span className="text-sm text-zinc-300">Processing {selectedCount} items...</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export type { BulkEntityType, BulkAction, Entity, BulkOperationsProps };
