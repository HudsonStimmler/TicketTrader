import { createClient, RedisClientType } from 'redis';
import * as dotenv from 'dotenv';

dotenv.config();

let redisClient: RedisClientType;

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0')
};

export async function connectRedis(): Promise<RedisClientType> {
  try {
    const clientConfig: any = {
      socket: {
        host: redisConfig.host,
        port: redisConfig.port
      },
      database: redisConfig.db
    };

    if (redisConfig.password) {
      clientConfig.password = redisConfig.password;
    }

    redisClient = createClient(clientConfig);

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis client connected');
    });

    redisClient.on('ready', () => {
      console.log('Redis client ready');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('Redis connection failed:', error);
    throw error;
  }
}

export function getRedisClient(): RedisClientType {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
  }
}