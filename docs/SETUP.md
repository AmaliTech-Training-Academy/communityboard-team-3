# CommunityBoard - Development Setup Guide

Complete guide for setting up and running the CommunityBoard application locally.

## Prerequisites

- Docker Desktop (24.x or higher)
- Git
- WSL2 (for Windows users)
- 8GB RAM minimum
- 20GB free disk space

## Quick Start
```bash
# Clone repository
git clone https://github.com/AmaliTech-Training-Academy/communityboard-team-3.git
cd communityboard-team-3

# Start all services
docker compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:8080
# Swagger: http://localhost:8080/swagger-ui.html
```

## Services

The application runs 5 Docker containers:

| Service | Port | Description |
|---------|------|-------------|
| postgres | 5432 | PostgreSQL database |
| backend | 8080 | Spring Boot REST API |
| frontend | 3000 | React + Vite SPA |
| data-seed | - | One-time data seeding (exits after completion) |
| data-etl | - | Analytics ETL pipeline (exits after completion) |

## First Time Setup

### 1. Start Services
```bash
docker compose up --build
```

**Expected output:**
```
data-seed-1  | Categories seeded: 4
data-seed-1  | Users seeded: 30
data-seed-1  | Posts seeded: 80
data-seed-1  | Comments seeded: 323
backend-1    | Started CommunityBoardApplication in 7s
frontend-1   | Configuration complete; ready for start up
```

### 2. Verify Services
```bash
# Check all containers running
docker compose ps

# Test backend
curl http://localhost:8080/actuator/health

# Test frontend
curl http://localhost:3000
```

### 3. Access Application

- **Frontend:** http://localhost:3000
- **Backend API Docs:** http://localhost:8080/swagger-ui.html
- **Database:** localhost:5432 (credentials in docker-compose.yml)

## Running in Background
```bash
# Start in detached mode
docker compose up -d

# View logs
docker compose logs -f

# View specific service logs
docker compose logs backend
docker compose logs frontend

# Stop services
docker compose down
```

## Testing

### Run Backend Tests
```bash
# From repository root
cd backend
./mvnw test

# Or via Docker
docker compose exec backend ./mvnw test
```

### Run Frontend Tests
```bash
# From repository root
cd frontend
pnpm test

# Or via Docker
docker compose exec frontend pnpm test
```

### CI/CD Pipeline

All tests run automatically on every push via GitHub Actions.

**Check pipeline status:**
https://github.com/AmaliTech-Training-Academy/communityboard-team-3/actions

**Pipeline jobs:**
1. Backend build + test (Maven)
2. Frontend build + test (pnpm)
3. Docker build verification
4. Integration tests

## Environment Variables

### Development (.env.dev)

Located in root directory (gitignored):
```env
POSTGRES_DB=communityboard
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/communityboard
JWT_SECRET=communityboard-secret-key-amalitech-2024
VITE_API_BASE_URL=http://localhost:8080
```

### Reference Template (.env.example)

See `.env.example` for all available environment variables.

## API Documentation

### Swagger UI

Once backend is running, access interactive API documentation at:

**http://localhost:8080/swagger-ui.html**

### Authentication

Most endpoints require JWT authentication:

1. Register: `POST /api/auth/register`
2. Login: `POST /api/auth/login`
3. Use returned JWT token in `Authorization: Bearer <token>` header

### Key Endpoints

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/auth/register` | POST | No | Create new user |
| `/api/auth/login` | POST | No | Login user |
| `/api/posts` | GET | No | List all posts |
| `/api/posts` | POST | Yes | Create post |
| `/api/posts/{id}` | GET | No | Get single post |
| `/api/posts/{id}` | PUT | Yes | Update post |
| `/api/posts/{id}` | DELETE | Yes | Delete post |
| `/api/comments` | POST | Yes | Add comment |
| `/api/comments/{id}` | DELETE | Yes | Delete comment |

## Database

### Access Database
```bash
# Using Docker exec
docker compose exec postgres psql -U postgres -d communityboard

# List tables
\dt

# Query data
SELECT COUNT(*) FROM posts;
SELECT * FROM categories;

# Exit
\q
```

### Sample Data

The `data-seed` container loads:
- 4 categories (NEWS, EVENT, DISCUSSION, ALERT)
- 30 users
- 80 posts (spread across categories)
- 323 comments

### Reset Database
```bash
# Stop and remove volumes (deletes all data)
docker compose down -v

# Restart fresh (seed data reloads)
docker compose up --build
```

## Troubleshooting

### Backend crashes with "duplicate key" error

**Symptom:**
```
ERROR: duplicate key value violates unique constraint "categories_pkey"
```

**Cause:** Ernest's seed script and backend's data.sql both trying to insert categories.

**Solution:** Already fixed - `spring.sql.init.mode=never` in application.properties disables data.sql.

**Workaround if still occurring:**
```bash
docker compose down -v
docker compose up --build
```

### Port already in use

**Error:** `Bind for 0.0.0.0:8080 failed: port is already allocated`

**Solution:**
```bash
# Check what's using the port
sudo lsof -i :8080

# Stop the conflicting service (e.g., Jenkins)
sudo systemctl stop jenkins

# Or change the port in docker-compose.yml
```

### Frontend shows blank page

**Check backend is running:**
```bash
curl http://localhost:8080/actuator/health
```

**Check frontend logs:**
```bash
docker compose logs frontend
```

**Clear browser cache and reload**

### Database connection errors

**Verify PostgreSQL is running:**
```bash
docker compose ps postgres
```

**Check database logs:**
```bash
docker compose logs postgres
```

**Verify credentials in docker-compose.yml match backend configuration**

### Containers won't start

**Clean Docker system:**
```bash
docker compose down -v
docker system prune -af --volumes
docker compose up --build
```

### CI/CD pipeline failing

1. Check GitHub Actions tab for error details
2. Pull latest main: `git pull origin main`
3. Run tests locally before pushing
4. Verify all tests pass: `./mvnw test` and `pnpm test`

## Development Workflow

### Making Changes
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes
# ...

# Test locally
docker compose up --build

# Commit and push
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature-name

# Create Pull Request on GitHub
```

### Code Review Process

1. Create PR with descriptive title
2. Fill out PR template
3. Wait for CI/CD checks to pass
4. Request review from team member
5. Address feedback
6. Merge after approval

## Team Contacts

| Role | Name | Slack |
|------|------|-------|
| Backend | Bruce Mutsinzi | @Bruce Mutsinzi |
| Frontend | Emmanuel Joe Letsu | @Emmanuel Joe Letsu |
| QA | Divine Gihozo Bayingana | @Divine GIHOZO BAYINGANA |
| DevOps | Joel Alumasa | @Joel Alumasa |
| Data | Ernest Kwisanga | @Ernest Kwisanga |

## Additional Resources

- **GitHub Repository:** https://github.com/AmaliTech-Training-Academy/communityboard-team-3
- **CI/CD Pipeline:** https://github.com/AmaliTech-Training-Academy/communityboard-team-3/actions
- **Docker Compose Docs:** https://docs.docker.com/compose/
- **Spring Boot Docs:** https://spring.io/projects/spring-boot
- **React + Vite Docs:** https://vitejs.dev/

## Support

For issues or questions:
1. Check this documentation
2. Search existing GitHub Issues
3. Ask in team Slack channel
4. Create new GitHub Issue if needed
