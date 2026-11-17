# Step 8: Monitoring, Logging & Observability

## 8.1 Logging Architecture

### ELK Stack Setup

**infrastructure/docker-compose-monitoring.yml**
```yaml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - xpack.watcher.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:8.0.0
    volumes:
      - ./infrastructure/logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5000:5000"
    depends_on:
      - elasticsearch
    environment:
      - "LS_JAVA_OPTS=-Xmx256m -Xms256m"

  kibana:
    image: docker.elastic.co/kibana/kibana:8.0.0
    ports:
      - "5601:5601"
    environment:
      ELASTICSEARCH_HOSTS: http://elasticsearch:9200
    depends_on:
      - elasticsearch

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./infrastructure/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'

  grafana:
    image: grafana/grafana:latest
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    ports:
      - "3100:3000"
    volumes:
      - grafana_data:/var/lib/grafana
    depends_on:
      - prometheus

  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"
      - "6831:6831/udp"
    environment:
      - COLLECTOR_ZIPKIN_HOST_PORT=:9411

volumes:
  elasticsearch_data:
  prometheus_data:
  grafana_data:
```

### Winston Logger Configuration

**shared/logger/src/winston-config.js**
```javascript
const winston = require('winston');
const ecsFormat = require('@elastic/ecs-winston-format');

const createLogger = (serviceName) => {
  const logger = winston.createLogger({
    service: serviceName,
    node: process.env.HOSTNAME,
    environment: process.env.NODE_ENV,
    
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      ecsFormat()
    ),
    
    defaultMeta: {
      service: serviceName,
      environment: process.env.NODE_ENV,
      version: process.env.APP_VERSION
    },
    
    transports: [
      // Console transport
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            return `${timestamp} [${level}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
          })
        )
      }),
      
      // File transports
      new winston.transports.File({
        filename: `logs/${serviceName}-error.log`,
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),
      
      new winston.transports.File({
        filename: `logs/${serviceName}-combined.log`,
        maxsize: 5242880,
        maxFiles: 5
      }),
      
      // TCP transport for Logstash
      new winston.transports.Stream({
        stream: require('net').createConnection({
          host: process.env.LOGSTASH_HOST || 'localhost',
          port: process.env.LOGSTASH_PORT || 5000,
          type: 'tcp'
        })
      })
    ]
  });

  return logger;
};

module.exports = createLogger;
```

---

## 8.2 Structured Logging

### Request Logging Middleware

```javascript
const requestLogger = (logger) => {
  return (req, res, next) => {
    const start = Date.now();
    
    // Override res.json to log response
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      const duration = Date.now() - start;
      
      logger.info('HTTP Request', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('user-agent'),
        ip: req.ip,
        userId: req.user?.id,
        requestId: req.id,
        responseSize: JSON.stringify(data).length
      });
      
      return originalJson(data);
    };
    
    next();
  };
};
```

### Contextual Logging

```javascript
class LogContext {
  constructor(logger) {
    this.logger = logger;
    this.context = {};
  }

  setContext(key, value) {
    this.context[key] = value;
  }

  log(level, message, meta = {}) {
    this.logger[level](message, {
      ...this.context,
      ...meta
    });
  }

  info(message, meta) {
    this.log('info', message, meta);
  }

  error(message, meta) {
    this.log('error', message, meta);
  }

  warn(message, meta) {
    this.log('warn', message, meta);
  }

  debug(message, meta) {
    this.log('debug', message, meta);
  }
}

module.exports = LogContext;
```

---

## 8.3 Metrics Collection

### Prometheus Metrics

```javascript
const promClient = require('prom-client');

// Create metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.01, 0.1, 1, 5]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const databaseQueryDuration = new promClient.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries',
  labelNames: ['query_type', 'table'],
  buckets: [0.01, 0.1, 0.5, 1, 5]
});

const serviceCacheHits = new promClient.Counter({
  name: 'cache_hits_total',
  help: 'Total cache hits',
  labelNames: ['cache_key']
});

const serviceCacheMisses = new promClient.Counter({
  name: 'cache_misses_total',
  help: 'Total cache misses',
  labelNames: ['cache_key']
});

