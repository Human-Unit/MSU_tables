import {useEffect, useMemo, useState} from 'react';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';

import {Alert} from './ui/alert';
import {Button} from './ui/button';
import {Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle} from './ui/dialog';
import {Input} from './ui/input';
import {Select} from './ui/select';
import {Textarea} from './ui/textarea';
import {api} from '../services/api';
import {cn} from '../lib/utils';
import {useI18n} from '../i18n';
import type {FieldConfig, ModuleConfig, OptionItem} from '../types/modules';

type FormValues = Record<string, any>;

type Translate = (key: string, vars?: Record<string, string | number>) => string;

type RecordFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: ModuleConfig;
  // When set, the dialog edits an existing record; otherwise it creates a new one.
  recordId?: string | null;
  // Optional pre-filled values used when creating a new record (e.g. add a lesson
  // to a specific weekday/pair from the weekly schedule).
  initialValues?: FormValues;
  // Optional dialog title override; defaults to "Edit/Create — <module>".
  title?: string;
  onSaved?: () => void;
  // When provided, a Delete button is shown in edit mode.
  onDeleted?: () => void;
};

export function RecordFormDialog({
  open,
  onOpenChange,
  config,
  recordId,
  initialValues,
  title,
  onSaved,
  onDeleted,
}: RecordFormDialogProps) {
  const {t} = useI18n();
  const editing = Boolean(recordId);
  const moduleTitle = t(`module.${config.key}.title`);

  const [record, setRecord] = useState<FormValues | null>(null);
  const [options, setOptions] = useState<Record<string, OptionItem[]>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load select option sources whenever the dialog opens.
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

  // Fetch the record being edited so the form is pre-filled with existing data.
  useEffect(() => {
    let cancelled = false;
    if (open && recordId) {
      void api
        .get(config.key, recordId)
        .then((fetched) => {
          if (!cancelled) setRecord(fetched);
        })
        .catch(() => {
          if (!cancelled) setRecord(null);
        });
    } else {
      setRecord(null);
    }
    return () => {
      cancelled = true;
    };
  }, [open, recordId, config.key]);

  useEffect(() => {
    if (!open) {
      setSubmitError(null);
    }
  }, [open]);

  const schema = useMemo(() => buildSchema(config.fields, editing, t), [config.fields, editing, t]);

  // Source of truth for the form: the fetched record (edit) or the initial
  // values (create). `values` keeps react-hook-form in sync reactively, which is
  // what makes edits show the existing data instead of a blank form.
  const formValues = useMemo(
    () => buildFormValues(config.fields, record ?? initialValues ?? {}),
    [config.fields, record, initialValues],
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: {errors, isSubmitting},
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: formValues,
  });

  const submit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      const payload = normalizePayload(values, config.fields, {editing, existing: record});
      if (recordId) {
        await api.update(config.key, recordId, payload);
      } else {
        await api.create(config.key, payload);
      }
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      const raw = err as any;
      const message = raw?.message || raw?.error || raw?.detail || raw?.toString?.() || 'Save failed';
      setSubmitError(typeof message === 'string' ? message : 'Save failed');
    }
  };

  const onDelete = async () => {
    if (!recordId) return;
    if (!window.confirm(t('common.deleteConfirm'))) {
      return;
    }
    setSubmitError(null);
    setDeleting(true);
    try {
      await api.remove(config.key, recordId);
      onOpenChange(false);
      onDeleted?.();
    } catch (err) {
      const raw = err as any;
      const message = raw?.message || raw?.error || raw?.detail || raw?.toString?.() || 'Delete failed';
      setSubmitError(typeof message === 'string' ? message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const dialogTitle = title ?? (editing ? `${t('common.edit')} — ${moduleTitle}` : `${t('common.create')} — ${moduleTitle}`);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{t('common.fillDetails')}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          {submitError && (
            <Alert
              variant="error"
              message={`${t('common.saveFailed')}: ${submitError}`}
              onClose={() => setSubmitError(null)}
              className="mb-4"
            />
          )}
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(submit)}>
            {config.fields.map((field) => (
              <Field
                key={field.name}
                field={field}
                register={register}
                errors={errors}
                options={options[field.source ?? ''] ?? field.options ?? []}
                watch={watch}
                editing={editing}
                t={t}
              />
            ))}
            <div className="md:col-span-2 flex items-center justify-between gap-3 pt-2">
              <div>
                {editing && onDeleted ? (
                  <Button type="button" variant="destructive" disabled={deleting || isSubmitting} onClick={onDelete}>
                    {deleting ? t('common.deleting') : t('common.delete')}
                  </Button>
                ) : null}
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={isSubmitting || deleting}>
                  {isSubmitting ? t('common.saving') : t('common.save')}
                </Button>
              </div>
            </div>
          </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  field,
  register,
  errors,
  options,
  watch,
  editing,
  t,
}: {
  field: FieldConfig;
  register: ReturnType<typeof useForm>['register'];
  errors: Record<string, any>;
  options: OptionItem[];
  watch: ReturnType<typeof useForm>['watch'];
  editing: boolean;
  t: Translate;
}) {
  const error = errors[field.name]?.message as string | undefined;
  // `watch` keeps checkbox/label state reactive without controlling the input.
  void watch(field.name);
  const common = 'space-y-2';
  const label = t(field.label);
  // On edit, a blank password means "keep current password".
  const placeholder = field.type === 'password' && editing ? t('field.passwordKeep') : field.placeholder;
  return (
    <div className={cn(common, field.type === 'textarea' ? 'md:col-span-2' : '')}>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      {field.type === 'text' && <Input {...register(field.name)} placeholder={field.placeholder} />}
      {field.type === 'password' && <Input {...register(field.name)} type="password" placeholder={placeholder} />}
      {field.type === 'number' && <Input {...register(field.name)} type="number" min={field.min} max={field.max} step={field.step ?? 1} />}
      {field.type === 'date' && <Input {...register(field.name)} type="date" />}
      {field.type === 'textarea' && <Textarea {...register(field.name)} placeholder={field.placeholder} />}
      {field.type === 'checkbox' && (
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
          <input {...register(field.name)} type="checkbox" className="h-4 w-4 rounded border-slate-300" />
          <span className="text-sm text-slate-700">{label}</span>
        </label>
      )}
      {field.type === 'select' && (
        <Select {...register(field.name)}>
          <option value="">{t('common.select')}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {t(option.label)}
            </option>
          ))}
        </Select>
      )}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

