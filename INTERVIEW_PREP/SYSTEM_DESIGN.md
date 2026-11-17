# System Design Interview Questions

## 1. Design a URL Shortening Service (like bit.ly)

### Requirements
- Convert long URLs to short URLs
- Redirect short URLs to original
- Track click count
- Expiration of links
- Handle millions of requests
- Custom aliases

### Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
    ┌──┴───────────────────────┐
    │                          │
┌───▼──────────┐      ┌────────▼────┐
│  API Gateway │      │ Load Balancer
└───┬──────────┘      └────────┬────┘
    │                          │
    └──────────────┬───────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
    ┌───▼──┐  ┌───▼──┐  ┌───▼──┐
    │ Web  │  │ Web  │  │ Web  │
    │Server│  │Server│  │Server│
    └───┬──┘  └───┬──┘  └───┬──┘
        │         │         │
        └────┬────┴────┬────┘
             │         │
        ┌────▼──┐ ┌───▼────┐
        │ Cache │ │Database│
        │ Redis │ │ Postgres
        └───────┘ └────────┘
```

### Database Schema

```sql
CREATE TABLE urls (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  short_url VARCHAR(10) UNIQUE,
  long_url TEXT,
  user_id INT,
  created_at TIMESTAMP,
  expires_at TIMESTAMP,
  click_count INT DEFAULT 0
);

CREATE TABLE clicks (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  url_id BIGINT,
  user_ip VARCHAR(45),
  timestamp TIMESTAMP,
  FOREIGN KEY (url_id) REFERENCES urls(id)
);

CREATE INDEX idx_short_url ON urls(short_url);
CREATE INDEX idx_user_id ON urls(user_id);
```

### API Design

```javascript
// Shorten URL
POST /api/v1/shorten
{
  "long_url": "https://example.com/very/long/url",
  "custom_alias": "mylink", // optional
  "expires_in_days": 30
}

Response: {
  "short_url": "https://short.url/abc123",
  "long_url": "https://example.com/very/long/url",
  "created_at": "2024-01-01T00:00:00Z"
}

// Get URL info
GET /api/v1/urls/{id}
Response: {
  "short_url": "https://short.url/abc123",
  "long_url": "https://example.com/very/long/url",
  "click_count": 150,
  "created_at": "2024-01-01T00:00:00Z"
}

// Redirect
GET /{short_url}
Response: 302 Redirect to long_url
```

### Implementation

```javascript
// Node.js + Express
const express = require('express');
const redis = require('redis');
const db = require('./database');

const app = express();
const redis_client = redis.createClient();

