'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Users } from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  role?: string;
}

interface StaffFilterDropdownProps {
  staff: StaffMember[];
  selectedStaffId?: string;
  onSelect: (staffId: string | undefined) => void;
}

export function StaffFilterDropdown({ staff, selectedStaffId, onSelect }: StaffFilterDropdownProps) {
  return (
    <div className="flex items-center gap-2">
      <Label className="text-sm text-slate-400">Staff:</Label>
      <Select 
        value={selectedStaffId || 'all'} 
        onValueChange={(value) => onSelect(value === 'all' ? undefined : value)}
      >
        <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
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
  );
}
export default StaffFilterDropdown;
