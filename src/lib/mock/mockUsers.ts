export interface MockUser {
  username: string;
  password: string;
  role: "support-worker" | "client" | "admin";
  displayName: string;
}

export const mockUsers: MockUser[] = [
  {
    username: "support",
    password: "demo123",
    role: "support-worker",
    displayName: "Support Worker",
  },
  {
    username: "admin",
    password: "admin123",
    role: "admin",
    displayName: "Admin User",
  },
];
