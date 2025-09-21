'use client';

import { useLocalization } from '@/lib/stores/localization.store';

interface GroupingOption {
  value: string;
  label: string;
}

interface GroupingSelectorProps {
  value: string;
  onChange: (value: string) => void;
  options: GroupingOption[];
  label?: string;
  className?: string;
}

export default function GroupingSelector({
  value,
  onChange,
  options,
  label,
  className = "",
}: GroupingSelectorProps) {
  const { t } = useLocalization();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && (
        <label className="text-xs text-[var(--color-text-secondary)] whitespace-nowrap">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-2 py-1 text-xs border border-[var(--color-separator)] bg-[var(--color-background-level-1)] text-[var(--color-text)] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-[var(--border-radius-default)] min-w-0"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}