export const APP_CONFIG = {
  name: "FSD Template",
  version: "0.1.0",
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "/api",
} as const;
