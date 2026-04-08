"use client";

interface Slot {
  time: string;
  staff_id?: string;
}

interface TimeSlotPickerProps {
  slots: Slot[];
  onSelect: (slot: Slot) => void;
  date: string;
  onDateChange: (date: string) => void;
  loading: boolean;
}

// AC-03: Time slot selection component
export default function TimeSlotPicker({ slots, onSelect, date, onDateChange, loading }: TimeSlotPickerProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Available Time Slots</h2>
        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="p-2 border border-gray-300 rounded-md shadow-sm"
        />
      </div>

      {loading ? (
        <div className="text-center py-10">Loading slots...</div>
      ) : slots.length === 0 ? (
        <div className="text-center py-10 bg-gray-100 rounded-lg text-gray-500">No slots available for this date.</div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {slots.map((slot, idx) => (
            <button
              key={idx}
              onClick={() => onSelect(slot)}
              className="py-3 px-2 bg-white border border-gray-200 rounded-lg hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-colors font-medium"
            >
              {new Date(slot.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
