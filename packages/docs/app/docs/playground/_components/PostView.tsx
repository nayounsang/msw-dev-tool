"use client";

import { useState, useMemo } from "react";
import { PostCard } from "./PostCard";
import { Post } from "@/types/api";
import { PostViewSkeleton } from "./PostViewSkeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePostStore } from "@/store/postStore";
import { ErrorFallback } from "./ErrorFallback";
import { PostPreview } from "./PostPreview";

const POSTS_PER_PAGE = 6;

export const PostView = () => {
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { postsQuery } = usePostStore();

  const { data: allPosts, isLoading, error } = postsQuery;

  const totalPages = useMemo(() => {
    return allPosts ? Math.ceil(allPosts.length / POSTS_PER_PAGE) : 0;
  }, [allPosts]);

  const posts = useMemo(() => {
    return allPosts?.slice(
      (currentPage - 1) * POSTS_PER_PAGE,
      currentPage * POSTS_PER_PAGE
    );
  }, [allPosts, currentPage]);

  const paginationState = useMemo(() => {
    return {
      isPrevDisabled: currentPage === 1,
      isNextDisabled: currentPage === totalPages,
    };
  }, [currentPage, totalPages]);

  const goToNextPage = () => {
    if (!paginationState.isNextDisabled) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (!paginationState.isPrevDisabled) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (isLoading) return <PostViewSkeleton />;

  if (error) return <ErrorFallback error={error} />;

  return (
    <div className="py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 grid-container">
        {posts?.map((post: Post) => (
          <PostPreview
            key={post.id}
            post={post}
            setSelectedPostId={setSelectedPostId}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-8 gap-4">
          <button
            onClick={goToPrevPage}
            disabled={paginationState.isPrevDisabled}
            className={`p-2 rounded-full cursor-pointer ${
              paginationState.isPrevDisabled
                ? "text-neutral-500 cursor-not-allowed"
                : "text-cyan-400 hover:text-cyan-300 hover:bg-neutral-800"
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-neutral-300">
            <span className="font-medium text-cyan-400">{currentPage}</span>
            <span className="mx-1">/</span>
            <span>{totalPages}</span>
          </div>

          <button
            onClick={goToNextPage}
            disabled={paginationState.isNextDisabled}
            className={`p-2 rounded-full cursor-pointer ${
              paginationState.isNextDisabled
                ? "text-neutral-500 cursor-not-allowed"
                : "text-cyan-400 hover:text-cyan-300 hover:bg-neutral-800"
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {selectedPostId !== null && (
        <PostCard postId={selectedPostId} setPostId={setSelectedPostId} />
      )}
    </div>
  );
};
