# Adding a New Feature: Step-by-Step

This guide walks you through adding a complete new feature to the application. We'll build **"Create Post"** as a real example.

---

## Scenario

We're building a blog. Users can create posts. A post has a title, content, and an author.

---

## Step 1: Define the Entity

If `Post` doesn't exist yet, create it in the entities layer.

```
src/entities/post/
  model/
    types.ts
    postSlice.ts
  api/
    postApi.ts
  ui/
    PostCard.tsx
  index.ts
```

### types.ts

```ts
// src/entities/post/model/types.ts
export interface Post {
  id: number;
  title: string;
  content: string;
  authorId: number;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  published: boolean;
}

export type CreatePostDto = Omit<Post, "id" | "createdAt" | "updatedAt" | "authorName">;
```

### postSlice.ts

```ts
// src/entities/post/model/postSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Post } from "./types";

interface PostState {
  selectedPostId: number | null;
}

const initialState: PostState = {
  selectedPostId: null,
};

const postSlice = createSlice({
  name: "post",
  initialState,
  reducers: {
    selectPost(state, action: PayloadAction<number | null>) {
      state.selectedPostId = action.payload;
    },
  },
});

export const { selectPost } = postSlice.actions;
export const postReducer = postSlice.reducer;
```

### postApi.ts

```ts
// src/entities/post/api/postApi.ts
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import type { Post } from "../model/types";

export const postKeys = {
  all: ["posts"] as const,
  lists: () => [...postKeys.all, "list"] as const,
  detail: (id: number) => [...postKeys.all, "detail", id] as const,
};

export function usePosts() {
  return useQuery({
    queryKey: postKeys.lists(),
    queryFn: async () => {
      const { data } = await apiClient.get<Post[]>("/posts");
      return data;
    },
  });
}

export function usePost(id: number) {
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<Post>(`/posts/${id}`);
      return data;
    },
    enabled: !!id,
  });
}
```

### PostCard.tsx

```tsx
// src/entities/post/ui/PostCard.tsx
import { Calendar, User } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui";
import type { Post } from "../model/types";

interface PostCardProps {
  post: Post;
  onClick?: () => void;
}

export function PostCard({ post, onClick }: PostCardProps) {
  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <CardHeader>
        <CardTitle className="line-clamp-2">{post.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-3 text-sm text-muted-foreground">{post.content}</p>
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {post.authorName}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(post.createdAt).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
```

### index.ts (public API)

```ts
// src/entities/post/index.ts
export { PostCard } from "./ui/PostCard";
export { postReducer, selectPost } from "./model/postSlice";
export { usePosts, usePost, postKeys } from "./api/postApi";
export type { Post, CreatePostDto } from "./model/types";
```

### Register reducer in store

```ts
// src/shared/store/index.ts
import { postReducer } from "@/entities/post/model/postSlice";

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    user: userReducer,
    post: postReducer,  // ← add this
  },
});
```

---

## Step 2: Create the Feature

Now build the "create post" feature.

```
src/features/create-post/
  model/
    createPostSlice.ts
  ui/
    CreatePostForm.tsx
  index.ts
```

### createPostSlice.ts

This slice manages the **form state and submission state** — not the posts list itself:

```ts
// src/features/create-post/model/createPostSlice.ts
import { createSlice } from "@reduxjs/toolkit";

interface CreatePostState {
  isDialogOpen: boolean;
}

const initialState: CreatePostState = {
  isDialogOpen: false,
};

const createPostSlice = createSlice({
  name: "createPost",
  initialState,
  reducers: {
    openDialog(state) { state.isDialogOpen = true; },
    closeDialog(state) { state.isDialogOpen = false; },
  },
});

export const { openDialog, closeDialog } = createPostSlice.actions;
export const createPostReducer = createPostSlice.reducer;
```

### CreatePostForm.tsx

```tsx
// src/features/create-post/ui/CreatePostForm.tsx
"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppDispatch } from "@/shared/hooks";
import { apiClient } from "@/shared/api";
import { Button } from "@/shared/ui";
import { postKeys } from "@/entities/post";
import type { CreatePostDto } from "@/entities/post";
import { closeDialog } from "../model/createPostSlice";

export function CreatePostForm() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const createPost = useMutation({
    mutationFn: async (dto: CreatePostDto) => {
      const { data } = await apiClient.post("/posts", dto);
      return data;
    },
    onSuccess: () => {
      // Refresh the posts list
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      dispatch(closeDialog());
      setTitle("");
      setContent("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPost.mutate({
      title,
      content,
      authorId: 1, // Get from auth state in a real app
      published: false,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="text-sm font-medium">Title</label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Post title"
          required
        />
      </div>
      <div>
        <label htmlFor="content" className="text-sm font-medium">Content</label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          rows={5}
          placeholder="Write your post..."
          required
        />
      </div>
      {createPost.isError && (
        <p className="text-sm text-destructive">Failed to create post. Try again.</p>
      )}
      <Button type="submit" disabled={createPost.isPending}>
        {createPost.isPending ? "Creating..." : "Create Post"}
      </Button>
    </form>
  );
}
```

### feature index.ts

```ts
// src/features/create-post/index.ts
export { CreatePostForm } from "./ui/CreatePostForm";
export { createPostReducer, openDialog, closeDialog } from "./model/createPostSlice";
```

---

## Step 3: Add to Store

```ts
// src/shared/store/index.ts
import { createPostReducer } from "@/features/create-post/model/createPostSlice";

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    user: userReducer,
    post: postReducer,
    createPost: createPostReducer,  // ← add
  },
});
```

---

## Step 4: Use in a Widget or Page

If the form appears in a modal/dialog across multiple pages, make it a widget:

```tsx
// src/widgets/create-post-dialog/ui/CreatePostDialog.tsx
"use client";

import { useAppDispatch, useAppSelector } from "@/shared/hooks";
import { Button } from "@/shared/ui";
import { CreatePostForm } from "@/features/create-post";
import { openDialog, closeDialog } from "@/features/create-post";

export function CreatePostDialog() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((s) => s.createPost.isDialogOpen);

  return (
    <>
      <Button onClick={() => dispatch(openDialog())}>
        New Post
      </Button>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg bg-background p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Create New Post</h2>
              <button onClick={() => dispatch(closeDialog())}>✕</button>
            </div>
            <CreatePostForm />
          </div>
        </div>
      )}
    </>
  );
}
```

---

## Summary: The Pattern

1. **Entity** (`entities/post/`) — type, basic state, API hooks, display component
2. **Feature** (`features/create-post/`) — form, mutation, interaction state
3. **Register reducer** in `shared/store/index.ts`
4. **Widget** (optional) — combine if reused across multiple pages
5. **Page** — compose everything together

This pattern ensures that when you need to modify "create post", you know exactly where to look and what to change.
