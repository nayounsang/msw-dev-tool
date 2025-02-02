import React, { useMemo } from "react";
import { useHandlerStore } from "../../lib";
import {
  convertRowToRowSelectionState,
  FlatHandlerMap,
  flatHandlerMap,
} from "../../utils/handlerMap";
import { dummyUrl } from "../../const/handler";
import {
  ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  RowSelectionState,
  useReactTable,
} from "@tanstack/react-table";

export const HttpControl = () => {
  const { handlerMap } = useHandlerStore();

  const columnHelper = createColumnHelper<FlatHandlerMap>();
  const columns: ColumnDef<FlatHandlerMap, any>[] = useMemo(() => {
    return [
      columnHelper.accessor("checked", {
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={(e) => table.toggleAllRowsSelected(e.target.checked)}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={(e) => row.toggleSelected(e.target.checked)}
          />
        ),
      }),
      columnHelper.accessor("url", {
        header: "End point",
      }),
      columnHelper.accessor("method", {
        header: "Method",
        cell: ({ row }) => (
          <div className="msw-dev-tool-center">{row.original.method}</div>
        ),
      }),
    ];
  }, []);
  const data = useMemo(() => {
    return flatHandlerMap(handlerMap).filter((h) => h.url !== dummyUrl);
  }, [handlerMap]);

  const getRowId = (row: FlatHandlerMap) => `${row.url}_${row.method}`;
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
    convertRowToRowSelectionState(data)
  );

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    state: {
      rowSelection,
    },
    onRowSelectionChange: (newRowSelection) => {
      setRowSelection(newRowSelection);
      
    },
    getRowId,
    enableRowSelection: true,
  });

  return (
    <div>
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
