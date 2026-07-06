import {useEffect, useMemo, useState} from 'react';
import type {ReactNode} from 'react';

import {Select} from '../ui/select';
import {api} from '../../services/api';
import {useI18n} from '../../i18n';
import type {GroupOption, ScheduleFilterData} from '../../types/modules';

const emptyFilters: ScheduleFilterData = {faculties: [], vocations: [], groups: []};

// useGroupFilters powers the cascading faculty -> vocation -> course -> group
// selector shared by the attendance and academic-performance journal pages. It
// mirrors the logic used by the weekly schedule so every group-scoped page
// filters the same way.
export function useGroupFilters() {
  const [filters, setFilters] = useState<ScheduleFilterData>(emptyFilters);
  const [facultyId, setFacultyId] = useState('');
  const [vocationId, setVocationId] = useState('');
  const [course, setCourse] = useState('');
  const [groupId, setGroupId] = useState('');

  useEffect(() => {
    void api.scheduleFilters().then(setFilters).catch(() => setFilters(emptyFilters));
  }, []);

  const availableVocations = useMemo(
    () => filters.vocations.filter((vocation) => !facultyId || vocation.facultyId === facultyId),
    [filters.vocations, facultyId],
  );

  const groupsForScope = useMemo(() => {
    const vocationIds = new Set(availableVocations.map((vocation) => vocation.id));
    return filters.groups.filter((group) => {
      if (vocationId) return group.vocationId === vocationId;
      if (facultyId) return vocationIds.has(group.vocationId);
      return true;
    });
  }, [filters.groups, availableVocations, facultyId, vocationId]);

  const availableCourses = useMemo(() => {
    const years = new Set(groupsForScope.map((group) => group.educationYear));
    return Array.from(years).sort((a, b) => a - b);
  }, [groupsForScope]);

  const availableGroups = useMemo(
    () => groupsForScope.filter((group) => !course || String(group.educationYear) === course),
    [groupsForScope, course],
  );

  const selectedGroup = useMemo(
    () => filters.groups.find((group) => group.id === groupId) ?? null,
    [filters.groups, groupId],
  );

  function onFacultyChange(value: string) {
    setFacultyId(value);
    setVocationId('');
    setCourse('');
    setGroupId('');
  }

  function onVocationChange(value: string) {
    setVocationId(value);
    setCourse('');
    setGroupId('');
  }

  function onCourseChange(value: string) {
    setCourse(value);
    setGroupId('');
  }

  return {
    filters,
    facultyId,
    vocationId,
    course,
    groupId,
    availableVocations,
    availableCourses,
    availableGroups,
    selectedGroup,
    onFacultyChange,
    onVocationChange,
    onCourseChange,
    setGroupId,
  };
}

export type GroupFiltersState = ReturnType<typeof useGroupFilters>;

// GroupFilters renders the four cascading selectors driven by useGroupFilters.
export function GroupFilters({state}: {state: GroupFiltersState}) {
  const {t} = useI18n();
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Filter label={t('weekly.faculty')}>
        <Select value={state.facultyId} onChange={(event) => state.onFacultyChange(event.target.value)}>
          <option value="">{t('weekly.allFaculties')}</option>
          {state.filters.faculties.map((faculty) => (
            <option key={faculty.id} value={faculty.id}>
              {faculty.name}
            </option>
          ))}
        </Select>
      </Filter>

      <Filter label={t('weekly.vocation')}>
        <Select value={state.vocationId} onChange={(event) => state.onVocationChange(event.target.value)}>
          <option value="">{t('weekly.allVocations')}</option>
          {state.availableVocations.map((vocation) => (
            <option key={vocation.id} value={vocation.id}>
              {vocation.name}
            </option>
          ))}
        </Select>
      </Filter>

      <Filter label={t('weekly.course')}>
        <Select value={state.course} onChange={(event) => state.onCourseChange(event.target.value)}>
          <option value="">{t('weekly.allCourses')}</option>
          {state.availableCourses.map((year) => (
            <option key={year} value={String(year)}>
              {t('weekly.courseN', {n: year})}
            </option>
          ))}
        </Select>
      </Filter>

      <Filter label={t('weekly.group')}>
        <Select value={state.groupId} onChange={(event) => state.setGroupId(event.target.value)}>
          <option value="">{t('journal.selectGroup')}</option>
          {state.availableGroups.map((group: GroupOption) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </Select>
      </Filter>
    </div>
  );
}

function Filter({label, children}: {label: string; children: ReactNode}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">{label}</label>
      {children}
    </div>
  );
}