// Middleware to collect metrics
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    
    httpRequestDuration.labels(
      req.method,
      req.route?.path || req.path,
      res.statusCode
    ).observe(duration);
    
    httpRequestsTotal.labels(
      req.method,
      req.route?.path || req.path,
      res.statusCode
    ).inc();
  });
  
  next();
};

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(promClient.register.metrics());
});

module.exports = {
  httpRequestDuration,
  httpRequestsTotal,
  databaseQueryDuration,
  serviceCacheHits,
  serviceCacheMisses,
  metricsMiddleware
};
```

---

## 8.4 Distributed Tracing

### Jaeger Integration

```javascript
const initTracer = require('jaeger-client').initTracer;
const { Format } = require('opentracing');

const initJaegerTracer = (serviceName) => {
  const config = {
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

  const options = {
    logger: console
  };

  return initTracer(config, options);
};

// Tracing middleware
const tracingMiddleware = (tracer) => {
  return (req, res, next) => {
    const wireCtx = tracer.extract(Format.HTTP_HEADERS, req.headers);
    const span = tracer.startSpan(req.path, {
      childOf: wireCtx,
      tags: {
        'http.method': req.method,
        'http.url': req.url,
        'http.headers': req.headers,
        'span.kind': 'server'
      }
    });

    req.span = span;

    res.on('finish', () => {
      span.setTag('http.status_code', res.statusCode);
      span.finish();
    });

    next();
  };
};

// Service-to-service calls with tracing
const tracedAxiosCall = (tracer, serviceName, span) => {
  const headers = {};
  tracer.inject(span, Format.HTTP_HEADERS, headers);
  
  return axios.create({
    headers,
    validateStatus: () => true
  });
};

module.exports = { initJaegerTracer, tracingMiddleware, tracedAxiosCall };
```

---

## 8.5 Health Checks

### Comprehensive Health Endpoint

```javascript
app.get('/health', async (req, res) => {
  try {
    // Check database
    const dbHealthy = await checkDatabase();
    
    // Check Redis
    const redisHealthy = await checkRedis();
    
    // Check RabbitMQ
    const queueHealthy = await checkQueue();
    
    const health = {
      status: dbHealthy && redisHealthy && queueHealthy ? 'healthy' : 'degraded',
      timestamp: new Date(),
      service: process.env.SERVICE_NAME,
      checks: {
        database: dbHealthy,
        redis: redisHealthy,
        queue: queueHealthy
      },
      uptime: process.uptime(),
      version: process.env.APP_VERSION
    };
    
    res.status(health.status === 'healthy' ? 200 : 503).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

app.get('/ready', async (req, res) => {
  // Liveness check - is the service running?
  res.json({ ready: true });
});

const checkDatabase = async () => {
  try {
    await sequelize.authenticate();
    return true;
  } catch {
    return false;
  }
};

const checkRedis = async () => {
  try {
    await redisClient.ping();
    return true;
  } catch {
    return false;
  }
};

const checkQueue = async () => {
  try {
    await channel.assertExchange('health-check', 'direct');
    return true;
  } catch {
    return false;
  }
};
```

---

## 8.6 Alerting Rules

**infrastructure/prometheus-rules.yml**
```yaml
groups:
  - name: microservices
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: |
          (sum(rate(http_requests_total{status=~"5.."}[5m])) by (service)) /
          (sum(rate(http_requests_total[5m])) by (service)) > 0.05
        for: 5m
        annotations:
          summary: "High error rate on {{ $labels.service }}"
          description: "Error rate is {{ $value | humanizePercentage }}"
      
      # High response time
      - alert: HighResponseTime
        expr: |
          histogram_quantile(0.95, 
            sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service)
          ) > 1
        for: 5m
        annotations:
          summary: "High response time on {{ $labels.service }}"
      
      # Database connection pool exhausted
      - alert: DatabasePoolExhausted
        expr: |
          database_connections_active / database_connections_max > 0.8
        for: 5m
        annotations:
          summary: "Database connection pool exhausted"
      
      # Service down
      - alert: ServiceDown
        expr: up{job=~".*-service"} == 0
        for: 1m
        annotations:
          summary: "{{ $labels.job }} is down"
```

---

## 8.7 Custom Dashboards

### Grafana Dashboard JSON

```json
{
  "dashboard": {
    "title": "Microservices Overview",
    "panels": [
      {
        "id": 1,
        "title": "Request Rate",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[1m])) by (service)"
          }
        ],
        "type": "graph"
      },
      {
        "id": 2,
        "title": "Error Rate",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status=~\"5..\"}[1m])) by (service)"
          }
        ],
        "type": "graph"
      },
      {
        "id": 3,
        "title": "Response Time (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service))"
          }
        ],
        "type": "graph"
      },
      {
        "id": 4,
        "title": "Database Query Time",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(database_query_duration_seconds_bucket[5m])) by (le, query_type))"
          }
        ],
        "type": "graph"
      },
      {
        "id": 5,
        "title": "Cache Hit Rate",
        "targets": [
          {
            "expr": "cache_hits_total / (cache_hits_total + cache_misses_total)"
          }
        ],
        "type": "stat"
      }
    ]
  }
}
```

---

## 8.8 Log Analysis Queries

### Kibana Queries

```
# Find all errors in the last hour
level: ERROR AND timestamp: [now-1h TO now]

