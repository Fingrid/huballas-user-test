'use client';

import { useLocalization } from '@/lib/stores/localization.store';
import { useDictionaryStore } from '@/lib/stores';

interface ChannelSelectorProps {
  availableChannels: string[];
  selectedChannels: string[];
  onChange: (selectedChannels: string[]) => void;
  className?: string;
}

export default function ChannelSelector({
  availableChannels,
  selectedChannels,
  onChange,
  className = "",
}: ChannelSelectorProps) {
  const { t } = useLocalization();
  const dictionaryStore = useDictionaryStore();

  const handleChannelToggle = (channel: string) => {
    if (selectedChannels.includes(channel)) {
      // Remove channel from selection
      onChange(selectedChannels.filter(c => c !== channel));
    } else {
      // Add channel to selection
      onChange([...selectedChannels, channel]);
    }
  };

  const handleSelectAll = () => {
    if (selectedChannels.length === availableChannels.length) {
      // Deselect all
      onChange([]);
    } else {
      // Select all
      onChange([...availableChannels]);
    }
  };

  const isAllSelected = selectedChannels.length === availableChannels.length;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-[var(--color-text)]">
          {t('statistics.filters.channels')}
        </h4>
        <button
          onClick={handleSelectAll}
          className="text-xs text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
        >
          {isAllSelected ? t('statistics.filters.deselectAll') : t('statistics.filters.selectAll')}
        </button>
      </div>
      
      <div className="space-y-2">
        {availableChannels.map((channel) => {
          const isSelected = selectedChannels.includes(channel);
          const displayName = dictionaryStore.getChannelDescription(channel);
          
          return (
            <label
              key={channel}
              className="flex items-center gap-2 cursor-pointer text-sm text-[var(--color-text)] hover:bg-[var(--color-background-level-2)] p-1 rounded-[var(--border-radius-default)] transition-colors"
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleChannelToggle(channel)}
                className="w-4 h-4 text-blue-600 border-[var(--color-separator)] rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="flex-1">
                {displayName}
              </span>
              <span className="text-xs text-[var(--color-text-secondary)]">
                ({channel})
              </span>
            </label>
          );
        })}
      </div>
      
      {selectedChannels.length > 0 && (
        <div className="text-xs text-[var(--color-text-secondary)]">
          {selectedChannels.length} of {availableChannels.length} channels selected
        </div>
      )}
    </div>
  );
}