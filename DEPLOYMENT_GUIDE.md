# Deployment Guide

## Prerequisites
- Node.js v14+
- PostgreSQL v12+
- npm or yarn

## Production Deployment Steps

### 1. Backend Deployment

#### 1.1 Environment Configuration
```bash
cp backend/.env.example backend/.env

# Edit .env with production values:
```

```
PORT=5000
NODE_ENV=production
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=robro_system
DB_USER=db_user
DB_PASSWORD=strong_password
JWT_SECRET=generate_secure_token_here
JWT_EXPIRE=7d
UPLOAD_DIR=/var/uploads
```

#### 1.2 Database Setup
```bash
# Create database (as PostgreSQL admin)
createdb robro_system

# Run setup script
psql -U postgres -d robro_system -f DATABASE_SETUP.sql
```

#### 1.3 Install & Start Backend
```bash
cd backend
npm install --production
npm start
```

### 2. Frontend Deployment

#### 2.1 Environment Configuration
```bash
cp frontend/.env.example frontend/.env

# Edit .env:
```

```
ANGULAR_APP_API_URL=https://your-api.com/api
ANGULAR_APP_ENV=production
```

#### 2.2 Build Frontend
```bash
cd frontend
npm install --legacy-peer-deps
npm run build
```

#### 2.3 Deploy Built Files
The `dist/frontend` folder contains the production build.

```bash
# Copy to web server (nginx, Apache, etc.)
cp -r dist/frontend/* /var/www/html/robro-system/
```

### 3. Web Server Configuration (Nginx Example)

#### 3.1 Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/html/robro-system;
        try_files $uri $uri/ /index.html;
        expires 1h;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $http_host;
    }

    # Image uploads
    location /uploads {
        alias /var/uploads;
        expires 7d;
    }

    # SSL configuration
    listen 443 ssl http2;
    ssl_certificate /path/to/cert.crt;
    ssl_certificate_key /path/to/key.key;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### 4. Apache Configuration

#### 4.1 Apache VirtualHost
```apache
<VirtualHost *:443>
    ServerName your-domain.com
    
    DocumentRoot /var/www/html/robro-system
    
    <Directory /var/www/html/robro-system>
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    ProxyPreserveHost On
    ProxyPass /api http://localhost:5000/api
    ProxyPassReverse /api http://localhost:5000/api
    
    Alias /uploads /var/uploads
    <Directory /var/uploads>
        Options Indexes
    </Directory>
    
    SSLEngine on
    SSLCertificateFile /path/to/cert.crt
    SSLCertificateKeyFile /path/to/key.key
</VirtualHost>

<VirtualHost *:80>
    ServerName your-domain.com
    Redirect permanent / https://your-domain.com/
</VirtualHost>
```

### 5. PM2 Process Manager (Recommended for Backend)

#### 5.1 Install PM2
```bash
npm install -g pm2
```

#### 5.2 Create PM2 Config
```bash
cat > backend/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'robro-system',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/out.log',
    time_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF
```

#### 5.3 Start with PM2
```bash
cd backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 6. Docker Deployment (Optional)

#### 6.1 Backend Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm install --production

COPY backend . .

ENV NODE_ENV=production
EXPOSE 5000

CMD ["npm", "start"]
```

#### 6.2 Frontend Dockerfile
```dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

COPY frontend . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist/frontend /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 6.3 Docker Compose
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: robro_system
      POSTGRES_USER: robro_admin
      POSTGRES_PASSWORD: strong_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./DATABASE_SETUP.sql:/docker-entrypoint-initdb.d/setup.sql
    ports:
      - "5432:5432"

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    environment:
      DB_HOST: postgres
      DB_USER: robro_admin
      DB_PASSWORD: strong_password
      NODE_ENV: production
    depends_on:
      - postgres
    ports:
      - "5000:5000"
    volumes:
      - ./uploads:/app/uploads

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### 7. Security Checklist

- [ ] Change default admin password
- [ ] Set strong JWT_SECRET
- [ ] Enable HTTPS/SSL
- [ ] Use environment variables for sensitive data
- [ ] Set up database backups
- [ ] Enable CORS only for trusted domains
- [ ] Implement rate limiting
- [ ] Enable logging and monitoring
- [ ] Regular security updates
- [ ] Use strong database passwords
- [ ] Restrict file upload sizes
- [ ] Validate all user inputs
- [ ] Use HTTPS for API calls

### 8. Performance Optimization

- [ ] Enable database connection pooling
- [ ] Add Redis caching layer
- [ ] Compress API responses
- [ ] Implement CDN for static files
- [ ] Use load balancing
- [ ] Enable gzip compression
- [ ] Optimize database queries

### 9. Monitoring & Logging

#### 9.1 Backend Logging
```javascript
// Use winston or morgan for logging
const winston = require('winston');
const logger = winston.createLogger({
  filename: 'logs/app.log',
  format: winston.format.json(),
  level: 'info'
});
```

#### 9.2 Monitor with PM2
```bash
pm2 monit
pm2 logs robro-system
```

### 10. Backup Strategy

```bash
# PostgreSQL backup
pg_dump robro_system > backup_$(date +%Y%m%d).sql

# Uploads backup
tar -czvf uploads_backup_$(date +%Y%m%d).tar.gz ./uploads/

# Automated daily backup (cron)
0 2 * * * pg_dump robro_system | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz
```

---

## Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL status
systemctl status postgresql
pg_isready -h localhost -p 5432
```

### Port Already in Use
```bash
# Change port in .env or kill process using port
lsof -i :5000
kill -9 <PID>
```

### Permission Issues
```bash
# Ensure proper permissions
chmod 755 /var/www/html/robro-system
chmod 755 /var/uploads
chown www-data:www-data /var/uploads
```

### SSL Certificate Issues
```bash
# Use Let's Encrypt (free SSL)
sudo certbot certonly --standalone -d your-domain.com
```

---

**For more information, refer to README.md**
