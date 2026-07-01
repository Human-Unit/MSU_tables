import {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import type {ReactNode} from 'react';

export type Lang = 'en' | 'ru';

type Dict = Record<string, string>;

const en: Dict = {
  'app.university': 'University',
  'app.title': 'Academic Records',
  'app.tagline': 'Simple desktop management',
  'app.language': 'Language',
  'app.localUser': 'Local User',

  'nav.dashboard': 'Dashboard',
  'nav.weekly-schedule': 'Weekly Schedule',
  'nav.faculty': 'Faculties',
  'nav.vocation': 'Vocations',
  'nav.group': 'Groups',
  'nav.auditorium': 'Auditoriums',
  'nav.students': 'Students',
  'nav.teachers': 'Teachers',
  'nav.subject': 'Subjects',
  'nav.discipline': 'Disciplines',
  'nav.schedule': 'Schedule',
  'nav.attendance': 'Attendance',
  'nav.academic-performance': 'Academic Performance',
  'nav.execution': 'Execution',

  'dashboard.title': 'Dashboard',
  'dashboard.subtitle': 'A quick snapshot of the academic record system.',
  'dashboard.totalStudents': 'Total Students',
  'dashboard.totalTeachers': 'Total Teachers',
  'dashboard.totalGroups': 'Total Groups',
  'dashboard.totalSubjects': 'Total Subjects',
  'dashboard.recentStudents': 'Recent Students',
  'dashboard.recentStudentsDesc': 'The 5 most recently created student profiles.',
  'dashboard.recentTeachers': 'Recent Teachers',
  'dashboard.recentTeachersDesc': 'The 5 most recently created teacher profiles.',
  'dashboard.fullName': 'Full Name',
  'dashboard.group': 'Group',
  'dashboard.occupation': 'Occupation',

  'common.new': 'New',
  'common.search': 'Search',
  'common.actions': 'Actions',
  'common.save': 'Save',
  'common.saving': 'Saving...',
  'common.cancel': 'Cancel',
  'common.loading': 'Loading...',
  'common.noRecords': 'No records found.',
  'common.page': 'Page',
  'common.of': 'of',
  'common.previous': 'Previous',
  'common.next': 'Next',
  'common.deleteConfirm': 'Delete this record?',
  'common.active': 'Active',
  'common.inactive': 'Inactive',
  'common.saveFailed': 'Save failed',
  'common.manageDesc': 'Search, paginate, and manage records from one place.',
  'common.fillDetails': 'Fill out the record details and save your changes.',
  'common.edit': 'Edit',
  'common.create': 'Create',
  'common.select': 'Select',

  'weekly.title': 'Weekly Schedule',
  'weekly.subtitle': 'Pick a faculty, vocation and course to view the weekly timetable.',
  'weekly.faculty': 'Faculty',
  'weekly.vocation': 'Vocation',
  'weekly.course': 'Course',
  'weekly.group': 'Group',
  'weekly.all': 'All',
  'weekly.allFaculties': 'All faculties',
  'weekly.allVocations': 'All vocations',
  'weekly.allCourses': 'All courses',
  'weekly.allGroups': 'All groups',
  'weekly.selectPrompt': 'Select filters above to see the timetable.',
  'weekly.pair': 'Pair',
  'weekly.empty': 'No lessons for the selected filters.',
  'weekly.courseN': 'Year {n}',
  'weekly.lessonsCount': '{n} lesson(s)',
  'weekly.editHint': 'To add or edit lessons, use the Schedule section.',

  'lesson.lecture': 'Lecture',
  'lesson.practice': 'Practice',
  'lesson.lab': 'Lab',

  'day.1': 'Monday',
  'day.2': 'Tuesday',
  'day.3': 'Wednesday',
  'day.4': 'Thursday',
  'day.5': 'Friday',
  'day.6': 'Saturday',
  'day.short.1': 'Mon',
  'day.short.2': 'Tue',
  'day.short.3': 'Wed',
  'day.short.4': 'Thu',
  'day.short.5': 'Fri',
  'day.short.6': 'Sat',

  'module.faculty.title': 'Faculties',
  'module.faculty.subtitle': 'Manage academic faculties.',
  'module.vocation.title': 'Vocations',
  'module.vocation.subtitle': 'Manage vocations within a faculty.',
  'module.group.title': 'Groups',
  'module.group.subtitle': 'Student groups and education year.',
  'module.auditorium.title': 'Auditoriums',
  'module.auditorium.subtitle': 'Manage classroom and auditorium records.',
  'module.students.title': 'Students',
  'module.students.subtitle': 'Create student accounts and profiles.',
  'module.teachers.title': 'Teachers',
  'module.teachers.subtitle': 'Create teacher accounts and profiles.',
  'module.subject.title': 'Subjects',
  'module.subject.subtitle': 'Manage academic subjects.',
  'module.discipline.title': 'Disciplines',
  'module.discipline.subtitle': 'Link subjects, groups, and teachers.',
  'module.schedule.title': 'Schedule',
  'module.schedule.subtitle': 'Manage weekly lesson timetable entries.',
  'module.attendance.title': 'Attendance',
  'module.attendance.subtitle': 'Track student attendance.',
  'module.academic-performance.title': 'Academic Performance',
  'module.academic-performance.subtitle': 'Manage grades and assessments.',
  'module.execution.title': 'Execution',
  'module.execution.subtitle': 'Track teacher workload execution.',
};

const ru: Dict = {
  'app.university': 'Университет',
  'app.title': 'Учебные записи',
  'app.tagline': 'Простое настольное управление',
  'app.language': 'Язык',
  'app.localUser': 'Локальный пользователь',

  'nav.dashboard': 'Панель',
  'nav.weekly-schedule': 'Расписание на неделю',
  'nav.faculty': 'Факультеты',
  'nav.vocation': 'Направления',
  'nav.group': 'Группы',
  'nav.auditorium': 'Аудитории',
  'nav.students': 'Студенты',
  'nav.teachers': 'Преподаватели',
  'nav.subject': 'Предметы',
  'nav.discipline': 'Дисциплины',
  'nav.schedule': 'Расписание (записи)',
  'nav.attendance': 'Посещаемость',
  'nav.academic-performance': 'Успеваемость',
  'nav.execution': 'Нагрузка',

  'dashboard.title': 'Панель управления',
  'dashboard.subtitle': 'Краткий обзор системы учебных записей.',
  'dashboard.totalStudents': 'Всего студентов',
  'dashboard.totalTeachers': 'Всего преподавателей',
  'dashboard.totalGroups': 'Всего групп',
  'dashboard.totalSubjects': 'Всего предметов',
  'dashboard.recentStudents': 'Недавние студенты',
  'dashboard.recentStudentsDesc': '5 последних добавленных студентов.',
  'dashboard.recentTeachers': 'Недавние преподаватели',
  'dashboard.recentTeachersDesc': '5 последних добавленных преподавателей.',
  'dashboard.fullName': 'ФИО',
  'dashboard.group': 'Группа',
  'dashboard.occupation': 'Должность',

  'common.new': 'Добавить',
  'common.search': 'Поиск',
  'common.actions': 'Действия',
  'common.save': 'Сохранить',
  'common.saving': 'Сохранение...',
  'common.cancel': 'Отмена',
  'common.loading': 'Загрузка...',
  'common.noRecords': 'Записи не найдены.',
  'common.page': 'Страница',
  'common.of': 'из',
  'common.previous': 'Назад',
  'common.next': 'Вперёд',
  'common.deleteConfirm': 'Удалить эту запись?',
  'common.active': 'Активен',
  'common.inactive': 'Неактивен',
  'common.saveFailed': 'Ошибка сохранения',
  'common.manageDesc': 'Поиск, постраничный просмотр и управление записями в одном месте.',
  'common.fillDetails': 'Заполните данные записи и сохраните изменения.',
  'common.edit': 'Изменить',
  'common.create': 'Создать',
  'common.select': 'Выберите',

  'weekly.title': 'Расписание на неделю',
  'weekly.subtitle': 'Выберите факультет, направление и курс, чтобы увидеть расписание.',
  'weekly.faculty': 'Факультет',
  'weekly.vocation': 'Направление',
  'weekly.course': 'Курс',
  'weekly.group': 'Группа',
  'weekly.all': 'Все',
  'weekly.allFaculties': 'Все факультеты',
  'weekly.allVocations': 'Все направления',
  'weekly.allCourses': 'Все курсы',
  'weekly.allGroups': 'Все группы',
  'weekly.selectPrompt': 'Выберите фильтры выше, чтобы увидеть расписание.',
  'weekly.pair': 'Пара',
  'weekly.empty': 'Нет занятий по выбранным фильтрам.',
  'weekly.courseN': '{n} курс',
  'weekly.lessonsCount': 'Занятий: {n}',
  'weekly.editHint': 'Чтобы добавить или изменить занятия, используйте раздел «Расписание (записи)».',

  'lesson.lecture': 'Лекция',
  'lesson.practice': 'Практика',
  'lesson.lab': 'Лаборатория',

  'day.1': 'Понедельник',
  'day.2': 'Вторник',
  'day.3': 'Среда',
  'day.4': 'Четверг',
  'day.5': 'Пятница',
  'day.6': 'Суббота',
  'day.short.1': 'Пн',
  'day.short.2': 'Вт',
  'day.short.3': 'Ср',
  'day.short.4': 'Чт',
  'day.short.5': 'Пт',
  'day.short.6': 'Сб',

  'module.faculty.title': 'Факультеты',
  'module.faculty.subtitle': 'Управление факультетами.',
  'module.vocation.title': 'Направления',
  'module.vocation.subtitle': 'Управление направлениями в рамках факультета.',
  'module.group.title': 'Группы',
  'module.group.subtitle': 'Студенческие группы и год обучения.',
  'module.auditorium.title': 'Аудитории',
  'module.auditorium.subtitle': 'Управление аудиториями.',
  'module.students.title': 'Студенты',
  'module.students.subtitle': 'Создание учётных записей и профилей студентов.',
  'module.teachers.title': 'Преподаватели',
  'module.teachers.subtitle': 'Создание учётных записей и профилей преподавателей.',
  'module.subject.title': 'Предметы',
  'module.subject.subtitle': 'Управление учебными предметами.',
  'module.discipline.title': 'Дисциплины',
  'module.discipline.subtitle': 'Связь предметов, групп и преподавателей.',
  'module.schedule.title': 'Расписание (записи)',
  'module.schedule.subtitle': 'Управление занятиями недельного расписания.',
  'module.attendance.title': 'Посещаемость',
  'module.attendance.subtitle': 'Учёт посещаемости студентов.',
  'module.academic-performance.title': 'Успеваемость',
  'module.academic-performance.subtitle': 'Управление оценками и аттестациями.',
  'module.execution.title': 'Нагрузка',
  'module.execution.subtitle': 'Учёт выполнения нагрузки преподавателей.',
};

const dictionaries: Record<Lang, Dict> = {en, ru};

type I18nContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = 'app.lang';

function readInitialLang(): Lang {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'ru') return stored;
  } catch {
    // ignore storage errors
  }
  return 'ru';
}

export function LanguageProvider({children}: {children: ReactNode}) {
  const [lang, setLangState] = useState<Lang>(readInitialLang);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore storage errors
    }
  }, [lang]);

  const setLang = useCallback((next: Lang) => setLangState(next), []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = dictionaries[lang];
      let value = dict[key] ?? dictionaries.en[key] ?? key;
      if (vars) {
        for (const [name, replacement] of Object.entries(vars)) {
          value = value.replace(`{${name}}`, String(replacement));
        }
      }
      return value;
    },
    [lang],
  );

  const contextValue = useMemo(() => ({lang, setLang, t}), [lang, setLang, t]);

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within a LanguageProvider');
  }
  return context;
}
