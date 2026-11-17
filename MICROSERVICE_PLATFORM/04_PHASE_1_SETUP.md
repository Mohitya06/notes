# Phase 1: Initial Setup & Infrastructure

## Phase 1 Objectives
1. Initialize monorepo structure
2. Set up development environment
3. Create shared utilities
4. Set up API Gateway
5. Configure Docker and docker-compose
6. Set up CI/CD pipeline basics

**Timeline:** 1-2 weeks

## Step 1.1: Initialize Monorepo

### Create Root Directory and Package.json

```bash
# Create directory structure
mkdir -p microservice-platform
cd microservice-platform

# Initialize root package.json
npm init -y

# Install workspace management tools
npm install -D lerna
npm install -D @monorepo/scripts
```

### Root package.json

```json
{
  "name": "microservice-platform",
  "version": "1.0.0",
  "description": "Complete microservice platform",
  "private": true,
  "workspaces": [
    "services/*",
    "shared/*"
  ],
  "scripts": {
    "install-all": "npm install",
    "dev": "npm run dev --workspaces",
    "test": "npm run test --workspaces",
    "lint": "npm run lint --workspaces",
    "build": "npm run build --workspaces",
    "docker:build": "docker-compose build",
    "docker:up": "docker-compose up",
    "docker:down": "docker-compose down"
  },
  "devDependencies": {
    "eslint": "^8.42.0",
    "prettier": "^2.8.8"
  }
}
```

## Step 1.2: Create Folder Structure

```bash
# Create directories
mkdir -p services/{api-gateway,user-service,order-service,payment-service,notification-service}
mkdir -p shared/{logger,middleware,constants,utils}
mkdir -p infrastructure/{docker,kubernetes,monitoring,scripts}
mkdir -p docs
mkdir -p tests/{integration,e2e}

# Create initial files
touch .env.example
touch .gitignore
touch docker-compose.yml
touch docker-compose.prod.yml
touch README.md
touch CONTRIBUTING.md
```

## Step 1.3: Setup .gitignore

```bash
# .gitignore
node_modules/
dist/
build/
.env
.env.local
.env.*.local
*.log
logs/
.DS_Store
Thumbs.db
.vscode/settings.json
.idea/
*.swp
*.swo
coverage/
.nyc_output/
```

## Step 1.4: Create Shared Utilities

### Shared Logger

```bash
# Create shared logger package
mkdir -p shared/logger/src
cd shared/logger

npm init -y
npm install winston dotenv
```

**shared/logger/src/index.js**
```javascript
const winston = require('winston');
require('dotenv').config();

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: {
    service: process.env.SERVICE_NAME || 'microservice'
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

module.exports = logger;
```

**shared/logger/package.json**
```json
{
  "name": "@platform/logger",
  "version": "1.0.0",
  "main": "src/index.js",
  "dependencies": {
    "winston": "^3.8.2"
  }
}
```

### Shared Middleware

```bash
# Create shared middleware package
mkdir -p shared/middleware/src
cd shared/middleware

npm init -y
npm install jsonwebtoken cors helmet express-rate-limit joi dotenv
```

**shared/middleware/src/index.js**
```javascript
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const logger = require('@platform/logger');

// Auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Token verification failed', { error: error.message });
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    status: err.status || 500
  });
};

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests'
});

// CORS setup
const corsSetup = cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
});

// Request logger
const requestLogger = (req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  next();
};

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      logger.warn('Validation error', { errors: error.details });
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    
    req.validated = value;
    next();
  };
};

module.exports = {
  authMiddleware,
  errorHandler,
  limiter,
  corsSetup,
  requestLogger,
  validate
};
```

## Step 1.5: Setup API Gateway

```bash
# Create API Gateway service
mkdir -p services/api-gateway/src
cd services/api-gateway

npm init -y
npm install express axios dotenv @platform/logger @platform/middleware
npm install -D nodemon jest supertest
```

