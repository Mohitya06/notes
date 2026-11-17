# Step 9: Security Best Practices

## 9.1 Authentication & Authorization

### JWT Implementation

```javascript
// services/auth-service/src/services/tokenService.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class TokenService {
  // Generate JWT token
  generateAccessToken(user) {
    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        scope: this.getUserScopes(user.role)
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '15m',
        issuer: process.env.JWT_ISSUER,
        audience: process.env.JWT_AUDIENCE,
        algorithm: 'HS256'
      }
    );
  }

  // Generate refresh token
  generateRefreshToken(user) {
    const refreshTokenId = crypto.randomBytes(32).toString('hex');
    
    const token = jwt.sign(
      {
        jti: refreshTokenId,
        sub: user.id
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: '7d',
        issuer: process.env.JWT_ISSUER,
        algorithm: 'HS256'
      }
    );
    
    // Store token in Redis with TTL
    this.redis.setex(
      `refresh_token:${refreshTokenId}`,
      7 * 24 * 60 * 60,
      user.id
    );
    
    return token;
  }

  // Verify token
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET, {
        issuer: process.env.JWT_ISSUER,
        audience: process.env.JWT_AUDIENCE,
        algorithms: ['HS256']
      });
    } catch (error) {
      throw {
        status: 403,
        message: 'Invalid token',
        error: error.message
      };
    }
  }

  // Revoke token
  revokeToken(token) {
    const decoded = jwt.decode(token);
    const ttl = Math.ceil((decoded.exp * 1000 - Date.now()) / 1000);
    
    if (ttl > 0) {
      this.redis.setex(`revoked_token:${decoded.jti}`, ttl, '1');
    }
  }

  getUserScopes(role) {
    const scopeMap = {
      admin: ['users:read', 'users:write', 'orders:read', 'orders:write'],
      user: ['orders:read', 'profile:read', 'profile:write']
    };
    return scopeMap[role] || [];
  }
}

module.exports = TokenService;
```

### OAuth2 Integration

```javascript
// services/auth-service/src/routes/oauth.js
const express = require('express');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const passport = require('passport');

const router = express.Router();

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ email: profile.emails[0].value });
    
    if (!user) {
      user = await User.create({
        email: profile.emails[0].value,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        googleId: profile.id,
        verified: true
      });
    }
    
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/google/callback', passport.authenticate('google'), (req, res) => {
  const token = tokenService.generateAccessToken(req.user);
  res.redirect(`/auth-success?token=${token}`);
});

module.exports = router;
```

---

## 9.2 Data Encryption

### Encryption at Rest

```javascript
// shared/encryption/encryptionService.js
const crypto = require('crypto');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
  }

  encrypt(data, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(key), iv);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      iv: iv.toString('hex'),
      encrypted,
      authTag: authTag.toString('hex')
    };
  }

  decrypt(encryptedData, key) {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      Buffer.from(key),
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  // Hash sensitive data (one-way)
  hashSensitiveData(data, salt) {
    return crypto
      .pbkdf2Sync(data, salt, 100000, 64, 'sha512')
      .toString('hex');
  }
}

module.exports = EncryptionService;
```

### Database Model with Encryption

```javascript
// services/user-service/src/models/SensitiveData.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SensitiveData = sequelize.define('SensitiveData', {
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    // Encrypted SSN
    ssn: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const encrypted = this.getDataValue('ssn');
        if (!encrypted) return null;
        return encryptionService.decrypt(JSON.parse(encrypted), process.env.ENCRYPTION_KEY);
      },
      set(value) {
        if (!value) {
          this.setDataValue('ssn', null);
        } else {
          const encrypted = encryptionService.encrypt(value, process.env.ENCRYPTION_KEY);
          this.setDataValue('ssn', JSON.stringify(encrypted));
        }
      }
    }
  }, {
    timestamps: true,
    tableName: 'sensitive_data'
  });

  return SensitiveData;
};
```

---

## 9.3 TLS/HTTPS Configuration

### Express with HTTPS

```javascript
// services/user-service/src/server.js
const https = require('https');
const fs = require('fs');
const app = require('./app');
const logger = require('@platform/logger');

const PORT = process.env.PORT || 3001;

const httpsOptions = {
  key: fs.readFileSync(process.env.PRIVATE_KEY_PATH),
  cert: fs.readFileSync(process.env.CERTIFICATE_PATH)
};

https.createServer(httpsOptions, app).listen(PORT, () => {
  logger.info(`HTTPS server listening on port ${PORT}`);
});
```

