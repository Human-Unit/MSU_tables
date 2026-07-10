import {createPortal} from 'react-dom';
import {useEffect, useRef, useState, useCallback, useMemo} from 'react';

import {cn} from '../lib/utils';

type ScoreOption = {
  value: number;
  label: string;
};

type GradeDropdownProps = {
  anchorRef: React.RefObject<HTMLElement>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (value: number) => void;
  options: ScoreOption[];
  currentValue?: number;
};

export function GradeDropdown({anchorRef, open, onOpenChange, onSelect, options, currentValue}: GradeDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [position, setPosition] = useState({top: 0, left: 0});

  // Calculate position for portal
  useEffect(() => {
    if (open && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setPosition({
        top: rect.bottom + scrollTop,
        left: rect.left,
      });
    }
  }, [open, anchorRef]);

  // Handle click outside
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current?.contains(target) || anchorRef.current?.contains(target)) {
        return;
      }
      onOpenChange(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onOpenChange, anchorRef]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!open) return;

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          onOpenChange(false);
          break;
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % options.length);
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex((prev) => (prev - 1 + options.length) % options.length);
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (options[focusedIndex]) {
            onSelect(options[focusedIndex].value);
            onOpenChange(false);
          }
          break;
      }
    },
    [open, options, focusedIndex, onSelect, onOpenChange],
  );

  // Scroll focused item into view
  useEffect(() => {
    if (!open) return;
    
    const itemRefs = dropdownRef.current?.querySelectorAll('button');
    const focusedElement = itemRefs?.[focusedIndex] as HTMLElement;
    focusedElement?.scrollIntoView({block: 'nearest'});
  }, [open, focusedIndex]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      // Reset focused index when opening
      const currentIndex = currentValue !== undefined ? options.findIndex((o) => o.value === currentValue) : 0;
      setFocusedIndex(Math.max(0, currentIndex));
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleKeyDown, options, currentValue]);

  if (!open) return null;

  return createPortal(
    <div
      ref={dropdownRef}
      className="absolute z-[100] mt-1 min-w-[120px] rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
      style={{top: position.top, left: position.left}}
      role="menu"
    >
      <div className="flex flex-col gap-0.5" role="none">
        {options.map((option, index) => (
          <button
            key={option.value}
            type="button"
            role="menuitem"
            onClick={() => {
              onSelect(option.value);
              onOpenChange(false);
            }}
            className={cn(
              'w-full rounded px-2 py-1 text-left text-xs transition',
              option.value === currentValue && 'bg-slate-100 font-semibold',
              index === focusedIndex && 'bg-slate-100',
              option.value !== currentValue && index !== focusedIndex && 'hover:bg-slate-50',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );
}