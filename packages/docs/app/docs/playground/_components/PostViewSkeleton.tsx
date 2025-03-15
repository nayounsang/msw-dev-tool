"use client";

import { motion } from "framer-motion";

export const PostViewSkeleton = () => {
  const skeletonItems = Array.from({ length: 6 }, (_, i) => i);
  
  return (
    <div className="py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {skeletonItems.map((index) => (
          <motion.div
            key={index}
            className="bg-neutral-800/70 rounded-lg overflow-hidden shadow-lg border border-neutral-700 h-[140px]"
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            transition={{ 
              repeat: Infinity, 
              repeatType: "reverse", 
              duration: 1.5,
              delay: index * 0.1
            }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-orange-500/20 h-5 w-16 rounded animate-pulse"></div>
                <div className="bg-neutral-700 h-4 w-8 rounded animate-pulse"></div>
              </div>
              <div className="bg-neutral-700 h-6 w-3/4 rounded mb-4 animate-pulse"></div>
              
              <div className="mt-4 flex justify-end">
                <div className="bg-orange-500/20 h-6 w-20 rounded animate-pulse"></div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}; 