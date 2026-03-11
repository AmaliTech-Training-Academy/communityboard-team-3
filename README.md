# CommunityBoard
**AmaliTech Group Project – Full-Stack Teams (Teams 1-5)**

A community notice board where users can post announcements, events, and discussions. Supports categories, comments, and search.

## Tech Stack
- **Backend:** Java 17 + Spring Boot 3.2, Spring Security (JWT), Spring Data JPA, PostgreSQL
- **Frontend:** React 18, React Router, Axios, Chart.js
- **Data Engineering:** Python ETL pipeline, analytics aggregation
- **QA:** REST Assured (API), Selenium WebDriver (UI)
- **DevOps:** Docker, docker-compose, GitHub Actions CI

## Getting Started
```bash
docker-compose up --build
```
- Backend API: http://localhost:8080/swagger-ui/index.html#/
- Frontend: http://localhost:3000

## Default Users (seeded)
| Email | Password | Role |
|---|---|---|
| admin@amalitech.com | password123 | ADMIN |
| user@amalitech.com | password123 | USER |

## Project Structure
```
backend/          - Spring Boot REST API
frontend/         - React 18 SPA
data-engineering/ - Python ETL & analytics
qa/               - API & UI test suites
devops/           - Docker, CI/CD configs
```

## What's Implemented (~30%)
- [x] User authentication (register/login with JWT)
- [x] Basic post CRUD (create, read, update, delete)
- [x] Category management
- [ ] Comments system (TODO)
- [ ] Search & filtering (TODO)
- [ ] User profiles (TODO)
- [ ] Notifications (TODO)
- [ ] Analytics dashboard (TODO)

## Environment Setup

**IMPORTANT:** This project requires environment variables.

### Quick Start
```bash
# 1. Copy the example environment file
cp .env.example .env

# 2. Edit with your values
nano .env

# 3. Update these required variables:
POSTGRES_DB=communityboard
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password-here
JWT_SECRET=your-jwt-secret-minimum-32-characters

# 4. Start the application
docker compose up --build
```

### Security Notes

- **NEVER** commit the `.env` file
- Use strong passwords in production
- For production, use proper secret management (AWS Secrets Manager, etc.)
- The `.env.example` file contains placeholders only

