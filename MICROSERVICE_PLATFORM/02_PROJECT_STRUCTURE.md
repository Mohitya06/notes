# Step 2: Project Structure

## 2.1 Folder Organization

### Monorepo Structure (Recommended)

```
microservice-platform/
├── .github/
│   └── workflows/           # CI/CD pipelines
│       ├── user-service.yml
│       ├── order-service.yml
│       └── docker-build.yml
│
├── services/
│   ├── api-gateway/
│   │   ├── src/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── user-service/
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── middlewares/
│   │   │   └── app.js
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── order-service/
│   │   ├── src/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── payment-service/
│   │   ├── src/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── notification-service/
│       ├── src/
│       ├── tests/
│       ├── Dockerfile
│       ├── package.json
│       └── README.md
│
├── shared/
│   ├── logger/              # Shared logging utility
│   │   ├── index.js
│   │   └── package.json
│   │
│   ├── middleware/          # Shared middleware
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── package.json
│   │
│   ├── constants/           # Shared constants
│   │   ├── errorCodes.js
│   │   ├── statusCodes.js
│   │   └── package.json
│   │
│   └── utils/               # Shared utilities
│       ├── validators.js
│       ├── formatters.js
│       └── package.json
│
├── infrastructure/
│   ├── docker-compose.yml   # Local development
│   ├── kubernetes/
│   │   ├── namespace.yaml
│   │   ├── configmap.yaml
│   │   ├── secrets.yaml
│   │   ├── deployments/
│   │   │   ├── api-gateway.yaml
│   │   │   ├── user-service.yaml
│   │   │   ├── order-service.yaml
│   │   │   └── payment-service.yaml
│   │   ├── services/
│   │   │   ├── api-gateway-svc.yaml
│   │   │   ├── user-service-svc.yaml
│   │   │   └── order-service-svc.yaml
│   │   └── ingress.yaml
│   │
│   ├── monitoring/
│   │   ├── prometheus.yml
│   │   ├── grafana-datasources.yaml
│   │   └── prometheus-rules.yaml
│   │
│   └── scripts/
│       ├── setup.sh
│       ├── deploy.sh
│       └── cleanup.sh
│
├── docs/
│   ├── API_DOCUMENTATION.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   └── TROUBLESHOOTING.md
│
├── tests/
│   ├── integration/
│   │   ├── user-service.test.js
│   │   ├── order-service.test.js
│   │   └── payment-flow.test.js
│   │
│   └── e2e/
│       ├── checkout-flow.test.js
│       └── order-creation.test.js
│
├── .env.example
├── .gitignore
├── docker-compose.yml
├── docker-compose.prod.yml
├── package.json              # Root workspace
├── lerna.json               # If using Lerna for monorepo
├── README.md
└── CONTRIBUTING.md
```

## 2.2 Individual Service Structure

### User Service Example

```
services/user-service/
├── src/
│   ├── config/
│   │   ├── database.js      # DB connection
│   │   ├── env.js           # Environment variables
│   │   └── logger.js        # Logger setup
│   │
│   ├── controllers/
│   │   ├── userController.js
│   │   └── authController.js
│   │
│   ├── models/
│   │   ├── User.js          # User schema/model
│   │   └── UserProfile.js
│   │
│   ├── routes/
│   │   ├── users.js
│   │   ├── auth.js
│   │   └── index.js         # Route aggregator
│   │
│   ├── services/
│   │   ├── userService.js   # Business logic
│   │   └── authService.js
│   │
│   ├── middlewares/
│   │   ├── authMiddleware.js
│   │   ├── validationMiddleware.js
│   │   └── errorHandlerMiddleware.js
│   │
│   ├── utils/
│   │   ├── validators.js
│   │   ├── helpers.js
│   │   └── formatters.js
│   │
│   ├── events/              # Event emitters/handlers
│   │   └── userEvents.js
│   │
│   ├── app.js               # Express app setup
│   ├── server.js            # Server entry point
│   └── index.js             # Main entry
│
├── tests/
│   ├── unit/
│   │   ├── userService.test.js
│   │   └── validators.test.js
│   │
│   ├── integration/
│   │   ├── userRoutes.test.js
│   │   └── database.test.js
│   │
│   └── setup.js             # Test setup/teardown
│
├── migrations/              # Database migrations
│   ├── 001_create_users_table.sql
│   └── 002_create_user_profile_table.sql
│
├── seeds/                   # Test data
│   └── users.seed.js
│
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── Dockerfile
├── .dockerignore
├── package.json
├── README.md
└── jest.config.js           # Test configuration
```

## 2.3 Shared Libraries Structure

### Shared Logger

```
shared/logger/
├── index.js                 # Main export
├── logger.js                # Logger implementation
├── transports/
│   ├── console.js
│   ├── file.js
│   └── elasticsearch.js
├── formatters/
│   ├── json.js
│   └── text.js
├── package.json
└── README.md
```

### Shared Middleware

```
shared/middleware/
├── index.js
├── auth.js                  # JWT verification
├── errorHandler.js          # Global error handling
├── requestLogger.js         # Request logging
├── rateLimiter.js           # Rate limiting
├── corsHandler.js           # CORS configuration
├── validationHandler.js     # Input validation
├── package.json
└── README.md
```

## 2.4 Infrastructure Setup

### Docker Compose (Local Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: password

  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  rabbitmq:
    image: rabbitmq:3.12-management
    ports:
      - "5672:5672"
      - "15672:15672"

  user-service:
    build: ./services/user-service
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis

  order-service:
    build: ./services/order-service
    ports:
      - "3002:3002"
    depends_on:
      - postgres
      - rabbitmq

  api-gateway:
    build: ./services/api-gateway
    ports:
      - "3000:3000"
    depends_on:
      - user-service
      - order-service
```

## 2.5 Kubernetes Structure

### Namespace Setup

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: microservices
  labels:
    name: microservices
```

### Deployment Template

```yaml
# k8s/deployments/user-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  namespace: microservices
  labels:
    app: user-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
      - name: user-service
        image: your-registry/user-service:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: user-db-url
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
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
```

## 2.6 Key Files to Create First

1. **Root package.json** - Workspace configuration
2. **docker-compose.yml** - Local development setup
3. **.env.example** - Environment variables template
4. **.gitignore** - Version control exclusions
5. **README.md** - Project overview
6. Individual service package.json files

## 2.7 Best Practices

### Naming Conventions
- Services: lowercase with hyphens (user-service)
- Files: camelCase (userController.js)
- Folders: lowercase (controllers, models)
- Constants: UPPER_SNAKE_CASE (DB_POOL_SIZE)

### File Organization Principles
- Keep files small and focused
- Co-locate related functionality
- Separate concerns (controllers, services, models)
- Shared code in /shared directory
- Configuration in /config directory

### Version Control
- One service per directory
- Shared utilities in /shared
- Infrastructure code in /infrastructure
- Documentation in /docs
- Tests alongside source or in /tests
