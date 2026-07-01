import {useEffect, useMemo, useState} from 'react';
import type {ReactNode} from 'react';
import {CalendarRange} from 'lucide-react';

import {Card, CardContent, CardHeader, CardTitle} from '../components/ui/card';
import {Select} from '../components/ui/select';
import {Badge} from '../components/ui/badge';
import {api} from '../services/api';
import {cn} from '../lib/utils';
import {useI18n} from '../i18n';
import type {ScheduleEntry, ScheduleFilterData} from '../types/modules';

const WEEKDAYS = [1, 2, 3, 4, 5, 6];

const lessonBadgeClass: Record<string, string> = {
  lecture: 'bg-indigo-100 text-indigo-700',
  practice: 'bg-emerald-100 text-emerald-700',
  lab: 'bg-amber-100 text-amber-700',
};

const emptyFilters: ScheduleFilterData = {faculties: [], vocations: [], groups: []};

export function WeeklySchedulePage() {
  const {t} = useI18n();

  const [filters, setFilters] = useState<ScheduleFilterData>(emptyFilters);
  const [facultyId, setFacultyId] = useState('');
  const [vocationId, setVocationId] = useState('');
  const [course, setCourse] = useState('');
  const [groupId, setGroupId] = useState('');

  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void api.scheduleFilters().then(setFilters).catch(() => setFilters(emptyFilters));
  }, []);

  // Cascading option lists derived from the loaded filter tree.
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

  // Fetch the timetable whenever the filter combination changes.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .weeklySchedule(facultyId, vocationId, course, groupId)
      .then((rows) => {
        if (!cancelled) setEntries(rows ?? []);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [facultyId, vocationId, course, groupId]);

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

  const showGroupName = groupId === '';

  const pairs = useMemo(() => {
    const maxPair = entries.reduce((max, entry) => Math.max(max, entry.pair), 6);
    return Array.from({length: maxPair}, (_, index) => index + 1);
  }, [entries]);

  // Index entries by "weekday-pair" for O(1) cell lookup.
  const cellMap = useMemo(() => {
    const map = new Map<string, ScheduleEntry[]>();
    for (const entry of entries) {
      const key = `${entry.weekday}-${entry.pair}`;
      const bucket = map.get(key);
      if (bucket) bucket.push(entry);
      else map.set(key, [entry]);
    }
    return map;
  }, [entries]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
          <CalendarRange className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-3xl font-semibold text-slate-950">{t('weekly.title')}</h2>
          <p className="mt-1 text-sm text-slate-500">{t('weekly.subtitle')}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('weekly.title')}</CardTitle>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Filter label={t('weekly.faculty')}>
              <Select value={facultyId} onChange={(event) => onFacultyChange(event.target.value)}>
                <option value="">{t('weekly.allFaculties')}</option>
                {filters.faculties.map((faculty) => (
                  <option key={faculty.id} value={faculty.id}>
                    {faculty.name}
                  </option>
                ))}
              </Select>
            </Filter>

            <Filter label={t('weekly.vocation')}>
              <Select value={vocationId} onChange={(event) => onVocationChange(event.target.value)}>
                <option value="">{t('weekly.allVocations')}</option>
                {availableVocations.map((vocation) => (
                  <option key={vocation.id} value={vocation.id}>
                    {vocation.name}
                  </option>
                ))}
              </Select>
            </Filter>

            <Filter label={t('weekly.course')}>
              <Select value={course} onChange={(event) => onCourseChange(event.target.value)}>
                <option value="">{t('weekly.allCourses')}</option>
                {availableCourses.map((year) => (
                  <option key={year} value={String(year)}>
                    {t('weekly.courseN', {n: year})}
                  </option>
                ))}
              </Select>
            </Filter>

            <Filter label={t('weekly.group')}>
              <Select value={groupId} onChange={(event) => setGroupId(event.target.value)}>
                <option value="">{t('weekly.allGroups')}</option>
                {availableGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </Select>
            </Filter>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="py-10 text-center text-sm text-slate-500">{t('common.loading')}</p>
          ) : entries.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">{t('weekly.empty')}</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="w-24 border-b border-r border-slate-200 px-3 py-3 text-left font-semibold text-slate-600">
                      {t('weekly.pair')}
                    </th>
                    {WEEKDAYS.map((weekday) => (
                      <th
                        key={weekday}
                        className="border-b border-slate-200 px-3 py-3 text-left font-semibold text-slate-700"
                      >
                        {t(`day.${weekday}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pairs.map((pair) => (
                    <tr key={pair} className="align-top">
                      <td className="border-r border-t border-slate-200 px-3 py-3 font-semibold text-slate-500">
                        {pair}
                      </td>
                      {WEEKDAYS.map((weekday) => {
                        const cellEntries = cellMap.get(`${weekday}-${pair}`) ?? [];
                        return (
                          <td key={weekday} className="border-t border-slate-100 px-2 py-2">
                            <div className="space-y-2">
                              {cellEntries.map((entry) => (
                                <LessonCard key={entry.id} entry={entry} showGroup={showGroupName} t={t} />
                              ))}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-4 text-xs text-slate-400">{t('weekly.editHint')}</p>
        </CardContent>
      </Card>
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

function LessonCard({
  entry,
  showGroup,
  t,
}: {
  entry: ScheduleEntry;
  showGroup: boolean;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const lessonType = entry.typeOfLesson;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <p className="font-semibold text-slate-900">{entry.subject?.name ?? '—'}</p>
      <p className="text-xs text-slate-500">{entry.teacher?.fullName ?? '—'}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <Badge className={cn('text-[11px]', lessonBadgeClass[lessonType] ?? 'bg-slate-100 text-slate-600')}>
          {t(`lesson.${lessonType}`)}
        </Badge>
        {entry.auditorium?.number ? (
          <span className="text-[11px] text-slate-500">№ {entry.auditorium.number}</span>
        ) : null}
        {showGroup && entry.group?.name ? (
          <span className="text-[11px] font-medium text-slate-400">{entry.group.name}</span>
        ) : null}
      </div>
    </div>
  );
}
