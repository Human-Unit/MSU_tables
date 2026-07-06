import {useEffect, useMemo, useState} from 'react';
import type {ReactNode} from 'react';
import {CalendarRange, Clock, MapPin, Plus, User} from 'lucide-react';

import {Button} from '../components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '../components/ui/card';
import {Select} from '../components/ui/select';
import {Badge} from '../components/ui/badge';
import {RecordFormDialog} from '../components/RecordFormDialog';
import {api} from '../services/api';
import {cn} from '../lib/utils';
import {useI18n} from '../i18n';
import type {ModuleConfig, ScheduleEntry, ScheduleFilterData} from '../types/modules';
 
 const WEEKDAYS = [1, 2, 3, 4, 5, 6];
 
 // Schedule module config for the edit/add dialog - defined locally since the schedule
 // module page was removed while keeping the weekly schedule page.
 const scheduleConfig: ModuleConfig = {
   key: 'schedule',
   title: 'Schedule',
   subtitle: 'Manage weekly lesson timetable entries.',
   searchPlaceholder: 'Search schedule...',
   columns: [{key: 'weekday', label: 'col.weekday'}, {key: 'pair', label: 'col.pair'}, {key: 'subject.name', label: 'col.subject'}, {key: 'group.name', label: 'col.group'}],
   fields: [
     {name: 'weekday', label: 'field.weekday', type: 'select', required: true, valueType: 'number', options: [
       {id: '1', label: 'day.1'},
       {id: '2', label: 'day.2'},
       {id: '3', label: 'day.3'},
       {id: '4', label: 'day.4'},
       {id: '5', label: 'day.5'},
       {id: '6', label: 'day.6'},
     ]},
     {name: 'pair', label: 'field.pair', type: 'number', required: true, min: 1, max: 8},
     {name: 'subjectId', label: 'field.subject', type: 'select', source: 'subject', required: true},
     {name: 'teacherId', label: 'field.teacher', type: 'select', source: 'teachers', required: true},
     {name: 'typeOfLesson', label: 'field.lessonType', type: 'select', required: true, options: [
       {id: 'lecture', label: 'opt.lecture'},
       {id: 'practice', label: 'opt.practice'},
       {id: 'lab', label: 'opt.lab'},
     ]},
     {name: 'auditoriumId', label: 'field.auditorium', type: 'select', source: 'auditorium'},
     {name: 'groupId', label: 'field.group', type: 'select', source: 'group', required: true},
   ],
 };
const lessonBadgeClass: Record<string, string> = {
  lecture: 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200',
  practice: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  lab: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
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
  const [refreshTick, setRefreshTick] = useState(0);

  // Schedule edit/add dialog state.
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [addInitial, setAddInitial] = useState<Record<string, any> | undefined>(undefined);

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

  // Fetch the timetable whenever the filter combination (or a save) changes.
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
  }, [facultyId, vocationId, course, groupId, refreshTick]);

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

  function reload() {
    setRefreshTick((tick) => tick + 1);
  }

  function openEdit(id: string) {
    setEditId(id);
    setAddInitial(undefined);
    setFormOpen(true);
  }

  function openAdd(prefill?: {weekday?: number; pair?: number}) {
    setEditId(null);
    setAddInitial({
      ...(groupId ? {groupId} : {}),
      ...(prefill?.weekday ? {weekday: prefill.weekday} : {}),
      ...(prefill?.pair ? {pair: prefill.pair} : {}),
    });
    setFormOpen(true);
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <CalendarRange className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-3xl font-semibold text-slate-950">{t('weekly.title')}</h2>
            <p className="mt-1 text-sm text-slate-500">{t('weekly.subtitle')}</p>
          </div>
        </div>
        <Button className="gap-2" onClick={() => openAdd()}>
          <Plus className="h-4 w-4" />
          {t('weekly.addLesson')}
        </Button>
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
                          <td key={weekday} className="group border-t border-slate-100 px-2 py-2">
                            <div className="space-y-2">
                              {cellEntries.map((entry) => (
                                <LessonCard
                                  key={entry.id}
                                  entry={entry}
                                  showGroup={showGroupName}
                                  onClick={() => openEdit(entry.id)}
                                  t={t}
                                />
                              ))}
                              <button
                                type="button"
                                title={t('weekly.addLesson')}
                                onClick={() => openAdd({weekday, pair})}
                                className={cn(
                                  'flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-slate-200 py-1.5 text-xs text-slate-400 transition hover:border-slate-300 hover:text-slate-600',
                                  cellEntries.length > 0 ? 'opacity-0 group-hover:opacity-100' : '',
                                )}
                              >
                                <Plus className="h-3 w-3" />
                                {t('weekly.add')}
                              </button>
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

      <RecordFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        config={scheduleConfig}
        recordId={editId}
        initialValues={addInitial}
        title={editId ? t('weekly.editLesson') : t('weekly.addLesson')}
        onSaved={reload}
        onDeleted={reload}
      />
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
  onClick,
  t,
}: {
  entry: ScheduleEntry;
  showGroup: boolean;
  onClick: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const lessonType = entry.typeOfLesson;
  return (
    <button
      type="button"
      onClick={onClick}
      title={t('weekly.editLesson')}
      className="group/card w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition-all hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-tight text-slate-900 line-clamp-2">{entry.subject?.name ?? '—'}</p>
        <Badge className={cn('shrink-0 text-[10px] font-semibold', lessonBadgeClass[lessonType] ?? 'bg-slate-100 text-slate-600')}>
          {t(`lesson.${lessonType}`)}
        </Badge>
      </div>
      <div className="mt-2 flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <User className="h-3 w-3 shrink-0 text-slate-400" />
          <span className="truncate">{entry.teacher?.fullName ?? '—'}</span>
        </div>
        {entry.auditorium?.number ? (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
            <span>{t('weekly.room')} {entry.auditorium.number}</span>
          </div>
        ) : null}
        {showGroup && entry.group?.name ? (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Clock className="h-3 w-3 shrink-0" />
            <span>{entry.group.name}</span>
          </div>
        ) : null}
      </div>
    </button>
  );
}
