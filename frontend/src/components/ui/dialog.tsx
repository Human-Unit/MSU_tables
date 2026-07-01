import * as React from 'react';
import {X} from 'lucide-react';
import {cn} from '../../lib/utils';
import {Button} from './button';

type DialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DialogContext = React.createContext<DialogContextValue | null>(null);

export function Dialog({open, onOpenChange, children}: {open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode}) {
  return <DialogContext.Provider value={{open, setOpen: onOpenChange}}>{children}</DialogContext.Provider>;
}

export function DialogTrigger({children}: {children: React.ReactNode}) {
  const ctx = React.useContext(DialogContext);
  if (!ctx) {
    return null;
  }
  return <div onClick={() => ctx.setOpen(true)}>{children}</div>;
}

export function DialogContent({className, children}: React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(DialogContext);
  if (!ctx?.open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className={cn('relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl', className)}>
        <button
          type="button"
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          onClick={() => ctx.setOpen(false)}
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({className, ...props}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('border-b border-slate-100 px-6 py-4', className)} {...props} />;
}

export function DialogTitle({className, ...props}: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-lg font-semibold text-slate-900', className)} {...props} />;
}

export function DialogDescription({className, ...props}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-slate-500', className)} {...props} />;
}

export function DialogBody({className, ...props}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('max-h-[75vh] overflow-y-auto px-6 py-5', className)} {...props} />;
}

export function DialogFooter({className, ...props}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4', className)} {...props} />;
}

export function DialogCloseButton({onClick}: {onClick?: () => void}) {
  const ctx = React.useContext(DialogContext);
  return <Button variant="secondary" onClick={() => (onClick ? onClick() : ctx?.setOpen(false))}>Close</Button>;
}

