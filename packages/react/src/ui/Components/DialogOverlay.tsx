import React from "react";

/**
 * Standalone backdrop overlay for use inside Dialog/Drawer portals.
 * Base UI Dialog.Backdrop handles its own state; this is a simple visual overlay
 * that closes the dialog when clicked (used as a sibling to Dialog.Popup).
 */
export const DialogOverlay = () => {
  return <div className="msw-dt-dialog-backdrop" />;
};
