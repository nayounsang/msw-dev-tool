import { Footer, Navbar } from "nextra-theme-docs";
import cn from "clsx";
import { REPO_URL } from "@/const/link";
import Image from "next/image";
//import { Banner } from "nextra/components";

export const banner = <></>;
export const navbar = (
  <Navbar
    logo={
      <span className="flex items-center gap-2">
        <Image
          src="/msw-dev-tool-logo.svg"
          alt="MSW Dev Tool Logo"
          width={24}
          height={24}
          style={{ borderRadius: 4 }}
        />
        <span
          className={cn(
            "font-bold",
            "hover:transition-all hover:duration-1000 motion-reduce:hover:transition-none",
            "[mask-image:linear-gradient(60deg,#000_25%,rgba(0,0,0,.2)_50%,#000_75%)] [mask-position:0] [mask-size:400%]",
            "hover:[mask-position:100%]"
          )}
        >
          <span className="text-orange-500">MSW</span> DEV TOOL
        </span>
      </span>
    }
    projectLink={REPO_URL}
    className="border-b border-gray-700"
  />
);

export const footer = (
  <Footer className="flex-col items-center md:items-start border-t border-gray-700">
    <a
      className="x:focus-visible:nextra-focus flex items-center gap-1"
      target="_blank"
      rel="noreferrer"
      title="nextra homepage"
      href="https://nextra.site/"
    >
      Powered by nextra
    </a>
    <p className="mt-6 text-xs">
      © {new Date().getFullYear()} The msw dev tool Project.
    </p>
  </Footer>
);
