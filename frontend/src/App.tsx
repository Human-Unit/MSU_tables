import {useEffect, useMemo, useState} from 'react';
import {api} from './services/api';
import {DashboardPage} from './pages/DashboardPage';
import {ModulePage} from './pages/ModulePage';
import {WeeklySchedulePage} from './pages/WeeklySchedulePage';
import {AttendanceJournalPage} from './pages/AttendanceJournalPage';
import {PerformanceJournalPage} from './pages/PerformanceJournalPage';
import {ExecutionSheetPage} from './pages/ExecutionSheetPage';
import {Sidebar} from './components/layout/Sidebar';
import {moduleConfigs} from './data/modules';
import {useI18n} from './i18n';
import type {DashboardStats, ModuleConfig} from './types/modules';

function App() {
  const {t} = useI18n();
  const [activePage, setActivePage] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    void api.dashboard().then(setStats).catch(() => setStats(null));
  }, []);

  const currentModule = useMemo(() => moduleConfigs.find((module: ModuleConfig) => module.key === activePage) ?? null, [activePage]);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      <Sidebar
        active={activePage}
        onNavigate={setActivePage}
        userName={t('app.localUser')}
        userRole="Admin"
      />
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full bg-[radial-gradient(circle_at_top_right,_rgba(15,23,42,0.08),_transparent_36%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-6 py-6 md:px-10">
          <div className="mx-auto max-w-7xl">
            {activePage === 'dashboard' ? (
              <DashboardPage stats={stats} />
            ) : activePage === 'weekly-schedule' ? (
              <WeeklySchedulePage />
            ) : activePage === 'attendance' ? (
              <AttendanceJournalPage />
            ) : activePage === 'academic-performance' ? (
              <PerformanceJournalPage />
            ) : activePage === 'execution' ? (
              <ExecutionSheetPage />
            ) : currentModule ? (
              <ModulePage config={currentModule} />
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
