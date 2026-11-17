# Node.js & Express - Level 2 (Intermediate)

## 1. What is Authentication vs Authorization?
**Answer:**
**Authentication:** Verifying who you are
**Authorization:** Verifying what you can do

```javascript
// JWT Authentication
const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Authorization - check role
function authorize(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// Usage
app.post('/login', (req, res) => {
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  res.json({ token });
});

app.get('/admin', authenticate, authorize('admin'), (req, res) => {
  res.json({ message: 'Admin panel' });
});
```

---

## 2. What is CORS (Cross-Origin Resource Sharing)?
**Answer:**
Allows restricted resources on server to be requested from different origin.

```javascript
const cors = require('cors');

// Simple CORS
app.use(cors());

// Configured CORS
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// Route-specific CORS
app.get('/api/data', cors(), (req, res) => {
  res.json({ data: 'public' });
});
```

---

## 3. What is Validation and Sanitization?
**Answer:**
Validation: Check data is correct format
Sanitization: Clean data to prevent attacks

```javascript
const { body, validationResult } = require('express-validator');

app.post('/users', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).trim(),
  body('name').notEmpty().escape()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  // Process valid data
  const { email, password, name } = req.body;
  // Create user...
});
```

---

## 4. What is Database Connection Pooling?
**Answer:**
Reuse database connections instead of creating new ones.

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  user: 'user',
  password: 'password',
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  max: 20, // Max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// Reuse connections
async function query(sql, params) {
  const client = await pool.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}

// Usage
const result = await query('SELECT * FROM users WHERE id = $1', [1]);
```

---

## 5. What is ORM (Object-Relational Mapping)?
**Answer:**
Maps database tables to programming objects.

**Popular ORMs:**
- Mongoose (MongoDB)
- TypeORM (SQL databases)
- Sequelize (SQL databases)

```javascript
// Using Mongoose
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: { type: String, default: 'user' }
});

const User = mongoose.model('User', userSchema);

// Usage
const user = new User({ name: 'John', email: 'john@example.com' });
await user.save();

const users = await User.find({ role: 'admin' });
await User.findByIdAndUpdate(id, { role: 'user' });
```

---

## 6. What is Caching Strategies?
**Answer:**
Store frequently accessed data to reduce database queries.

**In-Memory Caching (Redis):**
```javascript
const redis = require('redis');
const client = redis.createClient();

async function getUser(id) {
  const cached = await client.get(`user:${id}`);
  if (cached) return JSON.parse(cached);
  
  const user = await User.findById(id);
  await client.setEx(`user:${id}`, 3600, JSON.stringify(user));
  return user;
}
```

**HTTP Caching:**
```javascript
app.get('/api/data', (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600');
  res.json({ data: 'cached for 1 hour' });
});
```

**Query Result Caching:**
```javascript
const cache = new Map();

function getCachedData(key, fetcher, ttl = 3600000) {
  if (cache.has(key)) {
    const { data, timestamp } = cache.get(key);
    if (Date.now() - timestamp < ttl) {
      return data;
    }
  }
  
  const data = fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

---

## 7. What is Pagination?
**Answer:**
Split large datasets into pages.

```javascript
app.get('/users', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  const total = await User.countDocuments();
  const users = await User.find().skip(skip).limit(limit);
  
  res.json({
    data: users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// Usage: /users?page=2&limit=20
```

---

## 8. What are Transactions?
**Answer:**
Multiple operations executed as single atomic unit.

```javascript
// MongoDB Transaction
const session = await mongoose.startSession();
session.startTransaction();

try {
  await User.updateOne({ _id: userId }, { balance: -100 }, { session });
  await User.updateOne({ _id: otherId }, { balance: +100 }, { session });
  
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  await session.endSession();
}
```

---

## 9. What is NestJS Framework?
**Answer:**
Progressive Node.js framework for building scalable server-side applications.

```javascript
// NestJS Controller
import { Controller, Get, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}
  
  @Get()
  async getUsers() {
    return this.userService.findAll();
  }
  
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }
}

// NestJS Service
@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}
  
  async findAll() {
    return this.repo.find();
  }
  
  async create(dto: CreateUserDto) {
    const user = this.repo.create(dto);
    return this.repo.save(user);
  }
}

// NestJS Module
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {}
```

**Features:**
- Dependency injection
- Decorators
- Pipes for validation
- Guards for authorization
- Interceptors for transformation

---

## 10. What is Microservices Architecture?
**Answer:**
Application built as collection of loosely coupled services.

```javascript
// User Service
const userApp = express();
userApp.get('/users/:id', (req, res) => {
  res.json({ id: req.params.id, name: 'John' });
});
userApp.listen(3001);

// Order Service
const orderApp = express();
orderApp.get('/orders', async (req, res) => {
  // Call user service
  const user = await fetch('http://localhost:3001/users/1');
  res.json({ orders: [], user });
});
orderApp.listen(3002);

// API Gateway
const gateway = express();
gateway.use('/users', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true
}));
gateway.use('/orders', createProxyMiddleware({
  target: 'http://localhost:3002',
  changeOrigin: true
}));
gateway.listen(3000);
```

**Advantages:**
- Independent scaling
- Technology diversity
- Easy deployment
- Fault isolation

**Disadvantages:**
- Complex debugging
- Network latency
- Data consistency

---

## 11. What is Message Queue (RabbitMQ, Kafka)?
**Answer:**
Asynchronous communication between services.

**RabbitMQ Example:**
```javascript
const amqp = require('amqplib');

// Producer
async function sendMessage() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();
  
  const queue = 'tasks';
  await channel.assertQueue(queue);
  channel.sendToQueue(queue, Buffer.from('Task data'));
  
  await connection.close();
}

// Consumer
async function consumeMessage() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();
  
  const queue = 'tasks';
  await channel.assertQueue(queue);
  
  channel.consume(queue, (msg) => {
    console.log('Received:', msg.content.toString());
    channel.ack(msg); // Acknowledge
  });
}
```

---

## 12. What is Webhook?
**Answer:**
HTTP callbacks for real-time events.

```javascript
// Sender
app.post('/events/payment', async (req, res) => {
  const paymentData = req.body;
  
  // Send webhook to all subscribers
  const webhooks = await Webhook.find({ event: 'payment' });
  
  for (const webhook of webhooks) {
    try {
      await fetch(webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });
    } catch (error) {
      console.error('Webhook failed:', error);
    }
  }
  
  res.json({ success: true });
});

// Receiver
app.post('/webhook/payment', (req, res) => {
  const paymentData = req.body;
  console.log('Payment received:', paymentData);
  res.json({ received: true });
});
```

---

## 13. What is Rate Limiting?
**Answer:**
Control request rate to prevent abuse.

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests
  message: 'Too many requests'
});

