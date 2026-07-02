  import {useEffect, useMemo, useRef, useState} from 'react';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';
import {Edit2, Plus, Search, Trash2} from 'lucide-react';

import {Button} from '../components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../components/ui/card';
import {Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription} from '../components/ui/dialog';
import {Input} from '../components/ui/input';
import {Select} from '../components/ui/select';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '../components/ui/table';
import {Textarea} from '../components/ui/textarea';
import {Badge} from '../components/ui/badge';
import {api} from '../services/api';
import {cn, getPathValue} from '../lib/utils';
import {useI18n} from '../i18n';
import type {FieldConfig, ModuleConfig, OptionItem, PageResult} from '../types/modules';

type ModulePageProps = {
  config: ModuleConfig;
};

type FormValues = Record<string, any>;

export function ModulePage({config}: ModulePageProps) {
  const {t} = useI18n();
  const title = t(`module.${config.key}.title`);
  const subtitle = t(`module.${config.key}.subtitle`);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [data, setData] = useState<PageResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<FormValues>({});
  const [options, setOptions] = useState<Record<string, OptionItem[]>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fieldsRef = useRef(config.fields);
  fieldsRef.current = config.fields;

  const schema = useMemo(() => buildSchema(config.fields, t), [config.fields, t]);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: {errors, isSubmitting},
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaultValues(config.fields),
  });

  useEffect(() => {
    void loadRecords();
  }, [config.key, search, page, pageSize]);

  useEffect(() => {
    const sources = [...new Set(config.fields.filter((field) => field.type === 'select' && field.source).map((field) => field.source as string))];
    void Promise.all(sources.map(async (source) => [source, await api.options(source)] as const)).then((entries) => {
      const next: Record<string, OptionItem[]> = {};
      for (const [source, items] of entries) {
        next[source] = items;
      }
      setOptions(next);
    });
  }, [config.fields]);

  useEffect(() => {
    if (!modalOpen) {
      setEditingId(null);
      setSelectedRecord({});
      reset(buildDefaultValues(fieldsRef.current));
      return;
    }
    reset(buildDefaultValues(fieldsRef.current, selectedRecord));
  }, [modalOpen, selectedRecord, reset]);

  async function loadRecords() {
    setLoading(true);
    try {
      const response = await api.list(config.key, search, page, pageSize);
      setData(response);
    } finally {
      setLoading(false);
    }
  }

  async function onCreate() {
    setEditingId(null);
    setSelectedRecord({});
    setModalOpen(true);
  }

  async function onEdit(id: string) {
    const record = await api.get(config.key, id);
    setEditingId(id);
    setSelectedRecord(record);
    setModalOpen(true);
  }

  async function onDelete(id: string) {
    if (!window.confirm(t('common.deleteConfirm'))) {
      return;
    }
    await api.remove(config.key, id);
    await loadRecords();
  }

  const submit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      const payload = normalizePayload(values, config.fields);
      console.log('ModulePage submit', {module: config.key, editingId, payload});
      if (editingId) {
        await api.update(config.key, editingId, payload);
      } else {
        await api.create(config.key, payload);
      }
      setModalOpen(false);
      await loadRecords();
    } catch (err) {
      const raw = err as any;
      const message = raw?.message || raw?.error || raw?.detail || raw?.toString?.() || 'Save failed';
      console.log('ModulePage submit error', {module: config.key, editingId, err, raw, message});
      setSubmitError(typeof message === 'string' ? message : 'Save failed');
    }
  };

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-slate-950">{title}</h2>
          {subtitle ? <p className="mt-2 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        <Button onClick={onCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('common.new')}
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{t('common.manageDesc')}</CardDescription>
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => {
                  setPage(1);
                  setSearch(event.target.value);
                }}
                placeholder={t('common.search')}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  {config.columns.map((column) => <TableHead key={column.key}>{t(column.label)}</TableHead>)}
                  <TableHead className="w-[140px]">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={config.columns.length + 1}>{t('common.loading')}</TableCell>
                  </TableRow>
                ) : (data?.items ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={config.columns.length + 1}>{t('common.noRecords')}</TableCell>
                  </TableRow>
                ) : (
                  data?.items.map((item) => (
                    <TableRow key={String(item.id)}>
                      {config.columns.map((column) => (
                        <TableCell key={column.key}>{renderValue(getPathValue(item, column.key), t)}</TableCell>
                      ))}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="secondary" onClick={() => onEdit(String(item.id))}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => onDelete(String(item.id))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-600">
            <p>
              {t('common.page')} {data?.page ?? 1} {t('common.of')} {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                {t('common.previous')}
              </Button>
              <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>
                {t('common.next')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? `${t('common.edit')} — ${title}` : `${t('common.create')} — ${title}`}</DialogTitle>
            <DialogDescription>{t('common.fillDetails')}</DialogDescription>
          </DialogHeader>
          <DialogBody>
            {submitError && <p className="text-sm text-red-600">{t('common.saveFailed')}: {submitError}</p>}
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(submit)}>
              {config.fields.map((field) => (
                <Field key={field.name} field={field} register={register} errors={errors} options={options[field.source ?? ''] ?? field.options ?? []} watch={watch} t={t} />
              ))}
              <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t('common.saving') : t('common.save')}
                </Button>
              </div>
            </form>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  field,
  register,
  errors,
  options,
  watch,
  t,
}: {
  field: FieldConfig;
  register: ReturnType<typeof useForm>['register'];
  errors: Record<string, any>;
  options: OptionItem[];
  watch: ReturnType<typeof useForm>['watch'];
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const error = errors[field.name]?.message as string | undefined;
  const value = watch(field.name);
  const common = 'space-y-2';
  const label = t(field.label);
  return (
    <div className={cn(common, field.type === 'textarea' ? 'md:col-span-2' : '')}>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      {field.type === 'text' && <Input {...register(field.name)} placeholder={field.placeholder} />}
      {field.type === 'password' && <Input {...register(field.name)} type="password" placeholder={field.placeholder} />}
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

function buildSchema(fields: FieldConfig[], t: (key: string, vars?: Record<string, string | number>) => string) {
  const shape: Record<string, z.ZodTypeAny> = {};
  const required = (field: FieldConfig) => `${t(field.label)} ${t('common.required')}`;
  const mustBeNumber = (field: FieldConfig) => `${t(field.label)} ${t('common.mustBeNumber')}`;
  for (const field of fields) {
    switch (field.type) {
      case 'text':
      case 'textarea':
        shape[field.name] = field.required ? z.string().min(1, required(field)) : z.string().optional().or(z.literal(''));
        break;
      case 'number':
        if (field.required) {
          shape[field.name] = z.string().min(1, required(field)).refine(val => !Number.isNaN(Number(val)), mustBeNumber(field));
        } else {
          shape[field.name] = z.string().optional().or(z.literal('')).refine(val => val === undefined || val === '' || !Number.isNaN(Number(val)), mustBeNumber(field));
        }
        break;
      case 'date':
        shape[field.name] = field.required ? z.string().min(1, required(field)) : z.string().optional().or(z.literal(''));
        break;
      case 'checkbox':
        shape[field.name] = z.boolean().optional();
        break;
      case 'select':
        shape[field.name] = field.required ? z.string().min(1, required(field)) : z.string().optional().or(z.literal(''));
        break;
    }
  }
  return z.object(shape);
}

function buildDefaultValues(fields: FieldConfig[], record: FormValues = {}) {
  const defaults: FormValues = {};
  for (const field of fields) {
    const current = record[field.name];
    if (field.type === 'checkbox') {
      defaults[field.name] = Boolean(current ?? false);
      continue;
    }
    if (field.type === 'date') {
      defaults[field.name] = current ? toDateInputValue(current) : '';
      continue;
    }
    if (field.type === 'select') {
      // Select values are always strings on the form so they match <option value>.
      defaults[field.name] = current === undefined || current === null ? '' : String(current);
      continue;
    }
    defaults[field.name] = current ?? '';
  }
  return defaults;
}

function normalizePayload(values: FormValues, fields: FieldConfig[]) {
  const payload: FormValues = {};
  for (const field of fields) {
    const value = values[field.name];
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
  return payload;
}

function renderValue(value: any, t: (key: string) => string) {
  if (typeof value === 'boolean') {
    return <Badge className={value ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>{value ? t('common.active') : t('common.inactive')}</Badge>;
  }
  if (value === null || value === undefined || value === '') {
    return <span className="text-slate-400">-</span>;
  }
  if (typeof value === 'object') {
    if ('name' in value) {
      return String((value as any).name);
    }
    if ('fullName' in value) {
      return String((value as any).fullName);
    }
  }
  return String(value);
}

function toDateInputValue(value: any) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 10);
}
