# Plan: Change Date Display Format from YYYY-MM-DD to DD.MM.YYYY

## Objective
Replace the date display format in academic performance journals from ISO format (YYYY-MM-DD) to European/Russian format (DD.MM.YYYY) for better readability.

## Implementation Steps

### 1. Update `frontend/src/pages/AcademicJournalPage.tsx`
- [x] Modify `formatDate` helper function to convert YYYY-MM-DD to DD.MM.YYYY
- [x] Update tour header display logic (line ~410-418) to use formatted dates
- [x] Update grade cell tooltip to show formatted dates

### 2. Update `frontend/src/pages/PerformanceJournalPage.tsx`
- [x] Modify `formatDate` helper function to convert YYYY-MM-DD to DD.MM.YYYY
- [x] Update tour header display logic (line ~352-361) to use formatted dates
- [x] Update grade cell tooltip to show formatted dates

### 3. Verify changes
- [x] Ensure dates display correctly in both journal pages
- [x] Verify tooltip formatting is consistent

## Technical Details

### Date Format Conversion
Input: `"2026-10-15"` → Output: `"15.10.2026"`

### Helper Function Change
```typescript
// Current
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return dateStr;
}

// New
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  // Convert YYYY-MM-DD to DD.MM.YYYY
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}
```

## Files to Modify
1. `frontend/src/pages/AcademicJournalPage.tsx`
2. `frontend/src/pages/PerformanceJournalPage.tsx`