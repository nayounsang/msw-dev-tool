"use client";

import { useFetchContext } from "./FetchProvider";
import clsx from "clsx";

interface ResponseSectionProps {
  title: string;
  children: React.ReactNode;
}

const ResponseSection = ({ title, children }: ResponseSectionProps) => (
  <div>
    <h3 className="text-lg font-semibold text-gray-300 mb-2">{title}</h3>
    <pre className="p-4 bg-gray-800 rounded-md text-gray-100 overflow-auto max-h-[500px]">
      {children}
    </pre>
  </div>
);

interface SkeletonProps {
  mode: "title" | "content";
  className?: string;
}

const Skeleton = ({ mode, className = "" }: SkeletonProps) => {
  const baseClasses = "bg-gray-700 rounded animate-pulse";

  return (
    <div
      className={clsx(
        baseClasses,
        {
          "h-4 w-1/4": mode === "title",
          "h-32 w-full": mode === "content",
        },
        className
      )}
    />
  );
};

const SkeletonSection = () => (
  <div className="space-y-2">
    <Skeleton mode="title" />
    <Skeleton mode="content" />
  </div>
);

export const Response = () => {
  const { result } = useFetchContext();

  if (!result) {
    return (
      <div className="space-y-6">
        <SkeletonSection />
        <SkeletonSection />
        <SkeletonSection />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ResponseSection title="Status">
        {result.status} {result.statusText}
      </ResponseSection>
      <ResponseSection title="Data">{result.data}</ResponseSection>
      <ResponseSection title="Headers">
        {result.headers}
      </ResponseSection>
    </div>
  );
};
