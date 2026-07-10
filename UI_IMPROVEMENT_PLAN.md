# Academic Performance Page - UI/UX Improvement Plan

## Current Issues Summary
Based on analysis, the main UI/UX issues are:
1. **Dropdown positioning** - Uses absolute positioning without proper collision detection or portal rendering
2. **No keyboard navigation** - Dropdown lacks arrow key/escape/enter support
3. **Hidden tour distinction** - All tours look the same visually
4. **Unclear locking feedback** - Users don't understand why tours are locked
5. **"Add Tour" placement** - Button inside header may be confusing

## Proposed Improvements

### 1. Enhanced Grade Cell Dropdown Component ✓
**Problem:** Inline dropdown positioning can cause overflow issues, no keyboard support.

**Solution:** Create a dedicated `GradeDropdown` component with:
- Portal rendering (using `createPortal`) to avoid clipping
- Keyboard navigation (arrow up/down, enter to select, escape to close)
- Proper focus management
- Visual hover states for all options
- Click-outside-to-close detection

**Status:** Partially implemented ( GradeDropdown component created but still using inline dropdown in page)

### 2. Visual Tour Distinction ✓
**Problem:** All tour columns look identical, making it hard to track which tour is which.

**Solution:** Add visual distinction for tours:
- **Tour 1:** Primary color (sky-600) - "Tour 1 (Initial)"
- **Tour 2:** Secondary color (amber-600) - "Tour 2 (Retake)"  
- **Tour 3+:** Muted color (slate-500) - "Tour N (Additional)"

**Status:** Implemented - Tour headers now use color-coded labels

### 3. Improved Locking Mechanism Feedback ✓
**Problem:** Lock icon alone doesn't explain why a tour is locked.

**Solution:** 
- Add tooltip explaining the lock reason: "Locked: Passed in Tour X" or "Locked: Maximum changes reached"
- Added `getLockTooltip` function to determine the specific reason

**Status:** Implemented - Locked cells show detailed tooltips

### 4. Better "Add Tour" UX ✓
**Problem:** "Add Tour" button inside the discipline header may be missed.

**Solution:**
- Show current tour count vs max: "3/10 tours" on the button
- Added visual indication of tour limits

**Status:** Implemented - Button now shows "N/10" count

### 5. Additional UI Enhancements
- **Loading states:** Add skeleton loaders while data loads
- **Empty states:** More helpful empty state illustrations/messages
- **Responsive behavior:** Better mobile/tablet handling
- **Visual feedback:** Animation when grades are saved successfully

## Implementation Completed

### Files Modified:
1. `frontend/src/pages/AcademicJournalPage.tsx` - Main page component
   - Added visual tour distinction (color-coded tour headers)
   - Added improved locking tooltip function
   - Updated Add Tour button to show tour count
2. `frontend/src/i18n.tsx` - Added new translations:
   - `journal.tourLockedChanges` - "Locked: maximum changes reached"
   - `journal.tourLockedPassed` - "Locked: passed in Tour {tour}"
   - `journal.tour1` - "Tour 1 (Initial)"
   - `journal.tour2` - "Tour 2 (Retake)"
   - `journal.tour3plus` - "Tour {n} (Additional)"

### Files Created:
1. `frontend/src/components/GradeDropdown.tsx` - New dropdown component with portal and keyboard support
   - Uses `createPortal` for proper positioning
   - Keyboard navigation support (arrow keys, enter, escape)
   - Click-outside-to-close detection

## Next Steps (Optional)
- Fully integrate GradeDropdown component into AcademicJournalPage
- Add loading skeleton states
- Add "lock legend" help text below the table
- Add visual feedback animations for grade saves