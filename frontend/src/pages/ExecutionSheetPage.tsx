import {useEffect, useMemo, useState} from 'react';
import {Activity, Plus} from 'lucide-react';

import {Button} from '../components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '../components/ui/card';
import {Select} from '../components/ui/select';
import {RecordFormDialog} from '../components/RecordFormDialog';
import {api} from '../services/api';
import {useI18n} from '../i18n';
import {moduleByKey} from '../data/modules';
import type {OptionItem} from '../types/modules';

type Rec = Record<string, any>;

const executionConfig = moduleByKey.get('execution')!;

const workloadKeys = ['lectures', 'practices', 'labWorks', 'otherWorks'] as const;

export function ExecutionSheetPage() {
  const {t} = useI18n();

  const [teachers, setTeachers] = useState<OptionItem[]>([]);
  const [teacherId, setTeacherId] = useState('');
  const [records, setRecords] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [addInitial, setAddInitial] = useState<Rec | undefined>(undefined);

  useEffect(() => {
    void api.options('teachers').then(setTeachers).catch(() => setTeachers([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .listAll('execution')
      .then((rows) => {
        if (!cancelled) setRecords(rows);
      })
      .catch(() => {
        if (!cancelled) setRecords([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const teacherRecords = useMemo(
    () =>
      records
        .filter((record) => record.teacherId === teacherId)
        .sort((a, b) => String(a.discipline?.subject?.name ?? '').localeCompare(String(b.discipline?.subject?.name ?? ''))),
    [records, teacherId],
  );

  const totals = useMemo(() => {
    const acc: Record<string, number> = {lectures: 0, practices: 0, labWorks: 0, otherWorks: 0};
    for (const record of teacherRecords) {
      for (const key of workloadKeys) acc[key] += Number(record[key] ?? 0);
    }
    return acc;
  }, [teacherRecords]);

  function reload() {
    setRefreshTick((tick) => tick + 1);
  }

  function openEdit(id: string) {
    setEditId(id);
    setAddInitial(undefined);
    setFormOpen(true);
  }

  function openAdd() {
    setEditId(null);
    setAddInitial(teacherId ? {teacherId} : undefined);
    setFormOpen(true);
  }

  const rowTotal = (record: Rec) => workloadKeys.reduce((sum, key) => sum + Number(record[key] ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <Activity className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-3xl font-semibold text-slate-950">{t('module.execution.title')}</h2>
            <p className="mt-1 text-sm text-slate-500">{t('journal.execution.subtitle')}</p>
          </div>
        </div>
        <Button className="gap-2" disabled={!teacherId} onClick={openAdd}>
          <Plus className="h-4 w-4" />
          {t('journal.execution.add')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('module.execution.title')}</CardTitle>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">{t('field.teacher')}</label>
              <Select value={teacherId} onChange={(event) => setTeacherId(event.target.value)}>
                <option value="">{t('journal.selectTeacher')}</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="py-10 text-center text-sm text-slate-500">{t('common.loading')}</p>
          ) : !teacherId ? (
            <p className="py-10 text-center text-sm text-slate-500">{t('journal.pickTeacherPrompt')}</p>
          ) : teacherRecords.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">{t('journal.execution.empty')}</p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="min-w-[220px] border-b border-slate-200 px-3 py-3 text-left font-semibold text-slate-600">
                        {t('col.discipline')}
                      </th>
                      <th className="border-b border-l border-slate-200 px-3 py-3 text-center font-semibold text-slate-600">{t('field.lectures')}</th>
                      <th className="border-b border-l border-slate-200 px-3 py-3 text-center font-semibold text-slate-600">{t('field.practices')}</th>
                      <th className="border-b border-l border-slate-200 px-3 py-3 text-center font-semibold text-slate-600">{t('field.labWorks')}</th>
                      <th className="border-b border-l border-slate-200 px-3 py-3 text-center font-semibold text-slate-600">{t('field.otherWorks')}</th>
                      <th className="border-b border-l border-slate-200 px-3 py-3 text-center font-semibold text-slate-700">{t('journal.execution.total')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teacherRecords.map((record) => (
                      <tr
                        key={record.id}
                        onClick={() => openEdit(record.id)}
                        title={t('common.edit')}
                        className="cursor-pointer border-t border-slate-100 transition hover:bg-slate-50"
                      >
                        <td className="px-3 py-2.5 font-medium text-slate-800">{record.discipline?.subject?.name ?? '—'}</td>
                        <td className="border-l border-slate-100 px-3 py-2.5 text-center text-slate-600">{record.lectures ?? 0}</td>
                        <td className="border-l border-slate-100 px-3 py-2.5 text-center text-slate-600">{record.practices ?? 0}</td>
                        <td className="border-l border-slate-100 px-3 py-2.5 text-center text-slate-600">{record.labWorks ?? 0}</td>
                        <td className="border-l border-slate-100 px-3 py-2.5 text-center text-slate-600">{record.otherWorks ?? 0}</td>
                        <td className="border-l border-slate-100 px-3 py-2.5 text-center font-semibold text-slate-800">{rowTotal(record)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-200 bg-slate-50 font-semibold text-slate-700">
                      <td className="px-3 py-2.5 text-right">{t('journal.execution.total')}</td>
                      <td className="border-l border-slate-100 px-3 py-2.5 text-center">{totals.lectures}</td>
                      <td className="border-l border-slate-100 px-3 py-2.5 text-center">{totals.practices}</td>
                      <td className="border-l border-slate-100 px-3 py-2.5 text-center">{totals.labWorks}</td>
                      <td className="border-l border-slate-100 px-3 py-2.5 text-center">{totals.otherWorks}</td>
                      <td className="border-l border-slate-100 px-3 py-2.5 text-center">
                        {totals.lectures + totals.practices + totals.labWorks + totals.otherWorks}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <p className="mt-4 text-xs text-slate-400">{t('journal.execution.hint')}</p>
            </>
          )}
        </CardContent>
      </Card>

      <RecordFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        config={executionConfig}
        recordId={editId}
        initialValues={addInitial}
        title={editId ? `${t('common.edit')} — ${t('module.execution.title')}` : t('journal.execution.add')}
        onSaved={reload}
        onDeleted={reload}
      />
    </div>
  );
}