// Apply to all requests
app.use(limiter);

// Apply to specific routes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true
});

app.post('/login', loginLimiter, (req, res) => {
  // Login logic
});
```

---

## 14. What is Logging Best Practices?
**Answer:**
Structured logging for debugging and monitoring.

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Usage
logger.info('User logged in', { userId: 123 });
logger.error('Database error', { error: err.message });
logger.warn('High memory usage', { memory: process.memoryUsage() });
```

---

## 15. What is Dependency Injection (DI)?
**Answer:**
Objects receive dependencies rather than creating them.

```javascript
// Without DI (tight coupling)
class UserService {
  constructor() {
    this.db = new Database();
  }
}

// With DI (loose coupling)
class UserService {
  constructor(db) {
    this.db = db;
  }
}

const db = new Database();
const userService = new UserService(db);

// NestJS DI
@Injectable()
export class UserService {
  constructor(@Inject('DATABASE') private db: Database) {}
}

// Benefits
// - Easy to test (mock dependencies)
// - Flexibility (swap implementations)
// - Maintainability
```

---

## 16. What is Compression Middleware?
**Answer:**
Reduce response size with gzip compression.

```javascript
const compression = require('compression');

app.use(compression({
  level: 6,
  threshold: 1024 // Only compress > 1KB
}));

// Custom filter
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
```

---

## 17. What is Security Headers?
**Answer:**
HTTP headers to protect from common vulnerabilities.

```javascript
const helmet = require('helmet');

// Apply all Helmet protections
app.use(helmet());

// Individual headers
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", 'trusted-cdn.com']
  }
}));

app.use(helmet.hsts({ maxAge: 31536000 })); // HTTPS only
app.use(helmet.noSniff()); // Prevent MIME sniffing
app.use(helmet.xssFilter()); // XSS protection
app.use(helmet.frameguard({ action: 'deny' })); // Clickjacking
```

---

## 18. What is File Upload Handling?
**Answer:**
Handle file uploads securely.

```javascript
const multer = require('multer');

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  res.json({
    filename: file.filename,
    size: file.size,
    path: file.path
  });
});
```

---

## 19. What is API Versioning?
**Answer:**
Manage multiple API versions for backward compatibility.

```javascript
// URL versioning
app.get('/v1/users', (req, res) => {
  res.json({ version: 1, users: [] });
});

app.get('/v2/users', (req, res) => {
  res.json({ version: 2, users: [], meta: {} });
});

// Header versioning
app.get('/users', (req, res) => {
  const version = req.get('Accept-Version') || '1';
  
  if (version === '2') {
    res.json({ version: 2, users: [], meta: {} });
  } else {
    res.json({ version: 1, users: [] });
  }
});

// Media type versioning
app.get('/users', (req, res) => {
  if (req.accepts('application/vnd.api.v2+json')) {
    res.type('application/vnd.api.v2+json').json({ version: 2 });
  } else {
    res.json({ version: 1 });
  }
});
```

---

## 20. What is Testing in Node.js?
**Answer:**
Automated testing frameworks for reliability.

```javascript
// Jest Example
describe('UserService', () => {
  let userService;
  
  beforeEach(() => {
    userService = new UserService();
  });
  
  test('should create user', async () => {
    const user = await userService.create({
      name: 'John',
      email: 'john@example.com'
    });
    
    expect(user.id).toBeDefined();
    expect(user.name).toBe('John');
  });
  
  test('should throw on invalid email', async () => {
    await expect(
      userService.create({ name: 'John', email: 'invalid' })
    ).rejects.toThrow('Invalid email');
  });
});

// Supertest for API testing
const request = require('supertest');

describe('GET /users', () => {
  test('should return users list', async () => {
    const res = await request(app)
      .get('/users')
      .expect(200);
    
    expect(res.body).toHaveProperty('users');
    expect(Array.isArray(res.body.users)).toBe(true);
  });
});
```
