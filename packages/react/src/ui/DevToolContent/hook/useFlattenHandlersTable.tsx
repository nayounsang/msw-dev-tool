import {
  ColumnDef,
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React, { useMemo } from "react";
import { BehaviorSelect } from "../HandlerTable/BehaviorSelect";
import { FlattenHandler, useHandlerStore } from "@msw-dev-tool/core/browser";
import { Button } from "../../Components/Button";
import { Trash2 } from "lucide-react";
import { CustomResponseDialog } from "../HandlerTable/CustomResponseDialog";

const columnHelper = createColumnHelper<FlattenHandler>();

export const useFlattenHandlersTable = () => {
  const flattenHandlers = useHandlerStore((state) => state.flattenHandlers);
  const removeTempHandler = useHandlerStore((state) => state.removeTempHandler);
  const setHandlerEnabled = useHandlerStore((state) => state.setHandlerEnabled);

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
      columnHelper.accessor("enabled", {
        header: "Mock Enable",
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.original.enabled}
            aria-label={`Enable mock for ${row.original.path}`}
            onChange={(event) => setHandlerEnabled(row.original.id, event.target.checked)}
          />
        ),
      }),
      columnHelper.accessor("behavior", {
        header: "Behavior",
        cell: ({ row }) => {
          return <BehaviorSelect row={row} />;
        },
      }),
      columnHelper.display({
        header: "Custom Response",
        cell: ({ row }) => <CustomResponseDialog handler={row.original} />,
      }),
      columnHelper.display({
        header: "Delete",
        cell: ({ row }) => {
          const isTemp = row.original.type === "temp";
          return (
            <Button
              variant="ghost"
              color="danger"
              onClick={() => {
                removeTempHandler(row.original.id);
              }}
              disabled={!isTemp}
              title={
                isTemp
                  ? "Delete this handler"
                  : "Handlers generated from codebase cannot be deleted"
              }
              className={isTemp ? "msw-dt-danger-text" : "msw-dt-disabled-text"}
            >
              <Trash2 size={16} />
            </Button>
          );
        },
        id: "delete",
      }),
    ];
  }, [flattenHandlers, removeTempHandler, setHandlerEnabled]);

  const table = useReactTable({
    columns,
    data: flattenHandlers,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    enableRowSelection: true,
  });

  return table;
};
