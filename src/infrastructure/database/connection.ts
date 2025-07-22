import knex, { Knex } from 'knex';
import * as dotenv from 'dotenv';

dotenv.config();

const config: Knex.Config = {
  client: 'postgresql',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'ticket_trader'
  },
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: './src/infrastructure/database/migrations'
  },
  seeds: {
    directory: './src/infrastructure/database/seeds'
  }
};

export const db = knex(config);

export async function connectDatabase(): Promise<void> {
  try {
    // Test the connection
    await db.raw('SELECT 1');
    console.log('Database connection established');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  await db.destroy();
}

export default config;