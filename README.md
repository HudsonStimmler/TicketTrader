# Ticket Trader

A marketplace platform for trading event tickets with automated valuation and matching capabilities.

## Project Setup

This project has been initialized with the core infrastructure including:

- **Node.js + TypeScript**: Modern JavaScript development with type safety
- **Express.js**: Web framework with security middleware (helmet, cors)
- **PostgreSQL**: Primary database with Knex.js for migrations
- **Redis**: Caching and session storage
- **Docker**: Containerized development and deployment
- **Jest**: Testing framework with TypeScript support

## Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your database and Redis credentials

### Development

Start the development server:
```bash
npm run dev
```

Build the project:
```bash
npm run build
```

Run tests:
```bash
npm test
```

### Docker Development

Start all services with Docker Compose:
```bash
docker-compose up
```

This will start:
- Application server on port 3000
- PostgreSQL on port 5432
- Redis on port 6379

### Database Migrations

Run migrations:
```bash
npm run migrate
```

Create new migration:
```bash
npm run migrate:make migration_name
```

Rollback migrations:
```bash
npm run migrate:rollback
```

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /api` - API information

## Project Structure

```
src/
├── app/                    # Application layer
│   ├── controllers/        # HTTP request handlers
│   ├── middleware/         # Application-specific middleware
│   ├── routes/            # Route definitions
│   └── validators/        # Request validation schemas
├── core/                  # Core business logic
│   ├── entities/          # Domain entities/models
│   ├── services/          # Business logic services
│   ├── repositories/      # Data access interfaces
│   └── types/            # TypeScript type definitions
├── infrastructure/        # External concerns
│   ├── database/          # Database configuration and migrations
│   ├── cache/            # Redis configuration
│   └── external/         # External API clients
├── shared/               # Shared utilities
│   ├── utils/            # Utility functions
│   ├── constants/        # Application constants
│   ├── errors/           # Custom error classes
│   └── logger/           # Logging configuration
└── server.ts             # Application entry point
```

## Next Steps

The foundation is ready for implementing:
1. Data models and database schema
2. Authentication and user management
3. Ticket management services
4. Trading engine and marketplace
5. Payment processing
6. Frontend React application

See the implementation plan in `.kiro/specs/ticket-trader/tasks.md` for detailed next steps.