### Kubernetes TLS

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: tls-secret
  namespace: microservices
type: kubernetes.io/tls
data:
  tls.crt: <base64-encoded-certificate>
  tls.key: <base64-encoded-key>

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ingress
  namespace: microservices
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - api.example.com
    secretName: tls-secret
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-gateway
            port:
              number: 3000
```

---

## 9.4 Input Validation & Sanitization

### Comprehensive Validation

```javascript
// shared/validation/validators.js
const Joi = require('joi');
const xss = require('xss');

// Email validation
const emailSchema = Joi.string()
  .email()
  .max(255)
  .required();

// Password validation
const passwordSchema = Joi.string()
  .min(12)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
  .required()
  .messages({
    'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character'
  });

// User registration schema
const userRegistrationSchema = Joi.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: Joi.string().max(100),
  lastName: Joi.string().max(100)
});

// XSS prevention
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return xss(input, {
      whiteList: {},
      stripIgnoredTag: true
    });
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized = Array.isArray(input) ? [] : {};
    for (const key in input) {
      sanitized[key] = sanitizeInput(input[key]);
    }
    return sanitized;
  }
  return input;
};

// SQL injection prevention (using parameterized queries)
const getUserByEmail = async (email) => {
  // Bad - vulnerable to SQL injection
  // const user = await db.query(`SELECT * FROM users WHERE email = '${email}'`);
  
  // Good - parameterized query
  const user = await User.findOne({ where: { email } });
  return user;
};

module.exports = {
  emailSchema,
  passwordSchema,
  userRegistrationSchema,
  sanitizeInput
};
```

---

## 9.5 CORS & Headers Security

### Security Headers Middleware

```javascript
// shared/middleware/securityHeaders.js
const helmet = require('helmet');

