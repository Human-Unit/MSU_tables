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
  // Fetch every record of a module by paging through the list endpoint. Used by
  // the journal/matrix pages that build a group- or teacher-scoped grid on the
  // client from the full record set.
  listAll: async (module: string, search = ''): Promise<Record<string, any>[]> => {
    const pageSize = 200;
    const all: Record<string, any>[] = [];
    for (let page = 1; page <= 1000; page += 1) {
      const result = (await ListRecords(module, search, page, pageSize)) as PageResult;
      const items = result?.items ?? [];
      all.push(...items);
      const total = result?.total ?? all.length;
      if (items.length === 0 || all.length >= total) break;
    }
    return all;
  },
  get: (module: string, id: string) => GetRecord(module, id) as Promise<Record<string, any>>,
  create: (module: string, payload: Record<string, any>) => CreateRecord(module, payload) as Promise<Record<string, any>>,
  update: (module: string, id: string, payload: Record<string, any>) => UpdateRecord(module, id, payload) as Promise<Record<string, any>>,
  remove: (module: string, id: string) => DeleteRecord(module, id) as Promise<void>,
  options: (module: string) => ListOptions(module) as Promise<OptionItem[]>,
  scheduleFilters: () => ScheduleFilters() as Promise<ScheduleFilterData>,
  weeklySchedule: (facultyId: string, vocationId: string, educationYear: string, groupId: string) =>
    WeeklySchedule(facultyId, vocationId, educationYear, groupId) as Promise<ScheduleEntry[]>,
};
