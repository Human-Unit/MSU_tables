import {useEffect, useMemo, useState} from 'react';
import {ClipboardCheck, Plus} from 'lucide-react';

import {Button} from '../components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '../components/ui/card';
import {Select} from '../components/ui/select';
import {RecordFormDialog} from '../components/RecordFormDialog';
import {GroupFilters, useGroupFilters} from '../components/journal/GroupFilters';
import {api} from '../services/api';
import {cn} from '../lib/utils';
import {useI18n} from '../i18n';
import {moduleByKey} from '../data/modules';

type Rec = Record<string, any>;

const attendanceConfig = moduleByKey.get('attendance')!;

const statusClass: Record<string, string> = {
  present: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  absent: 'bg-rose-100 text-rose-700 ring-1 ring-rose-200',
  late: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
  excused: 'bg-sky-100 text-sky-700 ring-1 ring-sky-200',
};

type Session = {key: string; day: string; pair: number; disciplineId: string; subjectName: string};

export function AttendanceJournalPage() {
  const {t} = useI18n();
  const gf = useGroupFilters();
  const {groupId} = gf;

  const [disciplineId, setDisciplineId] = useState('');
  const [students, setStudents] = useState<Rec[]>([]);
  const [disciplines, setDisciplines] = useState<Rec[]>([]);
  const [records, setRecords] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [addInitial, setAddInitial] = useState<Rec | undefined>(undefined);

  // Load the full record sets once; group/discipline filtering happens in memory.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([api.listAll('students'), api.listAll('discipline'), api.listAll('attendance')])
      .then(([allStudents, allDisciplines, allAttendance]) => {
        if (cancelled) return;
        setStudents(allStudents);
        setDisciplines(allDisciplines);
        setRecords(allAttendance);
      })
      .catch(() => {
        if (cancelled) return;
        setStudents([]);
        setDisciplines([]);
        setRecords([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  // Reset the discipline filter whenever the group changes.
  useEffect(() => {
    setDisciplineId('');
  }, [groupId]);

  const groupStudents = useMemo(
    () =>
      students
        .filter((student) => student.groupId === groupId)
        .sort((a, b) => String(a.fullName).localeCompare(String(b.fullName))),
    [students, groupId],
  );

  const groupDisciplines = useMemo(
    () =>
      disciplines
        .filter((discipline) => (discipline.groupId ?? discipline.group?.id) === groupId)
        .sort((a, b) => String(a.subject?.name ?? '').localeCompare(String(b.subject?.name ?? ''))),
    [disciplines, groupId],
  );

  const groupDisciplineIds = useMemo(() => new Set(groupDisciplines.map((discipline) => discipline.id)), [groupDisciplines]);

  const scopedRecords = useMemo(
    () =>
      records.filter(
        (record) => groupDisciplineIds.has(record.disciplineId) && (!disciplineId || record.disciplineId === disciplineId),
      ),
    [records, groupDisciplineIds, disciplineId],
  );

  // Columns of the journal: one per distinct (day, pair, discipline) session.
  const sessions = useMemo<Session[]>(() => {
    const map = new Map<string, Session>();
    for (const record of scopedRecords) {
      const day = String(record.day ?? '');
      const pair = Number(record.pair ?? 0);
      const key = `${day}|${pair}|${record.disciplineId}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          day,
          pair,
          disciplineId: record.disciplineId,
          subjectName: record.discipline?.subject?.name ?? '',
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      if (a.day !== b.day) return a.day < b.day ? -1 : 1;
      if (a.pair !== b.pair) return a.pair - b.pair;
      return a.subjectName.localeCompare(b.subjectName);
    });
  }, [scopedRecords]);

  const cellMap = useMemo(() => {
    const map = new Map<string, Rec>();
    for (const record of scopedRecords) {
      const sessionKey = `${String(record.day ?? '')}|${Number(record.pair ?? 0)}|${record.disciplineId}`;
      map.set(`${record.studentId}|${sessionKey}`, record);
    }
    return map;
  }, [scopedRecords]);

  function reload() {
    setRefreshTick((tick) => tick + 1);
  }

  function openEdit(id: string) {
    setEditId(id);
    setAddInitial(undefined);
    setFormOpen(true);
  }

  function openAdd(prefill?: Rec) {
    setEditId(null);
    setAddInitial({
      ...(disciplineId ? {disciplineId} : {}),
      ...(prefill ?? {}),
    });
    setFormOpen(true);
  }

  const showSubjectInHeader = disciplineId === '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <ClipboardCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-3xl font-semibold text-slate-950">{t('module.attendance.title')}</h2>
            <p className="mt-1 text-sm text-slate-500">{t('journal.attendance.subtitle')}</p>
          </div>
        </div>
        <Button className="gap-2" disabled={!groupId || groupDisciplines.length === 0} onClick={() => openAdd()}>
          <Plus className="h-4 w-4" />
          {t('journal.attendance.add')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('module.attendance.title')}</CardTitle>
          <div className="mt-4 space-y-3">
            <GroupFilters state={gf} />
            {groupId ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">{t('field.subject')}</label>
                  <Select value={disciplineId} onChange={(event) => setDisciplineId(event.target.value)}>
                    <option value="">{t('journal.allSubjects')}</option>
                    {groupDisciplines.map((discipline) => (
                      <option key={discipline.id} value={discipline.id}>
                        {discipline.subject?.name ?? '—'}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            ) : null}
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="py-10 text-center text-sm text-slate-500">{t('common.loading')}</p>
          ) : !groupId ? (
            <p className="py-10 text-center text-sm text-slate-500">{t('journal.pickGroupPrompt')}</p>
          ) : groupStudents.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">{t('journal.noStudents')}</p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="sticky left-0 z-10 min-w-[220px] border-b border-r border-slate-200 bg-slate-50 px-3 py-3 text-left font-semibold text-slate-600">
                        {t('col.student')}
                      </th>
                      {sessions.map((session) => (
                        <th
                          key={session.key}
                          className="whitespace-nowrap border-b border-l border-slate-200 px-3 py-2 text-center font-semibold text-slate-600"
                        >
                          <div>{formatDay(session.day)}</div>
                          <div className="text-[11px] font-normal text-slate-400">
                            {t('col.pair')} {session.pair}
                            {showSubjectInHeader && session.subjectName ? ` · ${session.subjectName}` : ''}
                          </div>
                        </th>
                      ))}
                      {sessions.length === 0 ? (
                        <th className="border-b border-l border-slate-200 px-3 py-3 text-left text-xs font-normal text-slate-400">
                          {t('journal.attendance.empty')}
                        </th>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody>
                    {groupStudents.map((student) => (
                      <tr key={student.personId} className="border-t border-slate-100">
                        <td className="sticky left-0 z-10 border-r border-slate-200 bg-white px-3 py-2 font-medium text-slate-800">
                          {student.fullName}
                        </td>
                        {sessions.map((session) => {
                          const record = cellMap.get(`${student.personId}|${session.key}`);
                          const status = record?.status as string | undefined;
                          return (
                            <td key={session.key} className="border-l border-slate-100 px-2 py-1.5 text-center">
                              {record ? (
                                <button
                                  type="button"
                                  title={t(`status.${status}`)}
                                  onClick={() => openEdit(record.id)}
                                  className={cn(
                                    'inline-flex h-8 w-10 items-center justify-center rounded-lg text-xs font-semibold transition hover:opacity-80',
                                    statusClass[status ?? ''] ?? 'bg-slate-100 text-slate-600',
                                  )}
                                >
                                  {t(`status.short.${status}`)}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  title={t('journal.attendance.add')}
                                  onClick={() =>
                                    openAdd({
                                      studentId: student.personId,
                                      disciplineId: session.disciplineId,
                                      day: session.day,
                                      pair: session.pair,
                                      status: 'present',
                                    })
                                  }
                                  className="inline-flex h-8 w-10 items-center justify-center rounded-lg text-slate-300 transition hover:bg-slate-50 hover:text-slate-500"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </td>
                          );
                        })}
                        {sessions.length === 0 ? <td className="border-l border-slate-100" /> : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-xs text-slate-400">{t('journal.attendance.hint')}</p>
            </>
          )}
        </CardContent>
      </Card>

      <RecordFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        config={attendanceConfig}
        recordId={editId}
        initialValues={addInitial}
        title={editId ? `${t('common.edit')} — ${t('module.attendance.title')}` : t('journal.attendance.add')}
        onSaved={reload}
        onDeleted={reload}
      />
    </div>
  );
}

function formatDay(value: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}