# Find slow requests
http.request.duration.ms: [1000 TO *] AND http.status_code: 200

# Find user-related errors
service: "user-service" AND level: ERROR

# Find requests from specific user
user.id: "user-123"

# Find failed payment transactions
service: "payment-service" AND transaction.status: failed

# Find authentication failures
event.type: authentication AND event.outcome: failure
```

---

## 8.9 Observability Best Practices

### Naming Conventions

```
Metrics:
- http_requests_total (counter)
- http_request_duration_seconds (histogram)
- database_connections_active (gauge)

Logs:
- level: ERROR, WARN, INFO, DEBUG
- timestamp: ISO 8601
- service: service name
- requestId: unique request ID
- userId: user identifier
- duration: milliseconds

Traces:
- operation_name: HTTP method + path
- tags.http.method: GET, POST, etc.
- tags.http.url: full URL
- tags.span.kind: client, server, producer, consumer
```

### Context Propagation

```javascript
// Use correlation IDs for tracing
const correlationIdMiddleware = (req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || generateUUID();
  req.correlationId = correlationId;
  
  res.setHeader('x-correlation-id', correlationId);
  
  // Pass to logger context
  req.logger = logger.child({ correlationId });
  
  next();
};
```

---

## 8.10 Monitoring Setup Checklist

- [ ] ELK stack deployed and running
- [ ] Logstash configured to parse service logs
- [ ] Kibana dashboards created
- [ ] Prometheus scraping all service metrics
- [ ] Grafana connected to Prometheus
- [ ] Alert rules configured
- [ ] Jaeger distributed tracing enabled
- [ ] Service-to-service tracing working
- [ ] Health check endpoints functioning
- [ ] Log rotation configured
- [ ] Metrics retention policies set
- [ ] Alerting notifications configured (Slack, PagerDuty)

---

## 8.11 Incident Response

### Runbook Template

```markdown
# High Error Rate Incident

## Detection
- Alert: HighErrorRate
- Threshold: > 5% for > 5 minutes
- Severity: Critical

## Immediate Actions
1. Check affected service logs in Kibana
   - Filter: service: "X" AND level: ERROR
2. Check service health endpoint
   - curl http://service-url/health
3. Check dependencies (database, cache, queue)

## Investigation
1. Identify error pattern
2. Check recent deployments
3. Check resource usage
4. Check external API status

## Remediation
- Rollback latest deployment
- Restart affected pods
- Scale up service if CPU/memory exhausted
- Flush cache if corruption suspected

## Communication
- Notify stakeholders via Slack
- Update status page
- Create post-mortem

## Post-Incident
- Root cause analysis
- Implement fixes
- Update monitoring
- Update runbooks
```

This comprehensive observability setup ensures you can monitor, debug, and optimize your microservices platform effectively.
