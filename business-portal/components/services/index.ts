export { ServiceFormModal } from './ServiceFormModal';
export type { ServiceFormModalProps } from './ServiceFormModal';
export type {
  ServiceFormPayload,
  ServiceWithCategory,
  ServiceCategory,
  Service,
} from './types';
export { formatPriceFromCents } from './utils';

// Categorías de servicio (submódulo)
export { CategoryFormModal } from './categories';
export type { CategoryFormModalProps, ServiceCategoryRecord, CategoryFormPayload } from './categories';

// Relaciones de servicio (submódulo)
export type { ProductItem as RelationsProductItem, ServiceWithCode, MaterialEntry } from './relations';

// Servicios combinados (submódulo)
export { CombinedServiceFormModal } from './combined';
export type {
  CombinedServiceFormModalProps,
  CombinedServiceRecord,
  CombinedFormPayload,
  CombinedItemRow,
  CombinedServiceItem,
} from './combined';
