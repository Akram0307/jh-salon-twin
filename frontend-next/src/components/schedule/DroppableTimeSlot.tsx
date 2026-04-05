'use client';

import { useDroppable } from '@dnd-kit/core';
import { ReactNode } from 'react';

interface DroppableTimeSlotProps {
  id: string;
  time: string;
  day?: string;
  children?: ReactNode;
  className?: string;
}

export function DroppableTimeSlot({ id, time, day, children, className = '' }: DroppableTimeSlotProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { time, day },
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[80px] p-2 border-r border-slate-800 last:border-r-0 transition-colors ${
        isOver ? 'bg-gold-500/10 border-gold-500/30' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default DroppableTimeSlot;
