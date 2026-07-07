import type {ModuleConfig} from '../types/modules';

// Column `label`, field `label` and static option `label` values are i18n keys
// (see frontend/src/i18n.tsx). ModulePage resolves them via t(). Dynamic option
// labels loaded from the API (real names) pass through t() unchanged.
//
// Note: the `isActive` flag is intentionally NOT exposed as a form field. It is a
// backend soft-delete flag: new records default to active and edits preserve the
// current value (see RecordFormDialog). Deleting a record deactivates it.
export const moduleConfigs: ModuleConfig[] = [
  {
    key: 'faculty',
    title: 'Faculties',
    subtitle: 'Manage academic faculties.',
    searchPlaceholder: 'Search faculty...',
    columns: [{key: 'name', label: 'col.name'}],
    fields: [
      {name: 'name', label: 'field.name', type: 'text', required: true, placeholder: 'Faculty name'},
    ],
  },
  {
    key: 'vocation',
    title: 'Vocations',
    subtitle: 'Manage vocations within a faculty.',
    searchPlaceholder: 'Search vocation...',
    columns: [{key: 'name', label: 'col.name'}, {key: 'faculty.name', label: 'col.faculty'}],
    fields: [
      {name: 'name', label: 'field.name', type: 'text', required: true},
      {name: 'facultyId', label: 'field.faculty', type: 'select', source: 'faculty', required: false},
    ],
  },
  {
    key: 'group',
    title: 'Groups',
    subtitle: 'Student groups and education year.',
    searchPlaceholder: 'Search group...',
    columns: [{key: 'name', label: 'col.name'}, {key: 'educationYear', label: 'col.educationYear'}, {key: 'vocation.name', label: 'col.vocation'}],
    fields: [
      {name: 'name', label: 'field.name', type: 'text', required: true},
      {name: 'vocationId', label: 'field.vocation', type: 'select', source: 'vocation', required: true},
      {name: 'educationYear', label: 'field.educationYear', type: 'number', required: true, min: 1},
    ],
  },
  {
    key: 'auditorium',
    title: 'Auditoriums',
    subtitle: 'Manage classroom and auditorium records.',
    searchPlaceholder: 'Search auditorium...',
    columns: [{key: 'number', label: 'col.number'}, {key: 'type', label: 'col.type'}],
    fields: [
      {name: 'number', label: 'field.number', type: 'text', required: true},
      {name: 'type', label: 'field.type', type: 'select', required: true, options: [
        {id: 'lecture', label: 'opt.lecture'},
        {id: 'practice', label: 'opt.practice'},
        {id: 'flow', label: 'opt.flow'},
      ]},
    ],
  },
  {
    key: 'students',
    title: 'Students',
    subtitle: 'Create student accounts and profiles.',
    searchPlaceholder: 'Search students...',
    idKey: 'personId',
    columns: [{key: 'fullName', label: 'col.fullName'}, {key: 'groupName', label: 'col.group'}, {key: 'username', label: 'col.username'}],
    fields: [
      {name: 'fullName', label: 'field.fullName', type: 'text', required: true},
      {name: 'dateOfBirth', label: 'field.dateOfBirth', type: 'date'},
      {name: 'phone', label: 'field.phone', type: 'text'},
      {name: 'address', label: 'field.address', type: 'textarea'},
      {name: 'email', label: 'field.email', type: 'text'},
      {name: 'groupId', label: 'field.group', type: 'select', source: 'group', required: true},
      {name: 'username', label: 'field.username', type: 'text', required: true},
      {name: 'password', label: 'field.password', type: 'password', required: true},
    ],
  },
  {
    key: 'teachers',
    title: 'Teachers',
    subtitle: 'Create teacher accounts and profiles.',
    searchPlaceholder: 'Search teachers...',
    idKey: 'personId',
    columns: [{key: 'fullName', label: 'col.fullName'}, {key: 'occupation', label: 'col.occupation'}, {key: 'username', label: 'col.username'}],
    fields: [
      {name: 'fullName', label: 'field.fullName', type: 'text', required: true},
      {name: 'dateOfBirth', label: 'field.dateOfBirth', type: 'date'},
      {name: 'phone', label: 'field.phone', type: 'text'},
      {name: 'address', label: 'field.address', type: 'textarea'},
      {name: 'email', label: 'field.email', type: 'text'},
      {name: 'scienceDegree', label: 'field.scienceDegree', type: 'text'},
      {name: 'scienceRank', label: 'field.scienceRank', type: 'text'},
      {name: 'occupation', label: 'field.occupation', type: 'text'},
      {name: 'username', label: 'field.username', type: 'text', required: true},
      {name: 'password', label: 'field.password', type: 'password', required: true},
    ],
  },
  {
    key: 'subject',
    title: 'Subjects',
    subtitle: 'Manage academic subjects.',
    searchPlaceholder: 'Search subject...',
    columns: [{key: 'name', label: 'col.name'}, {key: 'semester', label: 'col.semester'}, {key: 'creditsECTS', label: 'col.credits'}],
    fields: [
      {name: 'name', label: 'field.name', type: 'text', required: true},
      {name: 'semester', label: 'field.semester', type: 'number', required: true, min: 1},
      {name: 'quantityOfHours', label: 'field.quantityOfHours', type: 'number', required: true, min: 1},
      {name: 'creditsECTS', label: 'field.creditsECTS', type: 'number', min: 0, step: 0.1},
      {name: 'formOfControl', label: 'field.formOfControl', type: 'text', required: true},
    ],
  },
   {
     key: 'discipline',
     title: 'Disciplines',
     subtitle: 'Link subjects, groups, and teachers.',
     searchPlaceholder: 'Search discipline...',
     columns: [{key: 'subject.name', label: 'col.subject'}, {key: 'group.name', label: 'col.group'}, {key: 'teacher.fullName', label: 'col.teacher'}],
     fields: [
       {name: 'subjectId', label: 'field.subject', type: 'select', source: 'subject', required: true},
       {name: 'teacherId', label: 'field.teacher', type: 'select', source: 'teachers', required: true},
       {name: 'groupId', label: 'field.group', type: 'select', source: 'group', required: true},
       {name: 'quantityOfLectures', label: 'field.lectures', type: 'number', min: 0},
       {name: 'quantityOfPracticalLessons', label: 'field.practicalLessons', type: 'number', min: 0},
       {name: 'quantityOfLabWorks', label: 'field.labWorks', type: 'number', min: 0},
       {name: 'otherWorks', label: 'field.otherWorks', type: 'number', min: 0},
       {name: 'selfControl', label: 'field.selfControl', type: 'number', min: 0},
     ],
   },
   {
     key: 'attendance',
     title: 'Attendance',
     subtitle: 'Track student attendance.',
     searchPlaceholder: 'Search attendance...',
    columns: [{key: 'day', label: 'col.day'}, {key: 'pair', label: 'col.pair'}, {key: 'student.fullName', label: 'col.student'}, {key: 'discipline.subject.name', label: 'col.subject'}, {key: 'status', label: 'col.status'}],
    fields: [
      {name: 'studentId', label: 'field.student', type: 'select', source: 'students', required: true},
      {name: 'disciplineId', label: 'field.discipline', type: 'select', source: 'discipline', required: true},
      {name: 'day', label: 'field.day', type: 'date', required: true},
      {name: 'pair', label: 'field.pair', type: 'number', required: true, min: 1, max: 8},
      {name: 'status', label: 'field.status', type: 'select', required: true, options: [
        {id: 'present', label: 'status.present'},
        {id: 'absent', label: 'status.absent'},
        {id: 'late', label: 'status.late'},
        {id: 'excused', label: 'status.excused'},
      ]},
    ],
  },
    {
        key: 'exam',
        title: 'Exams',
        subtitle: 'Manage exam grades.',
        searchPlaceholder: 'Search exams...',
        columns: [{key: 'student.fullName', label: 'col.student'}, {key: 'discipline.subject.name', label: 'col.discipline'}, {key: 'sign', label: 'col.sign'}],
        fields: [
          {name: 'studentId', label: 'field.student', type: 'select', source: 'students', required: true},
          {name: 'disciplineId', label: 'field.discipline', type: 'select', source: 'discipline', required: true},
          {name: 'teacherId', label: 'field.teacher', type: 'select', source: 'teachers', required: true},
          {name: 'tour', label: 'field.tour', type: 'number', required: true, min: 1},
          {name: 'sign', label: 'field.sign', type: 'number', required: true, min: 1, max: 5},
        ],
      },
    {
        key: 'zachet',
        title: 'Zachet',
        subtitle: 'Manage pass/fail test assessments.',
        searchPlaceholder: 'Search zachet...',
        columns: [{key: 'student.fullName', label: 'col.student'}, {key: 'discipline.subject.name', label: 'col.discipline'}, {key: 'sign', label: 'col.sign'}],
        fields: [
          {name: 'studentId', label: 'field.student', type: 'select', source: 'students', required: true},
          {name: 'disciplineId', label: 'field.discipline', type: 'select', source: 'discipline', required: true},
          {name: 'teacherId', label: 'field.teacher', type: 'select', source: 'teachers', required: true},
          {name: 'tour', label: 'field.tour', type: 'number', required: true, min: 1},
          {name: 'sign', label: 'field.sign', type: 'number', required: true, min: 0, max: 3},
        ],
      },
  {
    key: 'execution',
    title: 'Execution',
    subtitle: 'Track teacher workload execution.',
    searchPlaceholder: 'Search execution...',
    columns: [{key: 'teacher.fullName', label: 'col.teacher'}, {key: 'discipline.subject.name', label: 'col.discipline'}, {key: 'lectures', label: 'col.lectures'}],
    fields: [
      {name: 'teacherId', label: 'field.teacher', type: 'select', source: 'teachers', required: true},
      {name: 'disciplineId', label: 'field.discipline', type: 'select', source: 'discipline', required: true},
      {name: 'lectures', label: 'field.lectures', type: 'number', min: 0},
      {name: 'practices', label: 'field.practices', type: 'number', min: 0},
      {name: 'labWorks', label: 'field.labWorks', type: 'number', min: 0},
      {name: 'otherWorks', label: 'field.otherWorks', type: 'number', min: 0},
    ],
  },
];

export const moduleByKey = new Map(moduleConfigs.map((module) => [module.key, module]));
