# Troubleshooting Guide

## Common Issues & Solutions

### Backend Issues

#### 1. Database Connection Error
**Error Message:** `connect ECONNREFUSED 127.0.0.1:5432`

**Causes & Solutions:**
- PostgreSQL not running
- Wrong credentials in `.env`
- Database doesn't exist

**Fix:**
```bash
# Check if PostgreSQL is running
systemctl status postgresql
# or
pg_isready

# If not running, start it
systemctl start postgresql
# or on macOS
brew services start postgresql

# Verify database exists
psql -U postgres -l | grep robro_system

# Create if doesn't exist
createdb -U postgres robro_system
```

#### 2. Port 5000 Already in Use
**Error Message:** `listen EADDRINUSE: address already in use :::5000`

**Fix:**
```bash
# Find process using port 5000
lsof -i :5000
# or
netstat -tulpn | grep 5000

# Kill the process
kill -9 <PID>

# Or use different port in .env
PORT=5001
```

#### 3. JWT Token Errors
**Error Message:** `Invalid or expired token`

**Causes & Solutions:**
- Token expired (check JWT_EXPIRE in .env)
- JWT_SECRET changed between requests
- Token string malformed

**Fix:**
```bash
# Get new token by logging in again
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123"}'

# Use new token in subsequent requests
```

#### 4. Uploads Folder Permission Error
**Error Message:** `EACCES: permission denied, open './uploads'`

**Fix:**
```bash
# Create uploads folder if missing
mkdir -p backend/uploads

# Fix permissions (Linux/macOS)
chmod 755 backend/uploads
chmod 755 backend/uploads/*

# Or fix on Windows
icacls backend\uploads /grant:r "%USERNAME%:F"
```

#### 5. Node Modules Missing Dependencies
**Error Message:** `Cannot find module 'express'`

**Fix:**
```bash
cd backend
rm package-lock.json
npm install
```

#### 6. .env File Not Found
**Error Message:** `SyntaxError: Cannot find module`

**Fix:**
```bash
# Copy example to .env
cp backend/.env.example backend/.env

# Or create manually
cat > backend/.env << 'EOF'
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=robro_system
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
UPLOAD_DIR=./uploads
EOF
```

---

### Frontend Issues

#### 1. Angular CLI Not Found
**Error Message:** `ng: command not found`

**Fix:**
```bash
cd frontend
npm install -g @angular/cli
# or use local version
npx ng serve
```

#### 2. Port 4200 Already in Use
**Error Message:** `A server is already running at port 4200`

**Fix:**
```bash
# Use different port
ng serve --port 4201

# Or kill existing process
lsof -i :4200
kill -9 <PID>
```

#### 3. CORS Error from Frontend
**Error Message:** `Access to XMLHttpRequest at 'http://localhost:5000/api...' from origin 'http://localhost:4200' has been blocked by CORS policy`

**Causes & Solutions:**
- Backend CORS not configured for frontend URL
- Backend not running

**Fix:**
```javascript
// In backend server.js, verify CORS is enabled:
app.use(cors());

// For specific domains:
app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:3000'],
  credentials: true
}));

// Restart backend
npm start
```

#### 4. Login Redirects to Blank Page
**Error Message:** `Blank page after login`

**Causes & Solutions:**
- Angular routing issue
- Missing routing module

**Fix:**
```typescript
// Verify routing is set up in app.module.ts
\\ Check if RouterModule is imported
import { RouterModule } from '@angular/router';

// Manually navigate if needed
window.location.href = '/dashboard';
```

#### 5. Images Not Loading
**Error Message:** Image shows broken icon

**Causes & Solutions:**
- Incorrect image path
- Backend not serving uploads
- CORS blocking image access

**Fix:**
```typescript
// In dashboard.component.ts, verify image path:
[src]="'http://localhost:5000/' + image.filename"

// Backend must serve static files:
app.use(express.static(path.join(__dirname, 'uploads')));
```

#### 6. Camera Permission Denied
**Error Message:** `NotAllowedError: Permission denied`

**Causes & Solutions:**
- Browser doesn't have camera permission
- Running over HTTP (HTTPS required for some browsers)
- No camera hardware available

**Fix:**
```typescript
// Add error handling:
.catch((err: any) => {
  if (err.name === 'NotAllowedError') {
    alert('Camera permission denied');
  }
});

// Check browser camera settings
// Allow site permission in browser
```

#### 7. File Upload Fails
**Error Message:** `Upload failed`

**Causes & Solutions:**
- File too large (> 50MB limit)
- Wrong file type
- Backend not accepting uploads
- No permissions on uploads folder

**Fix:**
```typescript
// Check file validation in image.service.ts
const formData = new FormData();
formData.append('image', file);

// Verify file size and type
if (file.size > 50 * 1024 * 1024) {
  alert('File too large');
}
```

---

### Database Issues

#### 1. Tables Not Created
**Error Message:** `relation "users" does not exist`

