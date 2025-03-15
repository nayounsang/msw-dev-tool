import { http, HttpResponse } from "msw";
import { RequestHandler } from "msw";
import { mockPosts } from "./const";
import { BASE_URL } from "@/const/api";

export const handlers: RequestHandler[] = [
  http.get(`${BASE_URL}/posts`, () => {
    return HttpResponse.json(mockPosts);
  }),
  http.get<{ id: string }>(`${BASE_URL}/posts/:id`, ({ params }) => {
    const { id } = params;
    const post = mockPosts.find((post) => post.id === Number(id));

    if (!post) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json(post);
  }),
];
