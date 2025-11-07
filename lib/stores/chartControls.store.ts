import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { DateRangeFilter } from "@/lib/utils/dataProcessing";
import { DateRangeOption } from "@/lib/hooks/useDataAccess";

type SectionType = "usage" | "errors" | "response_times";
type StackingType = "all" | "channel" | "process_group" | "marketRoleCode";

interface ChartControlsState {
  // Active section
  activeSection: SectionType;
  
  // Date range controls
  selectedRange: DateRangeOption;
  customDateRange: DateRangeFilter | null;
  
  // Filter controls
  stackingType: StackingType;
  selectedProcess: string;
  selectedChannel: string;
  selectedRole: string;
}

interface ChartControlsActions {
  // Section actions
  setActiveSection: (section: SectionType) => void;
  
  // Date range actions
  setSelectedRange: (range: DateRangeOption) => void;
  setCustomDateRange: (range: DateRangeFilter | null) => void;
  
  // Filter actions
  setStackingType: (type: StackingType) => void;
  setSelectedProcess: (process: string) => void;
  setSelectedChannel: (channel: string) => void;
  setSelectedRole: (role: string) => void;
  clearFilters: () => void;
  
  // Reset action
  reset: () => void;
}

export type ChartControlsStore = ChartControlsState & ChartControlsActions;

const initialState: ChartControlsState = {
  activeSection: "usage",
  selectedRange: "30days",
  customDateRange: null,
  stackingType: "all",
  selectedProcess: "all",
  selectedChannel: "all",
  selectedRole: "all",
};

export const useChartControls = create<ChartControlsStore>()(
  devtools(
    immer((set) => ({
      ...initialState,
      
      setActiveSection: (section) =>
        set((state) => {
          state.activeSection = section;
        }),
      
      setSelectedRange: (range) =>
        set((state) => {
          state.selectedRange = range;
          // Reset custom date range when switching away from custom
          if (range !== "custom") {
            state.customDateRange = null;
          }
        }),
      
      setCustomDateRange: (range) =>
        set((state) => {
          state.customDateRange = range;
        }),
      
      setStackingType: (type) =>
        set((state) => {
          state.stackingType = type;
        }),
      
      setSelectedProcess: (process) =>
        set((state) => {
          state.selectedProcess = process;
        }),
      
      setSelectedChannel: (channel) =>
        set((state) => {
          state.selectedChannel = channel;
        }),
      
      setSelectedRole: (role) =>
        set((state) => {
          state.selectedRole = role;
        }),
      
      clearFilters: () =>
        set((state) => {
          state.stackingType = "all";
          state.selectedProcess = "all";
          state.selectedChannel = "all";
          state.selectedRole = "all";
        }),
      
      reset: () =>
        set(() => ({
          ...initialState,
        })),
    })),
    { name: "chart-controls-store" }
  )
);

// Selector hooks for optimized re-renders
export const useActiveSection = () => useChartControls((state) => state.activeSection);
export const useDateRangeControls = () => useChartControls((state) => ({
  selectedRange: state.selectedRange,
  customDateRange: state.customDateRange,
  setSelectedRange: state.setSelectedRange,
  setCustomDateRange: state.setCustomDateRange,
}));
export const useFilterControls = () => useChartControls((state) => ({
  stackingType: state.stackingType,
  selectedProcess: state.selectedProcess,
  selectedChannel: state.selectedChannel,
  selectedRole: state.selectedRole,
  setStackingType: state.setStackingType,
  setSelectedProcess: state.setSelectedProcess,
  setSelectedChannel: state.setSelectedChannel,
  setSelectedRole: state.setSelectedRole,
  clearFilters: state.clearFilters,
}));

// Helper to check if filters are active
export const useHasActiveFilters = () => 
  useChartControls((state) => 
    state.stackingType !== "all" || 
    state.selectedProcess !== "all" || 
    state.selectedChannel !== "all" || 
    state.selectedRole !== "all"
  );
