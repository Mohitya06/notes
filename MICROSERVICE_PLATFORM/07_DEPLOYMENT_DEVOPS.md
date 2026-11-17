# Step 7: Deployment & DevOps

## 7.1 Docker Multi-Stage Builds

### Optimized Dockerfile for Services

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY src ./src

# Run linting and tests
RUN npm run lint
RUN npm run test

# Production stage
FROM node:18-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy only necessary files from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/src ./src
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 3001

USER nodejs

CMD ["node", "src/server.js"]
```

---

## 7.2 CI/CD Pipeline with GitHub Actions

### Complete GitHub Actions Workflow

**.github/workflows/deploy.yml**
```yaml
name: Build, Test, and Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_PASSWORD: password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci --workspaces
      
      - name: Lint
        run: npm run lint --workspaces
      
      - name: Unit tests
        run: npm run test --workspaces
        env:
          DATABASE_URL: postgres://postgres:password@localhost:5432/test
          REDIS_URL: redis://localhost:6379
      
      - name: Integration tests
        run: npm run test:integration --workspaces
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    
    permissions:
      contents: read
      packages: write
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Log in to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=semver,pattern={{version}}
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:buildcache
          cache-to: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:buildcache,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup kubeconfig
        run: |
          mkdir -p $HOME/.kube
          echo "${{ secrets.KUBE_CONFIG }}" | base64 -d > $HOME/.kube/config
          chmod 600 $HOME/.kube/config
      
      - name: Install kubectl
        uses: azure/setup-kubectl@v3
        with:
          version: 'v1.27.0'
      
      - name: Update image in Kubernetes
        run: |
          kubectl set image deployment/api-gateway \
            api-gateway=ghcr.io/${{ github.repository }}/api-gateway:${{ github.sha }} \
            -n microservices
          
          kubectl set image deployment/user-service \
            user-service=ghcr.io/${{ github.repository }}/user-service:${{ github.sha }} \
            -n microservices
      
      - name: Verify rollout
        run: |
          kubectl rollout status deployment/api-gateway -n microservices
          kubectl rollout status deployment/user-service -n microservices

  smoke-tests:
    needs: deploy
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Run smoke tests
        run: npm run test:smoke
        env:
          API_URL: ${{ secrets.STAGING_API_URL }}
```

---

## 7.3 Infrastructure as Code with Terraform

### Terraform Configuration

**infrastructure/terraform/main.tf**
```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket         = "terraform-state-bucket"
    key            = "microservices/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region
}

# EKS Cluster
module "eks" {
  source = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"
  
  cluster_name    = "${var.cluster_name}-${var.environment}"
  cluster_version = var.kubernetes_version
  
  cluster_endpoint_private_access = true
  cluster_endpoint_public_access  = true
  
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
  
  eks_managed_node_groups = {
    general = {
      name           = "general-node-group"
      instance_types = ["t3.medium"]
      desired_size   = 3
      min_size       = 2
      max_size       = 10
      capacity_type  = "ON_DEMAND"
      
      iam_role_additional_policies = [
        "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
      ]
    }
  }
  
  manage_aws_auth_configmap = true
}

