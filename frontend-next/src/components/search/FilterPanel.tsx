'use client';

import { useState } from 'react';
import { Plus, X, Save, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearch, SearchFilter } from '@/contexts/SearchContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// ============================================
// Filter Configuration
// ============================================

const entityFields: Record<string, { label: string; field: string; type: 'text' | 'number' | 'date' | 'select'; options?: string[] }[]> = {
  clients: [
    { label: 'Name', field: 'name', type: 'text' },
    { label: 'Email', field: 'email', type: 'text' },
    { label: 'Phone', field: 'phone', type: 'text' },
    { label: 'Status', field: 'status', type: 'select', options: ['active', 'inactive', 'vip'] },
    { label: 'Created After', field: 'created_at', type: 'date' },
  ],
  staff: [
    { label: 'Name', field: 'name', type: 'text' },
    { label: 'Role', field: 'role', type: 'select', options: ['stylist', 'manager', 'receptionist', 'owner'] },
    { label: 'Status', field: 'status', type: 'select', options: ['active', 'inactive', 'on_leave'] },
    { label: 'Hired After', field: 'hired_at', type: 'date' },
  ],
  services: [
    { label: 'Name', field: 'name', type: 'text' },
    { label: 'Category', field: 'category', type: 'text' },
    { label: 'Price Min', field: 'price_min', type: 'number' },
    { label: 'Price Max', field: 'price_max', type: 'number' },
    { label: 'Duration Min', field: 'duration_min', type: 'number' },
    { label: 'Duration Max', field: 'duration_max', type: 'number' },
  ],
  appointments: [
    { label: 'Client Name', field: 'client_name', type: 'text' },
    { label: 'Staff Name', field: 'staff_name', type: 'text' },
    { label: 'Service Name', field: 'service_name', type: 'text' },
    { label: 'Status', field: 'status', type: 'select', options: ['scheduled', 'completed', 'cancelled', 'no_show'] },
    { label: 'Date From', field: 'date_from', type: 'date' },
    { label: 'Date To', field: 'date_to', type: 'date' },
  ],
  products: [
    { label: 'Name', field: 'name', type: 'text' },
    { label: 'Category', field: 'category', type: 'text' },
    { label: 'Price Min', field: 'price_min', type: 'number' },
    { label: 'Price Max', field: 'price_max', type: 'number' },
    { label: 'Stock Min', field: 'stock_min', type: 'number' },
    { label: 'Stock Max', field: 'stock_max', type: 'number' },
  ],
};

const operators = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'startsWith', label: 'Starts With' },
  { value: 'endsWith', label: 'Ends With' },
  { value: 'gt', label: 'Greater Than' },
  { value: 'lt', label: 'Less Than' },
  { value: 'gte', label: 'Greater Than or Equal' },
  { value: 'lte', label: 'Less Than or Equal' },
  { value: 'between', label: 'Between' },
];

// ============================================
// FilterPanel Component
// ============================================

interface FilterPanelProps {
  className?: string;
}

