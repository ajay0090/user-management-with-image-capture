# Robro System - User Management with Image Capturing App

A full-stack web application built with Angular frontend and Node.js/Express backend for user management and image capturing.

## 📋 Features

### 1. User Authentication
- Login functionality for Admin, Supervisor, and Worker roles
- Default admin account with credentials: `admin` / `Admin@123`
- JWT-based authentication
- Role-based access control

### 2. Admin Features
- Create new user accounts
- Assign roles to users (Admin, Supervisor, Worker)
- View all users and their details
- Deactivate user accounts
- Admin panel for user management

### 3. Image Capturing & Management
- Capture images using device camera
- Upload images from device
- View captured/uploaded images in gallery
- Delete images
- Secure image storage

### 4. Role-Based Access Control (RBAC)
- **Admin**: Full access to all features
- **Supervisor**: Limited access to view users and images
- **Worker**: Can capture and upload images

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **File Upload**: multer
- **CORS**: Enabled for frontend communication

### Frontend
- **Framework**: Angular (v21+)
- **Language**: TypeScript
- **HTTP Client**: Angular HttpClientModule
- **Routing**: Angular Router
- **Forms**: Reactive Forms & Template-driven Forms

## 📁 Project Structure

```
Assignment-1/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── imageController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Role.js
│   │   ├── Image.js
│   │   └── index.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── images.js
│   ├── uploads/
│   ├── server.js
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── login.component.ts
│   │   │   │   └── dashboard.component.ts
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── image.service.ts
│   │   │   │   └── admin.service.ts
│   │   │   ├── app.module.ts
│   │   │   └── app.component.ts
│   │   ├── main.ts
│   │   ├── index.html
│   │   └── styles.css
│   ├── tsconfig.json
│   └── package.json
│
├── .gitignore
├── README.md
└── package.json
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14+)
- PostgreSQL (v12+)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Create/update `.env` file:
   ```
   PORT=5000
   NODE_ENV=development
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=robro_system
   DB_USER=postgres
   DB_PASSWORD=postgres
   JWT_SECRET=your-secret-key-change-in-production
   JWT_EXPIRE=7d
   UPLOAD_DIR=./uploads
   ```

4. **Create PostgreSQL Database**
   ```sql
   CREATE DATABASE robro_system;
   ```

5. **Start backend server**
   ```bash
   npm start
   ```
   Server runs on: `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Start development server**
   ```bash
   npm start
   ```
   Application runs on: `http://localhost:4200`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/create-user` - Admin: Create new user
- `GET /api/auth/users` - Admin: Get all users
- `POST /api/auth/assign-role` - Admin: Assign role to user
- `POST /api/auth/deactivate-user` - Admin: Deactivate user

### Images
- `POST /api/images/upload` - Upload image
- `GET /api/images/my-images` - Get user's images
- `GET /api/images/download/:imageId` - Download image
- `DELETE /api/images/:imageId` - Delete image

### Health Check
- `GET /api/health` - Server health status

## 🔐 Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | Admin@123 |

## 📝 Database Schema

### Users Table
- id (INT, PRIMARY KEY)
- username (STRING, UNIQUE)
- email (STRING, UNIQUE)
- password (STRING, hashed)
- isActive (BOOLEAN)
- roleId (INT, FOREIGN KEY)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)

### Roles Table
- id (INT, PRIMARY KEY)
- name (STRING, UNIQUE)
- description (TEXT)
- permissions (JSON)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)

### Images Table
- id (INT, PRIMARY KEY)
- userId (INT, FOREIGN KEY)
- filename (STRING)
- filepath (STRING)
- mimeType (STRING)
- size (INT)
- description (TEXT)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)

## 🎯 Workflow

### As Admin User
1. Login with admin credentials
2. Access Admin Panel
3. Create new users and assign roles
4. Manage user accounts
5. View all users and their activities

### As Supervisor
1. Login with supervisor credentials
2. View assigned users
3. Monitor image uploads
4. Limited dashboard access

### As Worker
1. Login with worker credentials
2. Capture images using camera
3. Upload images from device
4. Manage personal image gallery
5. View image history

## 🎬 Usage Examples

### Login
```javascript
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "Admin@123"
}
```

### Create User (Admin Only)
```javascript
POST /api/auth/create-user
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "Pass@123",
  "roleId": 3
}
```

### Upload Image
```javascript
POST /api/images/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "image": <file>,
  "description": "Image description"
}
```

## 🧪 Testing

### Test Admin Login
- Username: `admin`
- Password: `Admin@123`

### Test Image Capture
1. Login to dashboard
2. Click "📷 Capture Image"
3. Allow camera access
4. Capture or upload image
5. View in gallery

## 🔄 Git Commit Flow

This project follows semantic commit messages:

- `Feat:` - New features
- `Fix:` - Bug fixes
- `Docs:` - Documentation changes
- `Refactor:` - Code refactoring
- `Test:` - Adding tests
- `Chore:` - Maintenance tasks

## 📋 Milestones

### ✅ Milestone 1: Authentication & User Management (30 points)
- [x] User registration and login
- [x] Admin user creation (default: admin/Admin@123)
- [x] Role assignment
- [x] Account removal

### ✅ Milestone 2: Role-Based Access Control (30 points)
- [x] RBAC implementation
- [x] Permission handling
- [x] Access controls for different roles

### ✅ Milestone 3: Image Capturing App (30 points)
- [x] Image capture component
- [x] Camera integration
- [x] Image upload
- [x] Image storage
- [x] Image management (view, delete)

### 📋 Milestone 4: Documentation & Deployment (10 points)
- [x] Setup instructions
- [x] API documentation
- [x] Database schema
- [ ] SQL backup scripts
- [ ] Deployment guide

## 🐛 Troubleshooting

### Database Connection Error
- Ensure PostgreSQL service is running
- Verify database credentials in `.env`
- Check database name and port

### Camera Access Denied
- Check browser permissions
- Use HTTPS in production
- Ensure camera hardware is available

### CORS Errors
- Verify frontend URL is allowed in backend
- Check CORS configuration in server.js

### Port Already in Use
- Change PORT in `.env` (backend)
- Use different Angular port: `ng serve --port 4201`

## 📧 Support

For issues or questions, please refer to the requirements document: `Robro-System-Assignment.pdf`

## 📄 License

ISC

---

**Project Created**: June 2, 2026  
**Framework**: Full-Stack Web Application  
**Status**: Active Development
