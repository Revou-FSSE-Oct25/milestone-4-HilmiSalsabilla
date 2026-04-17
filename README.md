# 🏦 RevoBank API

A secure, scalable RESTful banking API built with **NestJS**, **Prisma ORM**, and **PostgreSQL**.

---

## 📋 Overview

RevoBank is a fictional financial institution's backend API that supports:

- **Customers** – view balances, initiate transfers, monitor transaction history
- **Administrators** – manage users, review all accounts and transactions

---

## ✨ Features

| Module | Endpoints |
|--------|-----------|
| 🔐 Auth | `POST /auth/register`, `POST /auth/login` |
| 👤 User | `GET /user/profile`, `PATCH /user/profile` |
| 🏦 Accounts | `POST`, `GET`, `GET /:id`, `PATCH /:id`, `DELETE /:id` `/accounts` |
| 💸 Transactions | Deposit, Withdraw, Transfer, List, Detail |

### Key Features
- JWT-based authentication with role-based access control (USER / ADMIN)
- Users can only access their own accounts and transactions
- Admins have full access to all data
- Atomic database transactions (deposit, withdraw, transfer)
- Insufficient balance validation
- Swagger / OpenAPI documentation at `/api/docs`
- Comprehensive Jest unit test suite

---

## 🛠 Technologies

| Category | Technology |
|----------|------------|
| Framework | NestJS 10 |
| ORM | Prisma 5 |
| Database | PostgreSQL (Supabase / TigerData for production) |
| Auth | JWT (`@nestjs/jwt`, `passport-jwt`) |
| Validation | `class-validator`, `class-transformer` |
| Documentation | Swagger (`@nestjs/swagger`) |
| Testing | Jest, `@nestjs/testing` |
| Deployment | Render / Railway / Fly.io |

---

## 🗄 Database Schema

```
User ─────────────── Account ─────────────── Transaction
 │                      │                        │
 id (PK)               id (PK)                  id (PK)
 email (UNIQUE)         accountNumber (UNIQUE)   type (DEPOSIT/WITHDRAWAL/TRANSFER)
 password               type (SAVINGS/CHECKING)  amount
 firstName              status (ACTIVE/FROZEN)   fromAccountId (FK → Account)
 lastName               balance                  toAccountId   (FK → Account)
 phone                  currency                 balanceBefore
 role (USER/ADMIN)      userId (FK → User)       balanceAfter
 createdAt              createdAt                reference (UNIQUE)
 updatedAt              updatedAt                createdAt
```

**Relationships:**
- `User` → `Account`: one-to-many
- `Account` → `Transaction`: one-to-many (as sender or receiver)

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database (local or cloud)
- npm

### 1. Clone & Install

```bash
git clone https://github.com/your-username/revobank-api.git
cd revobank-api
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/revobank?schema=public"
JWT_SECRET="your-super-secret-key-min-32-chars"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=development
```

### 3. Run Database Migrations

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Seed with sample data
npm run prisma:seed
```

### 4. Start the Server

```bash
# Development (with hot reload)
npm run start:dev

# Production
npm run build
npm run start:prod
```

### 5. Access the API

| URL | Description |
|-----|-------------|
| `http://localhost:3000/api/v1` | Base API URL |
| `http://localhost:3000/api/docs` | Swagger UI |

---

## 🔐 Authentication

All protected routes require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

### Quick Start Flow

```bash
# 1. Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"Password123!","firstName":"John","lastName":"Doe"}'

# 2. Login → copy the access_token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"Password123!"}'

# 3. Create an account
curl -X POST http://localhost:3000/api/v1/accounts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"type":"SAVINGS"}'

# 4. Deposit funds
curl -X POST http://localhost:3000/api/v1/transactions/deposit \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"accountId":"<account-id>","amount":1000,"description":"Initial deposit"}'
```

---

## 📖 API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | ❌ | Register new user |
| POST | `/auth/login` | ❌ | Login, returns JWT |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/user/profile` | ✅ | Get own profile |
| PATCH | `/user/profile` | ✅ | Update own profile |

### Accounts
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/accounts` | ✅ | Create account |
| GET | `/accounts` | ✅ | List accounts |
| GET | `/accounts/:id` | ✅ | Get account details |
| PATCH | `/accounts/:id` | ✅ | Update account |
| DELETE | `/accounts/:id` | ✅ | Delete account (balance must be 0) |

