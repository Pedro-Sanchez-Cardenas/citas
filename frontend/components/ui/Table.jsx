export default function Table({
  columns,
  items,
  getItemKey,
  renderCell,
  emptyMessage = 'Sin registros',
  className = '',
}) {
  const renderContent = (item, col, rowIndex) => {
    if (renderCell) {
      return renderCell(item, col.key, rowIndex);
    }
    if (col.render) {
      return col.render(item, rowIndex);
    }
    if (col.accessor) {
      return col.accessor(item, rowIndex);
    }
    return null;
  };

  const hasItems = items.length > 0;

  return (
    <div
      className={`mt-2 overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/70 shadow-[0_18px_40px_rgba(15,23,42,0.85)] ${className}`}
    >
      {/* Versión de tabla para pantallas medianas en adelante */}
      <div className="hidden w-full overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-slate-900/80 text-left text-xs uppercase tracking-[0.16em] text-slate-400">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-medium ${
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
                  className="px-4 py-6 text-center text-xs text-slate-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              items.map((item, rowIndex) => (
                <tr
                  key={getItemKey ? getItemKey(item, rowIndex) : rowIndex}
                  className="border-t border-slate-800/80 hover:bg-slate-900/70"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 align-top wrap-break-word ${
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

      {/* Versión mobile: tarjetas apiladas, sin overflow horizontal */}
      <div className="space-y-2 p-3 text-sm md:hidden">
        {!hasItems ? (
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/80 px-3 py-4 text-center text-xs text-slate-400">
            {emptyMessage}
          </div>
        ) : (
          items.map((item, rowIndex) => (
            <div
              key={getItemKey ? getItemKey(item, rowIndex) : rowIndex}
              className="rounded-xl border border-slate-800/80 bg-slate-950/90 px-3.5 py-3"
            >
              {columns.map((col) => (
                <div
                  key={col.key}
                  className="flex flex-col gap-0.5 py-1 first:pt-0 last:pb-0"
                >
                  <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                    {col.header}
                  </span>
                  <div className="text-xs text-slate-200">
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


