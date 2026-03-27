import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/lib/api/products';
import { extractFieldErrors, type FormFieldErrors } from '@/lib/formErrors';
import {
  Button,
  Table,
  FloatMenu,
  EmptyState,
  Alert,
  PageHeader,
  SearchBar,
  PageLoading,
} from '@/components/ui';
import {
  ProductFormModal,
  formatMoneyFromCents,
  type ProductItem,
  type ProductFormPayload,
} from '@/components/products';
import type { AxiosError } from 'axios';
import { swalConfirm, swalError, swalSilentErrorText, swalSuccess } from '@/lib/swal';

export default function ProductsPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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
          setProducts(Array.isArray(data) ? (data as ProductItem[]) : []);
        }
      } catch (err) {
        if (!cancelled) {
          const ax = err as AxiosError<{ message?: string }>;
          setError(
            ax?.response?.data?.message || 'No se pudieron cargar los productos.'
          );
          if (ax?.response?.status === 401) logout();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProducts();
    return () => { cancelled = true; };
  }, [user, logout]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const name = String(p.name ?? '').toLowerCase();
      const sku = String(p.sku ?? '').toLowerCase();
      const category = String(p.category ?? '').toLowerCase();
      return name.includes(q) || sku.includes(q) || category.includes(q);
    });
  }, [products, search]);

  const isLoading = authLoading || loading;

  const openCreateModal = () => {
    setFieldErrors({});
    setSelectedProduct(null);
    setModalOpen(true);
  };

  const openEditModal = (product: ProductItem) => {
    setFieldErrors({});
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleSubmitProduct = async (formData: ProductFormPayload) => {
    setModalLoading(true);
    setError('');
    setFieldErrors({});
    try {
      if (selectedProduct?.id) {
        const updated = await updateProduct(
          selectedProduct.id,
          formData as unknown as Record<string, unknown>
        );
        setProducts((prev) =>
          prev.map((p) => (p.id === selectedProduct.id ? (updated as ProductItem) ?? p : p))
        );
      } else {
        const created = await createProduct(
          formData as unknown as Record<string, unknown>
        );
        if (created) setProducts((prev) => [created as ProductItem, ...prev]);
      }
      setModalOpen(false);
      setSelectedProduct(null);
      void swalSuccess('Guardado correcto', 'El producto se guardó correctamente.');
    } catch (err) {
      setFieldErrors(extractFieldErrors(err));
      const msg = swalSilentErrorText(err);
      setError(msg);
      void swalError('Error al guardar', msg);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    const ok = await swalConfirm({
      title: 'Eliminar producto',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!ok) return;
    setDeletingId(id);
    setError('');
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      void swalSuccess('Eliminado', 'El producto se eliminó correctamente.');
    } catch (err) {
      const msg = swalSilentErrorText(err);
      setError(msg);
      void swalError('Error al eliminar', msg);
    } finally {
      setDeletingId(null);
    }
  };

  if (!authLoading && !user) return null;

  return (
    <>
      <ProductFormModal
        open={modalOpen}
        onClose={() => {
          if (!modalLoading) {
            setFieldErrors({});
            setModalOpen(false);
            setSelectedProduct(null);
          }
        }}
        onSubmit={handleSubmitProduct}
        initialData={selectedProduct}
        loading={modalLoading}
        fieldErrors={fieldErrors}
      />

      <PageHeader
        title="Productos"
        subtitle="Catálogo de productos que usas en servicios o vendes. Controla costos y stock."
        action={
          <Button type="button" onClick={openCreateModal} size="md">
            <span className="mr-2 text-base">+</span>
            Nuevo producto
          </Button>
        }
      />

      <div className="page-filters" role="search" aria-label="Filtrar productos">
        <SearchBar
          id="products-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, SKU o categoría..."
          className="min-w-0 flex-1"
        />
        <p className="text-xs text-slate-500 tabular-nums sm:max-w-[12rem] sm:text-right">
          {search.trim()
            ? `${filteredProducts.length} de ${products.length} productos`
            : `${products.length} producto${products.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {isLoading ? (
        <PageLoading label="Cargando productos..." />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon="🧴"
          title={search.trim() ? 'No hay resultados' : 'Aún no hay productos'}
          description={
            search.trim()
              ? 'Prueba con otro término de búsqueda.'
              : 'Registra productos para controlar costos y stock.'
          }
          action={
            !search.trim() ? (
              <Button type="button" variant="outline" size="sm" onClick={openCreateModal}>
                Crear primer producto
              </Button>
            ) : null
          }
        />
      ) : (
        <Table<ProductItem>
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
                <span className="text-sm font-medium text-slate-50">{product.name}</span>
              );
            }
            if (key === 'sku') {
              return <span className="text-xs text-slate-400">{product.sku}</span>;
            }
            if (key === 'category') {
              return (
                <span className="text-xs text-slate-400">{product.category || '—'}</span>
              );
            }
            if (key === 'unit') {
              return <span className="text-xs text-slate-400">{product.unit}</span>;
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-slate-100"
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
      )}
    </>
  );
}
