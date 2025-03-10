import { REPO_URL } from "@/const/link";
import { SquareTerminal } from "lucide-react";
import Link from "next/link";
import { GitHubIcon } from "nextra/icons";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900 text-white">
      <div className="container mx-auto px-4 py-20 md:py-32 flex flex-col items-center justify-center text-center">
        <div className="max-w-3xl mx-auto">
          {/* Hero Section */}
          <div className="space-y-6 mb-12">
            <h1 className="text-4xl md:text-6xl font-bold animate-fadeIn">
              <span className="text-orange-500 animate-pulse">MSW</span> DEV TOOL
            </h1>
            <h2 className="text-xl md:text-2xl font-extralight text-neutral-200 leading-relaxed animate-fadeIn animation-delay-200">
              Dev tool to control mock logic, modify responses, and monitor API calls
              with <span className="text-orange-500 font-medium">msw</span>.
            </h2>
            <p className="text-neutral-400 text-sm animate-fadeIn animation-delay-300">
              Powered by{" "}
              <a href="https://mswjs.io/" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 underline underline-offset-2">
                msw
              </a>
              {" "}and{" "}
              <a href="https://zustand-demo.pmnd.rs/" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 underline underline-offset-2">
                zustand
              </a>
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fadeIn animation-delay-400">
            <Link
              href="/docs/get-started"
              className="w-full sm:w-auto px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex items-center justify-center gap-3 transition-colors duration-200 shadow-lg shadow-orange-500/20"
            >
              <SquareTerminal size={20} />
              <span className="font-medium">Get Started</span>
            </Link>
            <Link
              href={REPO_URL}
              target="_blank"
              className="w-full sm:w-auto px-8 py-3 border border-neutral-700 hover:border-neutral-500 rounded-lg text-neutral-300 hover:text-white flex items-center justify-center gap-3 transition-all duration-200"
            >
              <GitHubIcon className="w-[20px] h-[20px]" />
              <span>View on GitHub</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
