export interface DemoUser {
  id: string;
  name: string;
  email: string;
  username: string;
  password: string;
  role: "support-worker" | "admin";
  active: boolean;
  createdAt: string;
}

const USERS_STORAGE_KEY = "supportlens_demo_users";

class UserStore {
  private getUsers(): DemoUser[] {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    if (!stored) {
      // Initialize with default users
      const defaultUsers: DemoUser[] = [
        {
          id: "1",
          name: "Support Worker",
          email: "support@demo.com",
          username: "support",
          password: "demo123",
          role: "support-worker",
          active: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Admin User",
          email: "admin@demo.com",
          username: "admin",
          password: "admin123",
          role: "admin",
          active: true,
          createdAt: new Date().toISOString(),
        },
      ];
      this.saveUsers(defaultUsers);
      return defaultUsers;
    }
    return JSON.parse(stored);
  }

  private saveUsers(users: DemoUser[]): void {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }

  listAll(): DemoUser[] {
    return this.getUsers();
  }

  getById(id: string): DemoUser | null {
    const users = this.getUsers();
    return users.find(u => u.id === id) || null;
  }

  getByUsername(username: string): DemoUser | null {
    const users = this.getUsers();
    return users.find(u => u.username === username) || null;
  }

  add(user: Omit<DemoUser, "id" | "createdAt">): DemoUser {
    const users = this.getUsers();
    const newUser: DemoUser = {
      ...user,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }

  update(id: string, updates: Partial<Omit<DemoUser, "id" | "createdAt">>): DemoUser | null {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;
    
    users[index] = { ...users[index], ...updates };
    this.saveUsers(users);
    return users[index];
  }

  remove(id: string): boolean {
    const users = this.getUsers();
    const filtered = users.filter(u => u.id !== id);
    if (filtered.length === users.length) return false;
    this.saveUsers(filtered);
    return true;
  }

  toggleActive(id: string): DemoUser | null {
    const user = this.getById(id);
    if (!user) return null;
    return this.update(id, { active: !user.active });
  }
}

export const userStore = new UserStore();
