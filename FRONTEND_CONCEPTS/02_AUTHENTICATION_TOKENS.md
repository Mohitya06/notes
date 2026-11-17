# Authentication Tokens: JWT, OAuth2, Sessions & Refresh Strategies

## 1. JWT (JSON Web Tokens)

### What is JWT?

JWT is a stateless authentication method that uses digitally signed tokens to verify user identity.

### JWT Structure

A JWT consists of three parts separated by dots: `header.payload.signature`

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

Header:    eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
           {"alg":"HS256","typ":"JWT"}

Payload:   eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ
           {"sub":"1234567890","name":"John Doe","iat":1516239022}

Signature: SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
           HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)
```

### JWT Implementation

```javascript
// 1. JWT Library (jsonwebtoken)
const jwt = require('jsonwebtoken');

// Create JWT
const token = jwt.sign(
  {
    sub: user.id,
    email: user.email,
    role: user.role,
    permissions: user.permissions
  },
  process.env.JWT_SECRET,
  {
    expiresIn: '15m',      // Token expires in 15 minutes
    issuer: 'myapp',        // Who issued the token
    audience: 'myapp-users', // Who can use the token
    algorithm: 'HS256'      // Signing algorithm
  }
);

// Verify JWT
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET, {
    issuer: 'myapp',
    audience: 'myapp-users'
  });
  console.log(decoded); // { sub: 1, email: '...', iat: ..., exp: ... }
} catch (error) {
  console.error('Invalid token:', error.message);
}

// Decode without verifying (for debugging)
const decoded = jwt.decode(token);
console.log(decoded);
```

### Frontend JWT Handling

```javascript
// 1. Store JWT (after login)
class AuthService {
  static async login(email, password) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (response.ok) {
      // Store access token in memory or sessionStorage (NOT localStorage for XSS protection)
      this.accessToken = data.accessToken;
      
      // Store refresh token in httpOnly cookie (done by server)
      // Server sets: Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict
      
      return { success: true, user: data.user };
    }
    
    return { success: false, error: data.error };
  }

  static getAccessToken() {
    return this.accessToken;
  }

  static setAccessToken(token) {
    this.accessToken = token;
  }

  static clearAccessToken() {
    this.accessToken = null;
  }
}

// 2. Send JWT with requests
class APIClient {
  static async request(url, options = {}) {
    const token = AuthService.getAccessToken();
    
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include' // Send cookies with request
    });

    // Handle 401 (token expired)
    if (response.status === 401) {
      const newToken = await this.refreshToken();
      if (newToken) {
        // Retry with new token
        headers['Authorization'] = `Bearer ${newToken}`;
        return fetch(url, { ...options, headers });
      } else {
        // Redirect to login
        window.location.href = '/login';
      }
    }

    return response;
  }

  static async refreshToken() {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include' // Send refresh token cookie
      });

      if (response.ok) {
        const data = await response.json();
        AuthService.setAccessToken(data.accessToken);
        return data.accessToken;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    
    return null;
  }
}

