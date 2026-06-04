# 🚀 Quick Start Guide

## Prerequisites Checklist
- [ ] Node.js v14+ installed
- [ ] PostgreSQL v12+ installed and running
- [ ] Git installed
- [ ] Terminal/Command Prompt access

## ⚡ Quick Setup (5-10 minutes)

### Step 1: Database Setup
```bash
# Open PostgreSQL and run:
CREATE DATABASE robro_system;
```

### Step 2: Backend Setup
```bash
cd backend
npm install
# Verify .env is configured (default values should work)
npm start
```
✅ Backend should be running on http://localhost:5000

### Step 3: Frontend Setup (New Terminal)
```bash
cd frontend
npm install
npm start
```
✅ Frontend should open on http://localhost:4173

## 🔑 Default Credentials
```
Username: admin
Password: Admin@123
```

## 🧪 Test the Application

### Test 1: Login
1. Go to http://localhost:4200
2. Login with: `admin` / `Admin@123`
3. Should redirect to dashboard

### Test 2: Capture Image
1. Click "📷 Capture Image" button
2. Allow camera access when prompted
3. Click "Capture" or "Upload Image"
4. Image should appear in gallery

### Test 3: Admin Features
1. After login, click "⚙️ Admin Panel"
2. Create new user with role assignment
3. View all users in "Users Management" tab

## 🔗 API Testing

### Option 1: Using Postman
1. Import collection from `docs/` (if available)
2. Test endpoints with provided examples

### Option 2: Using cURL
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123"}'

# Get token from response and use in next requests

# Upload Image (with token)
curl -X POST http://localhost:5000/api/images/upload \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -F "image=@/path/to/image.jpg"
```

## 📦 Project Commands

### Root Level
```bash
npm run backend:start   # Start only backend
npm run backend:dev     # Backend with nodemon
npm run frontend:start  # Start only frontend
npm run frontend:dev    # Frontend with hot reload
```

### Backend
```bash
cd backend
npm start               # Production mode
npm run dev            # Development with nodemon
```

### Frontend
```bash
cd frontend
npm start              # Dev server with hot reload
npm run build         # Production build
npm run dev           # Dev server with auto-open
```

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Port 5000 already in use | Change PORT in `backend/.env` |
| Database connection error | Verify PostgreSQL is running |
| Camera permission denied | Check browser settings |
| CORS errors | Restart backend server |
| npm install fails | Use `npm install --legacy-peer-deps` |

## 📁 Important Files

| File | Purpose |
|------|---------|
| `backend/.env` | Backend configuration |
| `backend/server.js` | Express server entry point |
| `backend/package.json` | Backend scripts and dependencies |
| `frontend/src/main.tsx` | React entry point |
| `README.md` | Full documentation |

## ✅ Verification Checklist

- [ ] PostgreSQL running
- [ ] Backend server running (port 5000)
- [ ] Frontend running (port 4173)
- [ ] Can login with admin credentials
- [ ] Can capture image
- [ ] Can view image gallery
- [ ] Admin can create users

## 📞 Need Help?

Refer to:
1. README.md - Full documentation
2. Backend console logs - For server errors
3. Browser console (F12) - For frontend errors
4. Robro-System-Assignment.pdf - Requirements document

---

**Enjoy building!** 🎉
