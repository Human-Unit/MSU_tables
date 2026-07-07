import * as React from 'react';
import {X} from 'lucide-react';
import {createPortal} from 'react-dom';
import {cn} from '../../lib/utils';
import {Button} from './button';

type DialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DialogContext = React.createContext<DialogContextValue | null>(null);

// Lock body scroll when dialog opens
const useScrollLock = (open: boolean) => {
  React.useEffect(() => {
    if (open) {
      const originalStyle = document.body.style;
      const originalPadding = document.body.style.paddingRight;
      
      // Get scrollbar width to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      
      return () => {
        document.body.style.overflow = '';
        document.body.style.paddingRight = originalPadding;
      };
    }
  }, [open]);
};

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
  useScrollLock(ctx?.open ?? false);
  
  if (!ctx?.open) {
    return null;
  }

  // Use portal to render at body level to avoid scroll container issues
  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      onClick={(e) => {
        // Close when clicking on backdrop (outside the dialog)
        if (e.target === e.currentTarget) {
          ctx.setOpen(false);
        }
      }}
    >
      <div 
        className={cn('relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl', className)}
        onClick={(e) => e.stopPropagation()}
      >
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
    </div>,
    document.body
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