// Usage
async function fetchUserProfile() {
  try {
    const response = await APIClient.request('/api/users/profile');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch profile:', error);
  }
}
```

### Refresh Token Strategy

```javascript
// Backend refresh token endpoint
app.post('/api/auth/refresh', (req, res) => {
  // Get refresh token from cookie
  const refreshToken = req.cookies.refreshToken;
  
  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token' });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    // Check if refresh token is blacklisted or revoked
    if (isTokenRevoked(refreshToken)) {
      return res.status(401).json({ error: 'Token revoked' });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      {
        sub: decoded.sub,
        email: decoded.email,
        role: decoded.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Optionally generate new refresh token
    const newRefreshToken = jwt.sign(
      { sub: decoded.sub },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      accessToken: newAccessToken,
      expiresIn: 900 // 15 minutes
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});
```

---

## 2. OAuth2 & OpenID Connect

### OAuth2 Flow

OAuth2 is an authorization framework for delegated access.

```
1. User clicks "Login with Google"
2. Redirect to Google authorization endpoint
3. Google shows permission screen
4. User approves
5. Google redirects back with authorization code
6. Backend exchanges code for access token
7. Backend gets user info from provider
8. Backend creates session/JWT for user
9. User is logged in
```

### OAuth2 Implementation (Google)

```javascript
// Frontend - Trigger Google login
function handleGoogleLogin() {
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${REDIRECT_URI}&` +
    `response_type=code&` +
    `scope=openid email profile`;
}

// Backend - Handle OAuth callback
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Find or create user
    let user = await User.findOne({ googleId: profile.id });
    
    if (!user) {
      user = await User.create({
        googleId: profile.id,
        email: profile.emails[0].value,
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        verified: true
      });
    }
    
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

// OAuth callback route
app.get('/api/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Generate JWT
    const token = jwt.sign(
      { sub: req.user.id, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, { httpOnly: true });

    // Redirect to frontend with token
    res.redirect(`/dashboard?token=${token}`);
  }
);

// Frontend - Capture token from URL
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  
  if (token) {
    AuthService.setAccessToken(token);
    window.history.replaceState({}, document.title, '/dashboard');
    navigate('/dashboard');
  }
}, []);
```

---

## 3. Session-Based Authentication

### Traditional Session Management

```javascript
// Backend - Create session
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  // Verify credentials
  const user = findUser(email);
  if (!user || !verifyPassword(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Create session
  req.session.userId = user.id;
  req.session.email = user.email;
  req.session.role = user.role;

  // Send success response
  res.json({ success: true, user });
  // Session cookie automatically sent in Set-Cookie header
});

// Backend - Verify session
app.get('/api/users/profile', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = findUserById(req.session.userId);
  res.json(user);
});

// Backend - Logout
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    
    // Clear session cookie
    res.clearCookie('sessionId');
    res.json({ success: true });
  });
});

// Frontend - Sessions are automatic
async function fetchProfile() {
  const response = await fetch('/api/users/profile', {
    credentials: 'include' // Important: send cookies
  });
  return response.json();
}

async function logout() {
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include'
  });
}
```

---

## 4. Token Validation & Expiration

### Frontend Token Validation

```javascript
// Check token expiration
function isTokenExpired(token) {
  const decoded = jwt.decode(token);
  if (!decoded || !decoded.exp) return true;
  
  const expirationTime = decoded.exp * 1000; // Convert to milliseconds
  return Date.now() >= expirationTime;
}

// Decode and use token claims
function getUserFromToken(token) {
  const decoded = jwt.decode(token);
  return {
    id: decoded.sub,
    email: decoded.email,
    role: decoded.role
  };
}

// Protected route component
function ProtectedRoute({ children }) {
  const token = AuthService.getAccessToken();
  
  if (!token || isTokenExpired(token)) {
    return <Navigate to="/login" />;
  }

  const user = getUserFromToken(token);
  
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

// Role-based access
function RoleBasedRoute({ children, requiredRole }) {
  const token = AuthService.getAccessToken();
  
  if (!token) {
    return <Navigate to="/login" />;
  }

  const decoded = jwt.decode(token);
  
  if (decoded.role !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}
```

### Backend Token Validation

```javascript
// Middleware to verify JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(403).json({ error: 'Invalid token' });
    }

    req.user = decoded;
    next();
  });
}

// Use middleware
app.get('/api/users/profile', authenticateToken, (req, res) => {
  const user = User.findById(req.user.sub);
  res.json(user);
});

// Role-based middleware
function authorizeRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// Admin-only route
app.delete('/api/users/:id', authenticateToken, authorizeRole('admin'), (req, res) => {
  // Delete user
});
```

---

## 5. Token Revocation & Blacklisting

### Token Blacklist

```javascript
// Store revoked tokens in Redis
const redis = require('redis');
const client = redis.createClient();

// Blacklist token on logout
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  const token = req.headers['authorization'].split(' ')[1];
  const decoded = jwt.decode(token);
  
  // Calculate TTL (time until token would expire)
  const ttl = decoded.exp - Math.floor(Date.now() / 1000);
  
  // Add to blacklist
  client.setex(`blacklist:${token}`, ttl, '1');
  
  res.json({ success: true });
});

// Check blacklist in middleware
function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }

  // Check if token is blacklisted
  client.get(`blacklist:${token}`, (err, result) => {
    if (result) {
      return res.status(401).json({ error: 'Token revoked' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ error: 'Invalid token' });
      req.user = decoded;
      next();
    });
  });
}
```

---

## 6. Multi-Factor Authentication (MFA)

### TOTP (Time-based One-Time Password)

```javascript
// Backend - Generate TOTP secret
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

app.post('/api/auth/setup-2fa', authenticateToken, async (req, res) => {
  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `MyApp (${req.user.email})`,
    issuer: 'MyApp'
  });

  // Generate QR code
  const qrCode = await QRCode.toDataURL(secret.otpauth_url);

  // Store secret (encrypted) for user (not yet verified)
  res.json({
    secret: secret.base32,
    qrCode: qrCode
  });
});

// Verify TOTP
app.post('/api/auth/verify-2fa', authenticateToken, (req, res) => {
  const { token, secret } = req.body;

  const verified = speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2 // Allow 30 seconds drift
  });

  if (verified) {
    // Enable 2FA for user
    User.update({ twoFactorSecret: encrypt(secret) }, {
      where: { id: req.user.sub }
    });

    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid code' });
  }
});

// Login with 2FA
app.post('/api/auth/login', (req, res) => {
  const user = findUser(req.body.email);
  
  if (user && verifyPassword(req.body.password, user.password)) {
    if (user.twoFactorEnabled) {
      // Send temporary token (valid for 5 minutes)
      const tempToken = jwt.sign(
        { sub: user.id, type: '2fa' },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );

      return res.json({
        requiresMfa: true,
        tempToken: tempToken
      });
    }

    // No 2FA, return access token
    const accessToken = jwt.sign(
      { sub: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({ accessToken });
  }
});

// Verify MFA code
app.post('/api/auth/verify-mfa', (req, res) => {
  try {
    const tempDecoded = jwt.verify(req.body.tempToken, process.env.JWT_SECRET);
    
    if (tempDecoded.type !== '2fa') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    const user = User.findById(tempDecoded.sub);
    const verified = speakeasy.totp.verify({
      secret: decrypt(user.twoFactorSecret),
      encoding: 'base32',
      token: req.body.code
    });

    if (verified) {
      const accessToken = jwt.sign(
        { sub: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      res.json({ accessToken });
    } else {
      res.status(401).json({ error: 'Invalid code' });
    }
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});
```

---

## 7. Comparison: JWT vs Sessions vs OAuth2

| Feature | JWT | Session | OAuth2 |
|---------|-----|---------|--------|
| **Stateless** | ✅ Yes | ❌ No | ✅ Yes |
| **Scalability** | ✅ High | ❌ Low | ✅ High |
| **Revocation** | ⚠️ Hard | ✅ Easy | ✅ Easy |
| **CSRF Safe** | ✅ Yes | ⚠️ Needs token | ✅ Yes |
| **Third-party** | ❌ No | ❌ No | ✅ Yes |
| **Mobile Friendly** | ✅ Yes | ⚠️ Limited | ✅ Yes |
| **Complexity** | ⚠️ Medium | ✅ Low | ❌ High |

---

## 8. Security Best Practices

```javascript
// ✅ DO:
1. Use HTTPS only
2. Store tokens securely (httpOnly cookies for sensitive, memory for access)
3. Use short expiration times (15 minutes)
4. Implement refresh tokens
5. Validate tokens on every request
6. Use strong secrets
7. Implement rate limiting on auth endpoints
8. Log authentication events
9. Use SameSite cookies
10. Implement MFA for sensitive operations

// ❌ DON'T:
1. Store tokens in localStorage (XSS vulnerable)
2. Send tokens as query parameters
3. Use weak secrets
4. Skip token verification
5. Allow long expiration times
6. Send tokens over HTTP
7. Expose sensitive claims in token
8. Trust frontend validation alone
9. Use same secret for all tokens
10. Store passwords in tokens
```

This comprehensive authentication guide covers all major authentication methods with practical implementations!
