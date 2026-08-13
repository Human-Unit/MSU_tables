# Plan: Pre-fill and Filter Dialog Fields on Discipline Click

## Objective
When clicking on a grade cell (subject field) in the Academic Journal page, the RecordFormDialog should:
1. Automatically set tour, teacher's name, and student's name based on the clicked discipline
2. Hide/restrict irrelevant information (other disciplines and teachers) from the dropdowns

## Implementation Status: ✅ COMPLETED (with database fixes)

## Changes Made

### Frontend Changes

### 1. `frontend/src/components/RecordFormDialog.tsx`
- Added `dynamicOptions` useMemo hook that:
  - When `disciplineId` is pre-filled in `initialValues`, filters the discipline dropdown to show only that discipline
  - When `teacherId` is pre-filled in `initialValues`, filters the teachers dropdown to show only that teacher
  - Only applies filtering during new record creation (when `!recordId`)

### 2. `frontend/src/pages/AcademicJournalPage.tsx`
- Added `disciplineOptions` useMemo to convert group disciplines to OptionItem format
- Updated `RecordFormDialog` props to pass `discipline: disciplineOptions` in `filteredOptions`
- This ensures the dialog has access to filtered discipline options

### Backend Fixes (Database-related errors)

### 3. `migrations/000003_split_academic_performance.up.sql`
- Fixed INSERT statements to include `sign_changes` column during migration of exam/zachet data

### 4. `internal/database/migrate.go`
- Added `&models.Exam{}` and `&models.Zachet{}` to AutoMigrate list so tables are created properly

### 5. `internal/services/module.go`
- Fixed `saveEntityWithSignChange` function to use `saveEntity` for new records instead of creating empty objects

## How It Works
1. When user clicks "+" on a grade cell, the `openAdd` function is called with pre-filled values including `disciplineId` and `teacherId`
2. The dialog receives these values and the discipline options filtered to the current group
3. The `dynamicOptions` hook in RecordFormDialog then:
   - Finds the matching discipline option from the merged options
   - Filters teachers to only show the one matching `teacherId`
   - Shows only the selected discipline in the discipline dropdown