**services/api-gateway/src/app.js**
```javascript
const express = require('express');
const axios = require('axios');
const { corsSetup, limiter, requestLogger, errorHandler, authMiddleware } = require('@platform/middleware');
const logger = require('@platform/logger');

const app = express();

// Middleware
app.use(corsSetup);
app.use(limiter);
app.use(express.json());
app.use(requestLogger);

// Services map
const SERVICES = {
  'user': process.env.USER_SERVICE_URL || 'http://user-service:3001',
  'order': process.env.ORDER_SERVICE_URL || 'http://order-service:3002',
  'payment': process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3003'
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'api-gateway' });
});

// Ready check
app.get('/ready', (req, res) => {
  res.json({ ready: true });
});

// Request forwarding function
const forwardRequest = async (req, res, serviceName, path) => {
  try {
    const serviceUrl = SERVICES[serviceName];
    if (!serviceUrl) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    const response = await axios({
      method: req.method,
      url: `${serviceUrl}${path}`,
      headers: {
        ...req.headers,
        'x-forwarded-from': 'api-gateway',
        'x-user-id': req.user?.id
      },
      data: req.body
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    logger.error('Service forwarding failed', {
      serviceName,
      path,
      error: error.message
    });
    
    res.status(error.response?.status || 500).json({
      error: error.message
    });
  }
};

// Routes
app.post('/api/v1/auth/login', (req, res) => {
  forwardRequest(req, res, 'user', '/api/auth/login');
});

app.post('/api/v1/users', (req, res) => {
  forwardRequest(req, res, 'user', '/api/users');
});

app.get('/api/v1/users/:id', authMiddleware, (req, res) => {
  forwardRequest(req, res, 'user', `/api/users/${req.params.id}`);
});

app.get('/api/v1/orders', authMiddleware, (req, res) => {
  forwardRequest(req, res, 'order', '/api/orders');
});

// Error handler
app.use(errorHandler);

module.exports = app;
```

**services/api-gateway/src/server.js**
```javascript
const app = require('./app');
const logger = require('@platform/logger');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`API Gateway listening on port ${PORT}`);
});
```

**services/api-gateway/.env.example**
```
PORT=3000
LOG_LEVEL=info
SERVICE_NAME=api-gateway
JWT_SECRET=your-secret-key
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

USER_SERVICE_URL=http://user-service:3001
ORDER_SERVICE_URL=http://order-service:3002
PAYMENT_SERVICE_URL=http://payment-service:3003
```

**services/api-gateway/package.json**
```json
{
  "name": "api-gateway",
  "version": "1.0.0",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.0",
    "axios": "^1.4.0",
    "@platform/logger": "*",
    "@platform/middleware": "*"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.5.0",
    "supertest": "^6.3.3"
  }
}
```

## Step 1.6: Docker Setup

**docker-compose.yml** (for local development)
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: postgres
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: microservices
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  rabbitmq:
    image: rabbitmq:3.12-management-alpine
    container_name: rabbitmq
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest

  api-gateway:
    build:
      context: .
      dockerfile: services/api-gateway/Dockerfile
    container_name: api-gateway
    ports:
      - "3000:3000"
    depends_on:
      - redis
    environment:
      NODE_ENV: development
      PORT: 3000
      REDIS_URL: redis://redis:6379
    volumes:
      - ./services/api-gateway:/app
    command: npm run dev

volumes:
  postgres_data:
  redis_data:
```

**services/api-gateway/Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src ./src

EXPOSE 3000

CMD ["node", "src/server.js"]
```

## Step 1.7: Environment Configuration

**Root .env.example**
```
# General
NODE_ENV=development
LOG_LEVEL=info

# API Gateway
API_GATEWAY_PORT=3000
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=24h
REFRESH_TOKEN_SECRET=your-refresh-token-secret

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=microservices

# Redis
REDIS_URL=redis://localhost:6379

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# Services
USER_SERVICE_URL=http://localhost:3001
ORDER_SERVICE_URL=http://localhost:3002
PAYMENT_SERVICE_URL=http://localhost:3003

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# External APIs
STRIPE_KEY=your-stripe-key
MAIL_SERVICE_URL=https://api.mail-service.com
```

## Step 1.8: GitHub Actions CI/CD (Basic)

**.github/workflows/test.yml**
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run tests
        run: npm test
      
      - name: Run linter
        run: npm run lint --workspaces
```

## Step 1.9: Verification Checklist

- [ ] Repository initialized with git
- [ ] Root package.json created with workspaces
- [ ] Folder structure created
- [ ] Shared libraries set up (logger, middleware)
- [ ] API Gateway service created and functional
- [ ] Docker and docker-compose configured
- [ ] .env.example created
- [ ] .gitignore configured
- [ ] GitHub Actions workflow created
- [ ] Can run `npm install` and `docker-compose up`

## Step 1.10: Next Steps

1. Proceed to Phase 2: Create individual microservices
2. Implement database schemas for each service
3. Set up service-to-service communication
4. Implement authentication system

**Duration:** This phase should take 1-2 weeks depending on team size and complexity.
