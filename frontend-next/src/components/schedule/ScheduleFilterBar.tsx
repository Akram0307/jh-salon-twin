'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Users, Calendar, Filter } from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  role?: string;
}

interface ScheduleFilterBarProps {
  staff: StaffMember[];
  selectedStaffId?: string;
  onStaffSelect: (staffId: string | undefined) => void;
  view: 'day' | 'week';
  onViewChange: (view: 'day' | 'week') => void;
  className?: string;
}

export function ScheduleFilterBar({ 
  staff, 
  selectedStaffId, 
  onStaffSelect, 
  view, 
  onViewChange,
  className = '' 
}: ScheduleFilterBarProps) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center ${className}`}>
      {/* Staff Filter */}
      <div className="w-full sm:w-[220px]">
        <div className="flex items-center gap-2 mb-1 sm:mb-0">
          <Users className="h-4 w-4 text-slate-500" />
          <Label className="text-sm text-slate-400">Staff</Label>
        </div>
        <Select
          value={selectedStaffId || 'all'}
          onValueChange={(value) => onStaffSelect(value === 'all' ? undefined : value)}
        >
          <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-white">
            <SelectValue placeholder="All Staff" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">All Staff</SelectItem>
            {staff.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-500" />
                  <span>{member.name}</span>
                  {member.role && (
                    <span className="text-xs text-slate-500">({member.role})</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* View Toggle - Mobile: full width, Desktop: inline */}
      <div className="w-full sm:w-auto">
        <div className="flex items-center gap-2 mb-1 sm:mb-0">
          <Calendar className="h-4 w-4 text-slate-500" />
          <Label className="text-sm text-slate-400">View</Label>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:inline-flex sm:w-auto">
          <button
            onClick={() => onViewChange('day')}
            className={`min-h-11 w-full px-4 rounded-lg text-sm font-medium transition-colors ${
              view === 'day'
                ? 'bg-gold-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => onViewChange('week')}
            className={`min-h-11 w-full px-4 rounded-lg text-sm font-medium transition-colors ${
              view === 'week'
                ? 'bg-gold-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Week
          </button>
        </div>
      </div>
    </div>
  );
}

export default ScheduleFilterBar;
