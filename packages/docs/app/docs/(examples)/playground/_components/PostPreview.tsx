import { Post } from "@/types/api";
import { motion } from "framer-motion";
import { Dispatch, SetStateAction } from "react";
export const PostPreview = ({
  post,
  setSelectedPostId,
}: {
  post: Post;
  setSelectedPostId: Dispatch<SetStateAction<number | null>>;
}) => {
  return (
    <motion.div
      key={post.id}
      className={`bg-neutral-800 rounded-lg overflow-hidden shadow-lg
         hover:shadow-orange-500/10 transition-all duration-300 
         border border-neutral-700 hover:border-orange-500/30`}
      whileHover={{ y: -5 }}
      onClick={() => setSelectedPostId(post.id)}
    >
      <div className="p-6 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between">
          <span className="bg-orange-500/20 text-orange-300 text-xs font-medium py-1 px-2 rounded">
            User {post.userId}
          </span>
          <span className="text-neutral-500 text-sm">#{post.id}</span>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1 overflow-hidden text-ellipsis">
          {post.title}
        </h3>
        <div className="mt-4 flex justify-end">
          <button
            className="text-orange-400 hover:text-orange-300 text-sm font-medium"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPostId(post.id);
            }}
          >
            Details →
          </button>
        </div>
      </div>
    </motion.div>
  );
};
