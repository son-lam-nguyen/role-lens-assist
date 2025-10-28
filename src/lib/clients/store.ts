export type RiskLevel = 'low' | 'moderate' | 'high';

export interface Client {
  id: string;
  name: string;
  age: number;
  gender: string;
  contact: string;
  notes: string;
  riskLevel: RiskLevel;
  assignedWorker: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'supportlens_clients';

class ClientStore {
  private getClients(): Client[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveClients(clients: Client[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  }

  listAll(): Client[] {
    return this.getClients();
  }

  getById(id: string): Client | undefined {
    return this.getClients().find(c => c.id === id);
  }

  add(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Client {
    const clients = this.getClients();
    const newClient: Client = {
      ...client,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    clients.push(newClient);
    this.saveClients(clients);
    return newClient;
  }

  update(id: string, updates: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>): Client | null {
    const clients = this.getClients();
    const index = clients.findIndex(c => c.id === id);
    if (index === -1) return null;

    clients[index] = {
      ...clients[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveClients(clients);
    return clients[index];
  }

  remove(id: string): boolean {
    const clients = this.getClients();
    const filtered = clients.filter(c => c.id !== id);
    if (filtered.length === clients.length) return false;
    this.saveClients(filtered);
    return true;
  }
}

export const clientStore = new ClientStore();
