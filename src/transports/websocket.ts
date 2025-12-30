import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import WebSocket from 'ws';
import { logger } from '../utils/logger.js';

export class WebSocketClientTransport implements Transport {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 5000;

  constructor(private url: string) {}

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        logger.info(`🔌 Initiating WebSocket connection to: ${this.url}`);
        this.ws = new WebSocket(this.url);

        this.ws.on('open', () => {
          logger.info('✅ WebSocket connection established successfully');
          this.reconnectAttempts = 0;
          resolve();
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          try {
            const message = JSON.parse(data.toString()) as JSONRPCMessage;
            logger.info(`📩 Received message: ${JSON.stringify(message).substring(0, 100)}...`);
            this.onmessage?.(message);
          } catch (error) {
            logger.error(`❌ Failed to parse message: ${error}`);
          }
        });

        this.ws.on('close', () => {
          logger.warn('WebSocket connection closed');
          this.onclose?.();
          this.attemptReconnect();
        });

        this.ws.on('error', (error) => {
          logger.error(`WebSocket error: ${error.message}`);
          this.onerror?.(error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    logger.info(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      this.start().catch((error) => {
        logger.error(`Reconnection failed: ${error.message}`);
      });
    }, this.reconnectDelay);
  }

  async send(message: JSONRPCMessage): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    return new Promise((resolve, reject) => {
      this.ws!.send(JSON.stringify(message), (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async close(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Properties required by Transport interface
  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;
}