function buildSchema(fields: FieldConfig[], editing: boolean, t: Translate) {
  const shape: Record<string, z.ZodTypeAny> = {};
  const required = (field: FieldConfig) => `${t(field.label)} ${t('common.required')}`;
  const mustBeNumber = (field: FieldConfig) => `${t(field.label)} ${t('common.mustBeNumber')}`;
  for (const field of fields) {
    // Password is only mandatory when creating a record; on edit an empty value
    // keeps the existing password.
    const isRequired = field.type === 'password' ? Boolean(field.required) && !editing : Boolean(field.required);
    switch (field.type) {
      case 'text':
      case 'textarea':
      case 'password':
        shape[field.name] = isRequired ? z.string().min(1, required(field)) : z.string().optional().or(z.literal(''));
        break;
      case 'number':
        if (isRequired) {
          shape[field.name] = z.string().min(1, required(field)).refine((val) => !Number.isNaN(Number(val)), mustBeNumber(field));
        } else {
          shape[field.name] = z.string().optional().or(z.literal('')).refine((val) => val === undefined || val === '' || !Number.isNaN(Number(val)), mustBeNumber(field));
        }
        break;
      case 'date':
        shape[field.name] = isRequired ? z.string().min(1, required(field)) : z.string().optional().or(z.literal(''));
        break;
      case 'checkbox':
        shape[field.name] = z.boolean().optional();
        break;
      case 'select':
        shape[field.name] = isRequired ? z.string().min(1, required(field)) : z.string().optional().or(z.literal(''));
        break;
    }
  }
  return z.object(shape);
}

function buildFormValues(fields: FieldConfig[], record: FormValues = {}) {
  const values: FormValues = {};
  for (const field of fields) {
    const current = record[field.name];
    if (field.type === 'checkbox') {
      values[field.name] = Boolean(current ?? false);
      continue;
    }
    if (field.type === 'date') {
      values[field.name] = current ? toDateInputValue(current) : '';
      continue;
    }
    if (field.type === 'password') {
      // Never echo the (hashed) password back into the form.
      values[field.name] = '';
      continue;
    }
    if (field.type === 'select' || field.type === 'number') {
      values[field.name] = current === undefined || current === null ? '' : String(current);
      continue;
    }
    values[field.name] = current ?? '';
  }
  return values;
}

function normalizePayload(values: FormValues, fields: FieldConfig[], opts: {editing: boolean; existing?: FormValues | null}) {
  const payload: FormValues = {};
  for (const field of fields) {
    const value = values[field.name];
    if (field.type === 'password') {
      // Only send a password when the user typed one (create always, edit optional).
      if (typeof value === 'string' && value.trim() !== '') {
        payload[field.name] = value;
      }
      continue;
    }
    if (field.type === 'date') {
      payload[field.name] = value ? new Date(value).toISOString() : null;
      continue;
    }
    if (field.type === 'checkbox') {
      payload[field.name] = Boolean(value);
      continue;
    }
    if (field.type === 'number') {
      const num = value === '' || value === null || value === undefined ? 0 : Number(value);
      payload[field.name] = Number.isNaN(num) ? 0 : num;
      continue;
    }
    if (field.type === 'select' && field.valueType === 'number') {
      const num = value === '' || value === null || value === undefined ? 0 : Number(value);
      payload[field.name] = Number.isNaN(num) ? 0 : num;
      continue;
    }
    payload[field.name] = value ?? '';
  }
  // `isActive` is no longer a form field. Preserve the existing value on edit and
  // default new records to active so a save never silently deactivates a record.
  payload.isActive = opts.editing ? Boolean(opts.existing?.isActive ?? true) : true;
  return payload;
}

function toDateInputValue(value: any) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 10);
}
