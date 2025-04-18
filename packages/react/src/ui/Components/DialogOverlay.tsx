import { DialogClose } from "@radix-ui/react-dialog";
import React from "react";

/**
 * - Fix scroll being removed in shadow dom
 * - It doesn't matter if it's dialog or drawer
 */
export const DialogOverlay = () => {
  return (
    <DialogClose asChild>
        <div className="fixed inset-0 bg-black/40" />
    </DialogClose>
  );
};
