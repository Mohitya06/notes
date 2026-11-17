# Phase 3: Integration, Deployment & Production Readiness

## Phase 3 Objectives
1. Event-driven architecture implementation
2. Distributed tracing setup
3. Centralized logging
4. Kubernetes deployment configuration
5. Security implementation
6. Monitoring and alerting
7. Load testing and optimization

**Timeline:** 3-4 weeks

---

## Step 3.1: Complete Event-Driven Architecture

### Event Subscribers

**services/notification-service/src/services/eventSubscriber.js**
```javascript
const amqp = require('amqplib');
const logger = require('@platform/logger');

class EventSubscriber {
  constructor(eventHandlers) {
    this.connection = null;
    this.channel = null;
    this.eventHandlers = eventHandlers; // { 'order.created': handler }
  }

  async connect() {
    try {
      this.connection = await amqp.connect(process.env.RABBITMQ_URL);
      this.channel = await this.connection.createChannel();
      
      // Declare exchange
      await this.channel.assertExchange('events', 'topic', { durable: true });
      
      logger.info('Connected to RabbitMQ');
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ', { error: error.message });
      throw error;
    }
  }

  async subscribe(eventType) {
    try {
      // Create queue for this service
      const queue = await this.channel.assertQueue('notification-service', { durable: true });
      
      // Bind queue to exchange with routing key
      await this.channel.bindQueue(queue.queue, 'events', `*.${eventType}`);
      
      // Consume messages
      await this.channel.consume(queue.queue, async (msg) => {
        if (msg) {
          try {
            const event = JSON.parse(msg.content.toString());
            
            logger.info('Received event', { eventType, event });
            
            // Find and execute handler
            const handler = this.eventHandlers[eventType];
            if (handler) {
              await handler(event.data);
            }
            
            // Acknowledge message
            this.channel.ack(msg);
          } catch (error) {
            logger.error('Error processing event', { error: error.message });
            // Nack and requeue
            this.channel.nack(msg, false, true);
          }
        }
      });
      
      logger.info('Subscribed to event', { eventType });
    } catch (error) {
      logger.error('Error subscribing to event', { eventType, error: error.message });
      throw error;
    }
  }
}

module.exports = EventSubscriber;
```

### Email Event Handler

**services/notification-service/src/handlers/emailHandler.js**
```javascript
const nodemailer = require('nodemailer');
const logger = require('@platform/logger');

class EmailHandler {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    });
  }

  async handleOrderCreated(orderData) {
    try {
      await this.transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: orderData.userEmail,
        subject: 'Order Confirmation',
        html: this.getOrderConfirmationTemplate(orderData)
      });
      
      logger.info('Order confirmation email sent', { orderId: orderData.id });
    } catch (error) {
      logger.error('Failed to send email', { error: error.message });
      throw error;
    }
  }

  getOrderConfirmationTemplate(orderData) {
    return `
      <h1>Order Confirmation</h1>
      <p>Your order #${orderData.id} has been confirmed.</p>
      <p>Total Amount: $${orderData.totalAmount}</p>
      <p>Status: ${orderData.status}</p>
    `;
  }
}

module.exports = EmailHandler;
```

---

## Step 3.2: Distributed Tracing with Jaeger

### Jaeger Configuration

**infrastructure/jaeger-config.yaml**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: jaeger-config
  namespace: microservices
data:
  sampling.json: |
    {
      "default_strategy": {
        "type": "probabilistic",
        "param": 0.1
      }
    }
```

### Tracing Middleware

**shared/middleware/src/tracingMiddleware.js**
```javascript
const { initTracer } = require('jaeger-client');
const logger = require('@platform/logger');

const initJaeger = (serviceName) => {
  const options = {
    serviceName,
    sampler: {
      type: 'const',
      param: 1
    },
    reporter: {
      logSpans: true,
      agentHost: process.env.JAEGER_AGENT_HOST || 'localhost',
      agentPort: process.env.JAEGER_AGENT_PORT || 6831
    }
  };

  return initTracer(options);
};

