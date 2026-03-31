import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import type { User } from "../model/types";

export const userKeys = {
  all: ["users"] as const,
  detail: (id: number) => ["users", id] as const,
};

export function useUser(id: number) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<User>(`/users/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useUsers() {
  return useQuery({
    queryKey: userKeys.all,
    queryFn: async () => {
      const { data } = await apiClient.get<User[]>("/users");
      return data;
    },
  });
}
