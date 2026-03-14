import React from 'react';

interface FilterChip {
  id: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

interface HorizontalFilterChipsProps {
  chips: FilterChip[];
  className?: string;
}

export function HorizontalFilterChips({ chips, className = '' }: HorizontalFilterChipsProps) {
  return (
    <div className={`flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}>
      {chips.map((chip) => (
        <button
          key={chip.id}
          onClick={chip.onClick}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
            chip.active
              ? 'bg-gold-500 text-slate-950'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
