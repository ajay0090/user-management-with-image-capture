# API Documentation & Testing Guide

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints except `/auth/login` require JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Health Check
### Check Server Status
```bash
GET /health

Example:
curl http://localhost:5000/api/health
```

Response:
```json
{
  "status": "Server is running"
}
```

---

## Authentication Endpoints

### 1. Login
**Endpoint:** POST /auth/login
**Authentication:** None required
**Description:** User login with email or username and password

Request:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@robro.com",
    "password": "Admin@123"
  }'
```

Or using username:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin@123"
  }'
```

Response:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@robro.com",
    "role": "Admin"
  }
}
```

---

## Admin Endpoints (Require Admin Role)

### 2. Create User
**Endpoint:** POST /auth/create-user
**Authentication:** Required (Admin only)
**Description:** Create a new user account

Request:
```bash
curl -X POST http://localhost:5000/api/auth/create-user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass@123",
    "roleId": 3
  }'
```

Response:
```json
{
  "message": "User created successfully",
  "user": {
    "id": 2,
    "username": "john_doe",
    "email": "john@example.com",
    "roleId": 3
  }
}
```

### 3. Get All Users
**Endpoint:** GET /auth/users
**Authentication:** Required (Admin only)
**Description:** Retrieve list of all users

Request:
```bash
curl -X GET http://localhost:5000/api/auth/users \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "users": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@robro.com",
      "isActive": true,
      "Role": {
        "id": 1,
        "name": "Admin"
      },
      "createdAt": "2026-06-02T10:00:00Z"
    },
    ...
  ]
}
```

### 4. Get Roles
**Endpoint:** GET /auth/roles
**Authentication:** Required (Admin only)
**Description:** Retrieve the available role options for user creation and assignment

Request:
```bash
curl -X GET http://localhost:5000/api/auth/roles \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "roles": [
    { "id": 1, "name": "Admin", "description": "Administrator with full access" },
    { "id": 2, "name": "Supervisor", "description": "Supervisor with limited access" },
    { "id": 3, "name": "Worker", "description": "Worker with basic access" }
  ]
}
```

### 5. Assign Role
**Endpoint:** POST /auth/assign-role
**Authentication:** Required (Admin only)
**Description:** Change user role

Request:
```bash
curl -X POST http://localhost:5000/api/auth/assign-role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "userId": 2,
    "roleId": 2
  }'
```

Response:
```json
{
  "message": "Role assigned successfully",
  "user": {
    "id": 2,
    "username": "john_doe",
    "roleId": 2,
    ...
  }
}
```

### 5. Deactivate User
**Endpoint:** POST /auth/deactivate-user
**Authentication:** Required (Admin only)
**Description:** Deactivate a user account

Request:
```bash
curl -X POST http://localhost:5000/api/auth/deactivate-user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "userId": 2
  }'
```

Response:
```json
{
  "message": "User deactivated successfully"
}
```

### 6. Delete User
**Endpoint:** DELETE /auth/users/:id
**Authentication:** Required (Admin only)
**Description:** Delete a user account from the system

Request:
```bash
curl -X DELETE http://localhost:5000/api/auth/users/2 \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "message": "User deleted successfully"
}
```

---

## Image Endpoints

### 6. Upload Image
**Endpoint:** POST /images/upload
**Authentication:** Required
**Description:** Upload an image file

Request:
```bash
curl -X POST http://localhost:5000/api/images/upload \
  -H "Authorization: Bearer <token>" \
  -F "image=@/path/to/image.jpg" \
  -F "description=My captured image"
```

Response:
```json
{
  "message": "Image uploaded successfully",
  "image": {
    "id": 1,
    "filename": "image-1685689200000-12345.jpg",
    "uploadedAt": "2026-06-02T10:30:00Z"
  }
}
```

### 7. Get User's Images
**Endpoint:** GET /images/my-images
**Authentication:** Required
**Description:** Get all images uploaded by the current user

Request:
```bash
curl -X GET http://localhost:5000/api/images/my-images \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "images": [
    {
      "id": 1,
      "filename": "image-1685689200000-12345.jpg",
      "description": "My captured image",
      "createdAt": "2026-06-02T10:30:00Z"
    },
    ...
  ]
}
```

### 8. Download Image
**Endpoint:** GET /images/download/:imageId
**Authentication:** Required
**Description:** Download an image file

Request:
```bash
curl -X GET http://localhost:5000/api/images/download/1 \
  -H "Authorization: Bearer <token>" \
  -o downloaded_image.jpg
```

### 9. Delete Image
**Endpoint:** DELETE /images/:imageId
**Authentication:** Required
**Description:** Delete an image

Request:
```bash
curl -X DELETE http://localhost:5000/api/images/1 \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "message": "Image deleted successfully"
}
```

---

## Role-Based Access

### Role Permissions
| Role | Permissions |
|------|-------------|
| Admin | Create users, manage roles, deactivate users, upload/view/delete images |
| Supervisor | View users, view images |
| Worker | Upload images, view own images |

---

## Error Responses

### 400 - Bad Request
```json
{
  "message": "All fields are required"
}
```

### 401 - Unauthorized
```json
{
  "message": "No token provided"
}
or
{
  "message": "Invalid or expired token"
}
```

### 403 - Forbidden
```json
{
  "message": "Access denied"
}
```

### 404 - Not Found
```json
{
  "message": "User not found"
}
or
{
  "message": "Image not found"
}
```

### 500 - Server Error
```json
{
  "message": "Internal server error",
  "error": "Error details"
}
```

---

## Testing Checklist

- [ ] Login with admin credentials
- [ ] Create new user
- [ ] Get all users
- [ ] Assign role to user
- [ ] Deactivate user
- [ ] Upload image
- [ ] Get user images
- [ ] Delete image
- [ ] Test with invalid token
- [ ] Test access control

---

## Quick Reference

### Get Token
```bash
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo $TOKEN
```

### Use Token in Requests
```bash
curl -X GET http://localhost:5000/api/auth/users \
  -H "Authorization: Bearer $TOKEN"
```
