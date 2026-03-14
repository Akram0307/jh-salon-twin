'use client';

import { useState } from 'react';
import { Trash2, Play, Clock, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearch, SearchPreset } from '@/contexts/SearchContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// ============================================
// SavedPresets Component
// ============================================

interface SavedPresetsProps {
  className?: string;
}

export function SavedPresets({ className }: SavedPresetsProps) {
  const {
    savedPresets,
    loadPreset,
    deletePreset,
    filters,
    search,
  } = useSearch();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [presetToDelete, setPresetToDelete] = useState<SearchPreset | null>(null);

  const handleLoadPreset = (presetId: string) => {
    loadPreset(presetId);
    // Optionally trigger search after loading preset
    // search();
  };

  const handleDeleteClick = (preset: SearchPreset) => {
    setPresetToDelete(preset);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (presetToDelete) {
      deletePreset(presetToDelete.id);
      setShowDeleteDialog(false);
      setPresetToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getEntityLabel = (entity: string) => {
    const labels: Record<string, string> = {
      clients: 'Clients',
      staff: 'Staff',
      services: 'Services',
      appointments: 'Appointments',
      products: 'Products',
    };
    return labels[entity] || entity;
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300">Saved Presets</h3>
        <span className="text-xs text-slate-500">{savedPresets.length} preset{savedPresets.length !== 1 ? 's' : ''}</span>
      </div>

      {savedPresets.length === 0 ? (
        <div className="text-center py-8">
          <Filter className="h-8 w-8 mx-auto text-slate-600 mb-2" />
          <p className="text-sm text-slate-400">No saved presets yet</p>
          <p className="text-xs text-slate-500 mt-1">Save your current filters as a preset to quickly apply them later</p>
        </div>
      ) : (
        <div className="space-y-2">
          {savedPresets.map((preset) => (
            <div
              key={preset.id}
              className="p-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-white truncate">{preset.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-3 w-3 text-slate-500" />
                    <span className="text-xs text-slate-500">{formatDate(preset.createdAt)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {preset.filters.slice(0, 3).map((filter, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-300"
                      >
                        {getEntityLabel(filter.entity)}: {filter.field}
                      </span>
                    ))}
                    {preset.filters.length > 3 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-400">
                        +{preset.filters.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleLoadPreset(preset.id)}
                    className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700"
                    title="Load preset"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(preset)}
                    className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-slate-700"
                    title="Delete preset"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Preset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-300">
              Are you sure you want to delete the preset "{presetToDelete?.name}"?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
