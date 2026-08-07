export interface CfdPoint {
  date: string;
  backlog: number;
  executando: number;
  impedido: number;
  concluido: number;
}

export interface VelocityPoint {
  week: string;
  count: number;
}

export interface LeadTimePoint {
  week: string;
  averageDays: number;
}
