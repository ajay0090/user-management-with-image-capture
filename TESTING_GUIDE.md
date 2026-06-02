# Testing Guide

## Manual Testing Checklist

### 1. Environment Setup Testing
- [ ] Backend logs "Server listening on port 5000"
- [ ] Frontend loads on http://localhost:4200
- [ ] Database connection successful
- [ ] Uploads folder exists and is writable

### 2. Authentication Testing

#### 2.1 Login Page
- [ ] Login page loads with form
- [ ] Demo credentials are visible
- [ ] Username field accepts input
- [ ] Password field masks input
- [ ] Login button is clickable

#### 2.2 Admin Login
```bash
Username: admin
Password: Admin@123
```
- [ ] Successfully logs in with admin credentials
- [ ] Redirects to dashboard
- [ ] Token is saved in localStorage
- [ ] User data is displayed in welcome message

#### 2.3 Failed Login
- [ ] Shows error for incorrect credentials
- [ ] Shows error for missing fields
- [ ] Error message is clear and helpful

### 3. Dashboard Testing

#### 3.1 Navigation
- [ ] All menu items display correctly
- [ ] Active tab is highlighted
- [ ] Switching tabs updates content
- [ ] Logout button works

#### 3.2 Image Tab - Capture
- [ ] "Start Camera" button requests permission
- [ ] Camera feeds display in video element
- [ ] "Capture" button is disabled until camera starts
- [ ] Capturing image saves it
- [ ] Image appears in gallery after capture
- [ ] Upload file button opens file picker

#### 3.3 Image Tab - Gallery
- [ ] Images load from database
- [ ] Image thumbnails appear
- [ ] Image descriptions show
- [ ] Created date shows correctly
- [ ] Delete button works
- [ ] Confirmation dialog appears before delete
- [ ] Gallery updates after delete (no-image message when empty)

#### 3.4 Image Management
- [ ] Image upload with file input works
- [ ] File size validation (max 50MB)
- [ ] File type validation (JPEG, PNG only)
- [ ] Upload progress feedback
- [ ] Success/error messages appear
- [ ] Uploaded image appears immediately

### 4. Admin Panel Testing (Admin Only)

#### 4.1 Users Management Tab
- [ ] All users load in table
- [ ] User columns display: Username, Email, Role, Status, Created, Action
- [ ] Status shows "Active" or "Inactive"
- [ ] Created date formats correctly
- [ ] Deactivate button appears for active users
- [ ] Current user deactivate button is disabled
- [ ] "Loading users..." shows while fetching
- [ ] Empty state shows when no users

#### 4.2 Create User Tab
- [ ] Form has fields: Username, Email, Password, Role
- [ ] Role dropdown shows: Admin, Supervisor, Worker
- [ ] Form validation works (required fields)
- [ ] Submit button shows "Creating..." while processing
- [ ] Success message appears after creating user
- [ ] Form clears after successful creation
- [ ] New user appears in Users list
- [ ] Error message shows for invalid data

#### 4.3 Admin-Only Access
- [ ] Non-admin users cannot see Admin Panel
- [ ] Accessing admin route as non-admin gives error
- [ ] Admin-only API calls are blocked for non-admin

### 5. Role-Based Access Control Testing

#### 5.1 Admin Role
- [ ] Can login
- [ ] Can access all features
- [ ] Can create users
- [ ] Can view all users
- [ ] Can deactivate users
- [ ] Can capture images
- [ ] Can view all images

#### 5.2 Supervisor Role
- [ ] Can login
- [ ] Cannot create users
- [ ] Cannot deactivate users
- [ ] Can access image gallery
- [ ] Cannot access admin panel

#### 5.3 Worker Role
- [ ] Can login
- [ ] Cannot access admin features
- [ ] Can capture images
- [ ] Can view own images
- [ ] Cannot see other users' images

### 6. API Testing

#### 6.1 Auth Endpoints
```bash
# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123"}'
```
- [ ] Returns token
- [ ] Returns user info
- [ ] Invalid credentials return error

#### 6.2 User Management (Requires Admin Token)
```bash
# Create user
curl -X POST http://localhost:5000/api/auth/create-user \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Pass@123","roleId":3}'
```
- [ ] Returns success message
- [ ] User ID is created
- [ ] Duplicate username returns error
- [ ] Invalid role ID returns error

