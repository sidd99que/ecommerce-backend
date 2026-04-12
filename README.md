# FASCO — E-Commerce Backend

A production-ready REST API for the FASCO e-commerce platform built with NestJS + MongoDB.

![NestJS](https://img.shields.io/badge/NestJS-10-red?style=flat-square&logo=nestjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-7-green?style=flat-square&logo=mongodb)
![Stripe](https://img.shields.io/badge/Stripe-Payment-purple?style=flat-square&logo=stripe)

## 📖 Overview

FASCO is a full-stack e-commerce platform. This repository contains the backend API that powers user authentication, product management, order processing, and payment handling.

## 🏗 Architecture

```
Client (React) → REST API (NestJS) → MongoDB Database
                      ↓
              External Services:
              - Stripe (Payments)
              - Google OAuth (Authentication)
              - Nodemailer (Emails)
              - Google Gemini (AI)
```

## 🛠 Tech Stack & Why We Used It

| Technology | Purpose | Why |
|---|---|---|
| **Node.js** | Runtime environment | Runs JavaScript on the server — fast and scalable |
| **NestJS** | Backend framework | Built on Express, provides clean structure with modules, controllers & services |
| **TypeScript** | Programming language | Adds type safety to JavaScript — catches bugs before runtime |
| **MongoDB** | Database | NoSQL document database — flexible schema, perfect for e-commerce |
| **Mongoose** | ODM for MongoDB | Makes working with MongoDB easier using schemas and models |
| **JWT** | Authentication | Secure stateless token-based authentication |
| **Passport.js** | Auth middleware | Handles multiple auth strategies (Local, JWT, Google OAuth) |
| **bcrypt** | Password hashing | Securely hashes passwords before storing in database |
| **Stripe** | Payment processing | Industry standard for handling card payments securely |
| **Nodemailer** | Email service | Sends transactional emails (password reset, order confirmation) |
| **Google Gemini** | AI integration | Generates product descriptions and keywords using AI |

## ✨ Features

- 🔐 JWT Authentication with access & refresh tokens
- 🔵 Google OAuth 2.0 sign in
- 🔑 Forgot/Reset password via email
- 🛍️ Product & category management
- 🛒 Cart system
- 📦 Order management & tracking
- 💳 Stripe payment processing + webhooks
- ⭐ Reviews & ratings
- 🔍 Advanced product search & filters
- 👑 Admin panel APIs
- 🤖 AI product content generation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas or local MongoDB
- Stripe account
- Google Cloud Console project
- Gmail account

### Installation

```bash
# Clone the repo
git clone https://github.com/sidd99que/ecommerce-backend.git
cd ecommerce-backend

# Install dependencies
yarn install

# Setup environment variables
cp .env.example .env

# Start development server
yarn start:dev

# Build for production
yarn build
yarn start:prod
```

## 🔑 Environment Variables

```bash
PORT=                           # Server port (default: 5000)
MONGO_URI=                      # MongoDB connection string
NODE_ENV=                       # development | production

# JWT
AUTH_JWT_ACCESS_SECRET=         # Secret for access tokens
AUTH_JWT_REFRESH_SECRET=        # Secret for refresh tokens
AUTH_JWT_EXPIRES_IN=15m         # Access token expiry
AUTH_JWT_REFRESH_EXPIRES_IN=7d  # Refresh token expiry

# Stripe
STRIPE_SECRET_KEY=              # Stripe secret key
STRIPE_WEBHOOK_SECRET=          # Stripe webhook signing secret

# Google OAuth
GOOGLE_CLIENT_ID=               # Google OAuth client ID
GOOGLE_CLIENT_SECRET=           # Google OAuth client secret
GOOGLE_CALLBACK_URL=            # OAuth callback URL

# App
FRONTEND_URL=                   # Frontend URL for CORS & redirects

# AI
GEMINI_API_KEY=                 # Google Gemini API key

# Email
MAIL_USER=                      # Gmail address
MAIL_PASS=                      # Gmail app password
MAIL_FROM=                      # Display name + email
```

## 📁 Project Structure

```
src/
├── app/
│   ├── auth/           # JWT, Google OAuth, password reset
│   ├── CartModule/     # Cart management
│   ├── Order/          # Order processing
│   ├── payments/       # Stripe integration
│   ├── products/       # Product CRUD & filtering
│   ├── reviews/        # Reviews & ratings
│   ├── search/         # Advanced search
│   ├── mail/           # Email service
│   └── admin/          # Admin-only endpoints
├── common/
│   ├── decorators/     # Custom decorators
│   ├── guards/         # JWT & role guards
│   ├── filters/        # Exception filters
│   └── interceptors/   # Response interceptors
├── config/             # App configuration
├── models/             # Mongoose schemas
└── database/           # Database connection
```

## 📡 API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/signup` | ❌ | Register new user |
| POST | `/auth/login` | ❌ | Login |
| POST | `/auth/refresh` | ❌ | Refresh access token |
| POST | `/auth/logout` | ✅ | Logout |
| GET | `/auth/google` | ❌ | Google OAuth |
| POST | `/auth/forgot-password` | ❌ | Send reset email |
| POST | `/auth/reset-password` | ❌ | Reset password |

### Products
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/products` | ❌ | Get all products |
| GET | `/products/:id` | ❌ | Get single product |
| GET | `/products/featured` | ❌ | Featured products |
| GET | `/products/new-arrivals` | ❌ | New arrivals |
| GET | `/products/discount-deals` | ❌ | Discounted products |
| POST | `/admin/products` | 👑 | Create product |
| PATCH | `/admin/products/:id` | 👑 | Update product |
| DELETE | `/admin/products/:id` | 👑 | Delete product |

### Orders
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/orders` | ✅ | Create order |
| GET | `/orders/my-orders` | ✅ | My orders |
| GET | `/admin/orders` | 👑 | All orders |
| PATCH | `/admin/orders/:id/status` | 👑 | Update status |
| DELETE | `/admin/orders/:id` | 👑 | Delete order |

### Payments
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/payments/checkout` | ✅ | Create Stripe session |
| POST | `/payments/webhook` | ❌ | Stripe webhook |

## 🔒 Security

- Passwords hashed with **bcrypt** (10 salt rounds)
- Short-lived JWT access tokens (15 minutes)
- Refresh tokens stored **hashed** in database
- HTTP-only cookies for refresh tokens
- Role-based access control (user / admin)
- Input validation with **class-validator**

## 🔗 Frontend

👉 https://github.com/sidd99que/ecommerce-frontend

## 👨‍💻 Author

**Siddique** — [GitHub](https://github.com/sidd99que)

---
⭐ If you found this project helpful, please give it a star!****
