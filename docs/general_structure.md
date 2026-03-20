SaaS Gestión de Salones (Multi-tenant)

├── Portal del Negocio (Salón)
│   ├── Operación diaria
│   │   ├── Agenda / Calendario
│   │   ├── Gestión de citas
│   │   ├── Disponibilidad por profesional
│   │   └── Bloqueos / horarios especiales
│   │
│   ├── Profesionales
│   │   ├── Perfiles (skills, servicios)
│   │   ├── Horarios individuales
│   │   ├── Comisiones
│   │   └── Performance / KPIs
│   │
│   ├── Servicios
│   │   ├── Catálogo
│   │   ├── Duración
│   │   ├── Precio
│   │   └── Variantes (ej: corte + tratamiento)
│   │
│   ├── Clientes (CRM)
│   │   ├── Historial de citas
│   │   ├── Preferencias
│   │   ├── Notas internas
│   │   └── Segmentación
│   │
│   ├── Pagos y facturación
│   │   ├── Cobros
│   │   ├── Suscripciones (si aplica)
│   │   ├── Propinas
│   │   └── Reportes financieros
│   │
│   ├── Inventario
│   │   ├── Productos
│   │   ├── Consumo por servicio
│   │   └── Alertas de stock
│   │
│   ├── Marketing
│   │   ├── Promociones
│   │   ├── Cupones
│   │   ├── Recordatorios automáticos
│   │   └── Campañas (WhatsApp / email)
│   │
│   ├── Analytics
│   │   ├── Ingresos
│   │   ├── Ocupación
│   │   ├── Retención
│   │   └── Ticket promedio
│   │
│   └── Configuración
│       ├── Branding
│       ├── Horarios generales
│       └── Políticas

├── Portal del Cliente (End User)
│   ├── Descubrimiento
│   │   ├── Ver servicios
│   │   ├── Ver profesionales
│   │   └── Disponibilidad
│   │
│   ├── Agenda
│   │   ├── Reservar cita
│   │   ├── Reagendar
│   │   └── Cancelar
│   │
│   ├── Perfil
│   │   ├── Historial
│   │   ├── Favoritos
│   │   └── Preferencias
│   │
│   ├── Pagos
│   │   ├── Pago online
│   │   ├── Anticipos
│   │   └── Métodos guardados
│   │
│   ├── Fidelización
│   │   ├── Puntos / rewards
│   │   ├── Membresías
│   │   └── Referidos
│   │
│   └── Notificaciones
│       ├── Recordatorios
│       ├── Confirmaciones
│       └── Promociones

└── Core SaaS (Plataforma)
    ├── Multi-tenant
    ├── Billing (Stripe / MercadoPago)
    ├── Roles y permisos
    ├── API
    ├── Logs / auditoría
    └── Escalabilidad
