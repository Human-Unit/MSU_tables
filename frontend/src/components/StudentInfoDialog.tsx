import {useEffect, useMemo, useState} from 'react';

import {Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle} from './ui/dialog';
import {api} from '../services/api';
import {useI18n} from '../i18n';

type StudentInfoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId?: string | null;
  examRecords?: Rec[];
  zachetRecords?: Rec[];
  disciplines?: Rec[];
};

type StudentData = {
  personId: string;
  fullName: string;
  dateOfBirth?: string;
  phone?: string;
  address?: string;
  email?: string;
  groupId?: string;
  group?: {name?: string};
  username?: string;
};

type Rec = Record<string, any>;

export function StudentInfoDialog({open, onOpenChange, studentId, examRecords = [], zachetRecords = [], disciplines = []}: StudentInfoDialogProps) {
  const {t} = useI18n();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !studentId) {
      setStudent(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    api
      .get('students', studentId)
      .then((data) => {
        if (!cancelled) setStudent(data as StudentData);
      })
      .catch(() => {
        if (!cancelled) setStudent(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, studentId]);

  // Combine exam and zachet records for display
  const allGrades = useMemo(() => [...examRecords, ...zachetRecords], [examRecords, zachetRecords]);

  // Calculate average grade per discipline for the student
  const disciplineAverages = useMemo(() => {
    const map = new Map<string, {name: string; average: number; count: number; passed: number}>();
    
    // Get all grade records for this student
    const studentRecords = allGrades.filter((r: Rec) => r.studentId === studentId);
    
    for (const discipline of disciplines) {
      const discId = discipline.id;
      const discRecords = studentRecords.filter((r: Rec) => r.disciplineId === discId);
      
      if (discRecords.length > 0) {
        let sum = 0;
        let passed = 0;
        for (const record of discRecords) {
          const sign = Number(record.sign) || 0;
          sum += sign;
          // Exam (sign 1-5): pass >= 3, Zachet (sign 0-3): pass >= 1
          // We treat exam records as exams and zachet as tests
          const isZachet = zachetRecords.some((z: Rec) => z.id === record.id);
          if (isZachet ? sign >= 1 : sign >= 3) {
            passed++;
          }
        }
        const average = sum / discRecords.length;
        map.set(discId, {
          name: discipline.subject?.name ?? '—',
          average: Math.round(average * 100) / 100,
          count: discRecords.length,
          passed: passed,
        });
      }
    }
    
    return Array.from(map.entries()).sort((a, b) => a[1].name.localeCompare(b[1].name));
  }, [allGrades, disciplines, studentId, zachetRecords]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('common.viewDetails')}</DialogTitle>
          <DialogDescription>{t('common.recordDetails')}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          {loading ? (
            <p className="text-sm text-slate-500">{t('common.loading')}</p>
          ) : !student ? (
            <p className="text-sm text-slate-500">{t('common.noRecords')}</p>
          ) : (
            <div className="grid gap-4">
              <div>
                <span className="block text-xs font-semibold uppercase text-slate-500">{t('col.student')}</span>
                <span className="text-sm text-slate-800">{student.fullName}</span>
              </div>
              {student.dateOfBirth && (
                <div>
                  <span className="block text-xs font-semibold uppercase text-slate-500">{t('field.dateOfBirth')}</span>
                  <span className="text-sm text-slate-800">{student.dateOfBirth?.slice(0, 10)}</span>
                </div>
              )}
              {student.phone && (
                <div>
                  <span className="block text-xs font-semibold uppercase text-slate-500">{t('field.phone')}</span>
                  <span className="text-sm text-slate-800">{student.phone}</span>
                </div>
              )}
              {student.email && (
                <div>
                  <span className="block text-xs font-semibold uppercase text-slate-500">{t('field.email')}</span>
                  <span className="text-sm text-slate-800">{student.email}</span>
                </div>
              )}
              {student.group?.name && (
                <div>
                  <span className="block text-xs font-semibold uppercase text-slate-500">{t('col.group')}</span>
                  <span className="text-sm text-slate-800">{student.group.name}</span>
                </div>
              )}
              {student.username && (
                <div>
                  <span className="block text-xs font-semibold uppercase text-slate-500">{t('col.username')}</span>
                  <span className="text-sm text-slate-800">{student.username}</span>
                </div>
              )}
            </div>
          )}
        </DialogBody>

        {disciplineAverages.length > 0 && (
          <div className="border-t border-slate-100 px-6 py-4">
            <h4 className="mb-3 text-sm font-semibold uppercase text-slate-600">{t('module.academic-performance.title')}</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-2 py-1.5 text-left font-medium text-slate-500">{t('col.subject')}</th>
                    <th className="px-2 py-1.5 text-center font-medium text-slate-500">{t('col.sign')}</th>
                    <th className="px-2 py-1.5 text-center font-medium text-slate-500">{t('field.tour')}</th>
                    <th className="px-2 py-1.5 text-center font-medium text-slate-500">{t('common.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {disciplineAverages.map(([discId, data]) => (
                    <tr key={discId} className="border-b border-slate-100 last:border-0">
                      <td className="px-2 py-1.5 text-slate-800">{data.name}</td>
                      <td className="px-2 py-1.5 text-center font-semibold text-slate-800">{data.average}</td>
                      <td className="px-2 py-1.5 text-center text-slate-600">{data.count}</td>
                      <td className="px-2 py-1.5 text-center">
                        {data.passed === data.count ? (
                          <span className="text-emerald-600">{t('common.active')}</span>
                        ) : data.passed > 0 ? (
                          <span className="text-amber-600">{t('status.partial')}</span>
                        ) : (
                          <span className="text-rose-600">{t('common.inactive')}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
