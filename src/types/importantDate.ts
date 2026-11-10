/** Texto libre guardado en BD; valores legacy (birthday, etc.) siguen siendo válidos al leer. */
export type ImportantDateType = string;

export type ReminderPreset =
  | "same_day"
  | "one_day"
  | "three_days"
  | "one_week"
  | "custom";

export type ImportantDateSyncStatus = "synced" | "pending" | "error";

export interface ImportantDateUser {
  id: number;
  name: string;
  last_name?: string | null;
  email?: string | null;
  is_frequent_client?: boolean;
}

export interface ImportantDate {
  id: number;
  user_id: number | null;
  title: string;
  type: ImportantDateType;
  event_date: string;
  observation: string | null;
  reminder_preset: ReminderPreset;
  reminder_days_before: number | null;
  reminder_time: string | null;
  google_calendar_event_id: string | null;
  sync_status: ImportantDateSyncStatus;
  sync_error: string | null;
  synced_at: string | null;
  created_at: string;
  updated_at: string;
  user: ImportantDateUser | null;
  next_occurrence?: string;
  days_until?: number;
}

export interface ImportantDatePayload {
  user_id?: number | null;
  title: string;
  type: ImportantDateType;
  event_date: string;
  observation?: string;
  reminder_preset: ReminderPreset;
  reminder_days_before?: number | null;
  reminder_time?: string | null;
}

export interface GoogleCalendarStatus {
  configured: boolean;
  connected: boolean;
  google_email: string | null;
  calendar_id: string;
  connected_at: string | null;
}

export type ImportantDateClientFilter = "" | "with" | "without" | "frequent";

export type ImportantDateSyncFilter = ImportantDateSyncStatus | "needs_sync" | "";

export interface ImportantDatesListParams {
  search?: string;
  type?: ImportantDateType | "";
  sync_status?: ImportantDateSyncFilter;
  client?: ImportantDateClientFilter;
  event_month?: number | string;
  within_days?: number | string;
  page?: number;
  per_page?: number;
  calendar?: 1;
  year?: number;
  month?: number;
}

export interface PaginatedImportantDates {
  data: ImportantDate[];
  current_page: number;
  last_page: number;
  total: number;
}