#### 6.3 Image Endpoints
```bash
# Upload image
curl -X POST http://localhost:5000/api/images/upload \
  -H "Authorization: Bearer <token>" \
  -F "image=@image.jpg" \
  -F "description=Test"
```
- [ ] Image uploads successfully
- [ ] File is saved
- [ ] Database entry created
- [ ] Returns image ID and filename

```bash
# Get user images
curl -X GET http://localhost:5000/api/images/my-images \
  -H "Authorization: Bearer <token>"
```
- [ ] Returns user's images only
- [ ] Shows correct image metadata

```bash
# Delete image
curl -X DELETE http://localhost:5000/api/images/1 \
  -H "Authorization: Bearer <token>"
```
- [ ] Image deleted from database
- [ ] File deleted from storage
- [ ] Returns success message

### 7. Authentication & Security Testing

#### 7.1 Token Validation
- [ ] Expired token returns 401
- [ ] Invalid token returns 401
- [ ] Missing token returns 401
- [ ] Valid token allows request

#### 7.2 Authorization
- [ ] Non-admin cannot access admin endpoints
- [ ] User can only see own images
- [ ] Proper error messages for denied access

### 8. Error Handling Testing

#### 8.1 Client-Side Errors
- [ ] Missing required fields show validation error
- [ ] File upload error displays message
- [ ] Network error displays message
- [ ] Server error displays message

#### 8.2 Server-Side Errors
- [ ] 400: Bad request handled
- [ ] 401: Unauthorized handled
- [ ] 403: Forbidden handled
- [ ] 404: Not found handled
- [ ] 500: Server error handled

### 9. Performance Testing

- [ ] Dashboard loads in < 3 seconds
- [ ] Images load within < 5 seconds
- [ ] File upload completes for 10MB file
- [ ] Multiple simultaneous uploads work
- [ ] Large image gallery (100+ images) loads

### 10. Cross-Browser Testing

- [ ] Chrome: All features work
- [ ] Firefox: All features work
- [ ] Safari: All features work
- [ ] Edge: All features work
- [ ] Mobile Firefox: Camera and upload work

### 11. Accessibility Testing

- [ ] Tab navigation works
- [ ] Labels associated with inputs
- [ ] Color contrast meets standards
- [ ] Screen reader compatible

---

## Automated Test Examples

### Unit Test Example (Karma/Jasmine)
```typescript
describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('should store token', () => {
    const token = 'test-token';
    service.setToken(token);
    expect(service.getToken()).toBe(token);
  });

  it('should clear token on logout', () => {
    service.setToken('token');
    service.logout();
    expect(service.getToken()).toBeNull();
  });
});
```

### E2E Test Example (Cypress)
```javascript
describe('Authentication Flow', () => {
  it('should login successfully', () => {
    cy.visit('http://localhost:4200/login');
    cy.get('input[name="username"]').type('admin');
    cy.get('input[name="password"]').type('Admin@123');
    cy.get('button').contains('Login').click();
    cy.url().should('include', '/dashboard');
  });
});
```

---

## Test Data

### Admin User (Default)
- Username: admin
- Email: admin@robro.com
- Password: Admin@123
- Role: Admin

### Test Users to Create
```sql
-- Supervisor
INSERT INTO users (username, email, password, roleId, isActive, createdAt, updatedAt)
VALUES ('supervisor', 'supervisor@test.com', '<hashed_password>', 2, true, NOW(), NOW());

-- Worker
INSERT INTO users (username, email, password, roleId, isActive, createdAt, updatedAt)
VALUES ('worker', 'worker@test.com', '<hashed_password>', 3, true, NOW(), NOW());
```

### Test Images
- Create `test_images` folder with sample JPEG/PNG files
- Test both landscape and portrait orientations
- Test various file sizes (1MB, 5MB, 50MB)

---

## Known Test Scenarios

| Scenario | Expected Result | Priority |
|----------|-----------------|----------|
| Login with correct credentials | Success, redirect to dashboard | Critical |
| Login with wrong password | Error message | Critical |
| Admin create user | User created with correct role | High |
| Non-admin access admin panel | Blocked, no access | High |
| Upload 50MB image | Accepted | Medium |
| Upload non-image file | Rejected | Medium |
| Multiple concurrent uploads | All succeed | Medium |
| Delete user and check images | Images are cascade deleted | Medium |
| Logout | Session cleared, redirect to login | High |

---

**Run tests with**: `npm test`  
**Run E2E tests with**: `npm run e2e`
