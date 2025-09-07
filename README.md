"# Security-Project"

# Secure E-Commerce Platform

## Overview

This project is a secure e-commerce web application built with React (frontend) and Node.js/Express (backend), featuring authentication, role-based access control (RBAC), and protection against common web vulnerabilities (OWASP Top 10).

## Features

- User authentication via Auth0 (OIDC)
- Role-based access control (admin/user)
- Product catalog, cart, checkout, and order history
- Secure API endpoints and data validation
- Admin panel for product management

## Project Structure

```
Information Security New/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── index.js
│   ├── seedProducts.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── utils/
│   ├── .env.example
│   └── package.json
└── README.md
```

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-public-github-repo-url>
cd Information Security New
```

### 2. Install Dependencies

- Backend:
  ```bash
  cd backend
  npm install
  ```
- Frontend:
  ```bash
  cd ../frontend
  npm install
  ```

### 3. Configure Environment Variables

- Copy `.env.example` to `.env` in both `backend` and `frontend` folders.
- Fill in sample values for sensitive fields (e.g., `client_secret=testsecret`).
- **Do not use real secrets in the repo.**

### 4. Start the Application

- Backend:
  ```bash
  npm start
  ```
- Frontend:
  ```bash
  npm start
  ```

## Security Practices

- All credentials are stored in `.env` files with sample values in the repo.
- Auth0 userinfo endpoint is used for token validation.
- RBAC middleware restricts access to admin endpoints.
- No secrets are exposed in the codebase.
- All config/data files follow the required JSON format.

## How to Run & Test

1. Ensure MongoDB is running and accessible.
2. Start backend and frontend as described above.
3. Access the app via your browser at `http://localhost:3000` (or configured port).
4. For admin access, set your user role to `admin` in the database.

## Useful Links

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Auth0 Documentation](https://auth0.com/docs)
- [Your GitHub Repo] https://github.com/Tasheen2002/Security-Project
- [Your Blog] https://medium.com/@darshikatasheen99/building-a-secure-e-commerce-platform-a-security-first-development-journey-067b435e80be

---

**Author:** Tasheen2002
