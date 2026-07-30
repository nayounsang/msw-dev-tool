import {
  ColumnDef,
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React, { useMemo } from "react";
import { BehaviorSelect } from "../HandlerTable/BehaviorSelect";
import { FlattenHandler, useHandlerStore } from "@msw-dev-tool/core";
import { DebugIcon } from "../../Components/DebugIcon";
import { Dialog } from "@base-ui-components/react/dialog";
import { Button } from "../../Components/Button";
import { HandlerDebugger } from "../HandlerDebugger";
import { Flex } from "../../Components/Flex";
import { CloseButton } from "../../Components/CloseButton";
import { Trash2 } from "lucide-react";

const columnHelper = createColumnHelper<FlattenHandler>();

export const useFlattenHandlersTable = () => {
  const flattenHandlers = useHandlerStore((state) => state.flattenHandlers);
  const removeTempHandler = useHandlerStore((state) => state.removeTempHandler);

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
      columnHelper.display({
        header: "Debug",
        cell: ({ row }) => {
          return (
            <Dialog.Root>
              <Dialog.Trigger render={<Button variant="ghost"><DebugIcon /></Button>} />
              <Dialog.Portal>
                <Dialog.Backdrop className="msw-dt-dialog-backdrop" forceRender />
                <Dialog.Popup className="msw-dt-dialog-popup-viewport">
                  <div className="msw-dt-dialog-inner-debugger">
                    <Flex align="center" justify="space-between">
                      <Dialog.Title className="msw-dt-dialog-title-sm">
                        Debugger
                      </Dialog.Title>
                      <Dialog.Close render={<CloseButton />} />
                    </Flex>
                    <HandlerDebugger handler={row.original.handler} />
                  </div>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          );
        },
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
  }, [flattenHandlers, removeTempHandler]);

  const table = useReactTable({
    columns,
    data: flattenHandlers,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    enableRowSelection: true,
  });

  return table;
};
