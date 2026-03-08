import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import type { FormEvent, ChangeEvent } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { fetchInventoryStocks, adjustInventory } from '@/lib/api/inventory';
import { Button, Input, Select, Modal, Table, FloatMenu } from '@/components/ui';
import type { AxiosError } from 'axios';

interface StockRow {
  product_id: number;
  branch_id: number;
  product_name?: string;
  branch_name?: string;
  quantity?: number;
  min_quantity?: number;
  unit?: string;
  [key: string]: unknown;
}

interface AdjustPayload {
  product_id: number;
  branch_id: number;
  type: string;
  quantity: number;
  reason: string;
}

interface InventoryAdjustModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: AdjustPayload) => Promise<void>;
  initialData: StockRow | null;
  loading: boolean;
}

function InventoryAdjustModal({
  open,
  onClose,
  onSubmit,
  initialData,
  loading,
}: InventoryAdjustModalProps) {
  const [quantity, setQuantity] = useState('');
  const [type, setType] = useState('in');
  const [reason, setReason] = useState('ajuste');

  useEffect(() => {
    if (open) {
      setQuantity('');
      setType('in');
      setReason('ajuste');
    }
  }, [open, initialData]);

  if (!initialData) return null;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload: AdjustPayload = {
      product_id: initialData.product_id,
      branch_id: initialData.branch_id,
      type,
      quantity: Number(quantity),
      reason,
    };
    void onSubmit(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ajustar stock"
      description={`Ajusta el stock de ${initialData.product_name} en ${initialData.branch_name}.`}
      size="md"
    >
      <form className="mt-1 space-y-4" onSubmit={handleSubmit}>
        <Select
          label="Tipo de movimiento"
          id="inventory-type"
          value={type}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setType(e.target.value)}
        >
          <option value="in">Entrada (+)</option>
          <option value="out">Salida (-)</option>
        </Select>

        <Input
          label="Cantidad"
          id="inventory-quantity"
          type="number"
          min={0}
          step="0.001"
          required
          value={quantity}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setQuantity(e.target.value)}
          placeholder="Ej. 1, 0.5, 250"
        />

        <Input
          label="Motivo"
          id="inventory-reason"
          value={reason}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setReason(e.target.value)}
          placeholder="Compra, ajuste, consumo interno, etc."
        />

        <div className="mt-2 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="subtle"
            size="sm"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? 'Aplicando...' : 'Aplicar ajuste'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function InventoryPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [stocks, setStocks] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
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
            ax?.response?.data?.message ||
              'No se pudo cargar el inventario.'
          );
          if (ax?.response?.status === 401) {
            logout();
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadStocks();

    return () => {
      cancelled = true;
    };
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
    setSelectedStock(row);
    setModalOpen(true);
  };

  const handleSubmitAdjust = async (payload: AdjustPayload) => {
    setModalLoading(true);
    setError('');
    try {
      const updated = await adjustInventory(payload);
      if (updated && Array.isArray(updated)) {
        setStocks(updated as StockRow[]);
      } else {
        setStocks((prev) =>
          prev.map((row) =>
            row.product_id === payload.product_id &&
            row.branch_id === payload.branch_id
              ? { ...row, quantity: Number(row.quantity) + (payload.type === 'in' ? payload.quantity : -payload.quantity) }
              : row
          )
        );
      }
      setModalOpen(false);
      setSelectedStock(null);
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      setError(
        ax?.response?.data?.message ||
          'No se pudo aplicar el ajuste de inventario.'
      );
    } finally {
      setModalLoading(false);
    }
  };

  if (!authLoading && !user) {
    return null;
  }

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <InventoryAdjustModal
        open={modalOpen}
        onClose={() => {
          if (!modalLoading) {
            setModalOpen(false);
            setSelectedStock(null);
          }
        }}
        onSubmit={handleSubmitAdjust}
        initialData={selectedStock}
        loading={modalLoading}
      />

      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Inventario
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Visualiza el stock por sucursal y producto, y realiza ajustes rápidos.
          </p>
        </div>
      </header>

      <section className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="relative">
            <Input
              type="text"
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder="Buscar por producto o sucursal..."
              inputClassName="pl-9 rounded-2xl border-slate-800/80 bg-slate-950/70"
            />
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
              🔍
            </span>
          </div>
        </div>
        <div className="text-[11px] text-slate-500">
          {filteredStocks.length} registro
          {filteredStocks.length === 1 ? '' : 's'} visibles
        </div>
      </section>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/45 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-100 shadow-[0_0_0_1px_rgba(248,113,113,0.25)]">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="mt-10 flex items-center justify-center text-sm text-slate-400">
          Cargando inventario...
        </div>
      ) : filteredStocks.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800/80 bg-slate-950/60 px-6 py-10 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-xl">
            📦
          </div>
          <h3 className="text-sm font-medium text-slate-100">
            Aún no hay registros de inventario
          </h3>
          <p className="mt-1 max-w-md text-xs text-slate-400">
            Una vez que registres productos y movimientos, verás aquí el stock por sucursal.
          </p>
        </div>
      ) : (
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
                <span className="text-xs text-slate-400">
                  {row.branch_name}
                </span>
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
                    <Button type="button" variant="ghost" size="sm" className="text-slate-400 hover:text-slate-200" aria-label="Acciones">
                      ⋮
                    </Button>
                  </FloatMenu>
                </div>
              );
            }

            return null;
          }}
        />
      )}
    </DashboardLayout>
  );
}
