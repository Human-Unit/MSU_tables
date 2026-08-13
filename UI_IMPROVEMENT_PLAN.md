# Academic Performance Page - UI/UX Improvement Plan

## Design Analysis & Issues Identified

### What's Working Well:
- Clean card-based layout with proper data organization
- Color-coded tour headers (sky/amber colors)
- Lock mechanism to prevent editing after passing
- Split views for exam/zachet with appropriate scoring systems
- Student details accessible via clicking student name

### Issues Addressed:
1. **Missing Grade Type Indicator** - No way to distinguish exam vs zachet grades at a glance (PerformanceJournalPage shows E/T badges)
2. **No Average Grades** - No quick overview of class performance per discipline
3. **Missing Lock Legend** - Users don't understand the color coding and lock system
4. **Unclear "Add Tour" Button** - Button placement and purpose wasn't clear
5. **"Add Tour" button missing count** - No indication of current tour count vs limit
6. **Student dropdown shows ALL students** - When adding grades, the dialog shows students from all groups instead of only the selected group

## Improvements Implemented

### 1. Discipline Average Grades ✓
**Solution:** Added average grade calculation displayed below discipline name in the header.
- Shows average score: "Avg: 3.5" / "Ср.балл: 3.5"
- Shows pass count on hover tooltip
- Implemented in both AcademicJournalPage and PerformanceJournalPage

### 2. Enhanced "Add Tour" Button ✓
**Solution:** Show current tour count vs maximum limit.
- Button displays: "3/10" indicating 3 tours of max 10
- Only shows when tours < MAX_TOUR_COUNT
- Clearer visual feedback on tour availability

### 3. Lock Legend/Help Text ✓
**Solution:** Added a visual legend below the table explaining:
- Green badge = Passed grades
- Red badge = Failed grades  
- Lock icon = Locked cells (cannot edit)
- Sky-colored Tour 1 = Initial attempt
- Amber-colored Tour 2 = Retake

### 4. Visual Tour Distinction (Already Present) ✓
**Solution:** Tour headers have color-coded labels:
- Tour 1 (sky-600): "Tour 1 (Initial)" / "Тур 1 (Первичная попытка)"
- Tour 2 (amber-600): "Tour 2 (Retake)" / "Тур 2 (Пересдача)"
- Tour 3+ (slate-500): "Tour N (Additional)" / "Тур N (Дополнительный)"

### 5. Grade Type Indicator (PerformanceJournalPage) ✓
**Solution:** Show E/T badge in grade cells to distinguish:
- "E" = Exam grades
- "T" = Zachet (Test) grades

### 6. Filtered Student Dropdown ✓
**Problem:** When adding/editing grades via the dialog, the student dropdown showed ALL students in the system instead of only those in the currently selected group.

**Solution:** 
- Added `filteredOptions` prop to `RecordFormDialog` component
- Both AcademicJournalPage and PerformanceJournalPage now create `studentOptions` from `groupStudents`
- The dialog's student dropdown is overridden with group-filtered options when a group is selected
- When no group is selected, the dialog still shows all students (fallback behavior)

### 7. Fixed Grade Label Display ✓
**Problem:** Grades were showing incorrect labels (always showing "неявка"/"Fail" instead of proper score labels).

**Solution:** 
- Restored proper `getScoreLabel()` function usage
- Score labels now correctly display: "Excellent", "Good", "Satisfactory", "Poor", "Fail" for exams
- Zachet labels now correctly display: "Pass", "Retake", "Fail" for tests

### 8. Grades Are Now Read-Only ✓
**Problem:** Users could click on existing grades to change them inline.

**Solution:** 
- Removed inline dropdown editing functionality
- Once a grade is set, it displays as read-only with a lock icon
- Grades can only be added via the "+" button in empty cells
- Tooltip shows "Grade cannot be changed once set" when hovering locked grades

## Files Modified

### `frontend/src/components/RecordFormDialog.tsx`
- Added `filteredOptions` prop to accept filtered option overrides
- Added `mergedOptions` useMemo to merge API-loaded options with filtered options
- Updated Field component to use merged options for select fields

### `frontend/src/pages/AcademicJournalPage.tsx`
- Added `studentOptions` useMemo to convert `groupStudents` to OptionItem format
- Passed `filteredOptions={{students: studentOptions}}` to RecordFormDialog
- Added `disciplineAverages` calculation
- Added average display in discipline header
- Updated "Add Tour" button to show tour count (N/MAX)
- Added lock legend explaining color coding and tour types
- Removed inline dropdown editing - grades now read-only once set

### `frontend/src/pages/PerformanceJournalPage.tsx`
- Added `studentOptions` useMemo for group-filtered students
- Passed `filteredOptions` to RecordFormDialog
- Added `disciplineAverages` calculation
- Added average display in discipline header
- Updated "Add Tour" button to show tour count
- Added comprehensive legend explaining score types and tour meanings
- Added E/T badge for grade type distinction

### `frontend/src/i18n.tsx`
- Added English translations:
  - `journal.avg`: 'Avg'
  - `journal.passed`: 'Passed'
  - `journal.legend.passed`: 'Passed'
  - `journal.legend.failed`: 'Failed'
  - `journal.legend.locked`: 'Locked'
  - `journal.legend.tour1`: 'Tour 1'
  - `journal.legend.tour2`: 'Tour 2'
  - `journal.gradeLocked`: 'Grade cannot be changed once set'
- Added Russian translations:
  - `journal.avg`: 'Ср.балл'
  - `journal.passed`: 'Пройдено'
  - `journal.legend.passed`: 'Пройдено'
  - `journal.legend.failed`: 'Не пройдено'
  - `journal.legend.locked`: 'Заблокировано'
  - `journal.legend.tour1`: 'Тур 1'
  - `journal.legend.tour2`: 'Тур 2'
  - `journal.gradeLocked`: 'Оценка не может быть изменена после установки'

## Future Enhancements
- Add loading skeleton states for better perceived performance
- Add visual feedback animations when grades are saved
- Consider adding export/print functionality for grade reports
- Add bulk grade entry mode for faster data input