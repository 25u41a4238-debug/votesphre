import { Response } from 'express';

interface SSEClient {
  id: string;
  res: Response;
  userId?: string;
  role?: string;
}

class SSEManager {
  private clients: SSEClient[] = [];

  public addClient(client: SSEClient) {
    this.clients.push(client);
    // Send welcome heartbeat
    client.res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clientId: client.id })}\n\n`);
  }

  public removeClient(id: string) {
    this.clients = this.clients.filter(c => c.id !== id);
  }

  public broadcast(event: { type: string; payload?: any }) {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    this.clients.forEach(c => {
      try {
        c.res.write(data);
      } catch (err) {
        console.error('Failed to send SSE to client', c.id, err);
      }
    });
  }

  public sendToUser(userId: string, event: { type: string; payload?: any }) {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    this.clients.filter(c => c.userId === userId).forEach(c => {
      try {
        c.res.write(data);
      } catch (err) {
        console.error('Failed to send targeted SSE', err);
      }
    });
  }
}

export const sseManager = new SSEManager();