**Fix:**
```bash
# Run migrations to create tables
cd backend
npm run db:migrate
npm run db:seed
```

If `psql` is not available, do not worry; the migration commands work without it.

If you still need the PostgreSQL CLI, install PostgreSQL client tools and add `psql` to your PATH.

#### 2. Admin User Not Found
**Error Message:** `Invalid credentials` even with admin/Admin@123

**Fix:**
```bash
# Check if admin user exists
psql -U postgres -d robro_system
SELECT * FROM users WHERE username='admin';

# If missing, insert admin
INSERT INTO users (username, email, password, role_id, is_active, created_at, updated_at)
VALUES ('admin', 'admin@robro.com', '$2a$10$...hashed_password...', 1, true, NOW(), NOW());
```

#### 3. Foreign Key Constraint Error
**Error Message:** `violates foreign key constraint`

**Causes & Solutions:**
- Trying to create user with non-existent role
- Deleting role while users exist

**Fix:**
```bash
# Check roles exist
SELECT * FROM roles;

# Create roles if missing
INSERT INTO roles (name, description, permissions)
VALUES ('Admin', 'Administrator', '["all"]'::json);
```

---

### Authentication Issues

#### 1. Logout Not Working
**Error Message:** Still logged in after logout

**Fix:**
```typescript
// In auth.service.ts, verify logout clears everything:
logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
  this.authToken$.next(null);
  window.location.href = '/login';
}
```

#### 2. Token Lost After Page Refresh
**Error Message:** Logged out after refresh

**Fix:**
```typescript
// Token should persist in localStorage
// Verify storage after login:
localStorage.getItem('authToken')

// In browser console:
console.log(localStorage);
```

#### 3. Password Hashing Issues
**Error Message:** Can't login despite correct password

**Causes & Solutions:**
- Password not hashed before storing
- Different salt used

**Fix:**
```javascript
// Verify bcryptjs is used:
const bcrypt = require('bcryptjs');

// Hash password before saving:
const hashedPassword = await bcrypt.hash(password, 10);

// Verify on login:
const isValid = await bcrypt.compare(inputPassword, storedHash);
```

---

### Network Issues

#### 1. API Calls Not Being Sent
**Error Message:** No network activity in DevTools

**Fix:**
```typescript
// Verify token is in request:
// In browser DevTools > Network > Headers
// Authorization: Bearer <token>

// Check HTTP status (401, 403, etc.)
// Add debugging:
this.http.get(url, { headers }).subscribe(
  response => console.log('Success', response),
  error => console.error('Error', error)
);
```

#### 2. Slow API Response
**Error Message:** Long loading times

**Causes & Solutions:**
- Large image files
- Slow database queries
- Network latency

**Fix:**
```bash
# Check backend server logs
# Monitor database performance
# Optimize queries
# Add pagination for image lists
```

#### 3. 502 Bad Gateway
**Error Message:** `502 Bad Gateway`

**Causes & Solutions:**
- Backend server crashed
- Proxy misconfigured

**Fix:**
```bash
# Check backend is running
npm start

# Check logs for errors
pm2 logs

# Restart backend
npm restart
```

---

### Deployment Issues

#### 1. SSL Certificate Error
**Error Message:** `ERR_CERT_COMMON_NAME_INVALID`

**Fix:**
```bash
# For Let's Encrypt
sudo certbot certonly --standalone -d your-domain.com

# Update nginx config with cert paths
ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
```

#### 2. CORS on Production
**Error Message:** CORS error on deployed app

**Fix:**
```javascript
// Update CORS in backend for production domain
app.use(cors({
  origin: 'https://your-domain.com',
  credentials: true
}));
```

---

## Debug Checklist

When experiencing issues, check:

- [ ] Node.js and npm versions correct
- [ ] PostgreSQL running
- [ ] Database created and seeded
- [ ] .env file configured
- [ ] Backend server running (port 5000)
- [ ] Frontend running (port 4200)
- [ ] Browser console for JS errors
- [ ] Network tab for API issues
- [ ] Backend logs for errors
- [ ] File permissions on uploads folder
- [ ] Firewall not blocking ports
- [ ] No process conflicts on ports

---

## Getting More Help

### Check Logs
```bash
# Backend logs
npm start  # watch output

# With PM2
pm2 logs robro-system

# Frontend logs
Open DevTools (F12)
Check Console tab

# Database logs
journalctl -u postgresql
# or
tail -f /var/log/postgresql/postgresql.log
```

### Enable Debug Mode
```bash
# Temporary debug in Node
NODE_DEBUG=* npm start

# Angular debug
ng serve --source-map
```

### Common Commands for Testing
```bash
# Test backend API
curl http://localhost:5000/api/health

# Test database
psql -U postgres robro_system -c "SELECT * FROM users;"

# Test frontend
curl http://localhost:4200
```

---

**If issues persist, check:**
- Robro-System-Assignment.pdf (requirements)
- README.md (overview)
- API_DOCUMENTATION.md (API details)
