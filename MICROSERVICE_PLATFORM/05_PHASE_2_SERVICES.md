# Phase 2: Building Individual Microservices

## Phase 2 Objectives
1. Create User Service (Authentication & User Management)
2. Create Order Service
3. Create Payment Service
4. Implement database migrations
5. Set up service-to-service communication
6. Implement event publishing

**Timeline:** 2-3 weeks

---

## Step 2.1: User Service

### Initialize User Service

```bash
mkdir -p services/user-service/src/{controllers,models,routes,services,middleware}
cd services/user-service

npm init -y
npm install express sequelize pg bcryptjs jsonwebtoken dotenv @platform/logger @platform/middleware joi
npm install -D nodemon jest supertest
```

### Database Model

**services/user-service/src/models/User.js**
```javascript
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      defaultValue: 'user'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active'
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      onUpdate: DataTypes.NOW
    }
  }, {
    timestamps: true,
    tableName: 'users'
  });

  // Hash password before saving
  User.beforeCreate(async (user) => {
    user.password = await bcrypt.hash(user.password, 10);
  });

  // Method to compare passwords
  User.prototype.comparePassword = async function(password) {
    return bcrypt.compare(password, this.password);
  };

  return User;
};
```

### Database Configuration

**services/user-service/src/config/database.js**
```javascript
const { Sequelize } = require('sequelize');
const logger = require('@platform/logger');

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT || 5432,
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_NAME || 'microservices',
  logging: (msg) => logger.info(msg)
});

const initializeDatabase = async () => {
  try {
    // Import models
    const User = require('../models/User')(sequelize);
    
    // Sync database
    await sequelize.sync({ alter: true });
    logger.info('Database synchronized');
    
    return { User };
  } catch (error) {
    logger.error('Database initialization failed', { error: error.message });
    throw error;
  }
};

module.exports = { sequelize, initializeDatabase };
```

### User Service Logic

**services/user-service/src/services/userService.js**
```javascript
const logger = require('@platform/logger');

class UserService {
  constructor(User, redisClient) {
    this.User = User;
    this.redis = redisClient;
  }

  async createUser(userData) {
    try {
      const existingUser = await this.User.findOne({ where: { email: userData.email } });
      
      if (existingUser) {
        throw { status: 409, message: 'Email already exists' };
      }

      const user = await this.User.create(userData);
      
      logger.info('User created', { userId: user.id, email: user.email });
      
      // Clear user list cache
      await this.redis.del('users:list');
      
      return this.sanitizeUser(user);
    } catch (error) {
      logger.error('Error creating user', { error: error.message });
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      // Check cache first
      const cached = await this.redis.get(`user:${userId}`);
      if (cached) {
        return JSON.parse(cached);
      }

      const user = await this.User.findByPk(userId);
      
      if (!user) {
        throw { status: 404, message: 'User not found' };
      }

      const sanitized = this.sanitizeUser(user);
      
      // Cache for 1 hour
      await this.redis.setex(`user:${userId}`, 3600, JSON.stringify(sanitized));
      
      return sanitized;
    } catch (error) {
      logger.error('Error fetching user', { userId, error: error.message });
      throw error;
    }
  }

  async updateUser(userId, updateData) {
    try {
      const user = await this.User.findByPk(userId);
      
      if (!user) {
        throw { status: 404, message: 'User not found' };
      }

      await user.update(updateData);
      
      logger.info('User updated', { userId });
      
      // Invalidate cache
      await this.redis.del(`user:${userId}`);
      
      return this.sanitizeUser(user);
    } catch (error) {
      logger.error('Error updating user', { userId, error: error.message });
      throw error;
    }
  }

  async deleteUser(userId) {
    try {
      const user = await this.User.findByPk(userId);
      
      if (!user) {
        throw { status: 404, message: 'User not found' };
      }

      await user.destroy();
      
      logger.info('User deleted', { userId });
      
      // Invalidate cache
      await this.redis.del(`user:${userId}`);
      
      return { message: 'User deleted' };
    } catch (error) {
      logger.error('Error deleting user', { userId, error: error.message });
      throw error;
    }
  }

  async authenticateUser(email, password) {
    try {
      const user = await this.User.findOne({ where: { email } });
      
      if (!user) {
        throw { status: 401, message: 'Invalid credentials' };
      }

      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        throw { status: 401, message: 'Invalid credentials' };
      }

      // Update last login
      await user.update({ lastLogin: new Date() });
      
      logger.info('User authenticated', { userId: user.id, email });
      
      return this.sanitizeUser(user);
    } catch (error) {
      logger.error('Authentication failed', { email, error: error.message });
      throw error;
    }
  }

  sanitizeUser(user) {
    const { password, ...sanitized } = user.toJSON();
    return sanitized;
  }
}

module.exports = UserService;
```

