export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  role: "admin" | "user" | "guest";
  createdAt: string;
}
