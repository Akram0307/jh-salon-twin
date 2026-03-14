'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  color?: string;
}

interface CategoryManagementProps {
  categories?: Category[];
  onAdd?: (category: Omit<Category, 'id'>) => void;
  onEdit?: (id: string, category: Partial<Category>) => void;
  onDelete?: (id: string) => void;
}

export function CategoryManagement({ 
  categories = [], 
  onAdd, 
  onEdit, 
  onDelete 
}: CategoryManagementProps) {
  const [newCategory, setNewCategory] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleAdd = () => {
    if (!newCategory.trim()) return;
    if (onAdd) {
      onAdd({ name: newCategory.trim() });
    }
    setNewCategory('');
  };

  const handleEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditValue(name);
  };

  const handleSaveEdit = (id: string) => {
    if (!editValue.trim()) return;
    if (onEdit) {
      onEdit(id, { name: editValue.trim() });
    }
    setEditingId(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
      <h3 className="text-lg font-semibold text-white mb-4">Service Categories</h3>
      
      <div className="space-y-3 mb-4">
        {categories.map((category) => (
          <div key={category.id} className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3">
            {editingId === category.id ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white h-8"
                  autoFocus
                />
                <Button size="sm" variant="ghost" onClick={() => handleSaveEdit(category.id)}>
                  <Check className="h-4 w-4 text-emerald-400" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 text-slate-400" />
                </Button>
              </div>
            ) : (
              <>
                <span className="text-sm text-white">{category.name}</span>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(category.id, category.name)}>
                    <Edit2 className="h-4 w-4 text-slate-400" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onDelete && onDelete(category.id)}>
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="New category name"
          className="bg-slate-800 border-slate-700 text-white flex-1"
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button onClick={handleAdd} disabled={!newCategory.trim()} className="bg-gold-500 text-slate-950 hover:bg-gold-400">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
export default CategoryManagement;
