import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { fetchBranches } from '@/lib/api/branches';
import {
  PageHeader,
  Container,
  Select,
  Checkbox,
  AppointmentCalendar,
} from '@/components/ui';
import { hasAnyRole } from '@/lib/auth';
import type { Branch } from '@/types';
import type { AppointmentCalendarEvent } from '@/components/ui/AppointmentCalendar';

export default function AgendaPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [showCancelled, setShowCancelled] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
      return;
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function loadBranches() {
      try {
        const response = await fetchBranches();
        if (!cancelled) {
          const list = Array.isArray(response) ? response : [];
          setBranches(list);
          if (list.length === 1) setSelectedBranchId(String(list[0].id));
        }
      } catch {
        // Sin selector la agenda sigue funcionando
      }
    }
    void loadBranches();
    return () => { cancelled = true; };
  }, [user]);

  const handleEventClick = (event: AppointmentCalendarEvent) => {
    router.push(`/appointments?highlight=${event.id}`);
  };

  if (!authLoading && !user) return null;

  const isOwner = hasAnyRole(user, ['business_owner']);

  return (
    <Container>
      <PageHeader
        title="Agenda"
        subtitle="Visualiza las citas por sucursal. Los profesionales solo ven sus propias citas."
      />

      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {isOwner && branches.length > 0 && (
          <div className="w-full sm:w-56">
            <Select
              id="agenda-branch"
              label={null}
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              selectClassName="rounded-[var(--radius-xl)] border-[var(--color-border)] bg-[var(--color-surface-elevated)]/60"
            >
              <option value="">Todas las sucursales</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </Select>
          </div>
        )}
        <div className="flex items-center gap-3">
          <Checkbox
            id="agenda-show-cancelled"
            checked={showCancelled}
            onChange={(e) => setShowCancelled(e.target.checked)}
            label="Mostrar canceladas / no presentados"
          />
        </div>
      </div>

      <AppointmentCalendar
        user={user}
        branchId={selectedBranchId || null}
        showCancelled={showCancelled}
        onEventClick={handleEventClick}
        initialView="timeGridWeek"
        height="calc(100vh - 16rem)"
        className="mt-2"
      />
    </Container>
  );
}