const tracingMiddleware = (tracer) => {
  return (req, res, next) => {
    const wireCtx = tracer.extract('http_headers', req.headers);
    const span = tracer.startSpan(req.path, {
      childOf: wireCtx,
      tags: {
        [require('opentracing').Tags.SPAN_KIND]: require('opentracing').Tags.SPAN_KIND_RPC_SERVER,
        [require('opentracing').Tags.HTTP_METHOD]: req.method,
        [require('opentracing').Tags.HTTP_URL]: req.url,
        [require('opentracing').Tags.COMPONENT]: 'express'
      }
    });

    req.span = span;

    const finishSpan = () => {
      span.setTag(require('opentracing').Tags.HTTP_STATUS_CODE, res.statusCode);
      span.finish();
    };

    res.on('finish', finishSpan);
    next();
  };
};

module.exports = { initJaeger, tracingMiddleware };
```

---

## Step 3.3: Centralized Logging with ELK Stack

### Elasticsearch Configuration

**infrastructure/elasticsearch.yaml**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: elasticsearch
  namespace: microservices
spec:
  selector:
    app: elasticsearch
  ports:
  - port: 9200
    targetPort: 9200

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: elasticsearch
  namespace: microservices
spec:
  replicas: 1
  selector:
    matchLabels:
      app: elasticsearch
  template:
    metadata:
      labels:
        app: elasticsearch
    spec:
      containers:
      - name: elasticsearch
        image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
        ports:
        - containerPort: 9200
        env:
        - name: discovery.type
          value: single-node
        - name: xpack.security.enabled
          value: "false"
```

### Logstash Configuration

**infrastructure/logstash.conf**
```logstash
input {
  tcp {
    port => 5000
    codec => json
  }
}

filter {
  mutate {
    add_field => { "[@metadata][index_name]" => "%{service}-%{+YYYY.MM.dd}" }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "%{[@metadata][index_name]}"
  }
}
```

---

## Step 3.4: Kubernetes Deployment

### API Gateway Deployment

**infrastructure/kubernetes/deployments/api-gateway.yaml**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: microservices
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: your-registry/api-gateway:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: production
        - name: PORT
          value: "3000"
        - name: USER_SERVICE_URL
          value: http://user-service:3001
        - name: ORDER_SERVICE_URL
          value: http://order-service:3002
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: api-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway
  namespace: microservices
spec:
  type: LoadBalancer
  selector:
    app: api-gateway
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
```

### Horizontal Pod Autoscaler

**infrastructure/kubernetes/hpa.yaml**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
  namespace: microservices
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

## Step 3.5: Security Implementation

### Rate Limiting Advanced Configuration

**services/api-gateway/src/config/rateLimiter.js**
```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const client = redis.createClient({
  url: process.env.REDIS_URL
});

const createLimiter = (windowMs, max, keyGenerator) => {
  return rateLimit({
    store: new RedisStore({
      client,
      prefix: 'rate-limit:'
    }),
    windowMs,
    max,
    keyGenerator,
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: req.rateLimit.resetTime
      });
    }
  });
};

// Different limits for different endpoints
const apiLimiter = createLimiter(15 * 60 * 1000, 100, (req) => req.ip);
const authLimiter = createLimiter(15 * 60 * 1000, 5, (req) => req.body.email);
const createLimiter = createLimiter(60 * 60 * 1000, 10, (req) => req.user.id);

module.exports = { apiLimiter, authLimiter, createLimiter };
```

### API Key Authentication

**services/api-gateway/src/middleware/apiKeyAuth.js**
```javascript
const logger = require('@platform/logger');

