import { ColumnDef, createColumnHelper, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { flatHandlerMap, FlatHandlerMap } from "../utils/handlerMap";
import { useHandlerStore } from "../lib";
import { useMemo } from "react";
import React from "react";
import { dummyUrl } from "../const/handler";

// export const useHttpTable = () => {
//     const { handlerMap } = useHandlerStore();

//     const columnHelper = createColumnHelper<FlatHandlerMap>();
//     const columns: ColumnDef<FlatHandlerMap, any>[] = useMemo(() => {
//         return [
//             columnHelper.accessor("checked", {
//                 header: () => <input type="checkbox" />,
//                 cell: () => <input type="checkbox" />,
//             }),
//             columnHelper.accessor("url", {
//                 header: "End point",
//             }),
//             columnHelper.accessor("method", {
//                 header: "Method",
//                 cell: ({ row }) => (
//                     <div className="msw-dev-tool-center">{row.original.method}</div>
//                 ),
//             }),
//         ];
//     }, []);
//     const data = useMemo(() => {
//         return flatHandlerMap(handlerMap).filter((h) => h.url !== dummyUrl);
//     }, [handlerMap]);

//     const table = useReactTable({
//         columns,
//         data,
//         getCoreRowModel: getCoreRowModel(),
//         state: {
//             rowSelection:
//     }
//     });
// }