// Generate short URL
function generateShortUrl(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

app.post('/api/v1/shorten', async (req, res) => {
  const { long_url, custom_alias, expires_in_days } = req.body;
  
  // Validate URL
  try {
    new URL(long_url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }
  
  const short_url = custom_alias || generateShortUrl();
  
  // Check if custom alias exists
  const existing = await db.query('SELECT * FROM urls WHERE short_url = ?', [short_url]);
  if (existing.length > 0) {
    return res.status(400).json({ error: 'Short URL already exists' });
  }
  
  const expires_at = expires_in_days 
    ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000)
    : null;
  
  const result = await db.query(
    'INSERT INTO urls (short_url, long_url, user_id, created_at, expires_at) VALUES (?, ?, ?, NOW(), ?)',
    [short_url, long_url, req.user.id, expires_at]
  );
  
  // Cache in Redis
  await redis_client.setEx(`url:${short_url}`, 3600, long_url);
  
  res.json({
    short_url: `https://short.url/${short_url}`,
    long_url,
    created_at: new Date()
  });
});

app.get('/:short_url', async (req, res) => {
  const { short_url } = req.params;
  
  // Check cache first
  let long_url = await redis_client.get(`url:${short_url}`);
  
  if (!long_url) {
    // Query database
    const result = await db.query(
      'SELECT long_url FROM urls WHERE short_url = ? AND (expires_at IS NULL OR expires_at > NOW())',
      [short_url]
    );
    
    if (!result.length) {
      return res.status(404).json({ error: 'URL not found' });
    }
    
    long_url = result[0].long_url;
    
    // Cache for future
    await redis_client.setEx(`url:${short_url}`, 3600, long_url);
  }
  
  // Log click asynchronously
  db.query(
    'UPDATE urls SET click_count = click_count + 1 WHERE short_url = ?',
    [short_url]
  ).catch(err => console.error('Failed to log click:', err));
  
  res.redirect(302, long_url);
});
```

### Scalability Considerations

1. **Database Sharding:** Shard by user_id
2. **Cache Strategy:** Redis for frequently accessed URLs
3. **Load Balancer:** Distribute traffic
4. **Message Queue:** Async analytics processing
5. **CDN:** Cache redirect responses

---

## 2. Design a Real-time Chat Application

### Requirements
- Send/receive messages in real-time
- Multiple chat rooms
- User presence
- Message history
- Media sharing
- Search messages

### Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  WebSocket  │     │  WebSocket  │     │  WebSocket  │
│   Client 1  │     │   Client 2  │     │   Client 3  │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    ┌──────▼──────┐
                    │  Socket.io  │
                    │   Server    │
                    └──────┬──────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
       ┌────▼───┐  ┌────────▼────┐  ┌───▼────┐
       │ Redis  │  │  MongoDB    │  │Elasticsearch
       │(Cache) │  │(Messages)   │  │(Search)
       └────────┘  └─────────────┘  └────────┘
```

### WebSocket Events

```javascript
// Client → Server
'message' - Send message
'typing' - User typing
'join_room' - Join chat room
'leave_room' - Leave chat room
'user_online' - Set online status

// Server → Client
'message' - Receive message
'user_typing' - Someone typing
'user_joined' - User joined room
'user_left' - User left room
'user_online_status' - Presence update
'message_delivered' - Message delivery confirmation
```

### Implementation

```javascript
// Server
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const redis = require('redis');
const mongodb = require('mongodb');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

const redis_client = redis.createClient();
const mongodb_client = new mongodb.MongoClient(process.env.MONGODB_URI);

// Socket.io namespace for chat
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join_room', async (data) => {
    const { room, user } = data;
    
    socket.join(room);
    
    // Store user in Redis
    await redis_client.hSet(`room:${room}:users`, socket.id, JSON.stringify(user));
    
    // Notify others
    io.to(room).emit('user_joined', {
      user,
      timestamp: new Date()
    });
    
    // Send recent message history
    const db = mongodb_client.db('chat');
    const messages = await db.collection('messages')
      .find({ room })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();
    
    socket.emit('message_history', messages.reverse());
  });
  
  socket.on('message', async (data) => {
    const { room, message, user } = data;
    
    const msg = {
      _id: new mongodb.ObjectId(),
      room,
      user,
      message,
      timestamp: new Date(),
      read_by: [user.id]
    };
    
    // Save to database
    const db = mongodb_client.db('chat');
    await db.collection('messages').insertOne(msg);
    
    // Broadcast to room
    io.to(room).emit('message', msg);
    
    // Store in cache for recent messages
    await redis_client.lpush(`room:${room}:messages`, JSON.stringify(msg));
    await redis_client.ltrim(`room:${room}:messages`, 0, 99);
  });
  
  socket.on('typing', (data) => {
    const { room, user } = data;
    socket.to(room).emit('user_typing', { user });
  });
  
  socket.on('leave_room', async (data) => {
    const { room, user } = data;
    
    socket.leave(room);
    
    // Remove from Redis
    await redis_client.hDel(`room:${room}:users`, socket.id);
    
    io.to(room).emit('user_left', { user, timestamp: new Date() });
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(3000);
```

### Database Schema

```javascript
// MongoDB - Messages
{
  _id: ObjectId,
  room: String,
  user: {
    id: String,
    name: String,
    avatar: String
  },
  message: String,
  attachments: [{
    type: String,
    url: String
  }],
  timestamp: Date,
  read_by: [String]
}

// MongoDB - Rooms
{
  _id: ObjectId,
  name: String,
  members: [String],
  created_at: Date,
  updated_at: Date
}
```

---

## 3. Design Instagram/Photo Sharing App

### Key Components
1. **Image Storage:** S3 with CDN
2. **Database:** PostgreSQL + Redis
3. **Queue:** Message queue for image processing
4. **Cache:** Redis for feeds

### APIs

```
POST /api/posts - Create post
GET /api/posts/{id} - Get post
DELETE /api/posts/{id} - Delete post
POST /api/posts/{id}/like - Like post
POST /api/posts/{id}/comment - Add comment
GET /api/feed - Get user feed
GET /api/users/{id}/posts - Get user's posts
```

---

## 4. Design an E-commerce Platform

### Core Features
- Product catalog
- Shopping cart
- Payments (Stripe)
- Orders
- Inventory
- Reviews

### Architecture
- Microservices
- Product Service
- Cart Service
- Order Service
- Payment Service
- Inventory Service

---

## 5. Design a Video Streaming Service

### Challenges
- Large file sizes
- Bandwidth optimization
- Adaptive bitrate streaming
- CDN distribution
- Real-time metrics

### Solution
- Use HLS/DASH protocols
- Transcode videos to multiple qualities
- Store on S3
- Distribute via CloudFront
- Monitor with metrics

---

## Key System Design Concepts

### Scalability
- **Horizontal Scaling:** Add more servers
- **Vertical Scaling:** Add more resources to existing server
- **Database Sharding:** Split data across servers
- **Replication:** Copy data for redundancy

### Consistency & Availability
- **CAP Theorem:** Choose 2 of 3
  - Consistency
  - Availability
  - Partition Tolerance

### Caching Strategies
- **LRU Cache:** Remove least recently used
- **LFU Cache:** Remove least frequently used
- **TTL:** Time-based expiration
- **Cache-aside:** App manages cache

### Load Balancing
- **Round Robin:** Distribute evenly
- **Least Connections:** Route to least loaded
- **IP Hash:** Same user to same server
- **Weighted:** Different server weights

### Monitoring & Logging
- **Metrics:** CPU, Memory, Disk, Network
- **Logs:** Centralized logging (ELK)
- **Tracing:** Distributed tracing (Jaeger)
- **Alerts:** Set thresholds for incidents
