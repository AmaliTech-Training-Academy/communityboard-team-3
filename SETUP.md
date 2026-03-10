# CommunityBoard - Local Development Setup

## Prerequisites
- Docker & Docker Compose
- Git

## Quick Start

### 1. Clone the Repository
```bash
git clone git@github.com:AmaliTech-Training-Academy/communityboard-team-3.git
cd communityboard-team-3
```

### 2. Start All Services
```bash
docker compose up
```

Wait for all services to start (~1-2 minutes)

### 3. Access the Application
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8080/swagger-ui.html
- **Database:** localhost:5432 (PostgreSQL)

### 4. Default Credentials
| Email | Password | Role |
|-------|----------|------|
| admin@amalitech.com | password123 | ADMIN |
| user@amalitech.com | password123 | USER |

## Development Workflow

### Creating a Feature
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes...

# Commit
git add .
git commit -m "Add: your feature description"

# Push
git push origin feature/your-feature-name
```

### Opening a Pull Request
1. Go to GitHub repository
2. Click "Pull requests" → "New pull request"
3. Select your branch
4. Fill in PR template
5. Wait for CI checks to pass (6-7 minutes)
6. Request review from team member
7. Merge after approval

## CI/CD Pipeline
Every push triggers:
- ✅ Backend Build & Test
- ✅ Frontend Build & Test
- ✅ Docker Build Test
- ✅ Integration Test

## Troubleshooting

### Port Already in Use
```bash
# Stop all containers
docker compose down

# Kill processes on ports
sudo lsof -i :3000
sudo lsof -i :8080
sudo kill -9 <PID>
```

### Docker Issues
```bash
# Clean restart
docker compose down -v
docker system prune -f
docker compose up --build
```

### Database Connection Failed
```bash
# Check if database is running
docker compose ps

# View database logs
docker compose logs db
```

## Need Help?
- Check CI logs in GitHub Actions tab
- Ask in team Slack/Discord
- Contact DevOps: @JoelAlumasa
