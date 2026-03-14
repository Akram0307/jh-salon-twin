'use client';

interface Option {
  value: string;
  label: string;
}

interface ResponsiveSegmentedControlProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ResponsiveSegmentedControl({ 
  options, 
  value, 
  onChange, 
  className = '' 
}: ResponsiveSegmentedControlProps) {
  return (
    <div className={`grid grid-cols-2 gap-2 sm:inline-flex sm:w-auto ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`min-h-11 w-full px-4 rounded-lg text-sm font-medium transition-colors ${
            value === option.value
              ? 'bg-gold-500 text-slate-950'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default ResponsiveSegmentedControl;
