# Authentication & Authorization Setup

## Overview

The Smart Campus API implements a secure authentication and authorization system using:

- **Google OAuth 2.0** for user authentication
- **JWT (JSON Web Tokens)** for stateless session management
- **Role-Based Access Control (RBAC)** for authorization

## Architecture

### Authentication Flow

1. **OAuth2 Login**:

   - User clicks "Login with Google" on frontend
   - Redirected to `/oauth2/authorize/google`
   - Google authenticates user
   - Callback to `/oauth2/callback/google`
   - `OAuth2AuthenticationSuccessHandler` processes response

2. **User Creation/Update**:

   - Extract user info from OAuth2 response (email, name, picture)
   - Create new user or update existing user in database
   - Assign default role (STUDENT) to new users

3. **JWT Token Generation**:

   - Generate JWT token containing user claims (id, email, roles)
   - Token valid for 24 hours (configurable)
   - Redirect to frontend with token

4. **Subsequent Requests**:
   - Frontend includes JWT in `Authorization: Bearer <token>` header
   - `JwtAuthenticationFilter` validates token
   - Establishes Spring Security authentication context

### Security Components

#### 1. Models (`api/src/main/java/com/smartcampus/api/model/`)

- **User.java**: User entity with Google OAuth fields
- **Role.java**: Enum (STUDENT, STAFF, ADMIN)
- **Facility.java**: Bookable campus facilities
- **Booking.java**: Facility reservations
- **Incident.java**: Maintenance tickets

#### 2. Security Configuration (`api/src/main/java/com/smartcampus/api/config/`)

- **SecurityConfig.java**: Spring Security configuration
  - OAuth2 login enabled
  - JWT authentication filter chain
  - CORS configuration
  - Stateless session management

#### 3. Security Filters (`api/src/main/java/com/smartcampus/api/security/`)

- **JwtAuthenticationFilter.java**: Validates JWT tokens on each request
- **OAuth2AuthenticationSuccessHandler.java**: Handles successful OAuth2 login

#### 4. Services (`api/src/main/java/com/smartcampus/api/service/`)

- **JwtService.java**: JWT generation and validation using JJWT library

#### 5. Controllers (`api/src/main/java/com/smartcampus/api/controller/`)

- **AuthController.java**: Authentication endpoints
  - `GET /api/v1/auth/me` - Get current user info
  - `GET /api/v1/auth/health` - Health check

## Environment Configuration

### API (.env)

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
JWT_SECRET_KEY=your-base64-encoded-secret-key
DB_USERNAME=postgres
DB_PASSWORD=postgres
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
SUPABASE_BUCKET=incident-images
```

See [docs/SUPABASE_STORAGE_SETUP.md](SUPABASE_STORAGE_SETUP.md) for bucket visibility and verification steps.

### Frontend (.env.local)

```env
VITE_API_BASE_URL=http://localhost:8080
```

## Security Best Practices Implemented

✅ **OAuth 2.0 & JWT**: Industry-standard authentication
✅ **No Hardcoded Secrets**: All secrets from environment variables
✅ **Input Validation**: Jakarta validation on all DTOs
✅ **Parameterized Queries**: Spring Data JPA prevents SQL injection
✅ **No Stack Traces**: GlobalExceptionHandler sanitizes errors
✅ **RBAC**: Role-based access control with @PreAuthorize
✅ **CORS**: Configured for frontend communication
✅ **Secure File Upload**: UUID-based filenames, MIME type validation

## Role-Based Access Control

### Roles

- **STUDENT**: Default role for new users

  - Can create bookings
  - Can submit incident tickets
  - Can view own bookings and incidents

- **STAFF**: Campus staff members

  - All STUDENT permissions
  - Can manage facilities
  - Can approve/reject bookings
  - Can handle incident tickets

- **ADMIN**: System administrators
  - All STAFF permissions
  - Can manage users and roles
  - Full system access

### Using @PreAuthorize

```java
@PreAuthorize("hasRole('ADMIN')")
@DeleteMapping("/api/v1/users/{id}")
public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
    // Only admins can delete users
}

@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
@PutMapping("/api/v1/bookings/{id}/approve")
public ResponseEntity<Booking> approveBooking(@PathVariable Long id) {
    // Staff and admins can approve bookings
}
```

## API Usage

### 1. Initiate OAuth2 Login

```
GET http://localhost:8080/oauth2/authorize/google
```

### 2. After successful login, frontend receives token

```
http://localhost:5173/auth/callback?token=<jwt-token>
```

### 3. Make authenticated requests

```bash
curl -H "Authorization: Bearer <jwt-token>" \
     http://localhost:8080/api/v1/auth/me
```

### 4. Get current user info

```bash
GET /api/v1/auth/me
Authorization: Bearer <jwt-token>

Response:
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "pictureUrl": "https://...",
  "roles": ["STUDENT"]
}
```

## Database Schema

### users table

- id (Primary Key)
- google_id (Unique)
- email (Unique)
- name
- picture_url
- enabled
- created_at
- updated_at
- last_login

### user_roles table

- user_id (Foreign Key)
- role (STUDENT, STAFF, ADMIN)

## Testing

### Test OAuth2 Flow

1. Start the API: `./mvnw spring-boot:run`
2. Navigate to: `http://localhost:8080/oauth2/authorize/google`
3. Complete Google login
4. Verify redirect to frontend with token

### Test JWT Authentication

```bash
# Get token from OAuth2 flow
TOKEN="<your-jwt-token>"

# Test authenticated endpoint
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:8080/api/v1/auth/me
```

## Troubleshooting

### "Invalid JWT token"

- Check token expiration (default 24 hours)
- Verify JWT_SECRET_KEY matches between token generation and validation
- Ensure token format is correct: `Bearer <token>`

### "Authentication failed"

- Verify Google OAuth credentials in .env
- Check redirect URIs match in Google Console
- Ensure frontend URL is allowed in CORS config

### "Access Denied"

- Verify user has required role
- Check @PreAuthorize annotations
- Confirm JWT includes roles claim

## Production Considerations

Before deploying to production:

1. **Update CORS Origins**: Restrict to production domains
2. **Use HTTPS**: All OAuth2 redirects must use HTTPS
3. **Rotate JWT Secret**: Use strong, randomly generated secret
4. **Token Expiration**: Consider shorter token lifetime
5. **Refresh Tokens**: Implement refresh token mechanism
6. **Rate Limiting**: Add rate limiting to prevent abuse
7. **Logging**: Configure secure logging (no tokens/passwords)
8. **Database**: Use connection pooling and SSL

## Dependencies

- Spring Boot 4.0.4
- Spring Security OAuth2 Client
- JJWT 0.12.6
- PostgreSQL Driver
- Lombok
- Jakarta Validation
