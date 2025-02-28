import {
  ColumnDef,
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useHandlerStore } from "../lib/handlerStore";
import { FlattenHandler } from "../lib";
import React, { useMemo, useState } from "react";
import { PreviewHandler } from "../ui/Table/PreviewHandler";

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
        header: "Protocol",
        cell: ({ row }) => {
          console.log(row.original.path);
          const protocol = new URL(row.original.path, location.href).protocol;
          return <div className="msw-dev-tool-center">{protocol}</div>;
        },
      }),
      columnHelper.accessor("path", {
        header: "Host",
        cell: ({ row }) => {
          const host = new URL(row.original.path,location.href).host;
          return <div className="msw-dev-tool-center">{host}</div>;
        },
      }),
      columnHelper.accessor("path", {
        header: "Path",
        cell: ({ row }) => {
          const path = new URL(row.original.path, location.href).pathname;
          return <div className="msw-dev-tool-center">{path}</div>;
        },
      }),
      columnHelper.accessor("method", {
        header: "Method",
        cell: ({ row }) => (
          <div className="msw-dev-tool-center">{row.original.method}</div>
        ),
      }),
      columnHelper.accessor("handler", {
        header: "Preview",
        cell: ({ row }) => {
          const handler = row.original.handler;
          const [isOpen, setIsOpen] = useState(false);
          return (
            <>
              <button onClick={() => setIsOpen(true)}>Preview</button>
              {isOpen && (
                <PreviewHandler
                  handler={handler}
                  onClose={() => setIsOpen(false)}
                />
              )}
            </>
          );
        },
      }),
    ];
  }, []);

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
