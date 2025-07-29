import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '@shared/schema';

// Configure Neon with WebSocket and connection pooling
neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;
neonConfig.useSecureWebSocket = true;

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL must be set. Did you forget to provision a database?'
  );
}

// Configure connection pool with proper settings for serverless
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,                 // Reduced max connections to prevent overload
  min: 1,                 // Maintain at least 1 connection
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 10000,
  maxLifetime: 300000,    // 5 minutes max connection lifetime
  statementTimeout: 60000 // 60 second statement timeout
});

// Create the Drizzle client
export const db = drizzle({ client: pool, schema });

// Database health check and initialization
export async function initializeDatabase(): Promise<boolean> {
  try {
    console.log('Testing database connection...');
    await db.execute(`SELECT 1 as test`);
    console.log('Database connection test successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);

    // Attempt recovery
    try {
      console.log('Attempting database connection recovery...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      await db.execute(`SELECT 1 as test`);
      console.log('Database connection recovery successful');
      return true;
    } catch (retryError) {
      console.error('Database connection recovery failed:', retryError);
      return false;
    }
  }
}
