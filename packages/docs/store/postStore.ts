import { BASE_URL } from "@/const/api";
import { Post } from "@/types/api";
import { create } from "zustand";

interface Query<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

interface PostStore {
  postsQuery: Query<Post[]>;
  postQuery: Query<Post>;
  setPosts: () => Promise<void>;
  setPost: (id: number) => Promise<void>;
}

export const usePostStore = create<PostStore>((set) => ({
  postsQuery: { data: null, isLoading: false, error: null },
  postQuery: { data: null, isLoading: false, error: null },
  setPosts: async () => {
    set({ postsQuery: { data: null, isLoading: true, error: null } });
    try {
      const response = await fetch(`${BASE_URL}/posts`);
      const data = await response.json();
      set({ postsQuery: { data, isLoading: false, error: null } });
    } catch (error) {
      set({
        postsQuery: { data: null, isLoading: false, error: error as Error },
      });
    }
  },
  setPost: async (id) => {
    set({ postQuery: { data: null, isLoading: true, error: null } });
    try {
      const response = await fetch(`${BASE_URL}/posts/${id}`);
      const data = await response.json();
      set({ postQuery: { data, isLoading: false, error: null } });
    } catch (error) {
      set({
        postQuery: { data: null, isLoading: false, error: error as Error },
      });
    }
  },
}));
