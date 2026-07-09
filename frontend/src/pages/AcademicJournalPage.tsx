import {Lock, GraduationCap, Plus, ClipboardCheck, ChevronDown} from 'lucide-react';
import {useEffect, useMemo, useState, useRef, useCallback} from 'react';

import {Button} from '../components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '../components/ui/card';
import {RecordFormDialog} from '../components/RecordFormDialog';
import {GroupFilters, useGroupFilters} from '../components/journal/GroupFilters';
import {StudentInfoDialog} from '../components/StudentInfoDialog';
import {api} from '../services/api';
import {cn} from '../lib/utils';
import {useI18n} from '../i18n';
import {moduleByKey} from '../data/modules';

type Rec = Record<string, any>;

const examConfig = moduleByKey.get('exam')!;
const zachetConfig = moduleByKey.get('zachet')!;

// Exam: sign >= 3 is passing, Zachet: sign >= 1 is passing
function isPass(isZachet: boolean, sign: number): boolean {
  return isZachet ? sign >= 1 : sign >= 3;
}

// Get score label based on view mode and sign
function getScoreLabel(t: (key: string) => string, isZachet: boolean, sign: number): string {
  if (isZachet) {
    return t(`zachet.${sign}` as 'zachet.0' | 'zachet.1' | 'zachet.2' | 'zachet.3');
  }
  return t(`score.${sign}` as 'score.1' | 'score.2' | 'score.3' | 'score.4' | 'score.5');
}

// Default number of tours to display per discipline
const DEFAULT_TOUR_COUNT = 3;
// Maximum number of tours allowed
const MAX_TOUR_COUNT = 10;

