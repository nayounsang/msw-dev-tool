import {
  ColumnDef,
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React, { useMemo } from "react";
import { BehaviorSelect } from "../HandlerTable/BehaviorSelect";
import { FlattenHandler, handlerStore } from "@msw-dev-tool/core";

export const useFlattenHandlersTable = () => {
  const { flattenHandlers } = handlerStore();

  const columnHelper = createColumnHelper<FlattenHandler>();
  const columns: ColumnDef<FlattenHandler, any>[] = useMemo(() => {
    return [
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
  }, [flattenHandlers]);

  const table = useReactTable({
    columns,
    data: flattenHandlers,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    enableRowSelection: true,
  });

  return table;
};
