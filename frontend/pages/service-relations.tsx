import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import type { ChangeEvent } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchServices,
  fetchServiceProfessionals,
  fetchServiceMaterials,
  syncServiceProfessionals,
  syncServiceMaterials,
} from '@/lib/api/services';
import { fetchProfessionals } from '@/lib/api/professionals';
import { fetchProducts } from '@/lib/api/products';
import { Button, Input, Checkbox, Select } from '@/components/ui';
import type { Service, Professional } from '@/types';
import type { AxiosError } from 'axios';

interface ProductItem {
  id: number;
  name: string;
  sku?: string;
  unit?: string;
  [key: string]: unknown;
}

interface ServiceWithCode extends Service {
  code?: string;
  duration_minutes?: number;
}

interface MaterialEntry {
  checked: boolean;
  quantity: number | string;
}

export default function ServiceRelationsPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [services, setServices] = useState<ServiceWithCode[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [loading, setLoading] = useState(true);
  const [relationsLoading, setRelationsLoading] = useState(false);
  const [error, setError] = useState('');

  const [professionalIds, setProfessionalIds] = useState<Set<number>>(new Set());
  const [materials, setMaterials] = useState<Record<number, MaterialEntry>>({});

  const [savingProfessionals, setSavingProfessionals] = useState(false);
  const [savingMaterials, setSavingMaterials] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
      return;
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadBaseData() {
      setLoading(true);
      setError('');
      try {
        const [servicesData, prosData, productsData] = await Promise.all([
          fetchServices(),
          fetchProfessionals(),
          fetchProducts(),
        ]);
        if (!cancelled) {
          setServices(Array.isArray(servicesData) ? (servicesData as ServiceWithCode[]) : []);
          setProfessionals(Array.isArray(prosData) ? prosData : []);
          setProducts(Array.isArray(productsData) ? (productsData as ProductItem[]) : []);
        }
      } catch (err) {
        if (!cancelled) {
          const ax = err as AxiosError<{ message?: string }>;
          setError(
            ax?.response?.data?.message ||
              'No se pudieron cargar los datos base de servicios.'
          );
          if (ax?.response?.status === 401) {
            logout();
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadBaseData();

    return () => {
      cancelled = true;
    };
  }, [user, logout]);

  useEffect(() => {
    if (!selectedServiceId) {
      setProfessionalIds(new Set());
      setMaterials({});
      return;
    }

    let cancelled = false;

    async function loadRelations() {
      setRelationsLoading(true);
      setError('');
      try {
        const [prosForService, materialsForService] = await Promise.all([
          fetchServiceProfessionals(selectedServiceId),
          fetchServiceMaterials(selectedServiceId),
        ]);
        if (!cancelled) {
          const prosList = (Array.isArray(prosForService) ? prosForService : []) as Professional[];
          const prosSet = new Set(prosList.map((p) => p.id));
          setProfessionalIds(prosSet);

          const matMap: Record<number, MaterialEntry> = {};
          const matList = (Array.isArray(materialsForService) ? materialsForService : []) as {
            id: number;
            pivot?: { quantity?: number };
          }[];
          matList.forEach((m) => {
            const quantity =
              m.pivot?.quantity != null ? Number(m.pivot.quantity) : 0;
            matMap[m.id] = { checked: true, quantity: quantity || 0 };
          });
          setMaterials(matMap);
        }
      } catch (err) {
        if (!cancelled) {
          const ax = err as AxiosError<{ message?: string }>;
          setError(
            ax?.response?.data?.message ||
              'No se pudieron cargar las relaciones del servicio.'
          );
        }
      } finally {
        if (!cancelled) setRelationsLoading(false);
      }
    }

    loadRelations();

    return () => {
      cancelled = true;
    };
  }, [selectedServiceId]);

  const isLoading = authLoading || loading;

  const handleToggleProfessional = (id: number) => {
    setProfessionalIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleMaterial = (id: number) => {
    setMaterials((prev) => {
      const current = prev[id] ?? { checked: false, quantity: 0 };
      return {
        ...prev,
        [id]: { ...current, checked: !current.checked },
      };
    });
  };

  const handleChangeMaterialQuantity = (id: number, value: string | number) => {
    setMaterials((prev) => {
      const current = prev[id] ?? { checked: false, quantity: 0 };
      return {
        ...prev,
        [id]: { ...current, quantity: value === '' ? '' : Number(value) },
      };
    });
  };

  const handleSaveProfessionals = async () => {
    if (!selectedServiceId) return;
    setSavingProfessionals(true);
    setError('');
    try {
      await syncServiceProfessionals(selectedServiceId, {
        professional_ids: Array.from(professionalIds),
      });
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      setError(
        ax?.response?.data?.message ||
          'No se pudieron guardar los profesionales asignados.'
      );
    } finally {
      setSavingProfessionals(false);
    }
  };

  const handleSaveMaterials = async () => {
    if (!selectedServiceId) return;
    setSavingMaterials(true);
    setError('');
    try {
      const materialsPayload = Object.entries(materials)
        .filter(([, value]) => value.checked && Number(value.quantity) > 0)
        .map(([productId, value]) => ({
          product_id: Number(productId),
          quantity: Number(value.quantity),
        }));

      await syncServiceMaterials(selectedServiceId, {
        materials: materialsPayload,
      });
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>;
      setError(
        ax?.response?.data?.message ||
          'No se pudieron guardar los materiales asignados.'
      );
    } finally {
      setSavingMaterials(false);
    }
  };

  const selectedService = useMemo(
    () => services.find((s) => String(s.id) === String(selectedServiceId)),
    [services, selectedServiceId]
  );

  if (!authLoading && !user) {
    return null;
  }

  return (
    <DashboardLayout user={user} onLogout={logout}>
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Relaciones de servicio
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Asigna qué profesionales pueden realizar cada servicio y qué productos se consumen.
          </p>
        </div>
      </header>

      <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] sm:items-center">
        <div>
          <Select
            value={selectedServiceId}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedServiceId(e.target.value)}
          >
            <option value="">Selecciona un servicio...</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          {selectedService && (
            <p className="mt-1 text-[11px] text-slate-500">
              Código: {selectedService.code} • Duración:{' '}
              {selectedService.duration_minutes} min
            </p>
          )}
        </div>
        <div className="text-[11px] text-slate-500">
          {relationsLoading
            ? 'Cargando relaciones...'
            : selectedService
            ? 'Editando relaciones para este servicio'
            : 'Selecciona un servicio para comenzar'}
        </div>
      </section>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/45 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-100 shadow-[0_0_0_1px_rgba(248,113,113,0.25)]">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="mt-10 flex items-center justify-center text-sm text-slate-400">
          Cargando datos de servicios...
        </div>
      ) : !selectedService ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800/80 bg-slate-950/60 px-6 py-10 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-xl">
            ✨
          </div>
          <h3 className="text-sm font-medium text-slate-100">
            Selecciona un servicio para configurar relaciones
          </h3>
          <p className="mt-1 max-w-md text-xs text-slate-400">
            Elige un servicio en la parte superior para asignarle profesionales y materiales.
          </p>
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.85)]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-50">
                Profesionales asignados
              </h2>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={savingProfessionals}
                onClick={handleSaveProfessionals}
              >
                {savingProfessionals ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
            <p className="mb-3 text-[11px] text-slate-500">
              Marca quién puede realizar este servicio en tu agenda.
            </p>
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {professionals.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-200"
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={professionalIds.has(p.id)}
                      onChange={() => handleToggleProfessional(p.id)}
                    />
                    <div>
                      <div className="font-medium text-slate-100">
                        {p.name}
                      </div>
                      {(p as Professional & { email?: string }).email && (
                        <div className="text-[11px] text-slate-500">
                          {(p as Professional & { email?: string }).email}
                        </div>
                      )}
                    </div>
                  </div>
                </label>
              ))}
              {professionals.length === 0 && (
                <p className="text-[11px] text-slate-500">
                  No hay profesionales registrados todavía.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.85)]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-50">
                Materiales / productos asociados
              </h2>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={savingMaterials}
                onClick={handleSaveMaterials}
              >
                {savingMaterials ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
            <p className="mb-3 text-[11px] text-slate-500">
              Indica qué productos se consumen y en qué cantidad por servicio.
            </p>
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {products.map((product) => {
                const entry = materials[product.id] ?? {
                  checked: false,
                  quantity: '' as const,
                };
                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-950/80 px-3 py-2 text-xs text-slate-200"
                  >
                    <div className="flex flex-1 items-center gap-2">
                      <Checkbox
                        checked={entry.checked}
                        onChange={() => handleToggleMaterial(product.id)}
                      />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-slate-100">
                          {product.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {product.sku} • {product.unit}
                        </div>
                      </div>
                    </div>
                    <div className="w-24">
                      <Input
                        label={null}
                        type="number"
                        min={0}
                        step="0.001"
                        value={entry.quantity}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          handleChangeMaterialQuantity(
                            product.id,
                            e.target.value
                          )
                        }
                        placeholder="0"
                        inputClassName="h-8 px-2 py-1 text-[11px]"
                      />
                    </div>
                  </div>
                );
              })}
              {products.length === 0 && (
                <p className="text-[11px] text-slate-500">
                  No hay productos registrados todavía.
                </p>
              )}
            </div>
          </div>
        </section>
      )}
    </DashboardLayout>
  );
}