export function AcademicJournalPage() {
  const {t} = useI18n();
  const gf = useGroupFilters();
  const {groupId} = gf;

  // View mode: 'exam' or 'zachet'
  const [viewMode, setViewMode] = useState<'exam' | 'zachet'>('exam');

  const [students, setStudents] = useState<Rec[]>([]);
  const [disciplines, setDisciplines] = useState<Rec[]>([]);
  const [examRecords, setExamRecords] = useState<Rec[]>([]);
  const [zachetRecords, setZachetRecords] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  // Track explicit tour counts per discipline (for "Add Tour" button)
  const [tourCounts, setTourCounts] = useState<Map<string, number>>(new Map());

  // Track dropdown state for quick grade selection
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [addInitial, setAddInitial] = useState<Rec | undefined>(undefined);

  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [studentRecordId, setStudentRecordId] = useState<string | null>(null);

  // Add a new tour column for a discipline
  function addTour(disciplineId: string) {
    setTourCounts(prev => {
      const newMap = new Map(prev);
      const currentCount = newMap.get(disciplineId) ?? 0;
      if (currentCount < MAX_TOUR_COUNT) {
        newMap.set(disciplineId, currentCount + 1);
      }
      return newMap;
    });
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([api.listAll('students'), api.listAll('discipline'), api.listAll('exam'), api.listAll('zachet')])
      .then(([allStudents, allDisciplines, allExams, allZachets]) => {
        if (cancelled) return;
        setStudents(allStudents);
        setDisciplines(allDisciplines);
        setExamRecords(allExams);
        setZachetRecords(allZachets);
      })
      .catch(() => {
        if (cancelled) return;
        setStudents([]);
        setDisciplines([]);
        setExamRecords([]);
        setZachetRecords([]);
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

  // Get records based on current view mode
  const records = viewMode === 'exam' ? examRecords : zachetRecords;

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

  // Determine the maximum tour number per discipline (includes explicit tour count from addTour button)
  // tourCounts stores the number of EXTRA tours to add beyond the calculated max
  const disciplineMaxTour = useMemo(() => {
    const map = new Map<string, number>();
    for (const [key, grades] of cellMap.entries()) {
      const disciplineId = key.split('|')[1];
      for (const grade of grades) {
        const currentMax = map.get(disciplineId) ?? 0;
        if (grade.tour > currentMax) {
          map.set(disciplineId, grade.tour);
        }
      }
    }
    // Set defaults and add extra tours from tourCounts
    for (const discipline of groupDisciplines) {
      if (!map.has(discipline.id)) {
        // Default to 3 for disciplines without grades
        map.set(discipline.id, DEFAULT_TOUR_COUNT);
      }
      // Add extra tours from tourCounts (each increment adds 1 more tour)
      const extraTours = tourCounts.get(discipline.id) ?? 0;
      map.set(discipline.id, (map.get(discipline.id) ?? DEFAULT_TOUR_COUNT) + extraTours);
    }
    return map;
  }, [cellMap, groupDisciplines, tourCounts]);

  // Build a map with key: studentId|disciplineId|tour
  const gradeMap = useMemo(() => {
    const map = new Map<string, Rec>();
    for (const [key, grades] of cellMap.entries()) {
      for (const grade of grades) {
        map.set(`${key}|${grade.tour}`, grade);
      }
    }
    return map;
  }, [cellMap]);

  // Determine which tours are locked (if a lower tour has a passing grade, higher tours are locked)
  // E.g., if tour 1 is passed -> lock tours 2 and 3; if tour 2 is passed -> lock tour 3
  const lockedToursMap = useMemo(() => {
    const map = new Map<string, Set<number>>(); // key: studentId|disciplineId, value: set of locked tour numbers
    const maxTours = disciplineMaxTour;
    
    for (const [key, grades] of cellMap.entries()) {
      const lockedTours = new Set<number>();
      // Sort grades by tour ascending to find the first passing grade (lowest tour)
      const sortedGrades = [...grades].sort((a, b) => Number(a.tour ?? 0) - Number(b.tour ?? 0));
      
      for (const grade of sortedGrades) {
        if (isPass(viewMode === 'zachet', Number(grade.sign))) {
          // Found a passing grade - lock all higher tours
          const passingTour = Number(grade.tour ?? 0);
          const maxTour = maxTours.get(key.split('|')[1]!) ?? DEFAULT_TOUR_COUNT;
          for (let i = passingTour + 1; i <= maxTour; i++) {
            lockedTours.add(i);
          }
          break;
        }
      }
      map.set(key, lockedTours);
    }
    return map;
  }, [cellMap, viewMode, disciplineMaxTour]);

  // Is zachet mode based on view mode
  const isZachet = viewMode === 'zachet';
  const Icon = viewMode === 'exam' ? GraduationCap : ClipboardCheck;

  // Reload function must be defined before quickSaveGrade
  const reloadRef = useRef<() => void>();
  reloadRef.current = () => {
    setRefreshTick((tick) => tick + 1);
  };

  // Quick save grade from dropdown (only used when clicking existing grade)
  const quickSaveGrade = useCallback(async (sign: number, studentId: string, disciplineId: string, tour: number, recordId?: string | null) => {
    try {
      const currentKey = viewMode === 'exam' ? 'exam' : 'zachet';
      if (recordId) {
        await api.update(currentKey, recordId, {sign});
      } else {
        await api.create(currentKey, {
          studentId,
          disciplineId,
          teacherId: disciplines.find(d => d.id === disciplineId)?.teacherId ?? '',
          tour,
          sign,
        });
      }
      reloadRef.current?.();
    } catch (error) {
      console.error('Failed to save grade:', error);
    }
    setOpenDropdown(null);
  }, [disciplines, viewMode]);

  // Get available scores based on view mode (for dropdown)
  function getAvailableScores() {
    if (isZachet) {
      return [
        {value: 3, label: t('zachet.3')},
        {value: 2, label: t('zachet.2')},
        {value: 1, label: t('zachet.1')},
        {value: 0, label: t('zachet.0')},
      ];
    }
    return [
      {value: 5, label: t('score.5')},
      {value: 4, label: t('score.4')},
      {value: 3, label: t('score.3')},
      {value: 2, label: t('score.2')},
      {value: 1, label: t('score.1')},
    ];
  }

  function reload() {
    setRefreshTick((tick) => tick + 1);
  }

  function openAdd(prefill?: Rec, editId?: string | null) {
    setOpenDropdown(null); // Close dropdown when opening full dialog
    setAddInitial(prefill);
    setRecordId(editId ?? null);
    setFormOpen(true);
  }

  function closeDialog() {
    setFormOpen(false);
    setRecordId(null);
    setAddInitial(undefined);
  }

  function openStudentDialog(studentId: string) {
    setStudentRecordId(studentId);
    setStudentDialogOpen(true);
  }

  function closeStudentDialog() {
    setStudentDialogOpen(false);
    setStudentRecordId(null);
  }

  // Current config and title based on view mode
  const currentConfig = viewMode === 'exam' ? examConfig : zachetConfig;
  const currentTitle = viewMode === 'exam' ? t('module.exam.title') : t('module.zachet.title');
  const currentSubtitle = viewMode === 'exam' ? t('journal.exam.subtitle') : t('journal.zachet.subtitle');
  const currentAddLabel = viewMode === 'exam' ? t('journal.exam.add') : t('journal.zachet.add');
  const currentNoDisciplinesLabel = viewMode === 'exam' ? t('journal.exam.noDisciplines') : t('journal.zachet.noDisciplines');
  const currentHint = viewMode === 'exam' ? t('journal.exam.hint') : t('journal.zachet.hint');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-3xl font-semibold text-slate-950">{currentTitle}</h2>
            <p className="mt-1 text-sm text-slate-500">{currentSubtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as 'exam' | 'zachet')}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="exam">{t('opt.exam')}</option>
            <option value="zachet">{t('opt.test')}</option>
          </select>
          <Button className="gap-2" disabled={!groupId || groupDisciplines.length === 0} onClick={() => openAdd()}>
            <Plus className="h-4 w-4" />
            {currentAddLabel}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{currentTitle}</CardTitle>
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
            <p className="py-10 text-center text-sm text-slate-500">{currentNoDisciplinesLabel}</p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="sticky left-0 z-20 min-w-[220px] border-b border-r border-slate-200 bg-slate-50 px-3 py-3 text-left font-semibold text-slate-600">
                        {t('col.student')}
                      </th>
                      {groupDisciplines.map((discipline) => {
                        const tourCount = disciplineMaxTour.get(discipline.id) ?? DEFAULT_TOUR_COUNT;
                        return (
                          <th
                            key={`${discipline.id}-header`}
                            colSpan={tourCount}
                            className="min-w-[130px] border-b border-l border-slate-200 px-3 py-2 text-center font-semibold text-slate-600"
                          >
                            <div>{discipline.subject?.name ?? '—'}</div>
                            <div className="text-[11px] font-normal text-slate-400">{discipline.teacher?.fullName ?? ''}</div>
                            {tourCount < MAX_TOUR_COUNT && (
                              <button
                                type="button"
                                title={t('journal.addTour')}
                                onClick={() => addTour(discipline.id)}
                                className="inline-flex h-5 w-5 items-center justify-center rounded text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            )}
                          </th>
                        );
                      })}
                    </tr>
                    <tr className="bg-slate-100">
                      <th className="sticky left-0 z-10 min-w-[220px] border-b border-r border-slate-200 bg-slate-100 px-3 py-2 text-left font-semibold text-slate-500">
                        {t('col.student')}
                      </th>
                      {groupDisciplines.map((discipline) => {
                        const tourCount = disciplineMaxTour.get(discipline.id) ?? DEFAULT_TOUR_COUNT;
                        return Array.from({length: tourCount}, (_, i) => i + 1).map((tour) => (
                          <th
                            key={`${discipline.id}-tour-${tour}`}
                            className="min-w-[50px] border-b border-l border-slate-200 bg-slate-100 px-2 py-1 text-center text-xs font-semibold text-slate-500"
                          >
                            {t('field.tour')} {tour}
                          </th>
                        ));
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {groupStudents.map((student) => (
                      <tr key={student.personId} className="border-t border-slate-100">
                        <td className="sticky left-0 z-10 min-w-[220px] border-r border-slate-200 bg-white px-3 py-2 font-medium text-slate-800">
                          <button
                            type="button"
                            title={t('common.viewDetails')}
                            onClick={() => openStudentDialog(student.personId)}
                            className="cursor-pointer text-left font-medium text-slate-800 transition hover:text-slate-950 hover:underline"
                          >
                            {student.fullName}
                          </button>
                        </td>
                        {groupDisciplines.map((discipline) => {
                          const tourCount = disciplineMaxTour.get(discipline.id) ?? DEFAULT_TOUR_COUNT;
                          const lockedTours = lockedToursMap.get(`${student.personId}|${discipline.id}`) ?? new Set();
                          return Array.from({length: tourCount}, (_, i) => i + 1).map((tour) => {
                            const grade = gradeMap.get(`${student.personId}|${discipline.id}|${tour}`);
                            const isLocked = lockedTours.has(tour);
                            const dropdownKey = `${student.personId}|${discipline.id}|${tour}`;
                            const isOpen = openDropdown === dropdownKey;
                            // If tour is locked and no grade exists, show "skipped" instead of "+"
                            if (isLocked && !grade) {
                              return (
                                <td
                                  key={`${discipline.id}-tour-${tour}`}
                                  className="border-l border-slate-100 px-2 py-1.5 text-center align-middle"
                                >
                                  <span
                                    title={t('journal.tourLocked')}
                                    className="inline-flex h-8 min-w-[34px] items-center justify-center rounded-lg px-2 text-xs font-semibold text-slate-400 ring-1 ring-slate-200 bg-slate-50 cursor-not-allowed"
                                  >
                                    —
                                    <Lock className="ml-1 h-3 w-3" />
                                  </span>
                                </td>
                              );
                            }
                            return (
                              <td
                                key={`${discipline.id}-tour-${tour}`}
                                className="border-l border-slate-100 px-2 py-1.5 text-center align-middle"
                              >
                                {grade ? (
                                  <div className="relative inline-block">
                                    <span
                                      title={isLocked ? t('journal.tourLocked') : `${t('field.tour')} ${tour}`}
                                      className={cn(
                                        'inline-flex h-8 min-w-[34px] items-center justify-center rounded-lg px-2 text-xs font-semibold ring-1',
                                        isLocked && 'cursor-not-allowed opacity-70',
                                        !isLocked && 'cursor-pointer',
                                        isPass(isZachet, Number(grade.sign))
                                          ? 'bg-emerald-100 text-emerald-700 ring-emerald-200'
                                          : 'bg-rose-100 text-rose-700 ring-rose-200',
                                      )}
                                      onClick={isLocked ? undefined : () => {
                                        if (isOpen) {
                                          setOpenDropdown(null);
                                        } else {
                                          setOpenDropdown(dropdownKey);
                                        }
                                      }}
                                    >
                                      {getScoreLabel(t, isZachet, Number(grade.sign))}
                                      {isLocked && <Lock className="ml-1 h-3 w-3" />}
                                      {!isLocked && <ChevronDown className="ml-1 h-3 w-3 opacity-50" />}
                                    </span>
                                    {isOpen && !isLocked && (
                                      <div className="absolute left-0 top-full z-50 mt-1 min-w-[120px] rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                                        <div className="flex flex-col gap-0.5">
                                          {getAvailableScores().map((score) => (
                                            <button
                                              key={score.value}
                                              type="button"
                                              onClick={() => quickSaveGrade(score.value, student.personId, discipline.id, tour, grade.id)}
                                              className={cn(
                                                'w-full rounded px-2 py-1 text-left text-xs transition',
                                                score.value === grade.sign
                                                  ? 'bg-slate-100 font-semibold'
                                                  : 'hover:bg-slate-50',
                                              )}
                                            >
                                              {score.label}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  // Empty cell - open form dialog when clicking "+"
                                  <button
                                    type="button"
                                    title={currentAddLabel}
                                    onClick={() => openAdd({
                                      studentId: student.personId,
                                      disciplineId: discipline.id,
                                      teacherId: disciplines.find(d => d.id === discipline.id)?.teacherId ?? '',
                                      tour: String(tour),
                                    })}
                                    className="inline-flex h-8 w-7 items-center justify-center rounded-lg text-slate-300 transition hover:bg-slate-50 hover:text-slate-500"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </td>
                            );
                          });
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-xs text-slate-400">{currentHint}</p>
            </>
          )}
        </CardContent>
      </Card>

      <RecordFormDialog
        open={formOpen}
        onOpenChange={closeDialog}
        config={currentConfig}
        recordId={recordId}
        initialValues={addInitial}
        title={currentAddLabel}
        onSaved={reload}
      />

      <StudentInfoDialog
        open={studentDialogOpen}
        onOpenChange={closeStudentDialog}
        studentId={studentRecordId}
        examRecords={examRecords}
        zachetRecords={zachetRecords}
        disciplines={groupDisciplines}
      />
    </div>
  );
}