export function FilterPanel({ className }: FilterPanelProps) {
  const {
    filters,
    addFilter,
    removeFilter,
    clearFilters,
    activeEntity,
    setActiveEntity,
    savePreset,
  } = useSearch();

  const [isAddingFilter, setIsAddingFilter] = useState(false);
  const [newFilter, setNewFilter] = useState<Partial<SearchFilter>>({
    entity: activeEntity === 'all' ? 'clients' : activeEntity,
    field: '',
    operator: 'contains',
    value: '',
  });
  const [presetName, setPresetName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleAddFilter = () => {
    if (newFilter.entity && newFilter.field && newFilter.operator && newFilter.value !== undefined) {
      addFilter(newFilter as SearchFilter);
      setNewFilter({
        entity: activeEntity === 'all' ? 'clients' : activeEntity,
        field: '',
        operator: 'contains',
        value: '',
      });
      setIsAddingFilter(false);
    }
  };

  const handleSavePreset = () => {
    if (presetName.trim() && filters.length > 0) {
      savePreset(presetName.trim());
      setPresetName('');
      setShowSaveDialog(false);
    }
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

  const getFieldLabel = (entity: string, field: string) => {
    const fieldConfig = entityFields[entity]?.find(f => f.field === field);
    return fieldConfig?.label || field;
  };

  const getOperatorLabel = (operator: string) => {
    const op = operators.find(o => o.value === operator);
    return op?.label || operator;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Entity selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">Search In</label>
        <Select
          value={activeEntity}
          onValueChange={(value) => setActiveEntity(value as any)}
        >
          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
            <SelectValue placeholder="Select entity" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-white hover:bg-slate-700">All Entities</SelectItem>
            <SelectItem value="clients" className="text-white hover:bg-slate-700">Clients</SelectItem>
            <SelectItem value="staff" className="text-white hover:bg-slate-700">Staff</SelectItem>
            <SelectItem value="services" className="text-white hover:bg-slate-700">Services</SelectItem>
            <SelectItem value="appointments" className="text-white hover:bg-slate-700">Appointments</SelectItem>
            <SelectItem value="products" className="text-white hover:bg-slate-700">Products</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active filters */}
      {filters.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-300">Active Filters</label>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-slate-400 hover:text-white h-6 px-2"
            >
              Clear All
            </Button>
          </div>
          <div className="space-y-2">
            {filters.map((filter, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 border border-slate-700"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400">{getEntityLabel(filter.entity)}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-white">{getFieldLabel(filter.entity, filter.field)}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">{getOperatorLabel(filter.operator)}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-white">{String(filter.value)}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFilter(index)}
                  className="h-6 w-6 text-slate-400 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add filter button */}
      {!isAddingFilter ? (
        <Button
          variant="outline"
          onClick={() => setIsAddingFilter(true)}
          className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Filter
        </Button>
      ) : (
        <div className="space-y-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-white">New Filter</h4>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsAddingFilter(false)}
              className="h-6 w-6 text-slate-400 hover:text-white"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Entity */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Entity</label>
            <Select
              value={newFilter.entity || 'clients'}
              onValueChange={(value) => setNewFilter({ ...newFilter, entity: value as any, field: '' })}
            >
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="clients" className="text-white hover:bg-slate-600">Clients</SelectItem>
                <SelectItem value="staff" className="text-white hover:bg-slate-600">Staff</SelectItem>
                <SelectItem value="services" className="text-white hover:bg-slate-600">Services</SelectItem>
                <SelectItem value="appointments" className="text-white hover:bg-slate-600">Appointments</SelectItem>
                <SelectItem value="products" className="text-white hover:bg-slate-600">Products</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Field */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Field</label>
            <Select
              value={newFilter.field || ''}
              onValueChange={(value) => setNewFilter({ ...newFilter, field: value })}
            >
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8">
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {entityFields[newFilter.entity || 'clients']?.map((field) => (
                  <SelectItem
                    key={field.field}
                    value={field.field}
                    className="text-white hover:bg-slate-600"
                  >
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Operator */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Operator</label>
            <Select
              value={newFilter.operator || 'contains'}
              onValueChange={(value) => setNewFilter({ ...newFilter, operator: value as any })}
            >
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {operators.map((op) => (
                  <SelectItem
                    key={op.value}
                    value={op.value}
                    className="text-white hover:bg-slate-600"
                  >
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Value */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Value</label>
            <Input
              type={
                entityFields[newFilter.entity || 'clients']?.find(f => f.field === newFilter.field)?.type === 'number'
                  ? 'number'
                  : entityFields[newFilter.entity || 'clients']?.find(f => f.field === newFilter.field)?.type === 'date'
                  ? 'date'
                  : 'text'
              }
              value={newFilter.value as string || ''}
              onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white h-8"
              placeholder="Enter value"
            />
          </div>

          {/* Add button */}
          <Button
            onClick={handleAddFilter}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-8"
          >
            Add Filter
          </Button>
        </div>
      )}

      {/* Save preset */}
      {filters.length > 0 && (
        <div className="pt-2 border-t border-slate-700">
          <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Save as Preset
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Save Filter Preset</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Preset Name</label>
                  <Input
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="Enter preset name"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowSaveDialog(false)}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSavePreset}
                    disabled={!presetName.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Save Preset
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
