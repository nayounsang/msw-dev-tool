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
import { usePortalContainer } from "../../PortalContainerProvider";
import {
  Root as Dialog,
  Trigger,
  Portal,
  Content,
  Title,
  Close,
} from "@radix-ui/react-dialog";
import { DialogOverlay } from "../../Components/DialogOverlay";
import { Button } from "../../Components/Button";
import { HandlerDebugger } from "../HandlerDebugger";
import { Flex } from "../../Components/Flex";
import { CloseButton } from "../../Components/CloseButton";
import { TrashIcon } from "@radix-ui/react-icons";

const columnHelper = createColumnHelper<FlattenHandler>();


export const useFlattenHandlersTable = () => {
  const flattenHandlers = useHandlerStore((state)=>state.flattenHandlers);
  const removeTempHandler = useHandlerStore((state)=>state.removeTempHandler);
  const container = usePortalContainer();

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
            <Dialog>
              <Trigger asChild>
                <Button variant="ghost">
                  <DebugIcon />
                </Button>
              </Trigger>
              <Portal container={container}>
                <DialogOverlay />
                <Content className="dialog-content h-[600px] w-[800px] flex flex-col">
                  <Flex align="center" justify="space-between">
                    <Title className="m-1 text-xl font-semibold">
                      Debugger
                    </Title>
                    <Close asChild>
                      <CloseButton />
                    </Close>
                  </Flex>
                  <HandlerDebugger handler={row.original.handler} />
                </Content>
              </Portal>
            </Dialog>
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
              className={isTemp ? "text-red-500" : "text-gray-300 cursor-not-allowed"}
            >
              <TrashIcon />
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
