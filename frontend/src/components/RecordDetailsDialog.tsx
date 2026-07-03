import {useEffect, useMemo, useState} from 'react';

import {Button} from './ui/button';
import {Badge} from './ui/badge';
import {Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle} from './ui/dialog';
import {api} from '../services/api';
import {useI18n} from '../i18n';
import type {FieldConfig, ModuleConfig, OptionItem} from '../types/modules';

type Record_ = Record<string, any>;

type Translate = (key: string, vars?: Record<string, string | number>) => string;

type RecordDetailsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: ModuleConfig;
  recordId?: string | null;
  // When provided, an Edit button is shown that hands control back to the caller.
  onEdit?: (id: string) => void;
};

export function RecordDetailsDialog({open, onOpenChange, config, recordId, onEdit}: RecordDetailsDialogProps) {
  const {t} = useI18n();
  const [record, setRecord] = useState<Record_ | null>(null);
  const [options, setOptions] = useState<Record<string, OptionItem[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (open && recordId) {
      setLoading(true);
      void api
        .get(config.key, recordId)
        .then((fetched) => {
          if (!cancelled) setRecord(fetched);
        })
        .catch(() => {
          if (!cancelled) setRecord(null);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    } else {
      setRecord(null);
    }
    return () => {
      cancelled = true;
    };
  }, [open, recordId, config.key]);

  // Load option sources so relation ids can be shown as human-readable names.
  useEffect(() => {
    if (!open) {
      return;
    }
    const sources = [...new Set(config.fields.filter((field) => field.type === 'select' && field.source).map((field) => field.source as string))];
    let cancelled = false;
    void Promise.all(sources.map(async (source) => [source, await api.options(source)] as const)).then((entries) => {
      if (cancelled) return;
      const next: Record<string, OptionItem[]> = {};
      for (const [source, items] of entries) {
        next[source] = items;
      }
      setOptions(next);
    });
    return () => {
      cancelled = true;
    };
  }, [open, config.fields]);

  const title = useMemo(() => (record ? recordTitle(record) : ''), [record]);

  // Fields shown in the details view: every configured field except passwords.
  const rows = config.fields.filter((field) => field.type !== 'password');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('common.recordDetails')}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          {loading ? (
            <p className="text-sm text-slate-500">{t('common.loading')}</p>
          ) : !record ? (
            <p className="text-sm text-slate-500">{t('common.noRecords')}</p>
          ) : (
            <>
              {title ? <p className="mb-4 text-lg font-semibold text-slate-900">{title}</p> : null}
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {rows.map((field) => (
                  <div key={field.name} className="space-y-0.5">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{t(field.label)}</dt>
                    <dd className="text-sm text-slate-800">{renderDetail(field, record, options, t)}</dd>
                  </div>
                ))}
                <div className="space-y-0.5">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{t('common.status')}</dt>
                  <dd className="text-sm text-slate-800">
                    <Badge className={record.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
                      {record.isActive ? t('common.active') : t('common.inactive')}
                    </Badge>
                  </dd>
                </div>
              </dl>
              <div className="mt-6 flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                  {t('common.close')}
                </Button>
                {onEdit && recordId ? (
                  <Button
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      onEdit(recordId);
                    }}
                  >
                    {t('common.edit')}
                  </Button>
                ) : null}
              </div>
            </>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

function recordTitle(record: Record_): string {
  return String(record.fullName ?? record.name ?? record.number ?? '');
}

const emptyValue = <span className="text-slate-400">—</span>;

function renderDetail(field: FieldConfig, record: Record_, options: Record<string, OptionItem[]>, t: Translate) {
  const value = record[field.name];

  if (field.type === 'date') {
    return value ? formatDate(value) : emptyValue;
  }

  if (field.type === 'select') {
    // 1) A preloaded relation object (e.g. faculty, group, teacher).
    const nested = relationName(record, field.name);
    if (nested) return nested;
    // 2) A loaded option source matched by id.
    if (field.source && options[field.source]) {
      const match = options[field.source].find((option) => String(option.id) === String(value));
      if (match) return t(match.label);
    }
    // 3) A static option list (e.g. lesson type, status, weekday).
    if (field.options) {
      const match = field.options.find((option) => String(option.id) === String(value));
      if (match) return t(match.label);
    }
    return value === undefined || value === null || value === '' ? emptyValue : String(value);
  }

  if (value === undefined || value === null || value === '') {
    return emptyValue;
  }
  return String(value);
}

// For a foreign-key field like `facultyId`, look for a preloaded `faculty` object.
function relationName(record: Record_, fieldName: string): string {
  if (!fieldName.endsWith('Id')) return '';
  const relationKey = fieldName.slice(0, -2);
  const related = record[relationKey];
  if (related && typeof related === 'object') {
    return String(related.name ?? related.fullName ?? related.number ?? '');
  }
  return '';
}

function formatDate(value: any): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toISOString().slice(0, 10);
}
