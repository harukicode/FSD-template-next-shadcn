export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type ID = string | number;

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