const apiKeyAuth = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  try {
    // Verify API key from database or cache
    const isValid = await verifyApiKey(apiKey);
    
    if (!isValid) {
      logger.warn('Invalid API key attempt', { apiKey: apiKey.substring(0, 10) });
      return res.status(403).json({ error: 'Invalid API key' });
    }
    
    req.apiKey = apiKey;
    next();
  } catch (error) {
    logger.error('API key verification failed', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = apiKeyAuth;
```

### Input Validation

**services/api-gateway/src/middleware/inputSanitizer.js**
```javascript
const sanitize = (input) => {
  if (typeof input === 'string') {
    return input
      .replace(/[<>]/g, '')
      .trim()
      .slice(0, 1000);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    for (const key in input) {
      if (key.length < 100) {
        sanitized[key] = sanitize(input[key]);
      }
    }
    return sanitized;
  }
  
  return input;
};

const inputSanitizer = (req, res, next) => {
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  next();
};

module.exports = inputSanitizer;
```

---

## Step 3.6: Monitoring with Prometheus and Grafana

### Prometheus Configuration

**infrastructure/prometheus.yml**
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'api-gateway'
    static_configs:
      - targets: ['localhost:3000']
  
  - job_name: 'user-service'
    static_configs:
      - targets: ['localhost:3001']
  
  - job_name: 'order-service'
    static_configs:
      - targets: ['localhost:3002']

  - job_name: 'kubernetes-apiservers'
    kubernetes_sd_configs:
      - role: endpoints
    relabel_configs:
      - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name]
        action: keep
        regex: default;kubernetes
```

### Grafana Dashboard

**infrastructure/grafana-dashboard.json** (sample)
```json
{
  "dashboard": {
    "title": "Microservices Platform",
    "panels": [
      {
        "title": "API Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[1m])"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[1m])"
          }
        ]
      },
      {
        "title": "Response Time (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, http_request_duration_seconds)"
          }
        ]
      }
    ]
  }
}
```

---

## Step 3.7: Load Testing

### Artillery Load Test

**infrastructure/scripts/load-test.yml**
```yaml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 300
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"
  processor: "./processor.js"

scenarios:
  - name: "User Registration Flow"
    flow:
      - post:
          url: "/api/v1/users/register"
          json:
            email: "test{{ $timestamp }}@example.com"
            password: "Password123!"
            firstName: "John"
      - think: 2
      - post:
          url: "/api/v1/auth/login"
          json:
            email: "test{{ $timestamp }}@example.com"
            password: "Password123!"
```

---

## Step 3.8: Deployment Strategy

### Rolling Deployment

```bash
#!/bin/bash
# deploy.sh

set -e

# Build images
docker build -t api-gateway:latest ./services/api-gateway
docker build -t user-service:latest ./services/user-service
docker build -t order-service:latest ./services/order-service

# Push to registry
docker push api-gateway:latest
docker push user-service:latest
docker push order-service:latest

# Deploy to Kubernetes
kubectl set image deployment/api-gateway \
  api-gateway=api-gateway:latest \
  -n microservices

kubectl set image deployment/user-service \
  user-service=user-service:latest \
  -n microservices

kubectl set image deployment/order-service \
  order-service=order-service:latest \
  -n microservices

# Verify deployments
kubectl rollout status deployment/api-gateway -n microservices
kubectl rollout status deployment/user-service -n microservices
kubectl rollout status deployment/order-service -n microservices
```

---

## Step 3.9: Verification Checklist

- [ ] Event-driven architecture fully implemented
- [ ] Jaeger distributed tracing configured
- [ ] ELK centralized logging set up
- [ ] Kubernetes deployments created
- [ ] HPA configured for all services
- [ ] Rate limiting and authentication secured
- [ ] Input validation and sanitization in place
- [ ] Prometheus metrics collected
- [ ] Grafana dashboards created
- [ ] Load testing completed successfully
- [ ] All security best practices implemented
- [ ] Blue-green or rolling deployment tested

## Step 3.10: Post-Deployment

```bash
# Monitor logs
kubectl logs -f deployment/api-gateway -n microservices

# Check pod status
kubectl get pods -n microservices

# View resource usage
kubectl top nodes
kubectl top pods -n microservices

# Check service endpoints
kubectl get endpoints -n microservices

# Scale services manually if needed
kubectl scale deployment user-service --replicas=5 -n microservices
```

**Duration:** 3-4 weeks with team

This completes the foundation for a production-ready microservice platform.
