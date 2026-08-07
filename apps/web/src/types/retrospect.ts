export interface TagMetric {
  tagId: string;
  tagName: string;
  color: string;
  count: number;
  avgLeadTimeDays: number | null;
}

export interface ColumnTime {
  columnId: string;
  columnName: string;
  avgHours: number;
}

export interface Insight {
  type: "warning" | "info" | "success";
  message: string;
}

export interface RetrospectData {
  periodDays: number;
  totalTickets: number;
  createdInPeriod: number;
  completedInPeriod: number;
  blockedInPeriod: number;
  avgLeadTimeDays: number | null;
  avgCycleTimeDays: number | null;
  tagMetrics: TagMetric[];
  columnTimes: ColumnTime[];
  insights: Insight[];
}
