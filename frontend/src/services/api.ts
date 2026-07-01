import {
  CreateRecord,
  DashboardStats,
  DeleteRecord,
  GetRecord,
  ListOptions,
  ListRecords,
  ScheduleFilters,
  UpdateRecord,
  WeeklySchedule,
} from '../../wailsjs/go/main/App';

import type {DashboardStats as DashboardStatsType, OptionItem, PageResult, ScheduleFilterData, ScheduleEntry} from '../types/modules';

export const api = {
  dashboard: () => DashboardStats() as Promise<DashboardStatsType>,
  list: (module: string, search: string, page: number, pageSize: number) => ListRecords(module, search, page, pageSize) as Promise<PageResult>,
  get: (module: string, id: string) => GetRecord(module, id) as Promise<Record<string, any>>,
  create: (module: string, payload: Record<string, any>) => CreateRecord(module, payload) as Promise<Record<string, any>>,
  update: (module: string, id: string, payload: Record<string, any>) => UpdateRecord(module, id, payload) as Promise<Record<string, any>>,
  remove: (module: string, id: string) => DeleteRecord(module, id) as Promise<void>,
  options: (module: string) => ListOptions(module) as Promise<OptionItem[]>,
  scheduleFilters: () => ScheduleFilters() as Promise<ScheduleFilterData>,
  weeklySchedule: (facultyId: string, vocationId: string, educationYear: string, groupId: string) =>
    WeeklySchedule(facultyId, vocationId, educationYear, groupId) as Promise<ScheduleEntry[]>,
};
