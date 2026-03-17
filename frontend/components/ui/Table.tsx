import type { ReactNode } from 'react';

export interface TableColumn<T = unknown> {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  accessor?: (item: T, rowIndex: number) => unknown;
  render?: (item: T, rowIndex: number) => ReactNode;
}

export interface TableProps<T = unknown> {
  columns: TableColumn<T>[];
  items: T[];
  getItemKey?: (item: T, rowIndex: number) => string | number;
  renderCell?: (item: T, colKey: string, rowIndex: number) => ReactNode;
  emptyMessage?: string;
  className?: string;
}

export default function Table<T = unknown>({
  columns,
  items,
  getItemKey,
  renderCell,
  emptyMessage = 'Sin registros',
  className = '',
}: TableProps<T>) {
  const renderContent = (item: T, col: TableColumn<T>, rowIndex: number): ReactNode => {
    if (renderCell) {
      return renderCell(item, col.key, rowIndex);
    }
    if (col.render) {
      return col.render(item, rowIndex);
    }
    if (col.accessor) {
      return col.accessor(item, rowIndex) as ReactNode;
    }
    return null;
  };

  const hasItems = items.length > 0;

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-700/80 bg-surface-elevated/60 shadow-(--shadow-card) ${className}`}
    >
      <div className="hidden w-full overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-surface/80 text-left text-xs uppercase tracking-[0.12em] text-slate-400">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3.5 font-medium ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                        ? 'text-center'
                        : ''
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!hasItems ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-xs text-slate-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              items.map((item, rowIndex) => (
                <tr
                  key={getItemKey ? String(getItemKey(item, rowIndex)) : rowIndex}
                  className="border-t border-slate-700/80 hover:bg-slate-800/50 transition"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3.5 align-top ${
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                            ? 'text-center'
                            : ''
                      }`}
                    >
                      {renderContent(item, col, rowIndex)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 p-3 text-sm md:hidden">
        {!hasItems ? (
          <div className="rounded-xl border border-slate-700/80 bg-surface/80 px-4 py-6 text-center text-xs text-slate-400">
            {emptyMessage}
          </div>
        ) : (
          items.map((item, rowIndex) => (
            <div
              key={getItemKey ? String(getItemKey(item, rowIndex)) : rowIndex}
              className="rounded-xl border border-slate-700/80 bg-surface/80 px-4 py-3.5"
            >
              {columns.map((col) => (
                <div
                  key={col.key}
                  className="flex flex-col gap-0.5 py-2 first:pt-0 last:pb-0 border-b border-slate-700/80/50 last:border-0"
                >
                  <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500">
                    {col.header}
                  </span>
                  <div className="text-sm text-slate-200 min-h-[20px]">
                    {renderContent(item, col, rowIndex)}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
