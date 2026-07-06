import {useEffect, useMemo, useState} from 'react';
import {GraduationCap, Plus} from 'lucide-react';

import {Button} from '../components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '../components/ui/card';
import {RecordFormDialog} from '../components/RecordFormDialog';
import {GroupFilters, useGroupFilters} from '../components/journal/GroupFilters';
import {api} from '../services/api';
import {cn} from '../lib/utils';
import {useI18n} from '../i18n';
import {moduleByKey} from '../data/modules';

type Rec = Record<string, any>;

const performanceConfig = moduleByKey.get('academic-performance')!;

function isPass(form: string, sign: number): boolean {
  return form === 'test' ? sign >= 1 : sign >= 3;
}

export function PerformanceJournalPage() {
  const {t} = useI18n();
  const gf = useGroupFilters();
  const {groupId} = gf;

  const [students, setStudents] = useState<Rec[]>([]);
  const [disciplines, setDisciplines] = useState<Rec[]>([]);
  const [records, setRecords] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [addInitial, setAddInitial] = useState<Rec | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([api.listAll('students'), api.listAll('discipline'), api.listAll('academic-performance')])
      .then(([allStudents, allDisciplines, allPerformance]) => {
        if (cancelled) return;
        setStudents(allStudents);
        setDisciplines(allDisciplines);
        setRecords(allPerformance);
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

  const cellMap = useMemo(() => {
    const map = new Map<string, Rec[]>();
    for (const record of records) {
      if (!groupDisciplineIds.has(record.disciplineId)) continue;
      const key = `${record.studentId}|${record.disciplineId}`;
      const bucket = map.get(key);
      if (bucket) bucket.push(record);
      else map.set(key, [record]);
    }
    for (const bucket of map.values()) {
      bucket.sort((a, b) => Number(a.tour ?? 0) - Number(b.tour ?? 0));
    }
    return map;
  }, [records, groupDisciplineIds]);

  function reload() {
    setRefreshTick((tick) => tick + 1);
  }

  function openAdd(prefill?: Rec) {
    setAddInitial(prefill);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <GraduationCap className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-3xl font-semibold text-slate-950">{t('module.academic-performance.title')}</h2>
            <p className="mt-1 text-sm text-slate-500">{t('journal.performance.subtitle')}</p>
          </div>
        </div>
        <Button className="gap-2" disabled={!groupId || groupDisciplines.length === 0} onClick={() => openAdd()}>
          <Plus className="h-4 w-4" />
          {t('journal.performance.add')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('module.academic-performance.title')}</CardTitle>
          <div className="mt-4">
            <GroupFilters state={gf} />
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="py-10 text-center text-sm text-slate-500">{t('common.loading')}</p>
          ) : !groupId ? (
            <p className="py-10 text-center text-sm text-slate-500">{t('journal.pickGroupPrompt')}</p>
          ) : groupStudents.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">{t('journal.noStudents')}</p>
          ) : groupDisciplines.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">{t('journal.performance.noDisciplines')}</p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="sticky left-0 z-10 min-w-[220px] border-b border-r border-slate-200 bg-slate-50 px-3 py-3 text-left font-semibold text-slate-600">
                        {t('col.student')}
                      </th>
                      {groupDisciplines.map((discipline) => (
                        <th
                          key={discipline.id}
                          className="min-w-[130px] border-b border-l border-slate-200 px-3 py-2 text-center font-semibold text-slate-600"
                        >
                          <div>{discipline.subject?.name ?? '—'}</div>
                          <div className="text-[11px] font-normal text-slate-400">{discipline.teacher?.fullName ?? ''}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {groupStudents.map((student) => (
                      <tr key={student.personId} className="border-t border-slate-100">
                        <td className="sticky left-0 z-10 border-r border-slate-200 bg-white px-3 py-2 font-medium text-slate-800">
                          {student.fullName}
                        </td>
                        {groupDisciplines.map((discipline) => {
                          const grades = cellMap.get(`${student.personId}|${discipline.id}`) ?? [];
                          return (
                            <td key={discipline.id} className="border-l border-slate-100 px-2 py-1.5 text-center align-middle">
                              <div className="flex flex-wrap items-center justify-center gap-1">
                                {grades.map((grade) => {
                                  const form = String(grade.formOfControl ?? '');
                                  const sign = Number(grade.sign ?? 0);
                                  return (
                                    <span
                                      key={grade.id}
                                      title={`${t(`opt.${form}`)} · ${t('field.tour')} ${grade.tour}`}
                                      className={cn(
                                        'inline-flex h-8 min-w-[34px] items-center justify-center gap-0.5 rounded-lg px-1.5 text-xs font-semibold',
                                        isPass(form, sign)
                                          ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
                                          : 'bg-rose-100 text-rose-700 ring-1 ring-rose-200',
                                      )}
                                    >
                                      <span className="text-[10px] opacity-70">{t(`form.short.${form}`)}</span>
                                      {sign}
                                    </span>
                                  );
                                })}
                                <button
                                  type="button"
                                  title={t('journal.performance.add')}
                                  onClick={() =>
                                    openAdd({
                                      studentId: student.personId,
                                      disciplineId: discipline.id,
                                      teacherId: discipline.teacherId ?? discipline.teacher?.id ?? '',
                                      formOfControl: 'exam',
                                      tour: 1,
                                    })
                                  }
                                  className="inline-flex h-8 w-7 items-center justify-center rounded-lg text-slate-300 transition hover:bg-slate-50 hover:text-slate-500"
                                >
                                  <Plus className="h-3.5 w-3.5" />
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
              <p className="mt-4 text-xs text-slate-400">{t('journal.performance.hint')}</p>
            </>
          )}
        </CardContent>
      </Card>

      <RecordFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        config={performanceConfig}
        initialValues={addInitial}
        title={t('journal.performance.add')}
        onSaved={reload}
      />
    </div>
  );
}