# Secure E-Commerce Frontend

A secure React-based e-commerce frontend application implementing OWASP Top 10 security practices with Auth0 OIDC authentication.

## Security Features

### ✅ OWASP Top 10 Mitigations Implemented

1. **A01 - Broken Access Control**
   - Server-side token validation
   - Protected routes with authentication checks
   - Role-based access control (RBAC) for admin functions

2. **A02 - Cryptographic Failures**
   - Environment variables for sensitive credentials
   - HTTPS enforcement
   - Secure token storage via Auth0 SDK

3. **A03 - Injection**
   - Input sanitization using DOMPurify
   - HTML escaping for user data
   - Parameterized API requests

4. **A04 - Insecure Design**
   - Secure-by-default configuration
   - Principle of least privilege
   - Input validation on both client and server

5. **A05 - Security Misconfiguration**
   - Security headers implementation
   - Content Security Policy (CSP)
   - Secure HTTP headers

6. **A06 - Vulnerable Components**
   - Regular dependency updates
   - Known vulnerability scanning

7. **A07 - Identification and Authentication**
   - Auth0 OIDC implementation
   - Secure session management
   - Multi-factor authentication support

8. **A08 - Software and Data Integrity**
   - Input validation and sanitization
   - API response validation

9. **A09 - Security Logging**
   - Client-side error logging
   - Security event tracking

10. **A10 - Server-Side Request Forgery**
    - CSRF token implementation
    - Same-origin policy enforcement

## Features

- **User Authentication**: OIDC/OAuth 2.0 via Auth0
- **User Profile**: Display authenticated user information
- **Product Ordering**: Complete purchase form with validation
- **Order Management**: View past and upcoming deliveries
- **Admin Panel**: Administrative functions with proper access control
- **Security**: Comprehensive security controls and validation

## Setup Instructions

### Prerequisites

- Node.js 16+ and npm
- Auth0 account and application
- SSL certificate (for HTTPS)

### Installation

1. **Clone and Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   - Copy `.env.example` to `.env`
   - Update with your Auth0 credentials:
   ```env
   REACT_APP_AUTH0_DOMAIN=your-domain.auth0.com
   REACT_APP_AUTH0_CLIENT_ID=your-client-id
   REACT_APP_AUTH0_AUDIENCE=your-api-audience
   REACT_APP_API_BASE_URL=https://localhost:3001
   HTTPS=true
   SSL_CRT_FILE=cert.pem
   SSL_KEY_FILE=key.pem
   ```

3. **Generate SSL Certificate**
   
   **Windows:**
   ```bash
   ./generate-ssl-cert.bat
   ```
   
   **Linux/Mac:**
   ```bash
   chmod +x ./generate-ssl-cert.sh
   ./generate-ssl-cert.sh
   ```

4. **Start Development Server**
   ```bash
   npm start
   ```

The application will start at `https://localhost:3000` (HTTPS enforced).

## Security Configuration

### Auth0 Setup

1. **Create Auth0 Application**
   - Application Type: Single Page Application
   - Allowed Callback URLs: `https://localhost:3000`
   - Allowed Logout URLs: `https://localhost:3000`
   - Allowed Web Origins: `https://localhost:3000`

2. **Configure Auth0 Rules/Actions**
   - Add user roles to tokens
   - Implement custom claims for authorization

### Content Security Policy

The application implements a strict CSP policy that only allows:
- Scripts from self and Auth0 CDN
- Styles from self and Google Fonts
- Images from self and HTTPS sources
- API connections to Auth0 and backend API

### HTTPS Configuration

- Development server enforces HTTPS
- SSL certificates required for local development
- Automatic HTTP to HTTPS redirects

## API Integration

The frontend expects a backend API with the following endpoints:

- `POST /api/purchases` - Create new purchase
- `GET /api/purchases/user` - Get user's purchases
- `GET /api/admin/purchases` - Get all purchases (admin only)
- `GET /api/auth/validate` - Validate access token

## Development

### Scripts

- `npm start` - Start development server (HTTPS)
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

### Security Testing

1. **Run Security Audit**
   ```bash
   npm audit
   ```

2. **Test HTTPS Configuration**
   - Verify SSL certificate validity
   - Check security headers in browser dev tools

3. **Validate CSP**
   - Check console for CSP violations
   - Test with security scanner tools

## Deployment

### Production Build

1. **Create Production Build**
   ```bash
   npm run build
   ```

2. **Configure Web Server**
   - Serve over HTTPS only
   - Set appropriate security headers
   - Configure CSP headers

### Security Checklist

- [ ] Environment variables properly configured
- [ ] HTTPS enabled and enforced
- [ ] Security headers implemented
- [ ] CSP policy configured
- [ ] Auth0 properly configured
- [ ] Input validation working
- [ ] Access controls tested
- [ ] Error handling secure
- [ ] Logging configured

## Architecture

```
src/
├── components/          # Reusable React components
│   ├── Navbar.jsx      # Navigation with auth state
│   ├── Profile.jsx     # User profile display
│   ├── PurchaseForm.jsx # Secure purchase form
│   ├── PurchaseList.jsx # Order history display
│   ├── ProtectedRoute.jsx # Route protection
│   └── LogoutButton.jsx
├── pages/              # Page components
│   ├── Home.jsx       # Landing page
│   ├── Profile.jsx    # Profile page wrapper
│   ├── Purchases.jsx  # Purchase management
│   └── AdminPanel.jsx # Admin functionality
├── utils/              # Utility functions
│   ├── api.js         # Secure API client
│   └── validation.js  # Input validation & sanitization
├── hooks/              # Custom React hooks
│   └── useTokenValidation.js
├── App.jsx            # Main app component
└── index.jsx          # App entry point
```

## Security Considerations

- All user input is sanitized and validated
- XSS protection through CSP and input escaping
- CSRF protection via tokens and same-origin policy
- Authentication handled by Auth0 (OIDC compliant)
- Authorization validated server-side
- Sensitive data not stored in client
- Error messages don't expose system information
- HTTPS enforced for all communications

## Support

For security issues or questions, please create an issue in the project repository with the `security` label.