SaaS Gestión de Salones (Multi-tenant)

Leyenda: `[X]` listo · `[~]` parcial o básico · `[ ]` pendiente

### Paquetes comerciales (tres precios)

Cada capacidad lleva el **nivel mínimo** en el que está incluida (los niveles superiores la heredan):

| Etiqueta | Paquete | Idea de posicionamiento |
|----------|---------|-------------------------|
| `(E)` | **Esencial** | Operar el día a día: agenda, citas, catálogo, clientes y cobros básicos; portal de reserva para clientes. |
| `(P)` | **Profesional** | Negocio con equipo y control: comisiones, inventario, reportes y automatizaciones; más analítica operativa. |
| `(S)` | **Estudio** | Diferenciación y escala: CRM avanzado, analítica de retención, cupones, políticas formales, features “premium” del portal cliente. |

Si una línea no tiene etiqueta `(E|P|S)`, es **transversal** (infra/plataforma) o aún no asignada a un tier.

---

├── Portal del Negocio (Salón) — `business-portal`
│   ├── Operación diaria `(E)`
│   │   ├── [X] `(E)` Agenda / Calendario (`/agenda`)
│   │   ├── [X] `(E)` Gestión de citas (crear / editar desde agenda)
│   │   ├── [X] `(E)` Disponibilidad por profesional (`/working-hours` → Disponibilidad)
│   │   └── [X] `(E)` Bloqueos / horarios especiales (misma ruta → Bloqueos; `/blocks` redirige)
│   │
│   ├── Profesionales
│   │   ├── [X] `(E)` Perfiles (datos, sucursal, foto, usuario trabajador)
│   │   ├── [X] `(E)` Horarios individuales (working hours por profesional)
│   │   ├── [X] `(P)` Comisiones (y salario base en formulario)
│   │   └── [~] `(S)` Performance / KPIs (`/reports` — métricas agregadas, no módulo de KPIs dedicado)
│   │
│   ├── Servicios
│   │   ├── [X] `(E)` Catálogo (`/services`, `/service-categories`)
│   │   ├── [X] `(E)` Duración
│   │   ├── [X] `(E)` Precio
│   │   └── [~] `(P)` Variantes / paquetes (`/combined-services`, `/service-relations`; no “variantes” tipo retail)
│   │
│   ├── Clientes (CRM)
│   │   ├── [X] `(E)` Historial de citas (detalle de cliente)
│   │   ├── [~] `(P)` Preferencias (poco estructurado; copy y notas más que campos dedicados)
│   │   ├── [X] `(E)` Notas internas (formulario de cliente)
│   │   └── [ ] `(S)` Segmentación (etiquetas, filtros CRM avanzados)
│   │
│   ├── Pagos y facturación
│   │   ├── [X] `(E)` Cobros (`/payments`)
│   │   ├── [~] Suscripciones (`/billing` = suscripción del negocio al SaaS; no membresías de clientes finales) *(transversal: todo negocio paga el plan elegido)*
│   │   ├── [X] `(P)` Propinas (en registro de cobro)
│   │   └── [~] `(P)` Reportes financieros (`/reports` + listados; no contabilidad completa)
│   │
│   ├── Inventario
│   │   ├── [X] `(P)` Productos (`/products`)
│   │   ├── [~] `(S)` Consumo por servicio (backend/API puede vincular materiales; UI no es un módulo “consumo” dedicado)
│   │   └── [~] `(P)` Alertas de stock (ajuste de inventario; sin centro de alertas avanzado en menú)
│   │
│   ├── Marketing
│   │   ├── [~] `(P)` Promociones (tipos de regla en `/automations`, p. ej. promoción)
│   │   ├── [ ] `(S)` Cupones (códigos de descuento dedicados)
│   │   ├── [X] `(P)` Recordatorios automáticos (`/automations`)
│   │   └── [~] `(S)` Campañas (WhatsApp / email) (según triggers planteados en automatizaciones; sin módulo de campañas masivas)
│   │
│   ├── Analytics
│   │   ├── [X] `(E)` Ingresos (`/reports` — resumen de negocio)
│   │   ├── [~] `(P)` Ocupación (parcial vía dashboard / citas; sin vista “ocupación” explícita)
│   │   ├── [ ] `(S)` Retención (cohortes, churn, etc.)
│   │   └── [~] `(P)` Ticket promedio (en reportes agregados)
│   │
│   └── Configuración
│       ├── [X] `(E)` Branding (`/profile` — logo, colores, textos de reserva pública)
│       ├── [X] `(E)` Horarios generales (working hours + `/branches`)
│       └── [ ] `(S)` Políticas (cancelación, depósitos, etc. como sección de negocio)

├── Portal del Cliente (End User) — `customer-portal`
│   ├── Descubrimiento `(E)`
│   │   ├── [X] `(E)` Ver servicios (catálogo por sucursal en flujo `CustomerBooking`)
│   │   ├── [X] `(E)` Ver profesionales (listado + selección en reserva)
│   │   └── [X] `(E)` Disponibilidad (fecha/hora en formulario de reserva; no calendario interactivo avanzado)
│   │
│   ├── Agenda
│   │   ├── [X] `(E)` Reservar cita (`/[slug]/book`)
│   │   ├── [ ] `(P)` Reagendar (sin acción en UI de cliente; posible vía negocio/API)
│   │   └── [ ] `(P)` Cancelar (sin acción en UI de `AppointmentsList`)
│   │
│   ├── Perfil
│   │   ├── [X] `(E)` Historial de citas (lista en `/[slug]/appointments`)
│   │   ├── [ ] `(S)` Favoritos
│   │   └── [ ] `(P)` Preferencias (perfil cliente = nombre/email básico; texto indica placeholder para ampliar)
│   │
│   ├── Pagos
│   │   ├── [ ] `(S)` Pago online (flujo completo en portal)
│   │   ├── [ ] `(S)` Anticipos
│   │   └── [ ] `(S)` Métodos guardados
│   │
│   ├── Fidelización
│   │   ├── [ ] `(S)` Puntos / rewards
│   │   ├── [ ] `(S)` Membresías
│   │   └── [ ] `(S)` Referidos
│   │
│   └── Notificaciones
│       ├── [~] `(P)` Recordatorios (vía automatizaciones / backend)
│       ├── [~] `(E)` Confirmaciones (email según integración)
│       └── [ ] `(S)` Promociones (push/marketing al cliente final)

└── Core SaaS (Plataforma) — backend + infra
    ├── [X] Multi-tenant *(todos los paquetes; límites por plan vía producto comercial)*
    ├── [X] Billing (Stripe — portal negocio `/billing`) *(cobro del SaaS al negocio; no tier de features del salón)*
    ├── [X] Roles y permisos (p. ej. Spatie en API) `(E)` base; refinamientos `(P|S)` según roadmap
    ├── [X] API `(E)`
    ├── [~] Logs / auditoría (según lo implementado en backend) `(P)` operativo; `(S)` retención/compliance ampliada
    └── [~] Escalabilidad (diseño multi-tenant; revisar límites y observabilidad según despliegue) *infra, no tier de UI*
