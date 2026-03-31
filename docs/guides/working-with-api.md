# Working with the API

This guide explains how to set up and use API calls throughout the application.

---

## API Client Setup

The API client lives in `shared/api/client.ts`. It's a configured axios instance:

```ts
// src/shared/api/client.ts
import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "/api",
  headers: {
    "Content-Type": "application/json",
  },
});
```

### Adding Authentication Headers

Uncomment and adapt the request interceptor for JWT auth:

```ts
// src/shared/api/client.ts
apiClient.interceptors.request.use((config) => {
  // Get token from Redux store or localStorage
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Global Error Handling

Handle common errors in the response interceptor:

```ts
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired — redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    if (error.response?.status === 500) {
      // Show a toast notification
      console.error("Server error:", error.response.data);
    }
    return Promise.reject(error);
  }
);
```

---

## Environment Variables

API configuration uses environment variables. Create a `.env.local` file at the project root:

```env
# .env.local
NEXT_PUBLIC_API_URL=https://api.yourapp.com
```

**Naming convention:**
- `NEXT_PUBLIC_` prefix → available in browser (client-side)
- No prefix → server-side only (use in Server Components and API routes)

---

## TanStack Query Patterns

### Basic Data Fetching

```ts
// src/entities/post/api/postApi.ts
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import type { Post } from "../model/types";

export function usePosts() {
  return useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const { data } = await apiClient.get<Post[]>("/posts");
      return data;
    },
  });
}
```

### Usage in a component:

```tsx
"use client";

import { usePosts } from "@/entities/post";

export function PostsList() {
  const { data: posts, isLoading, isError, error } = usePosts();

  if (isLoading) return <div>Loading posts...</div>;
  if (isError) return <div>Error: {(error as Error).message}</div>;

  return (
    <ul>
      {posts?.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

### Fetching with Parameters

```ts
// Search posts with filters
export function useSearchPosts(query: string, page: number) {
  return useQuery({
    queryKey: ["posts", "search", query, page],
    queryFn: async () => {
      const { data } = await apiClient.get("/posts/search", {
        params: { q: query, page, limit: 10 },
      });
      return data;
    },
    // Don't fetch until the user has typed at least 2 characters
    enabled: query.length >= 2,
  });
}
```

### Creating Data (POST)

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newPost: CreatePostDto) => {
      const { data } = await apiClient.post<Post>("/posts", newPost);
      return data;
    },
    onSuccess: (createdPost) => {
      // Invalidate the posts list so it re-fetches
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      
      // Or add the new post to the cache directly (no re-fetch needed)
      // queryClient.setQueryData(["posts", "detail", createdPost.id], createdPost);
    },
    onError: (error) => {
      console.error("Failed to create post:", error);
    },
  });
}
```

```tsx
// Usage in component
const createPost = useCreatePost();

const handleSubmit = (data: CreatePostDto) => {
  createPost.mutate(data, {
    onSuccess: () => alert("Post created!"),
    onError: () => alert("Failed to create post"),
  });
};
```

### Updating Data (PUT/PATCH)

```ts
export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Post> & { id: number }) => {
      const { data } = await apiClient.patch<Post>(`/posts/${id}`, updates);
      return data;
    },
    onSuccess: (updatedPost) => {
      // Update the detail cache
      queryClient.setQueryData(["posts", "detail", updatedPost.id], updatedPost);
      // Invalidate the list
      queryClient.invalidateQueries({ queryKey: ["posts", "list"] });
    },
  });
}
```

### Deleting Data (DELETE)

```ts
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/posts/${id}`),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ["posts", "detail", deletedId] });
      // Refresh list
      queryClient.invalidateQueries({ queryKey: ["posts", "list"] });
    },
  });
}
```

---

## Next.js API Routes

For backend logic in the same codebase, use Next.js Route Handlers in the `app/api/` directory:

```
src/app/
  api/
    posts/
      route.ts         ← GET /api/posts, POST /api/posts
      [id]/
        route.ts       ← GET /api/posts/:id, PUT /api/posts/:id, DELETE /api/posts/:id
```

### Example Route Handler

```ts
// src/app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server";

// GET /api/posts
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = Number(searchParams.get("page") ?? "1");

  // Fetch from your database here
  const posts = [/* ... */];

  return NextResponse.json({ data: posts, page, total: 100 });
}

// POST /api/posts
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Validate and save to database
  const newPost = { id: Date.now(), ...body };

  return NextResponse.json(newPost, { status: 201 });
}
```

---

## Error Handling Patterns

### In Query Hooks

```ts
export function usePost(id: number) {
  return useQuery({
    queryKey: ["posts", id],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get<Post>(`/posts/${id}`);
        return data;
      } catch (error: any) {
        // Transform the error for better UX
        if (error.response?.status === 404) {
          throw new Error("Post not found");
        }
        throw new Error("Failed to load post");
      }
    },
  });
}
```

### In Components

```tsx
const { data, isLoading, isError, error } = usePost(id);

if (isLoading) return <Skeleton />;
if (isError) {
  return (
    <div className="rounded-md bg-destructive/10 p-4 text-destructive">
      {(error as Error).message}
    </div>
  );
}
```

---

## Server Components vs Client Components

Next.js App Router supports **React Server Components** (RSC). Use them wisely:

### When to use Server Components (no "use client")
- Fetching data from your own database directly (skip API entirely)
- Components that don't need interactivity
- Pages that need SEO optimization

```tsx
// src/views/blog/ui/BlogPage.tsx — Server Component
// No "use client" directive — runs on server
import { db } from "@/shared/lib/db"; // hypothetical DB client

export async function BlogPage() {
  // Direct DB call — no API needed!
  const posts = await db.post.findMany({ where: { published: true } });
  
  return (
    <div>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
```

### When to use Client Components ("use client")
- Components with `useState`, `useEffect`, `useRef`
- Components that use Redux (`useAppSelector`, `useAppDispatch`)
- Components that use TanStack Query hooks
- Event handlers, forms, interactive UI

```tsx
// src/features/create-post/ui/CreatePostForm.tsx
"use client"; // ← needed because we use hooks and events

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
// ...
```

**Rule of thumb:** Start without `"use client"`. Add it only when you see an error saying it's required.
