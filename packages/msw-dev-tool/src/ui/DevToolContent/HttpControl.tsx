import React, { useMemo } from "react";
import { dummyUrl } from "../../const/handler";
import {
  ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useHandlerStore } from "../../lib/handlerStore";
import { FlattenHandler } from "../../lib";

export const HttpControl = () => {
  const { flattenHandlers,handlerRowSelection,handleHandlerRowSelectionChange } = useHandlerStore();

  const columnHelper = createColumnHelper<FlattenHandler>();
  const columns: ColumnDef<FlattenHandler, any>[] = useMemo(() => {
    return [
      columnHelper.accessor("enabled", {
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
      columnHelper.accessor("path", {
        header: "End point",
      }),
      columnHelper.accessor("method", {
        header: "Method",
        cell: ({ row }) => (
          <div className="msw-dev-tool-center">{row.original.enabled}</div>
        ),
      }),
    ];
  }, []);

  const table = useReactTable({
    columns,
    data:flattenHandlers,
    getCoreRowModel: getCoreRowModel(),
    state: {
      rowSelection:handlerRowSelection,
    },
    onRowSelectionChange: handleHandlerRowSelectionChange,
    getRowId:(row)=>row.id,
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
