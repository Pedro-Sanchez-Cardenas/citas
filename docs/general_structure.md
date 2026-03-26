SaaS Gestión de Salones (Multi-tenant)

Leyenda: `[X]` listo · `[~]` parcial o básico · `[ ]` pendiente

├── Portal del Negocio (Salón) — `business-portal`
│   ├── Operación diaria
│   │   ├── [X] Agenda / Calendario (`/agenda`)
│   │   ├── [X] Gestión de citas (crear / editar desde agenda)
│   │   ├── [X] Disponibilidad por profesional (`/working-hours` → Disponibilidad)
│   │   └── [X] Bloqueos / horarios especiales (misma ruta → Bloqueos; `/blocks` redirige)
│   │
│   ├── Profesionales
│   │   ├── [~] Perfiles (datos, sucursal, foto, usuario trabajador; sin módulo explícito de *skills*)
│   │   ├── [X] Horarios individuales (working hours por profesional)
│   │   ├── [X] Comisiones (y salario base en formulario)
│   │   └── [~] Performance / KPIs (`/reports` — métricas agregadas, no módulo de KPIs dedicado)
│   │
│   ├── Servicios
│   │   ├── [X] Catálogo (`/services`, `/service-categories`)
│   │   ├── [X] Duración
│   │   ├── [X] Precio
│   │   └── [~] Variantes / paquetes (`/combined-services`, `/service-relations`; no “variantes” tipo retail)
│   │
│   ├── Clientes (CRM)
│   │   ├── [X] Historial de citas (detalle de cliente)
│   │   ├── [~] Preferencias (poco estructurado; copy y notas más que campos dedicados)
│   │   ├── [X] Notas internas (formulario de cliente)
│   │   └── [ ] Segmentación (etiquetas, filtros CRM avanzados)
│   │
│   ├── Pagos y facturación
│   │   ├── [X] Cobros (`/payments`)
│   │   ├── [~] Suscripciones (`/billing` = suscripción del negocio al SaaS; no membresías de clientes finales)
│   │   ├── [X] Propinas (en registro de cobro)
│   │   └── [~] Reportes financieros (`/reports` + listados; no contabilidad completa)
│   │
│   ├── Inventario
│   │   ├── [X] Productos (`/products`)
│   │   ├── [~] Consumo por servicio (backend/API puede vincular materiales; UI no es un módulo “consumo” dedicado)
│   │   └── [~] Alertas de stock (ajuste de inventario; sin centro de alertas avanzado en menú)
│   │
│   ├── Marketing
│   │   ├── [~] Promociones (tipos de regla en `/automations`, p. ej. promoción)
│   │   ├── [ ] Cupones (códigos de descuento dedicados)
│   │   ├── [X] Recordatorios automáticos (`/automations`)
│   │   └── [~] Campañas (WhatsApp / email) (según triggers planteados en automatizaciones; sin módulo de campañas masivas)
│   │
│   ├── Analytics
│   │   ├── [X] Ingresos (`/reports` — resumen de negocio)
│   │   ├── [~] Ocupación (parcial vía dashboard / citas; sin vista “ocupación” explícita)
│   │   ├── [ ] Retención (cohortes, churn, etc.)
│   │   └── [~] Ticket promedio (en reportes agregados)
│   │
│   └── Configuración
│       ├── [X] Branding (`/profile` — logo, colores, textos de reserva pública)
│       ├── [X] Horarios generales (working hours + `/branches`)
│       └── [ ] Políticas (cancelación, depósitos, etc. como sección de negocio)

├── Portal del Cliente (End User) — `customer-portal`
│   ├── Descubrimiento
│   │   ├── [X] Ver servicios (catálogo por sucursal en flujo `CustomerBooking`)
│   │   ├── [X] Ver profesionales (listado + selección en reserva)
│   │   └── [X] Disponibilidad (fecha/hora en formulario de reserva; no calendario interactivo avanzado)
│   │
│   ├── Agenda
│   │   ├── [X] Reservar cita (`/[slug]/book`)
│   │   ├── [ ] Reagendar (sin acción en UI de cliente; posible vía negocio/API)
│   │   └── [ ] Cancelar (sin acción en UI de `AppointmentsList`)
│   │
│   ├── Perfil
│   │   ├── [X] Historial de citas (lista en `/[slug]/appointments`)
│   │   ├── [ ] Favoritos
│   │   └── [ ] Preferencias (perfil cliente = nombre/email básico; texto indica placeholder para ampliar)
│   │
│   ├── Pagos
│   │   ├── [ ] Pago online (flujo completo en portal)
│   │   ├── [ ] Anticipos
│   │   └── [ ] Métodos guardados
│   │
│   ├── Fidelización
│   │   ├── [ ] Puntos / rewards
│   │   ├── [ ] Membresías
│   │   └── [ ] Referidos
│   │
│   └── Notificaciones
│       ├── [~] Recordatorios (vía automatizaciones / backend)
│       ├── [~] Confirmaciones (email según integración)
│       └── [ ] Promociones (push/marketing al cliente final)

└── Core SaaS (Plataforma) — backend + infra
    ├── [X] Multi-tenant
    ├── [X] Billing (Stripe — portal negocio `/billing`)
    ├── [X] Roles y permisos (p. ej. Spatie en API)
    ├── [X] API
    ├── [~] Logs / auditoría (según lo implementado en backend)
    └── [~] Escalabilidad (diseño multi-tenant; revisar límites y observabilidad según despliegue)
