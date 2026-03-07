import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/lib/api/products';
import { Button, Input, Select, Checkbox, Modal, Table, FloatMenu } from '@/components/ui';

function formatMoneyFromCents(amountCents) {
  if (amountCents == null) return '—';
  const amount = (amountCents / 100).toFixed(2);
  return `$${amount}`;
}

function ProductFormModal({ open, onClose, onSubmit, initialData, loading }) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [sku, setSku] = useState(initialData?.sku ?? '');
  const [category, setCategory] = useState(initialData?.category ?? '');
  const [unit, setUnit] = useState(initialData?.unit ?? 'unit');
  const [cost, setCost] = useState(
    initialData?.cost_cents != null
      ? (initialData.cost_cents / 100).toString()
      : ''
  );
  const [price, setPrice] = useState(
    initialData?.price_cents != null
      ? (initialData.price_cents / 100).toString()
      : ''
  );
  const [isReusable, setIsReusable] = useState(initialData?.is_reusable ?? false);

  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? '');
      setSku(initialData?.sku ?? '');
      setCategory(initialData?.category ?? '');
      setUnit(initialData?.unit ?? 'unit');
      setCost(
        initialData?.cost_cents != null
          ? (initialData.cost_cents / 100).toString()
          : ''
      );
      setPrice(
        initialData?.price_cents != null
          ? (initialData.price_cents / 100).toString()
          : ''
      );
      setIsReusable(initialData?.is_reusable ?? false);
    }
  }, [open, initialData]);

  const isEdit = !!initialData?.id;

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name,
      sku,
      category: category || null,
      unit: unit || 'unit',
      cost_cents:
        cost && !Number.isNaN(Number(cost))
          ? Math.round(Number(cost) * 100)
          : 0,
      price_cents:
        price && !Number.isNaN(Number(price))
          ? Math.round(Number(price) * 100)
          : null,
      is_reusable: !!isReusable,
    };
    onSubmit(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar producto' : 'Nuevo producto'}
      description="Administra los productos que utilizas o vendes en tu negocio."
      size="lg"
    >
      <form
        className="mt-1 grid grid-cols-1 gap-4 md:grid-cols-2"
        onSubmit={handleSubmit}
      >
        <div className="md:col-span-2">
          <Input
            label="Nombre del producto"
            id="product-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Shampoo hidratante, Tinte rubio 7.1, etc."
          />
        </div>

        <Input
          label="SKU"
          id="product-sku"
          required
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          placeholder="Código interno único"
        />

        <Input
          label="Categoría"
          id="product-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Color, Tratamientos, Uñas, Barbería..."
        />

        <Select
          label="Unidad"
          id="product-unit"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
        >
          <option value="unit">Unidad</option>
          <option value="ml">Mililitros (ml)</option>
          <option value="gr">Gramos (gr)</option>
          <option value="kg">Kilogramos (kg)</option>
          <option value="lt">Litros (lt)</option>
        </Select>

        <Input
          label="Costo"
          id="product-cost"
          type="number"
          min={0}
          step="0.01"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          placeholder="Costo por unidad"
        />

        <Input
          label="Precio de venta"
          id="product-price"
          type="number"
          min={0}
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Precio sugerido de venta"
        />

        <div className="md:col-span-2 flex items-center justify-between pt-2">
          <Checkbox
            checked={!!isReusable}
            onChange={(e) => setIsReusable(e.target.checked)}
            label="Producto reutilizable (no se consume: tijeras, máquinas, etc.)"
          />
        </div>

        <div className="md:col-span-2 mt-2 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="subtle"
            size="sm"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function ProductsPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
      return;
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadProducts() {
      setLoading(true);
      setError('');
      try {
        const data = await fetchProducts();
        if (!cancelled) {
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              'No se pudieron cargar los productos.'
          );
          if (err?.response?.status === 401) {
            logout();
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [user, logout]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((product) => {
      const name = String(product.name ?? '').toLowerCase();
      const sku = String(product.sku ?? '').toLowerCase();
      const category = String(product.category ?? '').toLowerCase();
      return name.includes(q) || sku.includes(q) || category.includes(q);
    });
  }, [products, search]);

  const isLoading = authLoading || loading;

  const openCreateModal = () => {
    setSelectedProduct(null);
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleSubmitProduct = async (formData) => {
    setModalLoading(true);
    setError('');
    try {
      if (selectedProduct?.id) {
        const updated = await updateProduct(selectedProduct.id, formData);
        setProducts((prev) =>
          prev.map((p) => (p.id === selectedProduct.id ? updated ?? p : p))
        );
      } else {
        const created = await createProduct(formData);
        setProducts((prev) => [created, ...prev]);
      }
      setModalOpen(false);
      setSelectedProduct(null);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'No se pudo guardar el producto. Revisa los datos e inténtalo de nuevo.'
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) {
      return;
    }
    setDeletingId(id);
    setError('');
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'No se pudo eliminar el producto. Inténtalo nuevamente.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (!authLoading && !user) {
    return null;
  }

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <ProductFormModal
        open={modalOpen}
        onClose={() => {
          if (!modalLoading) {
            setModalOpen(false);
            setSelectedProduct(null);
          }
        }}
        onSubmit={handleSubmitProduct}
        initialData={selectedProduct}
        loading={modalLoading}
      />

      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Productos
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Controla el catálogo de productos que usas en servicios o vendes en tu negocio.
          </p>
        </div>
        <Button type="button" onClick={openCreateModal} size="md">
          <span className="mr-2 text-base">＋</span>
          Nuevo producto
        </Button>
      </header>

      <section className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="relative">
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, SKU o categoría..."
              inputClassName="pl-9 rounded-2xl border-slate-800/80 bg-slate-950/70"
            />
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
              🔍
            </span>
          </div>
        </div>
        <div className="text-[11px] text-slate-500">
          {filteredProducts.length} producto
          {filteredProducts.length === 1 ? '' : 's'} visibles
        </div>
      </section>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/45 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-100 shadow-[0_0_0_1px_rgba(248,113,113,0.25)]">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="mt-10 flex items-center justify-center text-sm text-slate-400">
          Cargando productos...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800/80 bg-slate-950/60 px-6 py-10 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-xl">
            🧴
          </div>
          <h3 className="text-sm font-medium text-slate-100">
            Aún no tienes productos registrados
          </h3>
          <p className="mt-1 max-w-md text-xs text-slate-400">
            Registra los productos que usas y vendes para controlar mejor tus costos y stock.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4 bg-slate-100 text-slate-900 hover:bg-slate-200 border-transparent"
            onClick={openCreateModal}
          >
            Crear producto
          </Button>
        </div>
      ) : (
        <Table
          columns={[
            { key: 'name', header: 'Nombre' },
            { key: 'sku', header: 'SKU' },
            { key: 'category', header: 'Categoría' },
            { key: 'unit', header: 'Unidad' },
            { key: 'cost', header: 'Costo' },
            { key: 'price', header: 'Precio' },
            { key: 'type', header: 'Tipo' },
            { key: 'actions', header: 'Acciones', align: 'right' },
          ]}
          items={filteredProducts}
          getItemKey={(product) => product.id}
          renderCell={(product, key) => {
            if (key === 'name') {
              return (
                <span className="text-sm font-medium text-slate-50">
                  {product.name}
                </span>
              );
            }

            if (key === 'sku') {
              return (
                <span className="text-xs text-slate-400">{product.sku}</span>
              );
            }

            if (key === 'category') {
              return (
                <span className="text-xs text-slate-400">
                  {product.category || '—'}
                </span>
              );
            }

            if (key === 'unit') {
              return (
                <span className="text-xs text-slate-400">{product.unit}</span>
              );
            }

            if (key === 'cost') {
              return (
                <span className="text-xs text-slate-400">
                  {formatMoneyFromCents(product.cost_cents)}
                </span>
              );
            }

            if (key === 'price') {
              return (
                <span className="text-xs text-slate-400">
                  {formatMoneyFromCents(product.price_cents)}
                </span>
              );
            }

            if (key === 'type') {
              return (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${
                    product.is_reusable
                      ? 'bg-sky-500/15 text-sky-300 border border-sky-500/40'
                      : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {product.is_reusable ? 'Reutilizable' : 'Consumible'}
                </span>
              );
            }

            if (key === 'actions') {
              return (
                <div className="flex justify-end">
                  <FloatMenu
                    placement="bottom-end"
                    options={[
                      { label: 'Editar', onClick: () => openEditModal(product) },
                      { divider: true },
                      {
                        label: deletingId === product.id ? 'Eliminando...' : 'Eliminar',
                        onClick: () => handleDeleteProduct(product.id),
                        disabled: deletingId === product.id,
                      },
                    ]}
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

