import {useEffect, useState} from 'react';
import {Edit2, Plus, Search, Trash2} from 'lucide-react';

import {Button} from '../components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '../components/ui/card';
import {Input} from '../components/ui/input';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '../components/ui/table';
import {Badge} from '../components/ui/badge';
import {RecordFormDialog} from '../components/RecordFormDialog';
import {RecordDetailsDialog} from '../components/RecordDetailsDialog';
import {api} from '../services/api';
import {getPathValue} from '../lib/utils';
import {useI18n} from '../i18n';
import type {ModuleConfig, PageResult} from '../types/modules';

type ModulePageProps = {
  config: ModuleConfig;
};

export function ModulePage({config}: ModulePageProps) {
  const {t} = useI18n();
  const title = t(`module.${config.key}.title`);
  const subtitle = t(`module.${config.key}.subtitle`);
  const idKey = config.idKey ?? 'id';

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [data, setData] = useState<PageResult | null>(null);
  const [loading, setLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [formRecordId, setFormRecordId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsRecordId, setDetailsRecordId] = useState<string | null>(null);

  useEffect(() => {
    void loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.key, search, page, pageSize]);

  // Reset paging/search when switching between modules.
  useEffect(() => {
    setSearch('');
    setPage(1);
  }, [config.key]);

  async function loadRecords() {
    setLoading(true);
    try {
      const response = await api.list(config.key, search, page, pageSize);
      setData(response);
    } finally {
      setLoading(false);
    }
  }

  function rowId(item: Record<string, any>): string {
    return String(getPathValue(item, idKey));
  }

  function onCreate() {
    setFormRecordId(null);
    setFormOpen(true);
  }

  function onEdit(id: string) {
    setFormRecordId(id);
    setFormOpen(true);
  }

  function onShowDetails(id: string) {
    setDetailsRecordId(id);
    setDetailsOpen(true);
  }

  async function onDelete(id: string) {
    if (!window.confirm(t('common.deleteConfirm'))) {
      return;
    }
    await api.remove(config.key, id);
    await loadRecords();
  }

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
                  data?.items.map((item) => {
                    const id = rowId(item);
                    return (
                      <TableRow key={id}>
                        {config.columns.map((column, columnIndex) => (
                          <TableCell key={column.key}>
                            {columnIndex === 0 ? (
                              <button
                                type="button"
                                title={t('common.viewDetails')}
                                onClick={() => onShowDetails(id)}
                                className="text-left font-medium text-slate-900 underline-offset-2 hover:text-slate-950 hover:underline"
                              >
                                {renderValue(getPathValue(item, column.key), t)}
                              </button>
                            ) : (
                              renderValue(getPathValue(item, column.key), t)
                            )}
                          </TableCell>
                        ))}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="secondary" title={t('common.edit')} onClick={() => onEdit(id)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" title={t('common.delete')} onClick={() => onDelete(id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
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

      <RecordFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        config={config}
        recordId={formRecordId}
        onSaved={loadRecords}
        onDeleted={loadRecords}
      />

      <RecordDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        config={config}
        recordId={detailsRecordId}
        onEdit={onEdit}
      />
    </div>
  );
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