### Controller

**services/user-service/src/controllers/userController.js**
```javascript
const logger = require('@platform/logger');

class UserController {
  constructor(userService) {
    this.userService = userService;
  }

  async register(req, res, next) {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      const user = await this.userService.createUser({
        email,
        password,
        firstName,
        lastName
      });
      
      res.status(201).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const logger = require('@platform/logger');
      const jwt = require('jsonwebtoken');
      
      const user = await this.userService.authenticateUser(email, password);
      
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION || '24h' }
      );
      
      res.json({
        success: true,
        data: user,
        token
      });
    } catch (error) {
      next(error);
    }
  }

  async getUser(req, res, next) {
    try {
      const user = await this.userService.getUserById(req.params.id);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const user = await this.userService.updateUser(req.params.id, req.body);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      await this.userService.deleteUser(req.params.id);
      res.json({ success: true, message: 'User deleted' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
```

### Routes

**services/user-service/src/routes/users.js**
```javascript
const express = require('express');
const Joi = require('joi');
const { validate, authMiddleware } = require('@platform/middleware');

module.exports = (userController) => {
  const router = express.Router();

  // Validation schemas
  const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string(),
    lastName: Joi.string()
  });

  const updateSchema = Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    phone: Joi.string()
  });

  // Routes
  router.post('/register', validate(registerSchema), (req, res, next) => {
    userController.register(req, res, next);
  });

  router.post('/login', validate(Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  })), (req, res, next) => {
    userController.login(req, res, next);
  });

  router.get('/:id', authMiddleware, (req, res, next) => {
    userController.getUser(req, res, next);
  });

  router.patch('/:id', authMiddleware, validate(updateSchema), (req, res, next) => {
    userController.updateUser(req, res, next);
  });

  router.delete('/:id', authMiddleware, (req, res, next) => {
    userController.deleteUser(req, res, next);
  });

  return router;
};
```

### Application Setup

**services/user-service/src/app.js**
```javascript
const express = require('express');
const { corsSetup, requestLogger, errorHandler, limiter } = require('@platform/middleware');
const logger = require('@platform/logger');

module.exports = (userService, userController) => {
  const app = express();

  // Middleware
  app.use(corsSetup);
  app.use(limiter);
  app.use(express.json());
  app.use(requestLogger);

  // Health checks
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'user-service' });
  });

  app.get('/ready', (req, res) => {
    res.json({ ready: true });
  });

  // Routes
  app.use('/api/users', require('./routes/users')(userController));
  app.use('/api/auth', require('./routes/users')(userController));

  // Error handler
  app.use(errorHandler);

  return app;
};
```

### Server Entry Point

**services/user-service/src/server.js**
```javascript
const logger = require('@platform/logger');
const { initializeDatabase } = require('./config/database');
const redis = require('redis');
const createApp = require('./app');
const UserService = require('./services/userService');
const UserController = require('./controllers/userController');

const PORT = process.env.PORT || 3001;

const start = async () => {
  try {
    // Initialize database
    const { User } = await initializeDatabase();
    
    // Initialize Redis
    const redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    await redisClient.connect();
    
    // Initialize services and controllers
    const userService = new UserService(User, redisClient);
    const userController = new UserController(userService);
    
    // Create app
    const app = createApp(userService, userController);
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`User Service listening on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start User Service', { error: error.message });
    process.exit(1);
  }
};

