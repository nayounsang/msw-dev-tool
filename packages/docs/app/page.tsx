import { REPO_URL } from "@/const/link";
import { ArrowRight, CheckCircle2, SquareTerminal } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GitHubIcon } from "nextra/icons";

export const metadata: Metadata = {
  title: "Runtime API mocking and scenario control for MSW",
  description:
    "Inspect and control MSW API scenarios at runtime. Simulate failures, verify user flows, and give AI agents a controlled network environment.",
  keywords: [
    "MSW Dev Tool",
    "runtime API mocking",
    "MSW scenarios",
    "AI agent testing",
    "API scenario testing",
    "runtime mock control",
  ],
};

const capabilities = [
  "Inspect registered mock handlers",
  "Change responses, latency, errors, or handler availability",
  "Add and remove temporary handlers without a code change",
  "Control running sessions through Chrome DevTools Protocol",
  "Use the same scenario controls in Node and test processes",
  "Reset every change and return to your declared handlers",
];

export default function Home() {
  return (
    <main className="overflow-hidden bg-neutral-950 text-white">
      <section className="relative isolate">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_-20%,rgba(249,115,22,0.24),transparent_42%),linear-gradient(180deg,#171717_0%,#0a0a0a_100%)]" />
        <div className="mx-auto max-w-6xl px-6 pb-24 pt-20 sm:pb-32 sm:pt-28 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-400/10 px-4 py-2 text-sm text-orange-200">
              <Image src="/msw-dev-tool-logo.svg" alt="" width={18} height={18} />
              Built on Mock Service Worker
            </div>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              Inspect and control every API scenario.
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-pretty text-lg leading-8 text-neutral-300 sm:text-xl">
              MSW Dev Tool turns your existing MSW handlers into runtime controls—so you can inspect
              requests, debug edge cases, demonstrate states, and verify user flows with confidence.
            </p>
            <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Link
                href="/docs/get-started"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-orange-500 px-6 py-3 font-medium text-white transition hover:bg-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2 focus:ring-offset-neutral-950"
              >
                <SquareTerminal size={19} />
                Get started
                <ArrowRight size={17} />
              </Link>
              <Link
                href={REPO_URL}
                target="_blank"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-neutral-700 bg-neutral-900/60 px-6 py-3 font-medium text-neutral-200 transition hover:border-neutral-500 hover:bg-neutral-800 hover:text-white"
              >
                <GitHubIcon className="h-5 w-5" />
                View on GitHub
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-4 sm:grid-cols-3">
            {[
              ["Inspect", "See the registered mock scenarios and their current state"],
              ["Control", "Apply responses, errors, delays, and temporary overrides"],
              ["Verify", "Check the resulting experience in a live application session"],
            ].map(([label, description]) => (
              <div
                key={label}
                className="rounded-xl border border-white/10 bg-white/[0.04] p-5 text-left shadow-2xl shadow-black/20 backdrop-blur"
              >
                <p className="text-sm font-semibold text-orange-300">{label}</p>
                <p className="mt-2 text-sm leading-6 text-neutral-300">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-neutral-900/50">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-300">
            Why MSW Dev Tool
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Make difficult network states easy to reach.
          </h2>
          <p className="mt-5 text-lg leading-7 text-neutral-300">
            Reuse your MSW handlers to reproduce any state—from loading to recovery—without changing
            application code.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-300">
            A tighter feedback loop
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            From declared mock to verified experience.
          </h2>
          <p className="mt-5 text-lg leading-7 text-neutral-300">
            Choose a scenario, inspect the result, and reset it—without building a separate E2E
            fixture for one API state.
          </p>
          <Link
            href="/docs/how-to-use"
            className="mt-7 inline-flex items-center gap-2 font-medium text-orange-300 transition hover:text-orange-200"
          >
            See the workflow <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <section className="border-t border-white/10 bg-neutral-900/50">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-300">
              Built for the whole mock lifecycle
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              One set of handlers. More useful ways to use them.
            </h2>
            <p className="mt-5 max-w-2xl leading-7 text-neutral-300">
              MSW Dev Tool complements—not replaces—your test runner and browser automation. It
              gives developers and agents a deterministic way to place the application in the
              network state they need before checking what users see.
            </p>
          </div>
          <ul className="space-y-3">
            {capabilities.map((capability) => (
              <li key={capability} className="flex gap-3 text-sm leading-6 text-neutral-300">
                <CheckCircle2
                  className="mt-0.5 shrink-0 text-orange-400"
                  size={18}
                  aria-hidden="true"
                />
                {capability}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-24 text-center lg:px-8">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Build and verify with the network under control.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl leading-7 text-neutral-300">
          Add MSW Dev Tool to an existing MSW setup and start exploring every state your interface
          needs to handle.
        </p>
        <Link
          href="/docs/get-started"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-3 font-medium transition hover:bg-orange-400"
        >
          Read the getting started guide <ArrowRight size={17} />
        </Link>
      </section>
    </main>
  );
}
