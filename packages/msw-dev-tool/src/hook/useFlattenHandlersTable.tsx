import {
  ColumnDef,
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useHandlerStore } from "../lib/handlerStore";
import { FlattenHandler } from "../lib";
import React, { useMemo } from "react";
import { PreviewHandler } from "../ui/Table/PreviewHandler";
import { Flex } from "@radix-ui/themes";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@radix-ui/react-dialog";

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
          const protocol = new URL(row.original.path, location.href).protocol;
          return protocol;
        },
      }),
      columnHelper.accessor("path", {
        header: "Host",
        cell: ({ row }) => {
          const host = new URL(row.original.path, location.href).host;
          return host;
        },
      }),
      columnHelper.accessor("path", {
        header: "Path",
        cell: ({ row }) => {
          const path = new URL(row.original.path, location.href).pathname;
          return path;
        },
      }),
      columnHelper.accessor("method", {
        header: "Method",
        cell: ({ row }) => row.original.method,
      }),
      columnHelper.accessor("handler", {
        header: "Preview",
        cell: ({ row }) => {
          const handler = row.original.handler;
          return (
            <Dialog>
              <DialogTrigger>Preview</DialogTrigger>
              <DialogPortal>
                <DialogOverlay
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    inset: 0,
                    position: "fixed",
                    zIndex: 10001,
                  }}
                />
                <DialogContent
                  style={{
                    backgroundColor: "white",
                    padding: "1rem",
                    position: "fixed",
                    zIndex: 99999,
                    inset:0,
                    borderRadius: "8px",
                    width: "320px",
                    maxHeight: "500px",
                    overflow: "scroll",
                  }}
                >
                  <Flex justify="between" align="center">
                    <DialogTitle>Preview Handler</DialogTitle>
                    <DialogClose
                      style={{
                        fontSize: "1.5rem",
                        backgroundColor: "transparent",
                        width: "2rem",
                        height: "2rem",
                        padding: 0,
                        textAlign: "center",
                      }}
                    >
                      X
                    </DialogClose>
                  </Flex>
                  <PreviewHandler handler={handler} />
                </DialogContent>
              </DialogPortal>
            </Dialog>
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
