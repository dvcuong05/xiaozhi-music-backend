import fs from 'node:fs';
import path from 'node:path';
import { inspect } from 'node:util';

class Logger {
  private get logPath() {
    return path.resolve('app.log');
  }

  log(level: 'info' | 'error' | 'warning' | 'debug', data: unknown) {
    if (process.env.NODE_ENV === 'development') {
      const date = new Date().toLocaleString();
      const message = inspect(data, true, Number.POSITIVE_INFINITY, false);
      fs.appendFileSync(this.logPath, `${date} [${level.toLocaleLowerCase()}] ${message}\n`);
    }
    console.error(`[${level.toUpperCase()}]`, data);
  }

  info(data: unknown) {
    this.log('info', data);
  }

  error(data: unknown) {
    this.log('error', data);
  }

  warn(data: unknown) {
    this.log('warning', data);
  }

  debug(data: unknown) {
    this.log('debug', data);
  }
}

export const logger = new Logger();
