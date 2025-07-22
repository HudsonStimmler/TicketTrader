-- Create database if it doesn't exist
CREATE DATABASE ticket_trader;
CREATE DATABASE ticket_trader_test;

-- Create extensions
\c ticket_trader;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c ticket_trader_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";