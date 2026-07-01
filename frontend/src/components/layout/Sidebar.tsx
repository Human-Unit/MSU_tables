import {Activity, BookOpen, Building2, CalendarDays, CalendarRange, ClipboardCheck, ClipboardList, GraduationCap, LayoutDashboard, School, Users, UserRound, UserRoundSearch, UsersRound} from 'lucide-react';
import {cn} from '../../lib/utils';
import {useI18n} from '../../i18n';
import type {Lang} from '../../i18n';

type SidebarProps = {
  active: string;
  onNavigate: (key: string) => void;
  userName: string;
  userRole: string;
};

const navItems = [
  {key: 'dashboard', icon: LayoutDashboard},
  {key: 'weekly-schedule', icon: CalendarRange},
  {key: 'faculty', icon: School},
  {key: 'vocation', icon: BookOpen},
  {key: 'group', icon: Users},
  {key: 'auditorium', icon: Building2},
  {key: 'students', icon: GraduationCap},
  {key: 'teachers', icon: UserRound},
  {key: 'subject', icon: ClipboardList},
  {key: 'discipline', icon: UserRoundSearch},
  {key: 'schedule', icon: CalendarDays},
  {key: 'attendance', icon: ClipboardCheck},
  {key: 'academic-performance', icon: UsersRound},
  {key: 'execution', icon: Activity},
];

const languages: {code: Lang; label: string}[] = [
  {code: 'ru', label: 'RU'},
  {code: 'en', label: 'EN'},
];

export function Sidebar({active, onNavigate, userName, userRole}: SidebarProps) {
  const {t, lang, setLang} = useI18n();

  return (
    <aside className="flex h-full w-[280px] flex-col border-r border-slate-200 bg-slate-950 text-slate-100">
      <div className="border-b border-white/10 px-6 py-6">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{t('app.university')}</p>
        <h1 className="mt-2 text-xl font-semibold">{t('app.title')}</h1>
        <p className="mt-2 text-sm text-slate-400">{t('app.tagline')}</p>
      </div>

      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div>
          <p className="text-sm font-medium text-white">{userName}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{userRole}</p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-white/5 p-1">
          {languages.map((option) => (
            <button
              key={option.code}
              onClick={() => setLang(option.code)}
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-semibold transition',
                lang === option.code ? 'bg-white text-slate-950' : 'text-slate-300 hover:text-white',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={cn(
                'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition',
                isActive ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-white/5 hover:text-white',
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{t(`nav.${item.key}`)}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
