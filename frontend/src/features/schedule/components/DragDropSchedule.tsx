import { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarClock, GripVertical, Clock, User, Scissors } from 'lucide-react';
import { glass, semantic } from '../../../lib/design-tokens';

type Appointment = {
  id: string;
  client_name: string;
  service_name: string;
  staff_name: string;
  start_time: string;
  status: string;
  duration?: number;
};

type DragDropScheduleProps = {
  appointments: Appointment[];
  onReorder?: (appointments: Appointment[]) => void;
  onReschedule?: (appointmentId: string, newTime: string) => void;
};

// Status badge colors
const statusColors: Record<string, { bg: string; text: string }> = {
  confirmed: { bg: 'bg-emerald-500/20', text: 'text-emerald-300' },
  'in-progress': { bg: 'bg-blue-500/20', text: 'text-blue-300' },
  pending: { bg: 'bg-amber-500/20', text: 'text-amber-300' },
  completed: { bg: 'bg-zinc-500/20', text: 'text-zinc-300' },
  cancelled: { bg: 'bg-red-500/20', text: 'text-red-300' },
};

// Sortable appointment item
function SortableAppointment({ appointment, isOverlay = false }: { appointment: Appointment; isOverlay?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: appointment.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const statusColor = statusColors[appointment.status] || statusColors.pending;
  const formattedTime = appointment.start_time 
    ? new Date(appointment.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-3 rounded-xl border p-4 transition-all
        ${isDragging || isOverlay 
          ? 'border-emerald-500/40 bg-emerald-500/10 shadow-lg shadow-emerald-500/10 scale-[1.02]' 
          : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1]'
        }
      `}
      {...attributes}
    >
      {/* Drag Handle */}
      <button
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50 transition-colors cursor-grab active:cursor-grabbing touch-none"
        {...listeners}
        aria-label="Drag to reschedule"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Time */}
      <div className="flex items-center gap-2 min-w-[80px]">
        <Clock className="h-4 w-4 text-zinc-500" />
        <span className="text-sm font-medium text-white">{formattedTime}</span>
      </div>

      {/* Client & Service */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-zinc-500" />
          <span className="text-sm font-medium text-white truncate">{appointment.client_name}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Scissors className="h-3 w-3 text-zinc-600" />
          <span className="text-xs text-zinc-400 truncate">{appointment.service_name}</span>
        </div>
      </div>

      {/* Staff */}
      <div className="hidden sm:block">
        <span className="text-xs text-zinc-400">{appointment.staff_name}</span>
      </div>

      {/* Status Badge */}
      <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-medium ${statusColor.bg} ${statusColor.text}`}>
        {appointment.status}
      </span>
    </div>
  );
}

// Main DragDropSchedule component
export default function DragDropSchedule({ appointments, onReorder, onReschedule }: DragDropScheduleProps) {
  const [items, setItems] = useState<Appointment[]>(appointments);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Update items when appointments prop changes
  useEffect(() => {
    setItems(appointments);
  }, [appointments]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Call the onReorder callback if provided
        if (onReorder) {
          onReorder(newItems);
        }
        
        return newItems;
      });
    }
  }, [onReorder]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  // Find the active appointment for the drag overlay
  const activeAppointment = activeId 
    ? items.find((item) => item.id === activeId)
    : null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Today's Schedule</h3>
        </div>
        <span className="text-xs text-zinc-500">Drag to reorder</span>
      </div>

      {/* Sortable List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((appointment) => (
              <SortableAppointment key={appointment.id} appointment={appointment} />
            ))}
          </div>
        </SortableContext>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeAppointment ? (
            <SortableAppointment appointment={activeAppointment} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
          <CalendarClock className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-400">No appointments scheduled for today</p>
        </div>
      )}
    </div>
  );
}

// Export types for external use
export type { Appointment, DragDropScheduleProps };
