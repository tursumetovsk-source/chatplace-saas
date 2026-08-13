export * from '@prisma/client';

export interface DatabaseServiceConfig {
  connectionString?: string;
}

export class DatabaseClientMock {
  async connect() {
    console.log('[Database] Connected to PostgreSQL instance');
  }
}
