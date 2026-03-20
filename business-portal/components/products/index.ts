export { ProductFormModal } from './ProductFormModal';
export type { ProductFormModalProps } from './ProductFormModal';
export type { ProductItem, ProductFormPayload } from './types';
export { formatMoneyFromCents } from './utils';

// Inventario (submódulo)
export {
  InventoryAdjustModal,
  type InventoryAdjustModalProps,
  type StockRow,
  type AdjustPayload,
} from './inventory';
