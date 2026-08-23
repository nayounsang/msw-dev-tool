import type { ReactNode } from "react";
import { Providers } from "./providers";
import "./globals.css";

export const metadata = {
  title: "msw-dev-tool example",
  description: "Browser + Node MSW example with Next.js SSR",
};

export default function RootLayout({ children, ssr }: { children: ReactNode; ssr: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <main>
            <h1>msw-dev-tool example</h1>
            <p>
              Client sections use the browser worker + DevTool. The SSR section uses{" "}
              <code>setupDevToolServer</code> (control it with <code>@msw-dev-tool/node-cli</code>).
            </p>
            {children}
            <hr />
            {ssr}
          </main>
        </Providers>
      </body>
    </html>
  );
}
