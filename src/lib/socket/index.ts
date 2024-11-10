import io from 'socket.io-client';
import type { SocketInstance } from './types';

class SocketService {
  private static instance: SocketInstance | null = null;

  private constructor() {} // Private constructor to prevent direct construction calls

  public static getInstance(): SocketInstance {
    if (!this.instance) {
      this.instance = io(process.env.NEXT_PUBLIC_OPENAI_URL || '', {
        reconnectionDelay: 1000,
        reconnection: true,
        reconnectionAttempts: 10,
        transports: ['websocket'],
        agent: false,
        upgrade: false,
        rejectUnauthorized: false
      }) as SocketInstance;
    }
    return this.instance;
  }

  public static cleanup(): void {
    if (this.instance) {
      this.instance.disconnect();
      this.instance = null;
    }
  }
}

export const getSocket = (): SocketInstance => {
  return SocketService.getInstance();
};