# RDS Database
resource "aws_db_instance" "main" {
  identifier     = "${var.cluster_name}-db"
  engine         = "postgres"
  engine_version = "15.0"
  instance_class = "db.t3.micro"
  
  allocated_storage = 20
  storage_type      = "gp2"
  
  username = var.db_username
  password = random_password.db_password.result
  
  db_name = var.db_name
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  skip_final_snapshot = false
  final_snapshot_identifier = "${var.cluster_name}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  
  multi_az = true
  
  tags = local.common_tags
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "main" {
  cluster_id           = "${var.cluster_name}-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  engine_version       = "7.0"
  port                 = 6379
  
  security_group_ids = [aws_security_group.redis.id]
  subnet_group_name  = aws_elasticache_subnet_group.main.name
  
  tags = local.common_tags
}

# LoadBalancer
resource "aws_lb" "main" {
  name               = "${var.cluster_name}-nlb"
  internal           = false
  load_balancer_type = "network"
  
  subnets = module.vpc.public_subnets
  
  tags = local.common_tags
}

locals {
  common_tags = {
    Environment = var.environment
    Project     = "microservices-platform"
  }
}

output "eks_cluster_endpoint" {
  value       = module.eks.cluster_endpoint
  description = "EKS cluster endpoint"
}

output "eks_cluster_name" {
  value       = module.eks.cluster_name
  description = "EKS cluster name"
}
```

**infrastructure/terraform/variables.tf**
```hcl
variable "aws_region" {
  description = "AWS region"
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  default     = "production"
}

variable "cluster_name" {
  description = "EKS cluster name"
  default     = "microservices"
}

variable "kubernetes_version" {
  description = "Kubernetes version"
  default     = "1.27"
}

variable "db_username" {
  description = "Database username"
  sensitive   = true
}

variable "db_password" {
  description = "Database password"
  sensitive   = true
}

variable "db_name" {
  description = "Database name"
  default     = "microservices"
}
```

---

## 7.4 Helm Charts for Kubernetes

### Helm Chart Structure

```
helm/
├── Chart.yaml
├── values.yaml
├── values-staging.yaml
├── values-production.yaml
└── templates/
    ├── deployment.yaml
    ├── service.yaml
    ├── ingress.yaml
    ├── configmap.yaml
    ├── secret.yaml
    ├── hpa.yaml
    └── networkpolicy.yaml
```

**helm/Chart.yaml**
```yaml
apiVersion: v2
name: microservices-platform
description: A Helm chart for microservices platform
type: application
version: 1.0.0
appVersion: "1.0"

keywords:
  - microservices
  - kubernetes
  - api-gateway

maintainers:
  - name: Your Team
    email: team@example.com
```

**helm/values.yaml**
```yaml
replicaCount: 3

image:
  repository: ghcr.io/yourorg/service
  pullPolicy: IfNotPresent
  tag: "latest"

imagePullSecrets: []

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 250m
    memory: 256Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

nodeSelector: {}

affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 100
      podAffinityTerm:
        labelSelector:
          matchExpressions:
          - key: app
            operator: In
            values:
            - "{{ .Chart.Name }}"
        topologyKey: kubernetes.io/hostname

tolerations: []

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: api.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: api-tls
      hosts:
        - api.example.com
```

---

## 7.5 Monitoring Deployment Health

### Deployment Status Check Script

```bash
#!/bin/bash
# scripts/check-deployment-health.sh

set -e

NAMESPACE=${1:-microservices}
TIMEOUT=${2:-300}

echo "Checking deployment health in namespace: $NAMESPACE"

# Check all deployments
DEPLOYMENTS=$(kubectl get deployments -n $NAMESPACE -o jsonpath='{.items[*].metadata.name}')

for deployment in $DEPLOYMENTS; do
  echo "Checking $deployment..."
  
  # Wait for rollout
  if kubectl rollout status deployment/$deployment -n $NAMESPACE --timeout=${TIMEOUT}s; then
    echo "✓ $deployment is healthy"
  else
    echo "✗ $deployment failed"
    kubectl describe deployment/$deployment -n $NAMESPACE
    exit 1
  fi
done

echo "All deployments are healthy!"

# Check pod status
echo ""
echo "Pod status:"
kubectl get pods -n $NAMESPACE

# Check resource usage
echo ""
echo "Resource usage:"
kubectl top pods -n $NAMESPACE
```

---

## 7.6 Blue-Green Deployment

### Blue-Green Deployment Script

```bash
#!/bin/bash
# scripts/blue-green-deploy.sh

set -e

BLUE_VERSION=${1}
GREEN_VERSION=${2}
NAMESPACE="microservices"

echo "Starting blue-green deployment"
echo "Blue (current): $BLUE_VERSION"
echo "Green (new): $GREEN_VERSION"

# Deploy green
echo "Deploying green version..."
kubectl set image deployment/api-gateway-green \
  api-gateway=ghcr.io/myorg/api-gateway:${GREEN_VERSION} \
  -n $NAMESPACE

# Wait for green to be ready
kubectl rollout status deployment/api-gateway-green -n $NAMESPACE --timeout=5m

# Run smoke tests on green
echo "Running smoke tests on green..."
curl -f http://localhost:8080/health || exit 1

# Switch traffic to green
echo "Switching traffic to green..."
kubectl patch service api-gateway -n $NAMESPACE \
  -p '{"spec":{"selector":{"version":"green"}}}'

# Monitor for errors
echo "Monitoring green for 5 minutes..."
sleep 300

# Check if there are errors
ERROR_COUNT=$(kubectl logs deployment/api-gateway-green -n $NAMESPACE | grep -c "ERROR" || true)

if [ $ERROR_COUNT -gt 0 ]; then
  echo "Errors detected! Rolling back to blue..."
  kubectl patch service api-gateway -n $NAMESPACE \
    -p '{"spec":{"selector":{"version":"blue"}}}'
  exit 1
fi

echo "Deployment successful! Updating blue to new version..."

# Update blue to new version
kubectl set image deployment/api-gateway-blue \
  api-gateway=ghcr.io/myorg/api-gateway:${GREEN_VERSION} \
  -n $NAMESPACE

kubectl rollout status deployment/api-gateway-blue -n $NAMESPACE

echo "Blue-green deployment complete!"
```

---

## 7.7 Environment Configuration Management

### ConfigMap and Secrets

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: microservices
data:
  LOG_LEVEL: "info"
  NODE_ENV: "production"
  API_TIMEOUT: "30000"

---
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: microservices
type: Opaque
stringData:
  JWT_SECRET: "your-secret-key"
  DATABASE_PASSWORD: "secure-password"
  STRIPE_API_KEY: "sk_live_xxxxx"
```

---

## 7.8 Network Policies

**infrastructure/kubernetes/network-policy.yaml**
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: microservices-netpol
  namespace: microservices
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 3000
  
  egress:
  - to:
    - podSelector: {}
    ports:
    - protocol: TCP
      port: 5432
    - protocol: TCP
      port: 6379
```

---

## 7.9 Deployment Checklist

- [ ] Docker images optimized with multi-stage builds
- [ ] GitHub Actions CI/CD pipeline configured
- [ ] All tests passing in CI/CD
- [ ] Terraform infrastructure code created
- [ ] Helm charts prepared
- [ ] EKS cluster provisioned
- [ ] RDS database configured
- [ ] ElastiCache Redis setup
- [ ] Network policies configured
- [ ] Monitoring and logging pipelines in place
- [ ] Blue-green deployment tested
- [ ] Rollback procedures documented

---

## 7.10 Deploy Commands

```bash
# Using Helm
helm upgrade --install microservices ./helm \
  -f ./helm/values-production.yaml \
  -n microservices

# Rollback
helm rollback microservices

# Check status
helm status microservices -n microservices

# Terraform
terraform plan
terraform apply

# Manual kubectl
kubectl apply -f infrastructure/kubernetes/
kubectl get all -n microservices
```

This section covers production-ready deployment practices and tooling.
