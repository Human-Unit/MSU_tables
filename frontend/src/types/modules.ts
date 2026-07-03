export type OptionItem = {
  id: string;
  label: string;
};

export type ColumnConfig = {
  key: string;
  label: string;
};

export type FieldType = 'text' | 'number' | 'date' | 'checkbox' | 'select' | 'textarea' | 'password';

export type FieldConfig = {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  source?: string;
  options?: OptionItem[];
  min?: number;
  max?: number;
  step?: number;
  optional?: boolean;
  // For select fields whose underlying value is numeric (e.g. weekday),
  // so the payload is sent as a number instead of a string.
  valueType?: 'number';
};

export type ModuleConfig = {
  key: string;
  title: string;
  subtitle?: string;
  searchPlaceholder: string;
  columns: ColumnConfig[];
  fields: FieldConfig[];
  // Key of the field that identifies a record for get/update/delete.
  // Defaults to 'id'; people modules (students/teachers) expose it as 'personId'.
  idKey?: string;
};

export type PageResult = {
  items: Record<string, any>[];
  page: number;
  pageSize: number;
  total: number;
};

export type DashboardStats = {
  totalStudents: number;
  totalTeachers: number;
  totalGroups: number;
  totalSubjects: number;
  recentStudents: Record<string, any>[];
  recentTeachers: Record<string, any>[];
};

export type CurrentUser = {
  id: string;
  personId: string;
  roleId: string;
  roleName: string;
  username: string;
  fullName: string;
  email?: string;
  isActive: boolean;
};

export type AuthResponse = {
  token: string;
  user: CurrentUser;
};

export type FacultyOption = {id: string; name: string};
export type VocationOption = {id: string; name: string; facultyId: string};
export type GroupOption = {id: string; name: string; vocationId: string; educationYear: number};

export type ScheduleFilterData = {
  faculties: FacultyOption[];
  vocations: VocationOption[];
  groups: GroupOption[];
};

// A schedule row as returned by WeeklySchedule (GORM model serialized to JSON).
export type ScheduleEntry = {
  id: string;
  weekday: number;
  pair: number;
  typeOfLesson: string;
  subject?: {name?: string};
  teacher?: {fullName?: string};
  auditorium?: {number?: string} | null;
  group?: {name?: string};
};

