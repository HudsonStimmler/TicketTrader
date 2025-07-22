import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import * as dotenv from 'dotenv';

import { connectDatabase } from './infrastructure/database/connection';
import { connectRedis } from './infrastructure/cache/redis';
import { errorHandler } from './app/middleware/errorHandler';
import { notFoundHandler } from './app/middleware/notFoundHandler';
import routes from './app/routes';
import { logger } from './shared/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Basic middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', routes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    // Initialize database connection
    await connectDatabase();
    logger.info('Database connected successfully');

    // Initialize Redis connection
    await connectRedis();
    logger.info('Redis connected successfully');

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Health check available at http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();