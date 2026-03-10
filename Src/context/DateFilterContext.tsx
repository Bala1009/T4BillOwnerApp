import React, { createContext, useContext, useState, useCallback } from 'react';
import type { DateRange, QuickFilter } from '../components';

// ─── Helpers ────────────────────────────────────────────────
function todayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function todayEndOfDay(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Format a Date as "YYYY-MM-DD" for API payloads */
export function formatYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ─── Context types ───────────────────────────────────────────
type DateFilterState = {
  dateRange: DateRange;
  activeFilter: QuickFilter;
};

type DateFilterContextType = DateFilterState & {
  /** Called from CalendarPicker's onDateRangeChange */
  setDateFilter: (range: DateRange, filter: QuickFilter) => void;
  /** Convenience shorthand used by API callers */
  startDate: string;
  endDate: string;
};

// ─── Default value = "Today" range ─────────────────────────────────────
const now = new Date();
const DEFAULT_STATE: DateFilterState = {
  dateRange: {
    start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    end: todayEndOfDay(),
  },
  activeFilter: 'today',
};

const DateFilterContext = createContext<DateFilterContextType>({
  ...DEFAULT_STATE,
  setDateFilter: () => {},
  startDate: formatYMD(DEFAULT_STATE.dateRange.start),
  endDate: formatYMD(DEFAULT_STATE.dateRange.end),
});

// ─── Provider ────────────────────────────────────────────────
export const DateFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<DateFilterState>(DEFAULT_STATE);

  const setDateFilter = useCallback((range: DateRange, filter: QuickFilter) => {
    setState({ dateRange: range, activeFilter: filter });
  }, []);

  const value: DateFilterContextType = {
    ...state,
    setDateFilter,
    startDate: formatYMD(state.dateRange.start),
    endDate: formatYMD(state.dateRange.end),
  };

  return (
    <DateFilterContext.Provider value={value}>
      {children}
    </DateFilterContext.Provider>
  );
};

// ─── Hook ────────────────────────────────────────────────────
export function useDateFilter() {
  return useContext(DateFilterContext);
}
