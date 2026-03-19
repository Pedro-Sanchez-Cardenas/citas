import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import type { ChangeEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchInventoryStocks, adjustInventory } from '@/lib/api/inventory';
import { extractFieldErrors, type FormFieldErrors } from '@/lib/formErrors';
import { Button, Input, Table, FloatMenu, EmptyState, Alert, PageHeader } from '@/components/ui';
import {
  InventoryAdjustModal,
  type StockRow,
  type AdjustPayload,
} from '@/components/products/inventory';
import type { AxiosError } from 'axios';
import { swalError, swalSilentErrorText, swalSuccess } from '@/lib/swal';

export default function InventoryPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [stocks, setStocks] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
  const [selectedStock, setSelectedStock] = useState<StockRow | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
      return;
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadStocks() {
      setLoading(true);
      setError('');
      try {
        const data = await fetchInventoryStocks();
        if (!cancelled) {
          setStocks(Array.isArray(data) ? (data as StockRow[]) : []);
        }
      } catch (err) {
        if (!cancelled) {
          const ax = err as AxiosError<{ message?: string }>;
          setError(
            ax?.response?.data?.message || 'No se pudo cargar el inventario.'
          );
          if (ax?.response?.status === 401) logout();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadStocks();
    return () => { cancelled = true; };
  }, [user, logout]);

  const filteredStocks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return stocks;
    return stocks.filter((row) => {
      const productName = String(row.product_name ?? '').toLowerCase();
      const branchName = String(row.branch_name ?? '').toLowerCase();
      return productName.includes(q) || branchName.includes(q);
    });
  }, [stocks, search]);

  const isLoading = authLoading || loading;

  const openAdjustModal = (row: StockRow) => {
    setFieldErrors({});
    setSelectedStock(row);
    setModalOpen(true);
  };

  const handleSubmitAdjust = async (payload: AdjustPayload) => {
    setModalLoading(true);
    setError('');
    setFieldErrors({});
    try {
      const updated = await adjustInventory(
        payload as unknown as Record<string, unknown>
      );
      if (updated && Array.isArray(updated)) {
        setStocks(updated as StockRow[]);
      } else {
        setStocks((prev) =>
          prev.map((row) =>
            row.product_id === payload.product_id &&
            row.branch_id === payload.branch_id
              ? {
                  ...row,
                  quantity:
                    Number(row.quantity) +
                    (payload.type === 'in' ? payload.quantity : -payload.quantity),
                }
              : row
          )
        );
      }
      setModalOpen(false);
      setSelectedStock(null);
      void swalSuccess('Guardado correcto', 'El inventario se actualizó correctamente.');
    } catch (err) {
      setFieldErrors(extractFieldErrors(err));
      const msg = swalSilentErrorText(err);
      setError(msg);
      void swalError('Error al guardar', msg);
    } finally {
      setModalLoading(false);
    }
  };

  if (!authLoading && !user) return null;

  return (
    <>
      <InventoryAdjustModal
        open={modalOpen}
        onClose={() => {
          if (!modalLoading) {
            setFieldErrors({});
            setModalOpen(false);
            setSelectedStock(null);
          }
        }}
        onSubmit={handleSubmitAdjust}
        initialData={selectedStock}
        loading={modalLoading}
        fieldErrors={fieldErrors}
      />

      <PageHeader
        title="Inventario"
        subtitle="Stock por sucursal y producto. Realiza ajustes cuando lo necesites."
      />

      <section className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" aria-label="Filtrar inventario">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Input
              type="text"
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder="Buscar por producto o sucursal..."
              inputClassName="pl-10 rounded-xl border-slate-700/80 bg-slate-950/50"
            />
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500" aria-hidden>🔍</span>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          {search.trim()
            ? `${filteredStocks.length} de ${stocks.length} registros`
            : `${stocks.length} registro${stocks.length === 1 ? '' : 's'}`}
        </p>
      </section>

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-slate-700/60 bg-slate-900/30">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500/50 border-t-teal-400" />
            <span className="text-sm">Cargando inventario...</span>
          </div>
        </div>
      ) : filteredStocks.length === 0 ? (
        <EmptyState
          icon="📦"
          title={search.trim() ? 'No hay resultados' : 'Aún no hay inventario'}
          description={
            search.trim()
              ? 'Prueba con otro término de búsqueda.'
              : 'Registra productos y movimientos para ver el stock por sucursal.'
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/40">
        <Table<StockRow>
          columns={[
            { key: 'product', header: 'Producto' },
            { key: 'branch', header: 'Sucursal' },
            { key: 'quantity', header: 'Cantidad' },
            { key: 'min', header: 'Mínimo' },
            { key: 'status', header: 'Estado' },
            { key: 'actions', header: 'Acciones', align: 'right' },
          ]}
          items={filteredStocks}
          getItemKey={(row) => `${row.branch_id}-${row.product_id}`}
          renderCell={(row, key) => {
            const belowMin = Number(row.quantity) <= Number(row.min_quantity);

            if (key === 'product') {
              return (
                <span className="text-sm font-medium text-slate-50">
                  {row.product_name}
                </span>
              );
            }
            if (key === 'branch') {
              return (
                <span className="text-xs text-slate-400">{row.branch_name}</span>
              );
            }
            if (key === 'quantity') {
              return (
                <span className="text-xs text-slate-400">
                  {row.quantity} {row.unit}
                </span>
              );
            }
            if (key === 'min') {
              return (
                <span className="text-xs text-slate-400">
                  {row.min_quantity} {row.unit}
                </span>
              );
            }
            if (key === 'status') {
              return (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${
                    belowMin
                      ? 'bg-red-500/15 text-red-200 border border-red-500/40'
                      : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {belowMin ? 'Reponer stock' : 'Stock saludable'}
                </span>
              );
            }
            if (key === 'actions') {
              return (
                <div className="flex justify-end">
                  <FloatMenu
                    placement="bottom-end"
                    options={[{ label: 'Ajustar', onClick: () => openAdjustModal(row) }]}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-slate-200"
                      aria-label="Acciones"
                    >
                      ⋮
                    </Button>
                  </FloatMenu>
                </div>
              );
            }
            return null;
          }}
        />
        </div>
      )}
    </>
  );
}
