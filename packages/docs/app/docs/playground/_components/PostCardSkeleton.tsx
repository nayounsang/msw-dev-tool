"use client";

import { motion } from "framer-motion";
import { XIcon } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

interface PostCardSkeletonProps {
  setPostId: Dispatch<SetStateAction<number | null>>;
}

export const PostCardSkeleton = ({ setPostId }: PostCardSkeletonProps) => {
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
      onClick={() => setPostId(null)}
    >
      <motion.div
        className="bg-neutral-800 rounded-xl max-w-2xl w-full shadow-2xl border border-neutral-700"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="bg-orange-500/20 h-5 w-16 rounded animate-pulse"></div>
              <div className="bg-neutral-700 h-4 w-8 rounded animate-pulse"></div>
            </div>
            <button
              className="text-neutral-400 hover:text-white"
              onClick={() => setPostId(null)}
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Title */}
          <div className="bg-neutral-700 h-7 w-3/4 rounded mb-3 animate-pulse"></div>

          {/* Body */}
          <div className="bg-neutral-900 rounded-lg p-4">
            <div className="bg-neutral-700 h-4 w-full rounded mb-2 animate-pulse"></div>
            <div className="bg-neutral-700 h-4 w-5/6 rounded mb-2 animate-pulse"></div>
            <div className="bg-neutral-700 h-4 w-4/6 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="px-6 py-4 bg-neutral-900 rounded-b-xl flex justify-between">
          <div className="bg-neutral-700 h-4 w-24 rounded animate-pulse"></div>
          <button
            className="text-orange-400 hover:text-orange-300 text-sm font-medium"
            onClick={() => setPostId(null)}
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
