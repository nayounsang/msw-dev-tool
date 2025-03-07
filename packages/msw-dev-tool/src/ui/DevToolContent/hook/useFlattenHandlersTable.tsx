import {
  ColumnDef,
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useHandlerStore } from "../../../lib/handlerStore";
import { FlattenHandler } from "../../../lib";
import React, { useMemo } from "react";
import { BehaviorSelect } from "../HandlerTable/BehaviorSelect";

export const useFlattenHandlersTable = () => {
  const {
    flattenHandlers,
    handlerRowSelection,
    handleHandlerRowSelectionChange,
  } = useHandlerStore();

  const columnHelper = createColumnHelper<FlattenHandler>();
  const columns: ColumnDef<FlattenHandler, any>[] = useMemo(() => {
    return [
      columnHelper.accessor("enabled", {
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={(e) => {
              e.stopPropagation();
              table.toggleAllRowsSelected(e.target.checked);
            }}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={(e) => {
              e.stopPropagation();
              row.toggleSelected(e.target.checked);
            }}
          />
        ),
      }),
      columnHelper.accessor("path", {
        header: "Protocol",
        cell: ({ row }) => {
          const protocol = new URL(row.original.path, location.href).protocol;
          return protocol;
        },
        id: "protocol",
      }),
      columnHelper.accessor("path", {
        header: "Host",
        cell: ({ row }) => {
          const host = new URL(row.original.path, location.href).host;
          return host;
        },
        id: "host",
      }),
      columnHelper.accessor("path", {
        header: "Path",
        cell: ({ row }) => {
          const path = new URL(row.original.path, location.href).pathname;
          return path;
        },
        id: "path",
      }),
      columnHelper.accessor("method", {
        header: "Method",
        cell: ({ row }) => row.original.method,
      }),
      columnHelper.accessor("behavior", {
        header: "Behavior",
        cell: ({ row }) => {
          return <BehaviorSelect row={row} />;
        },
      }),
    ];
  }, [flattenHandlers, handlerRowSelection, handleHandlerRowSelectionChange]);

  const table = useReactTable({
    columns,
    data: flattenHandlers,
    getCoreRowModel: getCoreRowModel(),
    state: {
      rowSelection: handlerRowSelection,
    },
    onRowSelectionChange: handleHandlerRowSelectionChange,
    getRowId: (row) => row.id,
    enableRowSelection: true,
  });

  return table;
};
