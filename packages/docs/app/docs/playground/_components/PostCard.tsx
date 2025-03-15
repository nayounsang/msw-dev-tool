"use client";

import { motion } from "framer-motion";
import { Dispatch, SetStateAction, useEffect } from "react";
import { XIcon } from "lucide-react";
import { useLoadMSWContext } from "@/app/_components/MSWProvider";
import { PostCardSkeleton } from "./PostCardSkeleton";
import { usePostStore } from "@/store/postStore";
import { ErrorFallback } from "./ErrorFallback";

interface PostCardProps {
  postId: number;
  setPostId: Dispatch<SetStateAction<number | null>>;
}

export const PostCard = ({ postId, setPostId }: PostCardProps) => {
  const { isLoading: isMSWLoading } = useLoadMSWContext();

  const { setPost, postQuery } = usePostStore();

  const { data: post, isLoading, error } = postQuery;

  useEffect(() => {
    setPost(postId);
  }, [postId, setPost]);

  if (isLoading || isMSWLoading) {
    return <PostCardSkeleton setPostId={setPostId} />;
  }

  if (error) return <ErrorFallback error={error} />;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
      onClick={() => setPostId(null)}
    >
      <motion.div
        className="bg-neutral-800 rounded-xl max-w-2xl w-full shadow-2xl border border-neutral-700"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="bg-orange-500/20 text-orange-300 text-xs font-medium py-1 px-2 rounded">
                User {post?.userId}
              </span>
              <span className="text-neutral-500 text-sm">#{post?.id}</span>
            </div>
            <button
              className="text-neutral-400 hover:text-white"
              onClick={() => setPostId(null)}
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
          <h3 className="text-xl font-bold text-white mb-3">{post?.title}</h3>
          <div className="bg-neutral-900 rounded-lg p-4 text-neutral-300">
            <p>{post?.body}</p>
          </div>
        </div>
        <div className="px-6 py-4 bg-neutral-900 rounded-b-xl flex justify-between">
          <span className="text-neutral-500 text-sm">Post ID: {post?.id}</span>
          <button
            className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
            onClick={() => setPostId(null)}
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