### Transactions
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/transactions/deposit` | ✅ | Deposit to account |
| POST | `/transactions/withdraw` | ✅ | Withdraw from account |
| POST | `/transactions/transfer` | ✅ | Transfer between accounts |
| GET | `/transactions` | ✅ | List transactions |
| GET | `/transactions/:id` | ✅ | Get transaction details |

---

## 🧪 Running Tests

```bash
# Run all unit tests
npm test

# With coverage report
npm run test:cov

# Watch mode
npm run test:watch
```

**Test coverage includes:**
- AuthService: register, login, password hashing, duplicate email
- AccountsService: CRUD, ownership checks, balance validation on delete
- TransactionsService: deposit, withdraw (insufficient balance), transfer (same account, insufficient funds), access control
- UserService: getProfile, updateProfile

---

## ☁️ Deployment

### Deploy to Render

1. Push code to GitHub
2. Create new **Web Service** on [render.com](https://render.com)
3. Connect your repo
4. Set environment variables: `DATABASE_URL`, `JWT_SECRET`
5. Build command: `npm ci && npx prisma generate && npm run build`
6. Start command: `npx prisma migrate deploy && node dist/main`

### Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

railway login
railway init
railway add postgresql       # provisions DB automatically
railway up
```

### Deploy to Fly.io

```bash
# Install flyctl
fly launch
fly secrets set DATABASE_URL="..." JWT_SECRET="..."
fly deploy
```

### Database Hosting

| Platform | Free Tier | Notes |
|----------|-----------|-------|
| [Supabase](https://supabase.com) | 500MB | PostgreSQL, easy setup |
| [Railway](https://railway.app) | $5 credit | Auto-provisions with app |
| [Neon](https://neon.tech) | 0.5GB | Serverless PostgreSQL |

---

## 👥 Seed Accounts

After running `npm run prisma:seed`:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@revobank.com | Password123! |
| User | alice@example.com | Password123! |
| User | bob@example.com | Password123! |

---

## 📁 Project Structure

```
revobank-api/
├── prisma/
│   ├── schema.prisma          # DB schema (User, Account, Transaction)
│   └── seed.ts                # Sample data seeder
├── src/
│   ├── auth/
│   │   ├── dto/auth.dto.ts    # RegisterDto, LoginDto
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   ├── auth.service.spec.ts  # Unit tests
│   │   └── jwt.strategy.ts
│   ├── user/
│   │   ├── dto/
│   │   ├── user.service.ts
│   │   ├── user.controller.ts
│   │   ├── user.module.ts
│   │   └── user.service.spec.ts
│   ├── accounts/
│   │   ├── dto/
│   │   ├── accounts.service.ts
│   │   ├── accounts.controller.ts
│   │   ├── accounts.module.ts
│   │   └── accounts.service.spec.ts
│   ├── transactions/
│   │   ├── dto/
│   │   ├── transactions.service.ts
│   │   ├── transactions.controller.ts
│   │   ├── transactions.module.ts
│   │   └── transactions.service.spec.ts
│   ├── prisma/
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── common/
│   │   ├── guards/            # JwtAuthGuard, RolesGuard
│   │   ├── decorators/        # @Public, @Roles, @CurrentUser
│   │   └── filters/           # HttpExceptionFilter
│   ├── app.module.ts
│   └── main.ts                # Swagger setup, global pipes
├── .env.example
├── Dockerfile
├── render.yaml
├── railway.toml
├── fly.toml
└── README.md
```

---

## 🔒 Security Notes

- Passwords are hashed with **bcrypt** (salt rounds: 10)
- JWT tokens expire after **7 days** (configurable)
- Users cannot access other users' accounts or transactions
- Route protection via global `JwtAuthGuard` — all routes are protected by default; use `@Public()` to opt out
- Input validation via `class-validator` on all DTOs
- Environment variables used for all secrets — never hardcoded

---

## 📄 License

MIT
