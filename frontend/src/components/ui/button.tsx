import * as React from 'react';
import {cn} from '../../lib/utils';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'secondary' | 'ghost' | 'destructive';
  size?: 'default' | 'sm';
};

export function Button({className, variant = 'default', size = 'default', ...props}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:pointer-events-none disabled:opacity-50',
        variant === 'default' && 'bg-slate-900 text-white hover:bg-slate-800',
        variant === 'secondary' && 'bg-slate-100 text-slate-900 hover:bg-slate-200',
        variant === 'ghost' && 'bg-transparent text-slate-700 hover:bg-slate-100',
        variant === 'destructive' && 'bg-rose-600 text-white hover:bg-rose-500',
        size === 'default' && 'h-10 px-4 py-2',
        size === 'sm' && 'h-8 px-3 text-xs',
        className,
      )}
      {...props}
    />
  );
}

