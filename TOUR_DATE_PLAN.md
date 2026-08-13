# Plan: Replace Tour Numbers with Tour Dates in Academic Performance Journal

## Objective
Replace numeric tour labels (1, 2, 3) in the academic performance journal tables with actual dates from the records when available, and add mock date data to the seed data.

## Implementation Status: ✅ COMPLETED

## Implementation Steps

### 1. Update `frontend/src/pages/PerformanceJournalPage.tsx`
- [x] Modify tour header display to show dates when available, fallback to tour number
- [x] Update the title attribute and display logic for grade cells to show date appropriately
- [x] Handle cases where date is missing (show tour number as fallback)

### 2. Update `frontend/src/pages/AcademicJournalPage.tsx`
- [x] Apply the same tour date display logic for consistency
- [x] Update title attributes to properly show tour/date info

### 3. Update `internal/database/seed.go`
- [x] Add mock dates for exam grades in `seedGradesDemo` function
- [x] Add mock dates for zachet grades in `seedGradesDemo` function

### 4. Update translations in `frontend/src/i18n.tsx` (if needed)
- [x] No additional translations needed (using existing `field.tour` and `field.date`)

## Technical Details

### Date Display Logic
- When a grade record exists with a date: display the date (YYYY-MM-DD format)
- When no grade exists yet: show tour number as placeholder
- Dates are displayed in the tour header row (second row of the table header)
- Dates appear in the title tooltip for grade cells

### Mock Data Dates
- Tour 1 dates: October 2026 (initial exam/zachet)
- Tour 2 dates: December 2026 (retake period) for students who failed Tour 1

## Changes Made

### `internal/database/seed.go`
- Added `formatDate` helper function
- Added `ptr` helper function for generic pointer
- Updated `seedGradesDemo` to include mock dates for exam and zachet grades
- Added Tour 2 records for 20% of failing students

### `frontend/src/pages/PerformanceJournalPage.tsx`
- Added `formatDate` helper function
- Added `getTourDateFromGrades` helper function
- Added `tourDateMap` useMemo to collect dates per discipline+tour
- Updated tour header cells to show dates when available

### `frontend/src/pages/AcademicJournalPage.tsx`
- Added `formatDate` helper function
- Added `tourDateMap` useMemo to collect dates per discipline+tour
- Updated tour header cells to show dates when available