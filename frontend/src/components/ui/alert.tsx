import {AlertCircle, AlertTriangle, CheckCircle, Info, X} from 'lucide-react';
import {cn} from '../../lib/utils';

type AlertVariant = 'error' | 'warning' | 'success' | 'info';

const variantStyles: Record<AlertVariant, {container: string; icon: string; text: string}> = {
  error: {
    container: 'border-red-200 bg-red-50',
    icon: 'text-red-500',
    text: 'text-red-700',
  },
  warning: {
    container: 'border-amber-200 bg-amber-50',
    icon: 'text-amber-500',
    text: 'text-amber-700',
  },
  success: {
    container: 'border-emerald-200 bg-emerald-50',
    icon: 'text-emerald-500',
    text: 'text-emerald-700',
  },
  info: {
    container: 'border-blue-200 bg-blue-50',
    icon: 'text-blue-500',
    text: 'text-blue-700',
  },
};

const variantIcons: Record<AlertVariant, typeof AlertCircle> = {
  error: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
};

type AlertProps = {
  variant?: AlertVariant;
  message: string;
  onClose?: () => void;
  className?: string;
};

export function Alert({variant = 'error', message, onClose, className}: AlertProps) {
  const styles = variantStyles[variant];
  const Icon = variantIcons[variant];

  return (
    <div className={cn('flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm', styles.container, className)}>
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', styles.icon)} />
      <p className={cn('flex-1', styles.text)}>{message}</p>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className={cn('rounded-full p-0.5 transition hover:opacity-70', styles.icon)}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}