const securityHeadersMiddleware = helmet({
  // Prevent clickjacking
  frameguard: {
    action: 'deny'
  },
  
  // Prevent MIME type sniffing
  noSniff: true,
  
  // Enable XSS filter
  xssFilter: true,
  
  // Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  
  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

module.exports = securityHeadersMiddleware;
```

### CORS Configuration

```javascript
// shared/middleware/corsConfig.js
const cors = require('cors');

const corsOptions = {
  origin: function(origin, callback) {
    const whitelist = (process.env.ALLOWED_ORIGINS || '').split(',');
    
    if (whitelist.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Number'],
  maxAge: 3600
};

module.exports = cors(corsOptions);
```

---

## 9.6 Dependency Management

### Security Scanning

```bash
# npm audit - built-in
npm audit
npm audit fix

# Snyk - advanced vulnerability scanning
npm install -g snyk
snyk test
snyk monitor

# OWASP Dependency Check
dependency-check --project "Project Name" --scan ./node_modules

# package.json with version pinning
{
  "dependencies": {
    "express": "4.18.2",  # Pinned version
    "sequelize": "~6.32.0" # Compatible version
  }
}
```

---

## 9.7 API Rate Limiting & Throttling

### Advanced Rate Limiting

```javascript
// services/api-gateway/src/middleware/advancedRateLimiter.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const client = redis.createClient({ url: process.env.REDIS_URL });

// Global rate limiter
const globalLimiter = rateLimit({
  store: new RedisStore({
    client,
    prefix: 'rl:global:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  skip: (req) => req.user?.role === 'admin' // Skip for admins
});

// Per-user rate limiter
const perUserLimiter = rateLimit({
  store: new RedisStore({
    client,
    prefix: 'rl:user:'
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  keyGenerator: (req) => req.user?.id || req.ip
});

// Per-endpoint limiter
const createUserLimiter = rateLimit({
  store: new RedisStore({
    client,
    prefix: 'rl:create:user:'
  }),
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5,
  keyGenerator: (req) => req.ip,
  message: 'Too many user accounts created from this IP'
});

module.exports = {
  globalLimiter,
  perUserLimiter,
  createUserLimiter
};
```

---

## 9.8 Secrets Management

### Environment Variables

```bash
# .env.example (NO secrets - just keys)
JWT_SECRET=<generate-and-set-locally>
DATABASE_PASSWORD=<set-in-production>
STRIPE_API_KEY=<set-in-production>

# Using AWS Secrets Manager
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

const getSecret = async (secretName) => {
  try {
    const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
    return JSON.parse(data.SecretString);
  } catch (error) {
    throw new Error(`Failed to retrieve secret: ${secretName}`);
  }
};

// Kubernetes Secrets
# kubectl create secret generic api-secrets \
  --from-literal=jwt-secret=your-secret \
  --from-literal=db-password=your-password \
  -n microservices
```

---

## 9.9 Audit Logging

### Security Event Logging

```javascript
// shared/audit-logger/auditLogger.js
class AuditLogger {
  constructor(logger) {
    this.logger = logger;
  }

  logAuthenticationEvent(user, success, reason = null) {
    this.logger.info('Authentication Event', {
      eventType: 'authentication',
      userId: user?.id,
      email: user?.email,
      success,
      reason,
      ip: this.request.ip,
      userAgent: this.request.get('user-agent'),
      timestamp: new Date()
    });
  }

  logAuthorizationEvent(userId, resource, action, allowed) {
    this.logger.info('Authorization Event', {
      eventType: 'authorization',
      userId,
      resource,
      action,
      allowed,
      timestamp: new Date()
    });
  }

  logDataAccessEvent(userId, dataType, recordCount) {
    this.logger.info('Data Access Event', {
      eventType: 'data_access',
      userId,
      dataType,
      recordCount,
      timestamp: new Date()
    });
  }

  logSecurityAlert(severity, message, details) {
    this.logger.warn('Security Alert', {
      eventType: 'security_alert',
      severity,
      message,
      details,
      timestamp: new Date()
    });
  }
}

module.exports = AuditLogger;
```

---

## 9.10 Security Checklist

**Authentication & Authorization**
- [ ] JWT tokens with short expiration (15 min)
- [ ] Refresh tokens stored securely (HTTP-only cookies)
- [ ] OAuth2 for third-party integrations
- [ ] Role-based access control (RBAC)
- [ ] Principle of least privilege implemented

**Encryption**
- [ ] TLS/HTTPS for all communications
- [ ] Sensitive data encrypted at rest (AES-256)
- [ ] Secure key management (AWS KMS / Vault)
- [ ] Database connections encrypted
- [ ] Backups encrypted

**Input Validation**
- [ ] All inputs validated with Joi/Zod
- [ ] XSS prevention (input sanitization)
- [ ] SQL injection prevention (parameterized queries)
- [ ] CSRF protection tokens
- [ ] File upload validation

**API Security**
- [ ] Rate limiting enabled
- [ ] API keys rotated regularly
- [ ] CORS properly configured
- [ ] Security headers implemented
- [ ] API versioning for backwards compatibility

**Data Protection**
- [ ] PII encryption/masking
- [ ] GDPR compliance (right to be forgotten)
- [ ] Data retention policies
- [ ] Secure deletion procedures
- [ ] Audit logging of data access

**Dependency Management**
- [ ] Regular dependency updates
- [ ] Security vulnerability scanning (npm audit, Snyk)
- [ ] Pinned dependency versions
- [ ] No dev dependencies in production
- [ ] License compliance

**Infrastructure Security**
- [ ] Network segmentation (VPC)
- [ ] Security groups / firewall rules
- [ ] WAF (Web Application Firewall)
- [ ] DDoS protection
- [ ] Intrusion detection

**Operational Security**
- [ ] Secrets management (HashiCorp Vault, AWS Secrets Manager)
- [ ] Multi-factor authentication for admin access
- [ ] SSH key rotation
- [ ] Log monitoring and alerting
- [ ] Incident response plan

**Compliance**
- [ ] OWASP Top 10 covered
- [ ] PCI DSS (if handling payments)
- [ ] GDPR compliance
- [ ] SOC 2 Type II ready
- [ ] Regular security audits

---

## 9.11 Security Testing

### OWASP ZAP Security Testing

```bash
# Docker installation
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:3000

# Report generation
docker run -v $(pwd):/zap/wrk:rw -t owasp/zap2docker-stable \
  zap-full-scan.py -t http://localhost:3000 \
  -r zap-report.html
```

### Penetration Testing Checklist

- [ ] SQL Injection attempts
- [ ] Cross-Site Scripting (XSS)
- [ ] Cross-Site Request Forgery (CSRF)
- [ ] Authentication bypass
- [ ] Authorization bypass
- [ ] Sensitive data exposure
- [ ] Insecure deserialization
- [ ] Using components with known vulnerabilities
- [ ] Insufficient logging & monitoring
- [ ] Broken access control

This comprehensive security guide ensures your microservices platform is production-ready and secure.
