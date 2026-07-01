import {StatCard} from '../components/layout/StatCard';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../components/ui/card';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '../components/ui/table';
import {useI18n} from '../i18n';
import type {DashboardStats} from '../types/modules';

type DashboardPageProps = {
  stats: DashboardStats | null;
};

function getPersonName(student: Record<string, any>) {
  const person = student?.person;
  if (!person) return '-';
  return person?.fullName ?? '-';
}

function getGroupName(student: Record<string, any>) {
  const group = student?.group;
  if (!group) return '-';
  return group?.name ?? '-';
}

function getTeacherName(teacher: Record<string, any>) {
  const person = teacher?.person;
  if (!person) return '-';
  return person?.fullName ?? '-';
}

export function DashboardPage({stats}: DashboardPageProps) {
  const {t} = useI18n();
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold text-slate-950">{t('dashboard.title')}</h2>
        <p className="mt-2 text-sm text-slate-500">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('dashboard.totalStudents')} value={stats?.totalStudents ?? 0} />
        <StatCard label={t('dashboard.totalTeachers')} value={stats?.totalTeachers ?? 0} />
        <StatCard label={t('dashboard.totalGroups')} value={stats?.totalGroups ?? 0} />
        <StatCard label={t('dashboard.totalSubjects')} value={stats?.totalSubjects ?? 0} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recentStudents')}</CardTitle>
            <CardDescription>{t('dashboard.recentStudentsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('dashboard.fullName')}</TableHead>
                    <TableHead>{t('dashboard.group')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(stats?.recentStudents ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2}>{t('common.noRecords')}</TableCell>
                    </TableRow>
                  ) : (
                    stats?.recentStudents.map((student, index) => (
                      <TableRow key={student?.personId ?? index}>
                        <TableCell>{getPersonName(student)}</TableCell>
                        <TableCell>{getGroupName(student)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recentTeachers')}</CardTitle>
            <CardDescription>{t('dashboard.recentTeachersDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('dashboard.fullName')}</TableHead>
                    <TableHead>{t('dashboard.occupation')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(stats?.recentTeachers ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2}>{t('common.noRecords')}</TableCell>
                    </TableRow>
                  ) : (
                    stats?.recentTeachers.map((teacher, index) => (
                      <TableRow key={teacher?.personId ?? index}>
                        <TableCell>{getTeacherName(teacher)}</TableCell>
                        <TableCell>{teacher?.occupation ?? '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