start();
```

---

## Step 2.2: Order Service

### Basic Structure

```bash
mkdir -p services/order-service/src/{controllers,models,routes,services}
cd services/order-service
npm init -y
npm install express sequelize pg dotenv @platform/logger @platform/middleware joi
npm install -D nodemon jest supertest
```

### Order Model

**services/order-service/src/models/Order.js**
```javascript
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'),
      defaultValue: 'pending'
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    items: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: []
    },
    shippingAddress: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true,
    tableName: 'orders'
  });

  return Order;
};
```

---

## Step 2.3: Service-to-Service Communication

### HTTP Client Service

**services/order-service/src/services/userServiceClient.js**
```javascript
const axios = require('axios');
const logger = require('@platform/logger');

class UserServiceClient {
  constructor() {
    this.userServiceUrl = process.env.USER_SERVICE_URL || 'http://user-service:3001';
    this.client = axios.create({ timeout: 5000 });
  }

  async getUser(userId, token) {
    try {
      const response = await this.client.get(
        `${this.userServiceUrl}/api/users/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.data;
    } catch (error) {
      logger.error('Error fetching user from user-service', { userId, error: error.message });
      throw error;
    }
  }

  async verifyUser(userId) {
    try {
      const response = await this.client.get(
        `${this.userServiceUrl}/api/users/${userId}`
      );
      return response.data.data;
    } catch (error) {
      logger.error('Error verifying user', { userId, error: error.message });
      return null;
    }
  }
}

module.exports = UserServiceClient;
```

---

## Step 2.4: Event Publishing

### RabbitMQ Event Publisher

**services/order-service/src/services/eventPublisher.js**
```javascript
const amqp = require('amqplib');
const logger = require('@platform/logger');

class EventPublisher {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    try {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672');
      this.channel = await this.connection.createChannel();
      logger.info('Connected to RabbitMQ');
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ', { error: error.message });
      throw error;
    }
  }

  async publishEvent(eventType, eventData) {
    try {
      const exchange = 'events';
      const routingKey = `order.${eventType}`;
      
      // Declare exchange
      await this.channel.assertExchange(exchange, 'topic', { durable: true });
      
      // Publish message
      this.channel.publish(
        exchange,
        routingKey,
        Buffer.from(JSON.stringify({
          type: eventType,
          timestamp: new Date(),
          data: eventData
        }))
      );
      
      logger.info('Event published', { eventType, routingKey });
    } catch (error) {
      logger.error('Failed to publish event', { eventType, error: error.message });
      throw error;
    }
  }

  async close() {
    await this.channel.close();
    await this.connection.close();
  }
}

module.exports = EventPublisher;
```

---

## Step 2.5: Package.json for Each Service

```json
{
  "name": "order-service",
  "version": "1.0.0",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.0",
    "sequelize": "^6.32.0",
    "pg": "^8.11.0",
    "axios": "^1.4.0",
    "amqplib": "^0.10.3",
    "dotenv": "^16.0.3",
    "@platform/logger": "*",
    "@platform/middleware": "*",
    "joi": "^17.9.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.5.0",
    "supertest": "^6.3.3"
  }
}
```

## Step 2.6: Environment Configuration

**services/order-service/.env.example**
```
NODE_ENV=development
PORT=3002
LOG_LEVEL=info

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=microservices

REDIS_URL=redis://localhost:6379

USER_SERVICE_URL=http://localhost:3001
PAYMENT_SERVICE_URL=http://localhost:3003

RABBITMQ_URL=amqp://guest:guest@localhost:5672

JWT_SECRET=your-secret-key
```

## Step 2.7: Verification Checklist

- [ ] User Service created and functional
- [ ] Order Service created
- [ ] Payment Service created (basic structure)
- [ ] Database models configured
- [ ] Service-to-service HTTP communication working
- [ ] RabbitMQ event publishing setup
- [ ] All services have health check endpoints
- [ ] Docker images build successfully
- [ ] Services can communicate via docker-compose
- [ ] Redis caching implemented in User Service

## Step 2.8: Testing Services Locally

```bash
# Start all services
docker-compose up

# Test User Service
curl -X POST http://localhost:3000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"John"}'

# Get user
curl http://localhost:3000/api/v1/users/[user-id] \
  -H "Authorization: Bearer [token]"
```

**Duration:** This phase should take 2-3 weeks depending on complexity and number of services.
